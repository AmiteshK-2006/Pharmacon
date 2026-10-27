import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { createAuditLog } from '../services/AuditService.js';
import * as AIService from '../services/PrescriptionRecognitionService.js';
import { processPrescriptionAnonymization } from '../services/AnonymizerService.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];

const VALID_STATUSES = [
  'UPLOADED', 'PROCESSING', 'EXTRACTED', 'NEEDS_REVIEW',
  'CORRECTED', 'PENDING_DOCTOR_CONFIRMATION', 'CONFIRMED',
  'DISPENSING', 'DISPENSED', 'CANCELLED', 'REJECTED',
];

const correctionSchema = z.object({
  field_name: z.string().min(1),
  corrected_value: z.string(),
  reason: z.string().optional(),
});

const dispenseSchema = z.object({
  items: z.array(z.object({
    medicine_id: z.string().uuid(),
    dispense_qty: z.number().int().positive(),
  })).min(1),
  notes: z.string().optional(),
});


export async function uploadPrescription(req, res, next) {
  try {
    const file = req.file;
    if (!file) throw new AppError('Prescription file is required', 400);
    if (!ALLOWED_TYPES.includes(file.mimetype)) throw new AppError('Invalid file type', 400);
    if (file.size > 20 * 1024 * 1024) throw new AppError('File too large (max 20MB)', 400);

    const { patient_id, doctor_id, notes } = req.body;
    const fileId = uuidv4();
    const ext = file.originalname.split('.').pop() || 'bin';
    const storagePath = `prescriptions/${fileId}.${ext}`;

    // 1. Upload original scan to private bucket (for patient, doctor, clinic staff)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('private-prescriptions')
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uploadError) throw new AppError(`Storage upload failed: ${uploadError.message}`, 500);

    // 2. Record file asset
    const { data: fileAsset, error: faError } = await supabaseAdmin
      .from('file_assets')
      .insert({
        id: fileId,
        bucket: 'private-prescriptions',
        storage_path: storagePath,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size,
        visibility: 'private',
        uploaded_by: req.user.id
      })
      .select().single();
    if (faError) throw new AppError(faError.message, 500);

    // 3. Create prescription with CONFIRMED status so both patient and doctor can immediately view
    const prescriptionId = uuidv4();
    const { data: prescription, error: presError } = await supabaseAdmin
      .from('prescriptions')
      .insert({
        id: prescriptionId,
        patient_id: patient_id || null,
        doctor_id: doctor_id || null,
        uploader_id: req.user.id,
        file_asset_id: fileAsset.id,
        status: 'CONFIRMED',
        anonymized_status: 'PROCESSING',
        notes: notes || null
      })
      .select().single();
    if (presError) throw new AppError(presError.message, 500);

    // 4. Initial status history
    await supabaseAdmin.from('prescription_status_history').insert({
      prescription_id: prescriptionId,
      status: 'CONFIRMED',
      actor_id: req.user.id,
      notes: 'Prescription uploaded and available for clinical review'
    });

    // 5. Trigger external de-identification pipeline in background
    processPrescriptionAnonymization(prescriptionId).catch(err => {
      console.error(`[Upload] Background anonymization failed for prescription ${prescriptionId}:`, err);
    });

    // 6. Audit log
    createAuditLog({
      actor_user_id: req.user.id,
      action: 'PRESCRIPTION_UPLOADED',
      entity_type: 'prescription',
      entity_id: prescriptionId,
      metadata: { patient_id, doctor_id, anonymized_status: 'PROCESSING' }
    });

    res.status(201).json({
      data: prescription,
      message: 'Prescription uploaded successfully. Document de-identification queued for research access.',
    });
  } catch (err) { next(err); }
}

export async function listPrescriptions(req, res, next) {
  try {
    const { role, id: userId } = req.user;

    // Fast, zero-PII path for researchers
    if (role === 'researcher') {
      const { data, error } = await supabaseAdmin
        .from('prescriptions')
        .select('id, created_at, status, anonymized_status, anonymization_metadata, anonymized_file_asset_id, file_asset_id')
        .not('file_asset_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw new AppError(error.message, 500);

      const sanitized = (data || []).map(p => ({
        id: p.id,
        created_at: p.created_at,
        status: p.status,
        anonymized_status: p.anonymized_status || 'COMPLETED',
        anonymization_metadata: p.anonymization_metadata || {},
        anonymized_file_asset_id: p.anonymized_file_asset_id || p.file_asset_id,
      }));
      return res.json({ data: sanitized });
    }

    let query = supabaseAdmin.from('prescriptions').select(`
      *,
      file_assets!file_asset_id(id, original_name, mime_type, size),
      prescription_items(*),
      prescription_extraction_fields(*),
      refill_requests(*),
      patient:profiles!prescriptions_patient_id_fkey(id, first_name, last_name, phone)
    `);

    if (role === 'patient') query = query.eq('patient_id', userId);
    else if (role === 'doctor') query = query.eq('doctor_id', userId);
    // admin, pharmacist, clinic_staff see all

    let { data, error } = await query.order('created_at', { ascending: false });

    // Fallback if PostgREST relation syntax encounters an issue
    if (error) {
      let fallbackQuery = supabaseAdmin.from('prescriptions').select('*, file_assets!file_asset_id(id, original_name, mime_type, size), prescription_items(*), prescription_extraction_fields(*), refill_requests(*)');
      if (role === 'patient') fallbackQuery = fallbackQuery.eq('patient_id', userId);
      else if (role === 'doctor') fallbackQuery = fallbackQuery.eq('doctor_id', userId);
      const resFallback = await fallbackQuery.order('created_at', { ascending: false });
      if (resFallback.error) throw new AppError(resFallback.error.message, 500);
      data = resFallback.data || [];

      const patientIds = [...new Set(data.map(p => p.patient_id).filter(Boolean))];
      if (patientIds.length > 0) {
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id, first_name, last_name, phone').in('id', patientIds);
        const pMap = new Map((profiles || []).map(p => [p.id, p]));
        data.forEach(p => {
          p.patient = pMap.get(p.patient_id) || null;
        });
      }
    }

    res.json({ data });
  } catch (err) { next(err); }
}

export async function getPrescription(req, res, next) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    // Fast, zero-PII path for researchers
    if (role === 'researcher') {
      const { data, error } = await supabaseAdmin
        .from('prescriptions')
        .select('id, created_at, status, anonymized_status, anonymization_metadata, anonymized_file_asset_id, file_asset_id')
        .eq('id', id)
        .single();
      if (error || !data) throw new AppError('Prescription not found', 404);

      return res.json({
        data: {
          id: data.id,
          created_at: data.created_at,
          status: data.status,
          anonymized_status: data.anonymized_status || 'COMPLETED',
          anonymization_metadata: data.anonymization_metadata || {},
          anonymized_file_asset_id: data.anonymized_file_asset_id || data.file_asset_id,
        }
      });
    }

    let { data, error } = await supabaseAdmin
      .from('prescriptions')
      .select('*, file_assets!file_asset_id(*), prescription_extraction_fields(*), prescription_status_history(*), patient:profiles!prescriptions_patient_id_fkey(id, first_name, last_name, phone)')
      .eq('id', id).single();

    if (error) {
      const fallback = await supabaseAdmin
        .from('prescriptions')
        .select('*, file_assets!file_asset_id(*), prescription_extraction_fields(*), prescription_status_history(*)')
        .eq('id', id).single();
      if (fallback.error || !fallback.data) throw new AppError('Prescription not found', 404);
      data = fallback.data;

      if (data.patient_id) {
        const { data: patientProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, first_name, last_name, phone')
          .eq('id', data.patient_id).single();
        data.patient = patientProfile || null;
      }
    }

    if (!data) throw new AppError('Prescription not found', 404);

    if (role === 'patient' && data.patient_id !== userId) throw new AppError('Access denied', 403);
    if (role === 'doctor' && data.doctor_id !== userId) throw new AppError('Access denied', 403);

    res.json({ data });
  } catch (err) { next(err); }
}

export async function getPrescriptionFile(req, res, next) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    if (role === 'researcher') {
      throw new AppError('Access denied: Researchers cannot access raw unanonymized files', 403);
    }

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .select('patient_id, doctor_id, file_assets!file_asset_id(bucket, storage_path)')
      .eq('id', id).single();
    if (error || !prescription) throw new AppError('Prescription not found', 404);

    if (role === 'patient' && prescription.patient_id !== userId) throw new AppError('Access denied', 403);
    if (role === 'doctor' && prescription.doctor_id !== userId) throw new AppError('Access denied', 403);

    const asset = prescription.file_assets;
    if (!asset || !asset.bucket || !asset.storage_path) {
      throw new AppError('No file attached to this prescription', 404);
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(asset.bucket).createSignedUrl(asset.storage_path, 300);
    if (signError) throw new AppError(`Could not generate file URL: ${signError.message}`, 500);

    res.json({ data: { url: signed.signedUrl, expires_in: 300 } });
  } catch (err) { next(err); }
}

export async function getAnonymizedPrescriptionFile(req, res, next) {
  try {
    const { id } = req.params;
    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .select('id, anonymized_file_asset_id, file_asset_id, anonymized_status')
      .eq('id', id).single();
    if (error || !prescription) throw new AppError('Prescription not found', 404);

    let targetAssetId = prescription.anonymized_file_asset_id;

    // Self-healing: If not yet anonymized or pending, run pipeline on-demand!
    if (!targetAssetId || prescription.anonymized_status !== 'COMPLETED') {
      const result = await processPrescriptionAnonymization(id);
      if (result.success && result.assetId) {
        targetAssetId = result.assetId;
      }
    }

    if (!targetAssetId) {
      throw new AppError('Anonymized file is still processing. Please try again in a few moments.', 404);
    }

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('file_assets')
      .select('bucket, storage_path, original_name, mime_type')
      .eq('id', targetAssetId)
      .single();

    if (assetError || !asset?.bucket || !asset?.storage_path) {
      throw new AppError('Anonymized file asset details could not be found', 404);
    }

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(asset.bucket).createSignedUrl(asset.storage_path, 300);
    if (signError) throw new AppError(`Could not generate file URL: ${signError.message}`, 500);

    res.json({
      data: {
        url: signed.signedUrl,
        expires_in: 300,
        filename: asset.original_name,
        mime_type: asset.mime_type,
      },
    });
  } catch (err) { next(err); }
}

export async function triggerAnonymization(req, res, next) {
  try {
    const { id } = req.params;
    const result = await processPrescriptionAnonymization(id);
    if (!result.success) {
      throw new AppError(`Anonymization failed: ${result.error}`, 500);
    }
    res.json({
      message: 'Prescription anonymized successfully',
      data: result,
    });
  } catch (err) { next(err); }
}

export async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { patient_id, doctor_id } = req.body;
    
    // Only admin or clinic_staff can reassign freely. Doctors could perhaps reassign, but let's restrict it.
    if (req.user.role === 'doctor') {
      const { data: pres } = await supabaseAdmin.from('prescriptions').select('doctor_id').eq('id', id).single();
      if (pres?.doctor_id !== req.user.id) throw new AppError('Access denied', 403);
    }

    const updates = {};
    if (patient_id !== undefined) updates.patient_id = patient_id || null;
    if (doctor_id !== undefined) updates.doctor_id = doctor_id || null;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('prescriptions').update(updates).eq('id', id).select().single();
      if (error) throw new AppError(error.message, 500);

      createAuditLog({ actor_user_id: req.user.id, action: 'PRESCRIPTION_REASSIGNED', entity_type: 'prescription', entity_id: id, metadata: updates });
      return res.json({ data });
    }
    res.json({ message: 'No changes provided' });
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!VALID_STATUSES.includes(status)) throw new AppError('Invalid status value', 400);

    const { data: pres, error: fetchErr } = await supabaseAdmin.from('prescriptions').select('doctor_id').eq('id', id).single();
    if (fetchErr || !pres) throw new AppError('Prescription not found', 404);
    if (req.user.role === 'doctor' && pres.doctor_id !== req.user.id) throw new AppError('Access denied', 403);

    const { data, error } = await supabaseAdmin
      .from('prescriptions').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new AppError(error.message, 500);

    await supabaseAdmin.from('prescription_status_history').insert({ prescription_id: id, status, actor_id: req.user.id, notes: notes || null });
    res.json({ data });
  } catch (err) { next(err); }
}

export async function submitCorrection(req, res, next) {
  try {
    const { id: prescriptionId } = req.params;
    const parsed = correctionSchema.parse(req.body);

    const { data: pres, error: presErr } = await supabaseAdmin.from('prescriptions').select('doctor_id').eq('id', prescriptionId).single();
    if (presErr || !pres) throw new AppError('Prescription not found', 404);
    if (req.user.role === 'doctor' && pres.doctor_id !== req.user.id) throw new AppError('Access denied', 403);

    const { data: field, error: fieldError } = await supabaseAdmin
      .from('prescription_extraction_fields')
      .select('*').eq('prescription_id', prescriptionId).eq('field_name', parsed.field_name).single();
    if (fieldError || !field) throw new AppError('Extraction field not found', 404);


    // Store correction — original value is preserved, never overwritten
    const { data: correction, error: corrError } = await supabaseAdmin
      .from('prescription_corrections')
      .insert({ prescription_id: prescriptionId, field_name: parsed.field_name, original_value: field.extracted_value, corrected_value: parsed.corrected_value, corrected_by: req.user.id, reason: parsed.reason || null })
      .select().single();
    if (corrError) throw new AppError(corrError.message, 500);

    // Update field with corrected value
    await supabaseAdmin.from('prescription_extraction_fields')
      .update({ corrected_value: parsed.corrected_value, is_corrected: true }).eq('id', field.id);

    // Auto-advance to CORRECTED if currently NEEDS_REVIEW
    const { data: presStatus } = await supabaseAdmin.from('prescriptions').select('status').eq('id', prescriptionId).single();
    if (presStatus?.status === 'NEEDS_REVIEW') {
      await supabaseAdmin.from('prescriptions').update({ status: 'CORRECTED' }).eq('id', prescriptionId);
      await supabaseAdmin.from('prescription_status_history').insert({ prescription_id: prescriptionId, status: 'CORRECTED', actor_id: req.user.id, notes: `Field '${parsed.field_name}' corrected` });
    }

    createAuditLog({ actor_user_id: req.user.id, action: 'PRESCRIPTION_CORRECTED', entity_type: 'prescription', entity_id: prescriptionId, metadata: { field_name: parsed.field_name, original: field.extracted_value, corrected: parsed.corrected_value } });
    res.status(201).json({ data: correction });
  } catch (err) { next(err); }
}

export async function getCorrectionHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('prescription_corrections')
      .select('*, profiles!prescription_corrections_corrected_by_fkey(first_name, last_name)')
      .eq('prescription_id', id).order('created_at', { ascending: false });
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function confirmPrescription(req, res, next) {
  try {
    const { id } = req.params;

    const { data: pres, error: fetchErr } = await supabaseAdmin.from('prescriptions').select('doctor_id').eq('id', id).single();
    if (fetchErr || !pres) throw new AppError('Prescription not found', 404);
    if (req.user.role === 'doctor' && pres.doctor_id !== req.user.id) throw new AppError('Access denied', 403);

    // Get all extraction fields to map to items
    const { data: fields } = await supabaseAdmin.from('prescription_extraction_fields').select('*').eq('prescription_id', id);
    
    // Group fields by medicine index (e.g., medicine_1_name -> index 1)
    const medMap = {};
    if (fields) {
      for (const field of fields) {
        const match = field.field_name.match(/^medicine_(\d+)_(.+)$/);
        if (match) {
          const idx = match[1];
          const prop = match[2];
          if (!medMap[idx]) medMap[idx] = {};
          medMap[idx][prop] = field.is_corrected ? field.corrected_value : field.extracted_value;
        }
      }
    }

    const itemsToInsert = Object.values(medMap).map(med => ({
      prescription_id: id,
      medicine_name_snapshot: med.name || null,
      strength: med.dose || null,
      frequency: med.freq || null,
      duration: med.dur || null,
      verification_status: 'verified'
    })).filter(item => item.medicine_name_snapshot);

    if (itemsToInsert.length > 0) {
      await supabaseAdmin.from('prescription_items').insert(itemsToInsert);
    }

    const { data, error } = await supabaseAdmin
      .from('prescriptions').update({ status: 'CONFIRMED', updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new AppError(error.message, 500);

    await supabaseAdmin.from('prescription_status_history').insert({ prescription_id: id, status: 'CONFIRMED', actor_id: req.user.id });
    createAuditLog({ actor_user_id: req.user.id, action: 'PRESCRIPTION_CONFIRMED', entity_type: 'prescription', entity_id: id });
    res.json({ data });
  } catch (err) { next(err); }
}

export async function rejectPrescription(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: pres, error: fetchErr } = await supabaseAdmin.from('prescriptions').select('doctor_id').eq('id', id).single();
    if (fetchErr || !pres) throw new AppError('Prescription not found', 404);
    if (req.user.role === 'doctor' && pres.doctor_id !== req.user.id) throw new AppError('Access denied', 403);

    const { data, error } = await supabaseAdmin
      .from('prescriptions').update({ status: 'REJECTED', updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new AppError(error.message, 500);

    await supabaseAdmin.from('prescription_status_history').insert({ prescription_id: id, status: 'REJECTED', actor_id: req.user.id, notes: reason || null });
    createAuditLog({ actor_user_id: req.user.id, action: 'PRESCRIPTION_REJECTED', entity_type: 'prescription', entity_id: id });
    res.json({ data });
  } catch (err) { next(err); }
}

export async function getStatusHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('prescription_status_history')
      .select('*, profiles!prescription_status_history_actor_id_fkey(first_name, last_name)')
      .eq('prescription_id', id).order('created_at', { ascending: true });
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function dispensePrescription(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = dispenseSchema.parse(req.body);

    // 1. Validate prescription status
    const { data: pres, error: presError } = await supabaseAdmin
      .from('prescriptions').select('status').eq('id', id).single();
    if (presError || !pres) throw new AppError('Prescription not found', 404);
    if (pres.status !== 'CONFIRMED' && pres.status !== 'DISPENSING') {
      throw new AppError('Prescription is not ready for dispensing', 400);
    }

    // Wrap in a transaction-like behavior using RPC or sequential updates if RPC isn't available.
    // For now, doing sequential with checks. In a production app with Supabase, this should ideally be an RPC.
    for (const item of parsed.items) {
      // Calculate current stock
      const { data: batches, error: batchError } = await supabaseAdmin
        .from('inventory_batches').select('id, quantity').eq('medicine_id', item.medicine_id).gt('quantity', 0);
      if (batchError) throw new AppError(batchError.message, 500);

      const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock < item.dispense_qty) {
        throw new AppError(`Insufficient stock for medicine ID ${item.medicine_id}`, 409, 'INVENTORY_INSUFFICIENT');
      }

      // Deduct from batches (FIFO)
      let remaining = item.dispense_qty;
      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        await supabaseAdmin.from('inventory_batches').update({ quantity: batch.quantity - deduct }).eq('id', batch.id);
        remaining -= deduct;
      }

      // Record transaction
      await supabaseAdmin.from('inventory_transactions').insert({
        medicine_id: item.medicine_id, quantity_change: -item.dispense_qty,
        transaction_type: 'DISPENSE', actor_user_id: req.user.id,
        reference_id: id, notes: parsed.notes || null,
      });

      createAuditLog({ actor_user_id: req.user.id, action: 'INVENTORY_DECREASED', entity_type: 'medicine', entity_id: item.medicine_id, metadata: { quantity: item.dispense_qty, prescription_id: id } });
    }

    // Update prescription status to DISPENSED
    await supabaseAdmin.from('prescriptions').update({ status: 'DISPENSED', updated_at: new Date().toISOString() }).eq('id', id);
    await supabaseAdmin.from('prescription_status_history').insert({ prescription_id: id, status: 'DISPENSED', actor_id: req.user.id, notes: parsed.notes || null });
    createAuditLog({ actor_user_id: req.user.id, action: 'PRESCRIPTION_DISPENSED', entity_type: 'prescription', entity_id: id });

    res.json({ message: 'Prescription dispensed successfully' });
  } catch (err) { next(err); }
}
