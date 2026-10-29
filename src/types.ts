export type UserRole = 'patient' | 'donor' | 'hospital_staff' | 'pharmacy_staff' | 'courier' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  city?: string;
  locality?: string;
  created_at?: string;
}

export interface Donor {
  id: string;
  donor_id?: string;
  user_id: string;
  blood_group: string;
  availability_status: 'available' | 'on_hold' | 'unavailable';
  last_donation_date?: string | null;
  age?: number | null;
  gender?: string | null;
  consent_emergency: number;
  total_donations: number;
  verified_badge: number;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  locality?: string;
  created_at?: string;
}

export interface BloodRequest {
  id: string;
  requester_user_id: string;
  requester_name?: string;
  requester_role?: string;
  patient_reference_id: string;
  patient_name: string;
  blood_group: string;
  units_required: number;
  units_fulfilled: number;
  urgency_level: 'critical' | 'urgent' | 'standard';
  hospital_name: string;
  hospital_city: string;
  hospital_locality: string;
  contact_person: string;
  contact_phone: string;
  required_by_date: string;
  clinical_notes?: string | null;
  status: 'Submitted' | 'Matching in Progress' | 'Awaiting Donor Response' | 'Under Staff Review' | 'Fulfilled' | 'Cancelled';
  created_at: string;
  updated_at: string;
  potential_matches_count?: number;
  accepted_donors_count?: number;
}

export interface DonorMatch {
  id: string;
  request_id: string;
  donor_id: string;
  compatibility_score: number;
  match_reasons: string[];
  status: 'notified' | 'accepted' | 'declined' | 'unavailable' | 'reviewed';
  donor_response_time?: string | null;
  staff_notes?: string | null;
  created_at: string;
  blood_group?: string;
  availability_status?: string;
  last_donation_date?: string | null;
  total_donations?: number;
  verified_badge?: number;
  donor_user_id?: string;
  donor_name?: string;
  donor_phone?: string;
  donor_city?: string;
  donor_locality?: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  stock_quantity: number;
  min_threshold: number;
  price_inr: number;
  prescription_required: number; // 0 or 1
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  description?: string | null;
  side_effects?: string | null;
  storage_instructions?: string | null;
  last_updated: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  patient_name: string;
  doctor_name: string;
  clinic_hospital: string;
  file_name: string;
  file_type: string;
  file_data: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Correction Requested';
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  prescription_id?: string | null;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  delivery_phone: string;
  payment_method: string;
  payment_status: 'Pending' | 'Paid';
  payment_utr?: string | null;
  payment_time?: string | null;
  notification_sent_whatsapp?: number;
  notification_sent_email?: number;
  status: 'Submitted' | 'Awaiting Prescription Review' | 'Approved' | 'Processing' | 'Ready for Dispatch' | 'Courier Assigned' | 'Out for Delivery' | 'Delivered' | 'Rejected' | 'Cancelled';
  courier_id?: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  pharmacy_notes?: string | null;
  created_at: string;
  updated_at: string;
  items_count?: number;
  rx_patient?: string;
  rx_doctor?: string;
  rx_status?: string;
  gps_telemetry?: GpsTelemetry;
}

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  courier_id: string;
  assigned_by: string;
  pickup_status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  status_note?: string | null;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  title_ta: string;
  message: string;
  message_ta: string;
  type: 'blood_request' | 'match_alert' | 'donor_accepted' | 'prescription_update' | 'order_status' | 'order_payment' | 'inventory_alert' | 'system';
  link?: string | null;
  is_read: number;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface BloodInventoryLevel {
  blood_group: string;
  units_in_stock: number;
  target_capacity: number;
  critical_threshold: number;
  donor_count: number;
  available_donors: number;
  active_requests: number;
  percentage: number;
  status: 'optimal' | 'moderate' | 'critical';
}

export interface GpsTelemetry {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  current_location: { lat: number; lng: number };
  vehicle_speed_kmh: number;
  distance_remaining_km: number;
  eta_minutes: number;
  temp_celsius: number;
  cold_chain_status: string;
  last_ping: string;
}

export interface AdmissionRecord {
  id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  hospital_name: string;
  hospital_city: string;
  ward_number: string;
  bed_number: string;
  attending_physician: string;
  diagnosis: string;
  blood_group?: string;
  admission_date: string;
  discharge_date?: string | null;
  order_id?: string | null;
  status: 'Active' | 'Discharged / Recovered' | 'Transferred' | 'Under Observation';
  emergency_priority: 'Critical Emergency' | 'Urgent' | 'High Priority' | 'Standard Inpatient';
  created_at: string;
  updated_at: string;
  order?: Order | null;
  order_items?: OrderItem[];
  courier?: { id: string; full_name: string; phone?: string; role?: string } | null;
  gps_telemetry?: GpsTelemetry;
}

export interface DashboardStats {
  blood: {
    totalRequests: number;
    criticalRequests: number;
    activeRequests: number;
    fulfilledRequests: number;
    totalDonors: number;
    availableDonors: number;
    bloodDistribution: { blood_group: string; donor_count: number; available_count: number }[];
    inventoryLevels?: BloodInventoryLevel[];
  };
  pharmacy: {
    totalMedicines: number;
    lowStockCount: number;
    pendingPrescriptions: number;
    activeOrders: number;
    deliveredOrders: number;
  };
}
