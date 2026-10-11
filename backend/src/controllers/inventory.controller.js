import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { createAuditLog } from '../services/AuditService.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const medicineSchema = z.object({
  name: z.string().min(1),
  generic_name: z.string().optional(),
  strength: z.string().min(1),
  dosage_form: z.string().min(1),
  sku: z.string().optional(),
  manufacturer: z.string().optional(),
  unit: z.string().min(1),
  pack_size: z.number().int().positive(),
  reorder_threshold: z.number().int().nonnegative(),
  price: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const restockSchema = z.object({
  quantity: z.number().int().positive(),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  supplier: z.string().optional(),
  cost_per_unit: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const adjustSchema = z.object({
  quantity_change: z.number().int(),   // can be negative
  reason: z.string().min(1),
  notes: z.string().optional(),
});

const dispenseSchema = z.object({
  quantity: z.number().int().positive(),
  prescription_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export async function listMedicines(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('medicines').select('*, inventory_batches(*)').eq('status', 'active').order('name');
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function getMedicine(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('medicines').select('*, inventory_batches(*)').eq('id', req.params.id).single();
    if (error || !data) throw new AppError('Medicine not found', 404);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function createMedicine(req, res, next) {
  try {
    const parsed = medicineSchema.parse(req.body);
    const id = uuidv4();
    const { data, error } = await supabaseAdmin.from('medicines').insert({ id, ...parsed }).select().single();
    if (error) throw new AppError(error.message, 500);
    createAuditLog({ actor_user_id: req.user.id, action: 'INVENTORY_CREATED', entity_type: 'medicine', entity_id: id });
    res.status(201).json({ data });
  } catch (err) { next(err); }
}

export async function updateMedicine(req, res, next) {
  try {
    const parsed = medicineSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('medicines').update(parsed).eq('id', req.params.id).select().single();
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function deactivateMedicine(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('medicines').update({ status: 'inactive' }).eq('id', req.params.id).select().single();
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function restockMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = restockSchema.parse(req.body);

    // Verify medicine exists
    const { data: medicine, error: medError } = await supabaseAdmin.from('medicines').select('id').eq('id', id).single();
    if (medError || !medicine) throw new AppError('Medicine not found', 404);

    // Create inventory batch
    const batchId = uuidv4();
    const { error: batchError } = await supabaseAdmin.from('inventory_batches').insert({
      id: batchId, medicine_id: id, quantity: parsed.quantity,
      batch_number: parsed.batch_number || null, expiry_date: parsed.expiry_date || null,
      supplier: parsed.supplier || null, cost_per_unit: parsed.cost_per_unit || null,
    });
    if (batchError) throw new AppError(batchError.message, 500);

    // Record transaction
    const { error: txError } = await supabaseAdmin.from('inventory_transactions').insert({
      medicine_id: id, batch_id: batchId, quantity_change: parsed.quantity,
      transaction_type: 'RESTOCK', actor_user_id: req.user.id, notes: parsed.notes || null,
    });
    if (txError) throw new AppError(txError.message, 500);

    createAuditLog({ actor_user_id: req.user.id, action: 'INVENTORY_RESTOCKED', entity_type: 'medicine', entity_id: id, metadata: { quantity: parsed.quantity, batch: parsed.batch_number } });
    res.status(201).json({ message: 'Restock recorded', batch_id: batchId });
  } catch (err) { next(err); }
}

export async function adjustStock(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = adjustSchema.parse(req.body);

    const { error: txError } = await supabaseAdmin.from('inventory_transactions').insert({
      medicine_id: id, quantity_change: parsed.quantity_change,
      transaction_type: 'ADJUSTMENT', actor_user_id: req.user.id,
      notes: parsed.notes || null, reason: parsed.reason,
    });
    if (txError) throw new AppError(txError.message, 500);

    createAuditLog({ actor_user_id: req.user.id, action: 'INVENTORY_ADJUSTED', entity_type: 'medicine', entity_id: id, metadata: { quantity_change: parsed.quantity_change, reason: parsed.reason } });
    res.json({ message: 'Stock adjustment recorded' });
  } catch (err) { next(err); }
}

export async function dispenseMedicine(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = dispenseSchema.parse(req.body);

    // Calculate current stock across all batches
    const { data: batches, error: batchError } = await supabaseAdmin
      .from('inventory_batches').select('id, quantity').eq('medicine_id', id).gt('quantity', 0);
    if (batchError) throw new AppError(batchError.message, 500);

    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalStock < parsed.quantity) {
      throw new AppError('Insufficient stock', 409, 'INVENTORY_INSUFFICIENT');
    }

    // Deduct from batches (FIFO)
    let remaining = parsed.quantity;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const deduct = Math.min(batch.quantity, remaining);
      await supabaseAdmin.from('inventory_batches').update({ quantity: batch.quantity - deduct }).eq('id', batch.id);
      remaining -= deduct;
    }

    // Record transaction
    await supabaseAdmin.from('inventory_transactions').insert({
      medicine_id: id, quantity_change: -parsed.quantity,
      transaction_type: 'DISPENSE', actor_user_id: req.user.id,
      reference_id: parsed.prescription_id || null, notes: parsed.notes || null,
    });

    createAuditLog({ actor_user_id: req.user.id, action: 'INVENTORY_DECREASED', entity_type: 'medicine', entity_id: id, metadata: { quantity: parsed.quantity, prescription_id: parsed.prescription_id } });
    res.json({ message: 'Dispensed successfully', remaining_stock: totalStock - parsed.quantity });
  } catch (err) { next(err); }
}

export async function getTransactionHistory(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('inventory_transactions')
      .select('*, profiles!inventory_transactions_actor_user_id_fkey(first_name, last_name)')
      .eq('medicine_id', req.params.id).order('created_at', { ascending: false });
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function getLowStockAlerts(req, res, next) {
  try {
    // Medicines where total batch stock <= reorder_threshold
    const { data, error } = await supabaseAdmin.rpc('get_low_stock_medicines');
    if (error) throw new AppError(error.message, 500);

    // Ensure generic_name is populated if RPC does not provide it
    if (data && data.length > 0) {
      const missingGeneric = data.some(d => d.generic_name === undefined);
      if (missingGeneric) {
        const ids = data.map(d => d.medicine_id);
        const { data: medicines } = await supabaseAdmin
          .from('medicines')
          .select('id, generic_name')
          .in('id', ids);

        if (medicines) {
          const medMap = new Map(medicines.map(m => [m.id, m.generic_name]));
          data.forEach(item => {
            if (item.generic_name === undefined) {
              item.generic_name = medMap.get(item.medicine_id) ?? null;
            }
          });
        }
      }
    }

    res.json({ data });
  } catch (err) { next(err); }
}

export async function getExpiringBatches(req, res, next) {
  try {
    const daysAhead = parseInt(req.query.days || '30');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    const { data, error } = await supabaseAdmin
      .from('inventory_batches')
      .select('*, medicines(name, generic_name, strength, dosage_form)')
      .lt('expiry_date', cutoffDate.toISOString())
      .gt('quantity', 0)
      .order('expiry_date');
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}
