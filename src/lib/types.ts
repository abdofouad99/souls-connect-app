export type AppRole = 'admin' | 'staff' | 'sponsor';

export interface Orphan {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  age: number;
  city: string;
  country: string;
  status: 'available' | 'partially_sponsored' | 'fully_sponsored' | 'inactive' | 'partial' | 'full';
  monthly_amount: number;
  story?: string;
  photo_url?: string;
  intro_video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  user_id?: string;
  full_name: string;
  phone?: string;
  email: string;
  country?: string;
  preferred_contact: string;
  created_at: string;
  updated_at: string;
}

export interface Sponsorship {
  id: string;
  orphan_id: string;
  sponsor_id: string;
  type: 'monthly' | 'yearly';
  monthly_amount: number;
  start_date: string;
  end_date?: string;
  payment_method: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  receipt_number: string;
  created_at: string;
  updated_at: string;
  orphan?: Orphan;
  sponsor?: Sponsor;
}

export interface Receipt {
  id: string;
  sponsorship_id: string;
  receipt_number: string;
  issue_date: string;
  amount: number;
  payment_reference?: string;
  created_at: string;
  sponsorship?: Sponsorship;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  country?: string;
  preferred_contact: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Stats {
  totalOrphans: number;
  availableOrphans: number;
  sponsoredOrphans: number;
  totalSponsors: number;
  activeSponsorships: number;
}
