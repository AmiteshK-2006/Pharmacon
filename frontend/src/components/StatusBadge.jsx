const STATUS_MAP = {
  // Prescription statuses
  UPLOADED:                   { label: 'Uploaded',            cls: 'badge-gray'   },
  PROCESSING:                 { label: 'Processing',          cls: 'badge-blue'   },
  EXTRACTED:                  { label: 'Extracted',           cls: 'badge-blue'   },
  NEEDS_REVIEW:               { label: 'Needs Review',        cls: 'badge-yellow' },
  CORRECTED:                  { label: 'Corrected',           cls: 'badge-blue'   },
  PENDING_DOCTOR_CONFIRMATION:{ label: 'Pending Confirmation',cls: 'badge-yellow' },
  CONFIRMED:                  { label: 'Confirmed',           cls: 'badge-green'  },
  DISPENSING:                 { label: 'Dispensing',          cls: 'badge-blue'   },
  DISPENSED:                  { label: 'Dispensed',           cls: 'badge-green'  },
  CANCELLED:                  { label: 'Cancelled',           cls: 'badge-gray'   },
  REJECTED:                   { label: 'Rejected',            cls: 'badge-red'    },
  // Refill statuses
  PENDING:                    { label: 'Pending',             cls: 'badge-yellow' },
  APPROVED:                   { label: 'Approved',            cls: 'badge-green'  },
  // Medicine statuses
  active:                     { label: 'Active',              cls: 'badge-green'  },
  inactive:                   { label: 'Inactive',            cls: 'badge-gray'   },
  // Deliverable statuses
  draft:                      { label: 'Draft',               cls: 'badge-gray'   },
  published:                  { label: 'Published',           cls: 'badge-green'  },
  archived:                   { label: 'Archived',            cls: 'badge-yellow' },
  // Milestone statuses
  upcoming:                   { label: 'Upcoming',            cls: 'badge-gray'   },
  in_progress:                { label: 'In Progress',         cls: 'badge-blue'   },
  completed:                  { label: 'Completed',           cls: 'badge-green'  },
  delayed:                    { label: 'Delayed',             cls: 'badge-red'    },
  // Anonymization statuses
  COMPLETED:                  { label: 'De-Identified',       cls: 'badge-green'  },
  ANONYMIZED:                 { label: 'De-Identified',       cls: 'badge-green'  },
  FAILED:                     { label: 'Anonymize Failed',    cls: 'badge-red'    },
  // Roles
  admin:                      { label: 'Admin',               cls: 'badge-red'    },
  doctor:                     { label: 'Doctor',              cls: 'badge-blue'   },
  pharmacist:                 { label: 'Pharmacist',          cls: 'badge-green'  },
  clinic_staff:               { label: 'Clinic Staff',        cls: 'badge-yellow' },
  patient:                    { label: 'Patient',             cls: 'badge-gray'   },
  researcher:                 { label: 'Researcher',          cls: 'badge-purple' },
};

export function StatusBadge({ status }) {
  const entry = STATUS_MAP[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${entry.cls}`}>{entry.label}</span>;
}
