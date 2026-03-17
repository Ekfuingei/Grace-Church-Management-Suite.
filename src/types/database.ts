export type MemberStatus = 'Visitor' | 'Regular' | 'Member' | 'Inactive' | 'Transferred'
export type Gender = 'Male' | 'Female' | 'Prefer not to say'

export type ServiceType = 'Sunday Morning' | 'Sunday Evening' | 'Midweek' | 'Special' | 'Other'
export type GivingType = 'Tithe' | 'First Fruit' | 'Offering' | 'Special Seed' | 'Building Fund' | 'Mission Fund' | 'Other'
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Cheque' | 'Card'
export type AttendanceStatus = 'Present' | 'Absent' | 'First Timer'
export type RotaAssignmentStatus = 'Confirmed' | 'Pending' | 'Declined'
export type PipelineStage = 'New Contact' | 'First Visit' | 'Regular' | 'Membership Class' | 'Full Member'
export type CounsellingCaseStatus = 'Open' | 'In Progress' | 'Closed'
export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show'

export interface Member {
  id: string
  full_name: string
  preferred_name: string | null
  member_id: string
  status: MemberStatus
  phone: string | null
  email: string | null
  date_of_birth: string | null
  gender: Gender | null
  join_date: string | null
  address: string | null
  cell_group: string | null
  departments: string[] | null
  photo_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChurchSettings {
  id: string
  church_name: string
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  date: string
  service_type: ServiceType
  theme: string | null
  preacher: string | null
  total_present: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  service_id: string
  member_id: string
  status: AttendanceStatus
  arrived_late: boolean
  notes: string | null
  created_at: string
}

export interface GivingRecord {
  id: string
  member_id: string
  amount: number
  currency: string
  giving_type: GivingType
  payment_method: PaymentMethod
  date: string
  service_type: ServiceType | null
  recorded_by: string | null
  notes: string | null
  receipt_number: string | null
  created_at: string
}

export interface Department {
  id: string
  name: string
  color: string
  max_volunteers: number
  coordinator_id: string | null
  created_at: string
  updated_at: string
}

export interface RotaAssignment {
  id: string
  service_id: string
  member_id: string
  department_id: string
  role: string | null
  status: RotaAssignmentStatus
  notes: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string | null
  category: string | null
  department_id: string | null
  is_urgent: boolean
  start_date: string | null
  expiry_date: string | null
  image_url: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EvangelismContact {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  address: string | null
  source: string | null
  first_contact_date: string | null
  initial_outcome: string | null
  pipeline_stage: PipelineStage
  assigned_to: string | null
  next_followup_date: string | null
  notes: string | null
  converted_to_member_id: string | null
  created_at: string
  updated_at: string
}

export interface FollowupActivity {
  id: string
  contact_id: string
  date: string
  type: string
  outcome: string | null
  next_step: string | null
  logged_by: string | null
  created_at: string
}

export interface CounsellingCase {
  id: string
  member_id: string
  status: CounsellingCaseStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CounsellingAppointment {
  id: string
  member_id: string
  counsellor_id: string
  appointment_type: string
  date: string
  time_start: string
  time_end: string
  location: string | null
  status: AppointmentStatus
  is_urgent: boolean
  case_id: string | null
  booked_by: string | null
  notes_for_counsellor: string | null
  created_at: string
  updated_at: string
}

export interface SessionNote {
  id: string
  appointment_id: string
  content: string
  action_items: string | null
  next_appointment_recommended: boolean
  risk_flag: boolean
  created_by: string | null
  created_at: string
}
