import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import DnaStrand from './components/DnaStrand';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import TeamPage from './pages/public/TeamPage';
import ProjectPage from './pages/public/ProjectPage';
import PresentationsPage from './pages/public/PresentationsPage';
import PresentationDetailPage from './pages/public/PresentationDetailPage';
import RoadmapPage from './pages/public/RoadmapPage';
import ArchitecturePage from './pages/public/ArchitecturePage';
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDeliverables from './pages/admin/AdminDeliverables';
import AdminTeam from './pages/admin/AdminTeam';
import AdminFiles from './pages/admin/AdminFiles';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAudit from './pages/admin/AdminAudit';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorReview from './pages/doctor/DoctorReview';
import DoctorCalibration from './pages/doctor/DoctorCalibration';

// Pharmacist
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import InventoryPage from './pages/pharmacist/InventoryPage';
import DispensingPage from './pages/pharmacist/DispensingPage';
import RefillRequestsPage from './pages/pharmacist/RefillRequestsPage';

// Clinic staff
import ClinicDashboard from './pages/clinic/ClinicDashboard';
import ClinicUpload from './pages/clinic/ClinicUpload';
import ClinicReviewQueue from './pages/clinic/ClinicReviewQueue';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientRefills from './pages/patient/PatientRefills';
import PatientSchedule from './pages/patient/PatientSchedule';

// Researcher
import ResearcherDashboard from './pages/researcher/ResearcherDashboard';
import ResearcherPrescriptions from './pages/researcher/ResearcherPrescriptions';

// Shared
import PrescriptionDetailPage from './pages/shared/PrescriptionDetailPage';
import ProfilePage from './pages/shared/ProfilePage';

function RoleRedirect() {
  const { role } = useAuth();
  const destinations = {
    admin: '/admin',
    doctor: '/doctor',
    pharmacist: '/pharmacist',
    clinic_staff: '/clinic',
    patient: '/patient',
    researcher: '/researcher',
  };
  return <Navigate to={destinations[role] || '/login'} replace />;
}

export default function App() {
  return (
    <>
      {/* ─── Global Persistent 3D Rotating DNA Strand (Between reference lines) ─── */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 right-0 w-[360px] h-[300px] sm:w-[400px] sm:h-[340px] pointer-events-none z-20 opacity-85 md:opacity-95 select-none overflow-hidden"
      >
        <DnaStrand className="w-full h-full" />
      </div>

      <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/project" element={<ProjectPage />} />
        <Route path="/presentations" element={<PresentationsPage />} />
        <Route path="/presentations/:id" element={<PresentationDetailPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Role redirect after login */}
      <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="deliverables" element={<AdminDeliverables />} />
        <Route path="team" element={<AdminTeam />} />
        <Route path="files" element={<AdminFiles />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Doctor */}
      <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DashboardLayout role="doctor" /></ProtectedRoute>}>
        <Route index element={<DoctorDashboard />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="prescriptions/:id" element={<DoctorReview />} />
        <Route path="prescriptions/:id/view" element={<PrescriptionDetailPage />} />
        <Route path="calibration" element={<DoctorCalibration />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Pharmacist */}
      <Route path="/pharmacist" element={<ProtectedRoute roles={['pharmacist']}><DashboardLayout role="pharmacist" /></ProtectedRoute>}>
        <Route index element={<PharmacistDashboard />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="dispensing" element={<DispensingPage />} />
        <Route path="refills" element={<RefillRequestsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Clinic staff */}
      <Route path="/clinic" element={<ProtectedRoute roles={['clinic_staff']}><DashboardLayout role="clinic_staff" /></ProtectedRoute>}>
        <Route index element={<ClinicDashboard />} />
        <Route path="upload" element={<ClinicUpload />} />
        <Route path="review" element={<ClinicReviewQueue />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Patient */}
      <Route path="/patient" element={<ProtectedRoute roles={['patient']}><DashboardLayout role="patient" /></ProtectedRoute>}>
        <Route index element={<PatientDashboard />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="refills" element={<PatientRefills />} />
        <Route path="schedule" element={<PatientSchedule />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Researcher */}
      <Route path="/researcher" element={<ProtectedRoute roles={['researcher']}><DashboardLayout role="researcher" /></ProtectedRoute>}>
        <Route index element={<ResearcherDashboard />} />
        <Route path="prescriptions" element={<ResearcherPrescriptions />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
