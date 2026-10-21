import { execute, queryOne, queryAll } from './db.js';
import { hashPassword } from './auth.js';

// Base64 demo prescription graphic
const DEMO_PRESCRIPTION_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="%23ffffff"><rect width="100%" height="100%" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="90" rx="8" fill="%230f172a"/><text x="40" y="60" fill="%23ffffff" font-family="Arial" font-size="20" font-weight="bold">TAMIL NADU MULTISPECIALITY CLINIC</text><text x="40" y="85" fill="%2394a3b8" font-family="Arial" font-size="12">Dr. K. Sundaram, MD, DM (Cardiology) | Reg No: TN-MC-49201</text><line x1="20" y1="130" x2="580" y2="130" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="160" fill="%23334155" font-family="Arial" font-size="14">Patient Name: S. Priya (Age: 32, Female)</text><text x="400" y="160" fill="%23334155" font-family="Arial" font-size="14">Date: 2026-10-18</text><text x="40" y="190" fill="%23334155" font-family="Arial" font-size="14">Diagnosis: Acute Respiratory Infection & Mild Hypertension</text><line x1="20" y1="220" x2="580" y2="220" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="260" fill="%23dc2626" font-family="Arial" font-size="28" font-weight="bold">Rx</text><text x="70" y="300" fill="%230f172a" font-family="Arial" font-size="15" font-weight="bold">1. Amoxicillin + Clavulanic Acid 625mg</text><text x="90" y="325" fill="%2364748b" font-family="Arial" font-size="13">1 Tablet twice daily after food x 5 days</text><text x="70" y="370" fill="%230f172a" font-family="Arial" font-size="15" font-weight="bold">2. Azithromycin 500mg</text><text x="90" y="395" fill="%2364748b" font-family="Arial" font-size="13">1 Tablet once daily 1 hour before meal x 3 days</text><text x="70" y="440" fill="%230f172a" font-family="Arial" font-size="15" font-weight="bold">3. Paracetamol 650mg</text><text x="90" y="465" fill="%2364748b" font-family="Arial" font-size="13">SOS for temperature > 100°F (Max 3/day)</text><text x="70" y="510" fill="%230f172a" font-family="Arial" font-size="15" font-weight="bold">4. Amlodipine 5mg</text><text x="90" y="535" fill="%2364748b" font-family="Arial" font-size="13">1 Tablet early morning daily</text><rect x="40" y="680" width="220" height="60" rx="4" fill="none" stroke="%2394a3b8" stroke-dasharray="4"/><text x="50" y="715" fill="%2364748b" font-family="Arial" font-size="12">Doctor Digital Signature</text><text x="50" y="730" fill="%2310b981" font-family="Arial" font-size="11" font-weight="bold">VERIFIED MEDICAL REGISTRATION</text></svg>`;

export function seedDemoData(): void {
  const existingUsers = queryOne('SELECT COUNT(*) as count FROM users');
  if (existingUsers && existingUsers.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial demo data for UyirThunai...');

  // 1. Demo Users
  const defaultPasswordHash = hashPassword('password123');
  const adminHash = hashPassword('admin123');
  const hospitalHash = hashPassword('hospital123');
  const donorHash = hashPassword('donor123');
  const pharmaHash = hashPassword('pharma123');
  const courierHash = hashPassword('courier123');
  const patientHash = hashPassword('patient123');

  const demoAccounts = [
    {
      id: 'USR-ADMIN-01',
      email: 'admin@uyirthunai.org',
      password_hash: adminHash,
      full_name: 'Dr. Meenakshi Sundaram (Admin)',
      role: 'admin',
      phone: '+91 98401 23456',
      city: 'Chennai',
      locality: 'Nungambakkam',
    },
    {
      id: 'USR-HOSP-01',
      email: 'staff.rajesh@apollo-hospital.org',
      password_hash: hospitalHash,
      full_name: 'Rajesh Kannan (Blood Bank Officer)',
      role: 'hospital_staff',
      phone: '+91 98402 34567',
      city: 'Chennai',
      locality: 'Greams Road',
    },
    {
      id: 'USR-DONOR-01',
      email: 'donor.kavitha@gmail.com',
      password_hash: donorHash,
      full_name: 'Kavitha Ramanathan',
      role: 'donor',
      phone: '+91 98403 45678',
      city: 'Chennai',
      locality: 'T. Nagar',
    },
    {
      id: 'USR-PHARMA-01',
      email: 'pharmacist.anand@medplus-tn.org',
      password_hash: pharmaHash,
      full_name: 'Anandhan Selvaraj (Chief Pharmacist)',
      role: 'pharmacy_staff',
      phone: '+91 98404 56789',
      city: 'Chennai',
      locality: 'Anna Nagar',
    },
    {
      id: 'USR-COURIER-01',
      email: 'courier.murugan@fastmed-logistics.org',
      password_hash: courierHash,
      full_name: 'Murugan Perumal (Delivery Partner)',
      role: 'courier',
      phone: '+91 98405 67890',
      city: 'Chennai',
      locality: 'Teynampet',
    },
    {
      id: 'USR-PATIENT-01',
      email: 'patient.priya@outlook.com',
      password_hash: patientHash,
      full_name: 'S. Priya (Patient & Requester)',
      role: 'patient',
      phone: '+91 98406 78901',
      city: 'Chennai',
      locality: 'Adyar',
    },
  ];

  const now = new Date().toISOString();

  demoAccounts.forEach(u => {
    execute(
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, city, locality, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, u.password_hash, u.full_name, u.role, u.phone, u.city, u.locality, now, now]
    );
  });

  // Additional Fictional Donors (Total > 20 donors)
  const additionalDonors = [
    { name: 'Suresh Kumar', blood: 'O+', city: 'Chennai', locality: 'T. Nagar', avail: 'available', last: '2026-06-15', age: 29, gender: 'Male', phone: '+91 98411 00001' },
    { name: 'Deepa Lakshmi', blood: 'O-', city: 'Chennai', locality: 'Greams Road', avail: 'available', last: '2026-05-10', age: 34, gender: 'Female', phone: '+91 98411 00002' },
    { name: 'Karthik Raja', blood: 'A+', city: 'Chennai', locality: 'Adyar', avail: 'available', last: '2026-07-20', age: 26, gender: 'Male', phone: '+91 98411 00003' },
    { name: 'Anitha Balaji', blood: 'A-', city: 'Chennai', locality: 'Mylapore', avail: 'available', last: '2026-04-12', age: 31, gender: 'Female', phone: '+91 98411 00004' },
    { name: 'Vigneshwaran M.', blood: 'B+', city: 'Chennai', locality: 'Anna Nagar', avail: 'available', last: '2026-06-01', age: 28, gender: 'Male', phone: '+91 98411 00005' },
    { name: 'Shalini Natarajan', blood: 'B-', city: 'Chennai', locality: 'Velachery', avail: 'available', last: '2026-05-30', age: 25, gender: 'Female', phone: '+91 98411 00006' },
    { name: 'Manoj Prabhakar', blood: 'AB+', city: 'Chennai', locality: 'Guindy', avail: 'available', last: '2026-06-25', age: 38, gender: 'Male', phone: '+91 98411 00007' },
    { name: 'Divya Bharathi', blood: 'AB-', city: 'Chennai', locality: 'Kilpauk', avail: 'available', last: '2026-04-05', age: 27, gender: 'Female', phone: '+91 98411 00008' },
    { name: 'Arun Pandian', blood: 'O+', city: 'Coimbatore', locality: 'RS Puram', avail: 'available', last: '2026-07-10', age: 30, gender: 'Male', phone: '+91 98411 00009' },
    { name: 'Pooja Venkatesh', blood: 'O-', city: 'Coimbatore', locality: 'Gandhipuram', avail: 'available', last: '2026-06-18', age: 29, gender: 'Female', phone: '+91 98411 00010' },
    { name: 'Bala Saravanan', blood: 'A+', city: 'Coimbatore', locality: 'Peelamedu', avail: 'on_hold', last: '2026-09-28', age: 35, gender: 'Male', phone: '+91 98411 00011' },
    { name: 'Gowri Shankar', blood: 'B+', city: 'Madurai', locality: 'KK Nagar', avail: 'available', last: '2026-05-22', age: 41, gender: 'Male', phone: '+91 98411 00012' },
    { name: 'Revathi Krishnan', blood: 'O+', city: 'Madurai', locality: 'Anna Nagar', avail: 'available', last: '2026-07-02', age: 32, gender: 'Female', phone: '+91 98411 00013' },
    { name: 'Senthil Velan', blood: 'AB+', city: 'Trichy', locality: 'Thillai Nagar', avail: 'available', last: '2026-06-14', age: 33, gender: 'Male', phone: '+91 98411 00014' },
    { name: 'Karpagam Sundar', blood: 'A-', city: 'Trichy', locality: 'Cantonment', avail: 'available', last: '2026-05-15', age: 37, gender: 'Female', phone: '+91 98411 00015' },
    { name: 'Dinesh Kumar', blood: 'B-', city: 'Salem', locality: 'Fairlands', avail: 'available', last: '2026-06-08', age: 28, gender: 'Male', phone: '+91 98411 00016' },
    { name: 'Pavitra Chandran', blood: 'O-', city: 'Salem', locality: 'Hasthampatti', avail: 'unavailable', last: '2026-09-15', age: 24, gender: 'Female', phone: '+91 98411 00017' },
    { name: 'Naveen Raj', blood: 'O+', city: 'Tirunelveli', locality: 'Palayamkottai', avail: 'available', last: '2026-06-20', age: 31, gender: 'Male', phone: '+91 98411 00018' },
    { name: 'Jayashree Murthi', blood: 'A+', city: 'Chennai', locality: 'Nungambakkam', avail: 'available', last: '2026-05-01', age: 29, gender: 'Female', phone: '+91 98411 00019' },
    { name: 'Raghavan S.', blood: 'O-', city: 'Chennai', locality: 'Royapettah', avail: 'available', last: '2026-06-30', age: 36, gender: 'Male', phone: '+91 98411 00020' },
    { name: 'Subhashini G.', blood: 'B+', city: 'Chennai', locality: 'Porur', avail: 'available', last: '2026-07-01', age: 27, gender: 'Female', phone: '+91 98411 00021' },
    { name: 'Vijay Anand', blood: 'AB-', city: 'Coimbatore', locality: 'Saibaba Colony', avail: 'available', last: '2026-04-18', age: 33, gender: 'Male', phone: '+91 98411 00022' }
  ];

  // Insert primary donor user record
  execute(
    `INSERT INTO donors (id, user_id, blood_group, availability_status, last_donation_date, age, gender, consent_emergency, total_donations, verified_badge, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['DNR-001', 'USR-DONOR-01', 'O+', 'available', '2026-06-10', 28, 'Female', 1, 4, 1, now]
  );

  additionalDonors.forEach((d, idx) => {
    const userId = `USR-DNR-${String(idx + 2).padStart(3, '0')}`;
    const donorId = `DNR-${String(idx + 2).padStart(3, '0')}`;
    const email = `donor.${d.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@uyirthunai.org`;

    execute(
      `INSERT INTO users (id, email, password_hash, full_name, role, phone, city, locality, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'donor', ?, ?, ?, ?, ?)`,
      [userId, email, defaultPasswordHash, d.name, d.phone, d.city, d.locality, now, now]
    );

    execute(
      `INSERT INTO donors (id, user_id, blood_group, availability_status, last_donation_date, age, gender, consent_emergency, total_donations, verified_badge, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [donorId, userId, d.blood, d.avail, d.last, d.age, d.gender, (idx % 5) + 1, idx % 2 === 0 ? 1 : 0, now]
    );
  });

  // 2. Fictional Blood Requests (10 requests with varied states)
  const bloodRequests = [
    {
      id: 'BR-2026-0001',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-APO-8841',
      patient_name: 'Thirunavukkarasu V.',
      blood: 'O-',
      units: 2,
      fulfilled: 1,
      urgency: 'critical',
      hospital: 'Apollo Hospitals - Greams Road',
      city: 'Chennai',
      locality: 'Greams Road',
      contact: 'Rajesh Kannan (Blood Bank Officer)',
      phone: '+91 98402 34567',
      req_by: '2026-10-22 18:00',
      notes: 'Emergency polytrauma surgical case requiring immediate O- universal donor transfusion.',
      status: 'Awaiting Donor Response',
    },
    {
      id: 'BR-2026-0002',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-MMC-3210',
      patient_name: 'Bavani S.',
      blood: 'O+',
      units: 3,
      fulfilled: 0,
      urgency: 'urgent',
      hospital: 'Madras Medical College & Rajiv Gandhi Hospital',
      city: 'Chennai',
      locality: 'Park Town',
      contact: 'Duty Medical Officer',
      phone: '+91 98402 11223',
      req_by: '2026-10-23 10:00',
      notes: 'Post-partum hemorrhage management in obstetric ICU.',
      status: 'Matching in Progress',
    },
    {
      id: 'BR-2026-0003',
      requester_id: 'USR-PATIENT-01',
      patient_ref: 'PAT-MIOT-4091',
      patient_name: 'Chandrasekar M.',
      blood: 'A+',
      units: 2,
      fulfilled: 2,
      urgency: 'standard',
      hospital: 'MIOT International Hospital',
      city: 'Chennai',
      locality: 'Manapakkam',
      contact: 'S. Priya (Family Attendant)',
      phone: '+91 98406 78901',
      req_by: '2026-10-24 14:00',
      notes: 'Elective total knee replacement surgery scheduled for tomorrow.',
      status: 'Fulfilled',
    },
    {
      id: 'BR-2026-0004',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-SIMS-1922',
      patient_name: 'Gopalakrishnan N.',
      blood: 'B+',
      units: 2,
      fulfilled: 0,
      urgency: 'urgent',
      hospital: 'SIMS Hospital Vadapalani',
      city: 'Chennai',
      locality: 'Vadapalani',
      contact: 'Dr. Vignesh (Cardiology Registrar)',
      phone: '+91 98402 77889',
      req_by: '2026-10-22 22:00',
      notes: 'CABG Bypass procedure, high risk of intraoperative bleeding.',
      status: 'Submitted',
    },
    {
      id: 'BR-2026-0005',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-KMCH-7712',
      patient_name: 'Meena Kumari',
      blood: 'AB+',
      units: 1,
      fulfilled: 1,
      urgency: 'standard',
      hospital: 'KMCH Hospital Coimbatore',
      city: 'Coimbatore',
      locality: 'Avinashi Road',
      contact: 'Blood Bank Desk',
      phone: '+91 98422 44556',
      req_by: '2026-10-25 12:00',
      notes: 'Severe chronic anemia transfusion therapy.',
      status: 'Under Staff Review',
    },
    {
      id: 'BR-2026-0006',
      requester_id: 'USR-PATIENT-01',
      patient_ref: 'PAT-GRH-5509',
      patient_name: 'Kandasamy R.',
      blood: 'B-',
      units: 2,
      fulfilled: 0,
      urgency: 'critical',
      hospital: 'Government Rajaji Hospital',
      city: 'Madurai',
      locality: 'Alwarpuram',
      contact: 'Resident Doctor',
      phone: '+91 98452 99881',
      req_by: '2026-10-21 23:59',
      notes: 'Rare B- negative blood needed for acute dengue thrombocytopenia with active mucosal bleeding.',
      status: 'Awaiting Donor Response',
    },
    {
      id: 'BR-2026-0007',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-KAP-2211',
      patient_name: 'Alagappan K.',
      blood: 'AB-',
      units: 1,
      fulfilled: 0,
      urgency: 'urgent',
      hospital: 'KAP Viswanatham Govt Medical College',
      city: 'Trichy',
      locality: 'Periyamilaguparai',
      contact: 'Blood Storage Center',
      phone: '+91 98431 33445',
      req_by: '2026-10-23 15:00',
      notes: 'Rare AB- blood requirement for neurosurgery craniotomy.',
      status: 'Matching in Progress',
    },
    {
      id: 'BR-2026-0008',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-MMH-1029',
      patient_name: 'Radhika S.',
      blood: 'A-',
      units: 2,
      fulfilled: 0,
      urgency: 'urgent',
      hospital: 'Manipal Hospital Salem',
      city: 'Salem',
      locality: 'Dalmia Board',
      contact: 'Dr. Arunkumar',
      phone: '+91 98427 66778',
      req_by: '2026-10-22 17:00',
      notes: 'Orthopedic femur fixation post motor vehicle collision.',
      status: 'Submitted',
    },
    {
      id: 'BR-2026-0009',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-TVM-8890',
      patient_name: 'Selvakumar P.',
      blood: 'O+',
      units: 4,
      fulfilled: 0,
      urgency: 'standard',
      hospital: 'Tirunelveli Medical College Hospital',
      city: 'Tirunelveli',
      locality: 'High Ground',
      contact: 'Blood Bank Officer',
      phone: '+91 98424 55667',
      req_by: '2026-10-26 10:00',
      notes: 'Patient stabilized and family managed through internal bank.',
      status: 'Cancelled',
    },
    {
      id: 'BR-2026-0010',
      requester_id: 'USR-HOSP-01',
      patient_ref: 'PAT-GFH-3301',
      patient_name: 'Mohamed Rafiq',
      blood: 'O-',
      units: 2,
      fulfilled: 2,
      urgency: 'critical',
      hospital: 'Fortis Malar Hospital Adyar',
      city: 'Chennai',
      locality: 'Adyar',
      contact: 'ICU Coordinator',
      phone: '+91 98409 11000',
      req_by: '2026-10-20 08:00',
      notes: 'Successfully fulfilled via UyirThunai donor matching network.',
      status: 'Fulfilled',
    },
  ];

  bloodRequests.forEach(br => {
    execute(
      `INSERT INTO blood_requests (id, requester_user_id, patient_reference_id, patient_name, blood_group, units_required, units_fulfilled, urgency_level, hospital_name, hospital_city, hospital_locality, contact_person, contact_phone, required_by_date, clinical_notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [br.id, br.requester_id, br.patient_ref, br.patient_name, br.blood, br.units, br.fulfilled, br.urgency, br.hospital, br.city, br.locality, br.contact, br.phone, br.req_by, br.notes, br.status, now, now]
    );
  });

  // Seed sample donor matches for BR-2026-0001
  execute(
    `INSERT INTO donor_matches (id, request_id, donor_id, compatibility_score, match_reasons, status, donor_response_time, staff_notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'MCH-001',
      'BR-2026-0001',
      'DNR-003', // Deepa Lakshmi O- in Greams Road
      95,
      JSON.stringify(['Exact blood group match (O-)', 'Located in the same city (Chennai)', 'Immediate locality match (Greams Road)', 'Donor status is actively Available', 'Cooldown satisfied (163 days since last donation)']),
      'accepted',
      '2026-10-20 09:30:00',
      'Confirmed by Rajesh Kannan. Donor arrived at blood bank for pre-donation screening.',
      now,
    ]
  );

  execute(
    `INSERT INTO donor_matches (id, request_id, donor_id, compatibility_score, match_reasons, status, donor_response_time, staff_notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'MCH-002',
      'BR-2026-0001',
      'DNR-021', // Raghavan S. O- in Royapettah
      85,
      JSON.stringify(['Exact blood group match (O-)', 'Located in the same city (Chennai)', 'Donor status is actively Available', 'Cooldown satisfied (112 days since last donation)']),
      'notified',
      null,
      'Awaiting donor response via in-app alert.',
      now,
    ]
  );

  // 3. Fictional Medicine Inventory (> 25 records with rich realistic data)
  const medicines = [
    { id: 'MED-001', name: 'Amoxicillin + Clavulanic Acid (Augmentin)', category: 'Antibiotics', strength: '625mg', dosage: 'Tablet', mfg: 'Apex LifeSciences', stock: 120, threshold: 25, price: 185.50, rx: 1, desc: 'Broad-spectrum penicillin antibiotic combined with beta-lactamase inhibitor.', side: 'Mild nausea, diarrhea, skin rash', storage: 'Store below 25°C in dry place' },
    { id: 'MED-002', name: 'Azithromycin (Aziwok)', category: 'Antibiotics', strength: '500mg', dosage: 'Tablet', mfg: 'MedVenture Pharma', stock: 85, threshold: 20, price: 119.00, rx: 1, desc: 'Macrolide antibiotic for upper and lower respiratory tract infections.', side: 'Abdominal pain, dizziness', storage: 'Keep away from moisture' },
    { id: 'MED-003', name: 'Cefixime (Taxim-O)', category: 'Antibiotics', strength: '200mg', dosage: 'Tablet', mfg: 'TamilNadu BioPharm', stock: 65, threshold: 20, price: 145.00, rx: 1, desc: 'Third-generation cephalosporin for severe bacterial infections.', side: 'Headache, loose stools', storage: 'Protect from sunlight' },
    { id: 'MED-004', name: 'Paracetamol (Dolo 650)', category: 'Analgesics', strength: '650mg', dosage: 'Tablet', mfg: 'MicroLabs Healthcare', stock: 350, threshold: 50, price: 32.00, rx: 0, desc: 'First-line antipyretic and analgesic for fever and pain relief.', side: 'Very rare; avoid liver overdose', storage: 'Room temperature' },
    { id: 'MED-005', name: 'Ibuprofen + Paracetamol (Combiflam)', category: 'Analgesics', strength: '400mg/325mg', dosage: 'Tablet', mfg: 'Sanofi India Demo', stock: 180, threshold: 30, price: 46.50, rx: 0, desc: 'Non-steroidal anti-inflammatory for acute muscular and dental pain.', side: 'Gastric irritation; take after meals', storage: 'Store in cool place' },
    { id: 'MED-006', name: 'Tramadol HCl (Ultracet)', category: 'Analgesics', strength: '37.5mg/325mg', dosage: 'Tablet', mfg: 'Janssen Demo Labs', stock: 12, threshold: 15, price: 210.00, rx: 1, desc: 'Controlled opioid analgesic for moderate to severe post-operative pain.', side: 'Somnolence, nausea, constipation', storage: 'Keep in locked schedule H cupboard' },
    { id: 'MED-007', name: 'Amlodipine (Amlong)', category: 'Cardiac', strength: '5mg', dosage: 'Tablet', mfg: 'MicroLabs Healthcare', stock: 210, threshold: 30, price: 68.00, rx: 1, desc: 'Calcium channel blocker for essential hypertension and angina.', side: 'Peripheral ankle edema, flushing', storage: 'Store below 30°C' },
    { id: 'MED-008', name: 'Telmisartan (Telma 40)', category: 'Cardiac', strength: '40mg', dosage: 'Tablet', mfg: 'Glenmark Demo', stock: 140, threshold: 25, price: 115.00, rx: 1, desc: 'Angiotensin II receptor antagonist for blood pressure control.', side: 'Back pain, fatigue', storage: 'Room temperature' },
    { id: 'MED-009', name: 'Atorvastatin (Atorva 10)', category: 'Cardiac', strength: '10mg', dosage: 'Tablet', mfg: 'Zydus Demo Corp', stock: 175, threshold: 30, price: 98.00, rx: 1, desc: 'HMG-CoA reductase inhibitor for dyslipidemia and cardiovascular risk.', side: 'Muscle cramps, elevated AST/ALT', storage: 'Store in dry place' },
    { id: 'MED-010', name: 'Metformin Hydrochloride (Glycomet)', category: 'Diabetes', strength: '500mg SR', dosage: 'Tablet', mfg: 'USV Demo Healthcare', stock: 260, threshold: 40, price: 42.00, rx: 1, desc: 'First-line biguanide for type 2 diabetes mellitus management.', side: 'Transient metallic taste, bloating', storage: 'Store below 25°C' },
    { id: 'MED-011', name: 'Glimepiride (Amaryl 2)', category: 'Diabetes', strength: '2mg', dosage: 'Tablet', mfg: 'Sanofi India Demo', stock: 80, threshold: 20, price: 88.00, rx: 1, desc: 'Second-generation sulfonylurea for glycemic stimulation.', side: 'Hypoglycemia risk if meals skipped', storage: 'Room temperature' },
    { id: 'MED-012', name: 'Human Regular Insulin (Actrapid)', category: 'Diabetes', strength: '40 IU/ml', dosage: 'Injection', mfg: 'Novo Demo Labs', stock: 8, threshold: 12, price: 182.00, rx: 1, desc: 'Short-acting recombinant human insulin vial for diabetic emergencies.', side: 'Hypoglycemia, lipodystrophy', storage: 'Refrigerate at 2°C to 8°C. Do not freeze' },
    { id: 'MED-013', name: 'Salbutamol Inhaler (Asthalin)', category: 'Respiratory', strength: '100mcg', dosage: 'Inhaler', mfg: 'Cipla Demo Pharma', stock: 55, threshold: 15, price: 165.00, rx: 1, desc: 'Fast-acting beta-2 agonist for acute bronchospasm and asthma relief.', side: 'Fine tremor, palpitations', storage: 'Store below 30°C away from heat' },
    { id: 'MED-014', name: 'Budesonide + Formoterol (Budecort-F)', category: 'Respiratory', strength: '200mcg', dosage: 'Inhaler', mfg: 'Cipla Demo Pharma', stock: 40, threshold: 15, price: 340.00, rx: 1, desc: 'Corticosteroid and LABA controller for maintenance asthma/COPD.', side: 'Hoarseness, oral candidiasis', storage: 'Rinse mouth after inhalation' },
    { id: 'MED-015', name: 'Montelukast + Levocetirizine (Montair-LC)', category: 'Respiratory', strength: '10mg/5mg', dosage: 'Tablet', mfg: 'Sun Demo Labs', stock: 190, threshold: 30, price: 172.00, rx: 0, desc: 'Dual-action antihistamine and leukotriene inhibitor for allergic rhinitis.', side: 'Mild drowsiness, headache', storage: 'Protect from moisture' },
    { id: 'MED-016', name: 'Pantoprazole Gastro-Resistant (Pan 40)', category: 'Gastrointestinal', strength: '40mg', dosage: 'Tablet', mfg: 'Alkem Demo Labs', stock: 320, threshold: 40, price: 95.00, rx: 0, desc: 'Proton pump inhibitor for GERD, peptic ulcer, and gastric acid relief.', side: 'Flatulence, headache', storage: 'Store in cool dry place' },
    { id: 'MED-017', name: 'Oral Rehydration Salts (Electral ORS)', category: 'Gastrointestinal', strength: '21.8g Sachet', dosage: 'Powder', mfg: 'FDC Demo India', stock: 450, threshold: 50, price: 22.00, rx: 0, desc: 'WHO formula electrolyte replacement for acute dehydration.', side: 'None when mixed with 1L drinking water', storage: 'Dry place' },
    { id: 'MED-018', name: 'Domperidone + Rabeprazole (Razo-D)', category: 'Gastrointestinal', strength: '30mg/20mg', dosage: 'Capsule', mfg: 'Dr. Reddys Demo', stock: 110, threshold: 25, price: 155.00, rx: 1, desc: 'Prokinetic and anti-secretory combo for severe dyspepsia.', side: 'Dry mouth, abdominal cramps', storage: 'Store below 25°C' },
    { id: 'MED-019', name: 'Adrenaline Injection (Epinephrine)', category: 'Emergency', strength: '1mg/1ml (1:1000)', dosage: 'Injection', mfg: 'TamilNadu BioPharm', stock: 15, threshold: 20, price: 75.00, rx: 1, desc: 'Emergency vasoconstrictor for anaphylactic shock and cardiac arrest.', side: 'Tachycardia, anxiety, hypertension', storage: 'Protect from light. Do not freeze' },
    { id: 'MED-020', name: 'Hydrocortisone Sodium Succinate', category: 'Emergency', strength: '100mg', dosage: 'Injection', mfg: 'Apex LifeSciences', stock: 18, threshold: 20, price: 58.00, rx: 1, desc: 'Systemic glucocorticoid for acute adrenal crisis and severe allergies.', side: 'Fluid retention, elevated glucose', storage: 'Store below 25°C' },
    { id: 'MED-021', name: 'Sorbitrate (Isosorbide Dinitrate)', category: 'Emergency', strength: '5mg Sublingual', dosage: 'Tablet', mfg: 'Abbott Demo India', stock: 95, threshold: 20, price: 48.00, rx: 1, desc: 'Sublingual coronary vasodilator for immediate angina pectoris relief.', side: 'Throbbing headache, orthostatic hypotension', storage: 'Keep tightly closed in amber bottle' },
    { id: 'MED-022', name: 'Vitamin C + Zinc Chewable (Limcee Plus)', category: 'Vitamins', strength: '500mg/5mg', dosage: 'Tablet', mfg: 'Abbott Demo India', stock: 280, threshold: 40, price: 65.00, rx: 0, desc: 'Immune support antioxidant chewable formula with natural ascorbic acid.', side: 'Mild stomach upset if taken empty stomach', storage: 'Store below 25°C' },
    { id: 'MED-023', name: 'Vitamin D3 (Calcirol 60K)', category: 'Vitamins', strength: '60,000 IU', dosage: 'Capsule', mfg: 'Cadila Demo Labs', stock: 160, threshold: 25, price: 135.00, rx: 0, desc: 'High-potency cholecalciferol for bone mineralization and deficiency.', side: 'None when taken once weekly', storage: 'Store in cool dry place' },
    { id: 'MED-024', name: 'Methylcobalamin + B-Complex (Becosules-Z)', category: 'Vitamins', strength: 'Multi', dosage: 'Capsule', mfg: 'Pfizer Demo India', stock: 240, threshold: 30, price: 55.00, rx: 0, desc: 'Comprehensive B-complex with zinc for neuropathy and convalescence.', side: 'Harmless bright yellow urine discoloration', storage: 'Room temperature' },
    { id: 'MED-025', name: 'Silver Sulfadiazine Burn Ointment (Silverex)', category: 'Emergency', strength: '1% w/w (50g)', dosage: 'Ointment', mfg: 'Sun Demo Labs', stock: 70, threshold: 15, price: 110.00, rx: 0, desc: 'Topical antimicrobial cream for second and third degree burns.', side: 'Transient burning sensation', storage: 'Do not freeze' },
    { id: 'MED-026', name: 'Digoxin (Lanoxin)', category: 'Cardiac', strength: '0.25mg', dosage: 'Tablet', mfg: 'GSK Demo India', stock: 5, threshold: 15, price: 28.00, rx: 1, desc: 'Cardiac glycoside for atrial fibrillation and severe heart failure.', side: 'Narrow therapeutic window; vision changes', storage: 'Store away from moisture' },
  ];

  medicines.forEach(m => {
    let status = 'in_stock';
    if (m.stock === 0) status = 'out_of_stock';
    else if (m.stock <= m.threshold) status = 'low_stock';

    execute(
      `INSERT INTO medicines (id, name, category, strength, dosage_form, manufacturer, stock_quantity, min_threshold, price_inr, prescription_required, status, description, side_effects, storage_instructions, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.name, m.category, m.strength, m.dosage, m.mfg, m.stock, m.threshold, m.price, m.rx, status, m.desc, m.side, m.storage, now]
    );
  });

  // 4. Prescriptions & Orders (10 realistic records)
  const prescriptions = [
    {
      id: 'RX-2026-0001',
      user_id: 'USR-PATIENT-01',
      patient_name: 'S. Priya',
      doctor: 'Dr. K. Sundaram, MD (Cardiology)',
      clinic: 'Tamil Nadu Multispeciality Clinic, Chennai',
      status: 'Approved',
      reviewer_id: 'USR-PHARMA-01',
      notes: 'Prescription valid, doctor license verified, dosages verified against clinical guidelines.',
      file_name: 'priya_rx_oct2026.png',
      file_type: 'image/png',
      file_data: DEMO_PRESCRIPTION_SVG,
    },
    {
      id: 'RX-2026-0002',
      user_id: 'USR-PATIENT-01',
      patient_name: 'K. Somasundaram (Father)',
      doctor: 'Dr. V. Revathi, MD (Endocrinology)',
      clinic: 'Apollo Sugar Clinic, Greams Road',
      status: 'Under Review',
      reviewer_id: null,
      notes: null,
      file_name: 'father_insulin_rx.png',
      file_type: 'image/png',
      file_data: DEMO_PRESCRIPTION_SVG,
    },
    {
      id: 'RX-2026-0003',
      user_id: 'USR-DONOR-01',
      patient_name: 'Kavitha Ramanathan',
      doctor: 'Dr. A. Joseph, MD (Chest Physician)',
      clinic: 'Sundaram Medical Foundation, Anna Nagar',
      status: 'Approved',
      reviewer_id: 'USR-PHARMA-01',
      notes: 'Asthalin inhaler prescription confirmed for 6 months maintenance.',
      file_name: 'kavitha_asthma_rx.png',
      file_type: 'image/png',
      file_data: DEMO_PRESCRIPTION_SVG,
    },
    {
      id: 'RX-2026-0004',
      user_id: 'USR-PATIENT-01',
      patient_name: 'R. Lakshmi',
      doctor: 'Dr. M. Prakash, MS (Ortho)',
      clinic: 'SIMS Hospital Orthopedics',
      status: 'Correction Requested',
      reviewer_id: 'USR-PHARMA-01',
      notes: 'Date of prescription is expired or unclear. Please re-upload clearer doctor stamp.',
      file_name: 'lakshmi_ortho_scan.png',
      file_type: 'image/png',
      file_data: DEMO_PRESCRIPTION_SVG,
    },
  ];

  prescriptions.forEach(rx => {
    execute(
      `INSERT INTO prescriptions (id, user_id, patient_name, doctor_name, clinic_hospital, file_name, file_type, file_data, status, reviewer_id, reviewer_notes, reviewed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rx.id, rx.user_id, rx.patient_name, rx.doctor, rx.clinic, rx.file_name, rx.file_type, rx.file_data, rx.status, rx.reviewer_id, rx.notes, rx.reviewer_id ? now : null, now]
    );
  });

  // Orders
  const orders = [
    {
      id: 'ORD-2026-0001',
      user_id: 'USR-PATIENT-01',
      rx_id: 'RX-2026-0001',
      total: 389.00,
      addr: 'Flat 4B, Lotus Apartments, 1st Cross Street, Adyar',
      city: 'Chennai',
      phone: '+91 98406 78901',
      pay_method: 'Simulated Online Transfer (UPI)',
      pay_status: 'Paid',
      status: 'Out for Delivery',
      courier_id: 'USR-COURIER-01',
      notes: 'Temperature-sensitive packaging completed.',
      items: [
        { med_id: 'MED-001', name: 'Amoxicillin + Clavulanic Acid (Augmentin)', qty: 1, unit: 185.50 },
        { med_id: 'MED-002', name: 'Azithromycin (Aziwok)', qty: 1, unit: 119.00 },
        { med_id: 'MED-004', name: 'Paracetamol (Dolo 650)', qty: 2, unit: 32.00 },
        { med_id: 'MED-022', name: 'Vitamin C + Zinc Chewable (Limcee Plus)', qty: 1, unit: 65.00 }, // Total items match
      ],
    },
    {
      id: 'ORD-2026-0002',
      user_id: 'USR-PATIENT-01',
      rx_id: 'RX-2026-0002',
      total: 224.00,
      addr: 'Flat 4B, Lotus Apartments, 1st Cross Street, Adyar',
      city: 'Chennai',
      phone: '+91 98406 78901',
      pay_method: 'Demo Cash on Delivery',
      pay_status: 'Pending',
      status: 'Awaiting Prescription Review',
      courier_id: null,
      notes: 'Requires pharmacist review of insulin vial prescription.',
      items: [
        { med_id: 'MED-012', name: 'Human Regular Insulin (Actrapid)', qty: 1, unit: 182.00 },
        { med_id: 'MED-010', name: 'Metformin Hydrochloride (Glycomet)', qty: 1, unit: 42.00 },
      ],
    },
    {
      id: 'ORD-2026-0003',
      user_id: 'USR-DONOR-01',
      rx_id: 'RX-2026-0003',
      total: 165.00,
      addr: '12 Raman Street, T. Nagar',
      city: 'Chennai',
      phone: '+91 98403 45678',
      pay_method: 'Simulated Online Transfer (UPI)',
      pay_status: 'Paid',
      status: 'Delivered',
      courier_id: 'USR-COURIER-01',
      notes: 'Handed over directly to recipient.',
      items: [
        { med_id: 'MED-013', name: 'Salbutamol Inhaler (Asthalin)', qty: 1, unit: 165.00 },
      ],
    },
    {
      id: 'ORD-2026-0004',
      user_id: 'USR-PATIENT-01',
      rx_id: null,
      total: 172.00,
      addr: 'Flat 4B, Lotus Apartments, 1st Cross Street, Adyar',
      city: 'Chennai',
      phone: '+91 98406 78901',
      pay_method: 'Demo Cash on Delivery',
      pay_status: 'Pending',
      status: 'Ready for Dispatch',
      courier_id: 'USR-COURIER-01',
      notes: 'OTC medication packed and tagged for courier pickup.',
      items: [
        { med_id: 'MED-015', name: 'Montelukast + Levocetirizine (Montair-LC)', qty: 1, unit: 172.00 },
      ],
    },
    {
      id: 'ORD-2026-0005',
      user_id: 'USR-DONOR-01',
      rx_id: null,
      total: 139.00,
      addr: '12 Raman Street, T. Nagar',
      city: 'Chennai',
      phone: '+91 98403 45678',
      pay_method: 'Simulated Online Transfer (UPI)',
      pay_status: 'Paid',
      status: 'Processing',
      courier_id: null,
      notes: 'Being assembled by pharmacist Anandhan.',
      items: [
        { med_id: 'MED-016', name: 'Pantoprazole Gastro-Resistant (Pan 40)', qty: 1, unit: 95.00 },
        { med_id: 'MED-017', name: 'Oral Rehydration Salts (Electral ORS)', qty: 2, unit: 22.00 },
      ],
    },
    {
      id: 'ORD-2026-0006',
      user_id: 'USR-PATIENT-01',
      rx_id: null,
      total: 254.50,
      addr: '15 South Mada Street, Mylapore',
      city: 'Chennai',
      phone: '+91 98406 78901',
      pay_method: 'Demo Cash on Delivery',
      pay_status: 'Paid',
      status: 'Delivered',
      courier_id: 'USR-COURIER-01',
      notes: 'Delivered on time.',
      items: [
        { med_id: 'MED-004', name: 'Paracetamol (Dolo 650)', qty: 3, unit: 32.00 },
        { med_id: 'MED-005', name: 'Ibuprofen + Paracetamol (Combiflam)', qty: 2, unit: 46.50 },
        { med_id: 'MED-022', name: 'Vitamin C + Zinc Chewable (Limcee Plus)', qty: 1, unit: 65.00 },
      ],
    },
  ];

  orders.forEach(ord => {
    execute(
      `INSERT INTO orders (id, user_id, prescription_id, total_amount, delivery_address, delivery_city, delivery_phone, payment_method, payment_status, status, courier_id, pharmacy_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ord.id, ord.user_id, ord.rx_id, ord.total, ord.addr, ord.city, ord.phone, ord.pay_method, ord.pay_status, ord.status, ord.courier_id, ord.notes, now, now]
    );

    ord.items.forEach((item, i) => {
      execute(
        `INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`ITM-${ord.id}-${i+1}`, ord.id, item.med_id, item.name, item.qty, item.unit, item.qty * item.unit]
      );
    });

    if (ord.courier_id) {
      execute(
        `INSERT INTO delivery_assignments (id, order_id, courier_id, assigned_by, pickup_status, status_note, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`DEL-${ord.id}`, ord.id, ord.courier_id, 'USR-PHARMA-01', ord.status === 'Delivered' ? 'delivered' : 'in_transit', ord.notes, now]
      );
    }
  });

  // 5. In-app Notifications
  const notifications = [
    {
      id: 'NOTIF-001',
      user_id: 'USR-DONOR-01',
      title: 'Emergency Blood Match Alert: O+ Required',
      title_ta: 'அவசர இரத்தத் தேவை எச்சரிக்கை: O+ தேவைப்படுகிறது',
      message: 'Apollo Hospitals Greams Road has requested 2 units of O+ blood for patient Bavani S. (Ref: PAT-MMC-3210). You are a high-compatibility donor match.',
      message_ta: 'அப்பல்லோ மருத்துவமனை கிரீம்ஸ் ரோடு நோயாளி பவானி எஸ். (PAT-MMC-3210) க்கு 2 யூனிட் O+ இரத்தத்தை கோரியுள்ளது. நீங்கள் சிறந்த பொருத்தமுள்ள கொடையாளர்.',
      type: 'blood_request',
      link: '/blood-requests/BR-2026-0002',
    },
    {
      id: 'NOTIF-002',
      user_id: 'USR-PATIENT-01',
      title: 'Prescription Approved by Pharmacist',
      title_ta: 'மருந்தாளர் மூலம் பரிந்துரைச்சீட்டு அங்கீகரிக்கப்பட்டது',
      message: 'Your prescription (RX-2026-0001) for Amoxicillin & Azithromycin was approved by Chief Pharmacist Anandhan. Order ORD-2026-0001 has been dispatched.',
      message_ta: 'அமாக்ஸிசிலின் & அசித்ரோமைசின் பரிந்துரைச்சீட்டு (RX-2026-0001) தலைமை மருந்தாளர் ஆனந்தன் அவர்களால் அங்கீகரிக்கப்பட்டது. ஆர்டர் அனுப்பப்பட்டுள்ளது.',
      type: 'prescription_update',
      link: '/orders/ORD-2026-0001',
    },
    {
      id: 'NOTIF-003',
      user_id: 'USR-COURIER-01',
      title: 'New Medicine Delivery Assigned: ORD-2026-0001',
      title_ta: 'புதிய மருந்து விநியோகப் பணி ஒதுக்கப்பட்டது: ORD-2026-0001',
      message: 'You have been assigned to deliver medicines to Flat 4B, Lotus Apartments, Adyar. Please pick up package from MedPlus Anna Nagar hub.',
      message_ta: 'அடையாறு லோட்டஸ் அடுக்குமாடிக்கு மருந்துகளை விநியோகிக்க உங்களுக்கு பணி ஒதுக்கப்பட்டுள்ளது. அண்ணா நகர் மையத்திலிருந்து பார்சலை எடுக்கவும்.',
      type: 'order_status',
      link: '/courier',
    },
    {
      id: 'NOTIF-004',
      user_id: 'USR-HOSP-01',
      title: 'Donor Accepted Emergency Blood Request',
      title_ta: 'கொடையாளர் அவசர இரத்தக் கோரிக்கையை ஏற்றுக்கொண்டார்',
      message: 'Donor Deepa Lakshmi has accepted your emergency request (BR-2026-0001) for patient Thirunavukkarasu V. Ready for blood bank clinical confirmation.',
      message_ta: 'கொடையாளர் தீபா லட்சுமி நோயாளி திருநாவுக்கரசு (BR-2026-0001) க்கான அவசர கோரிக்கையை ஏற்றுக்கொண்டுள்ளார்.',
      type: 'donor_accepted',
      link: '/blood-requests/BR-2026-0001',
    },
    {
      id: 'NOTIF-005',
      user_id: 'USR-PHARMA-01',
      title: 'Low Stock Alert: Human Regular Insulin & Tramadol',
      title_ta: 'குறைந்த இருப்பு எச்சரிக்கை: இன்சுலின் & டிரமடால்',
      message: 'Stock for Actrapid Insulin is down to 8 units (Threshold: 12) and Tramadol is at 12 units (Threshold: 15). Please reorder from distributor.',
      message_ta: 'இன்சுலின் இருப்பு 8 யூனிட்களாகவும், டிரமடால் 12 யூனிட்களாகவும் குறைந்துள்ளது. விநியோகஸ்தரிடமிருந்து மறுஆர்டர் செய்யவும்.',
      type: 'inventory_alert',
      link: '/pharmacy-inventory',
    },
    {
      id: 'NOTIF-006',
      user_id: 'USR-ADMIN-01',
      title: 'System Operational: All Modules Connected',
      title_ta: 'அமைப்பின் நிலை: அனைத்து தொகுதிகளும் இயங்குகின்றன',
      message: 'UyirThunai Blood Coordination & Pharmacy Fulfilment database engine initialized with 22 donors and 26 essential medicines.',
      message_ta: 'உயிர்த்துணை இரத்த ஒருங்கிணைப்பு & மருந்தக அமைப்பு 22 கொடையாளர்கள் மற்றும் 26 அத்தியாவசிய மருந்துகளுடன் இயங்குகிறது.',
      type: 'system',
      link: '/dashboard',
    },
  ];

  notifications.forEach(n => {
    execute(
      `INSERT INTO notifications (id, user_id, title, title_ta, message, message_ta, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [n.id, n.user_id, n.title, n.title_ta, n.message, n.message_ta, n.type, n.link, now]
    );
  });

  // 6. Audit Logs
  const auditLogs = [
    { id: 'AUD-001', user_id: 'USR-ADMIN-01', role: 'admin', action: 'DATABASE_INITIALIZATION', entity: 'System', entity_id: 'SYS-INIT', details: 'Database tables seeded with medical catalogue, demo donors, and hospitals.' },
    { id: 'AUD-002', user_id: 'USR-HOSP-01', role: 'hospital_staff', action: 'CREATE_BLOOD_REQUEST', entity: 'BloodRequest', entity_id: 'BR-2026-0001', details: 'Created Critical O- emergency request for patient Thirunavukkarasu V. at Apollo Hospitals.' },
    { id: 'AUD-003', user_id: 'USR-HOSP-01', role: 'hospital_staff', action: 'RUN_MATCHING_ENGINE', entity: 'BloodRequest', entity_id: 'BR-2026-0001', details: 'Automated compatibility algorithm identified 2 eligible O- donors in Chennai.' },
    { id: 'AUD-004', user_id: 'USR-PHARMA-01', role: 'pharmacy_staff', action: 'REVIEW_PRESCRIPTION', entity: 'Prescription', entity_id: 'RX-2026-0001', details: 'Approved prescription after verifying doctor credentials and dosage contraindications.' },
    { id: 'AUD-005', user_id: 'USR-PHARMA-01', role: 'pharmacy_staff', action: 'ASSIGN_COURIER', entity: 'Order', entity_id: 'ORD-2026-0001', details: 'Assigned delivery partner Murugan Perumal to order ORD-2026-0001.' },
  ];

  auditLogs.forEach(a => {
    execute(
      `INSERT INTO audit_logs (id, user_id, user_role, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, '127.0.0.1 (Local Server)', ?)`,
      [a.id, a.user_id, a.role, a.action, a.entity, a.entity_id, a.details, now]
    );
  });

  console.log('Seeding completed successfully!');
}
