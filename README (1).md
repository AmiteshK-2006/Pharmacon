# Pharmacon 💊

Pharmacon is a comprehensive , full-stack prescription digitisation and medication-management platform. It bridges the gap between clinic staff, doctors, pharmacists, and patients by securely digitizing handwritten prescriptions and providing a robust workflow for review, dispensing, and refills.

---

## 🌟 Key Features

### Role-Based Access Control

- **Clinic Staff**: Upload prescription images/PDFs and assign them to specific patients and doctors.
- **Doctors**: Review uploaded prescriptions, verify/correct extracted medication data, and confirm them for dispensing.
- **Pharmacists**: Manage medicine inventory and dispense confirmed prescriptions using a strict FIFO batch-deduction system.
- **Patients**: View their active medication schedules and request refills for ongoing prescriptions.

### Core Systems
- **Secure File Storage**: Prescriptions are stored in a private Supabase bucket with strict Row Level Security (RLS) and short-lived signed URLs.
- **Inventory Management**: Tracks individual batches, expiration dates, and maintains a ledger of all stock transactions.
- **Audit Trails**: Critical actions (uploads, corrections, dispenses) are logged in an immutable audit trail.
- **AI Abstraction Layer**: Built to integrate with OCR/AI models for automated handwriting recognition (currently requires manual doctor review as a fallback).

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, TanStack Query, React Router
- **Backend**: Node.js, Express.js, Jest (for testing)
- **Database & Auth**: Supabase (PostgreSQL, GoTrue, Storage)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- A free [Supabase](https://supabase.com/) account

### 1. Database Setup (Supabase)

1. Create a new project in Supabase.
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Run the SQL migration scripts located in `/supabase/migrations/` in sequential order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_prescription_items.sql`
   - `004_prescription_items_rls.sql`
   - `005_storage_buckets.sql`
4. Disable **Confirm Email** under Authentication -> Providers -> Email (for local testing).

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the frontend client:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`.

---

## 🧪 Testing

The backend includes a comprehensive Jest/Supertest suite verifying Authentication middleware, RBAC enforcement, Prescription workflows, and Inventory deduplication constraints.

To run the tests:
```bash
cd backend
npm run test
```

---

## 🚢 Deployment

- **Frontend**: Configured for continuous deployment via **GitHub Pages** (using the `.github/workflows/deploy-pages.yml` Action).
- **Backend Infrastructure**: Relies directly on **Supabase** (Postgres + Auth + Storage).

---

## 🔒 Security Notes
- **Never** expose the `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- **Never** trust JWT role payloads on the backend; the API explicitly looks up the user's role from the trusted database upon every request.
- The `private-prescriptions` bucket requires authenticated Service Role access to read or write blobs.
