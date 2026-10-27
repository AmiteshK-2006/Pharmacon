import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import {
  uploadPrescription, listPrescriptions, getPrescription,
  getPrescriptionFile, getAnonymizedPrescriptionFile, triggerAnonymization, updateStatus, submitCorrection,
  getCorrectionHistory, confirmPrescription, rejectPrescription,
  getStatusHistory, dispensePrescription, updateAssignment
} from '../controllers/prescriptions.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/', requireAuth, requireRole('admin', 'clinic_staff', 'doctor'), upload.single('file'), uploadPrescription);
router.get('/', requireAuth, listPrescriptions);
router.get('/:id', requireAuth, getPrescription);
router.get('/:id/file', requireAuth, getPrescriptionFile);
router.get('/:id/anonymized-file', requireAuth, requireRole('admin', 'researcher', 'doctor', 'clinic_staff'), getAnonymizedPrescriptionFile);
router.post('/:id/anonymize', requireAuth, requireRole('admin', 'researcher', 'clinic_staff', 'doctor'), triggerAnonymization);
router.patch('/:id/status', requireAuth, requireRole('admin', 'clinic_staff', 'doctor'), updateStatus);
router.patch('/:id/assignment', requireAuth, requireRole('admin', 'clinic_staff', 'doctor'), updateAssignment);
router.post('/:id/corrections', requireAuth, requireRole('admin', 'doctor'), submitCorrection);
router.get('/:id/corrections', requireAuth, requireRole('admin', 'doctor', 'pharmacist'), getCorrectionHistory);
router.post('/:id/confirm', requireAuth, requireRole('admin', 'doctor'), confirmPrescription);
router.post('/:id/reject', requireAuth, requireRole('admin', 'doctor', 'clinic_staff'), rejectPrescription);
router.get('/:id/history', requireAuth, requireRole('admin', 'doctor', 'pharmacist', 'clinic_staff'), getStatusHistory);
router.post('/:id/dispense', requireAuth, requireRole('admin', 'pharmacist'), dispensePrescription);
export default router;
