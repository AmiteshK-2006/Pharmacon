import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'doctor', 'pharmacist', 'clinic_staff', 'patient', 'researcher']),
});

export async function listUsers(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    if (error || !data) throw new AppError('User not found', 404);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = updateRoleSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('profiles').update({ role }).eq('id', id).select().single();
    if (error) throw new AppError(error.message, 500);
    res.json({ data });
  } catch (err) { next(err); }
}

export async function disableUser(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '87600h' });
    if (error) throw new AppError(error.message, 500);
    res.json({ message: 'User disabled successfully' });
  } catch (err) { next(err); }
}
