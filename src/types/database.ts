export type MemberStatus = 'Visitor' | 'Regular' | 'Member' | 'Inactive' | 'Transferred'
export type Gender = 'Male' | 'Female' | 'Prefer not to say'

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
