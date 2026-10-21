import { Router, Request, Response } from 'express';
import { queryAll, queryOne, execute } from './db.js';
import { generateToken, hashPassword, comparePassword, requireAuth, requireRole, AuthenticatedRequest } from './auth.js';
import { evaluateCompatibility } from './matchingEngine.js';

export const apiRouter = Router();

// Helper to log audit trail
function logAudit(userId: string | null, role: string | null, action: string, entityType: string, entityId: string, details: string, req: Request) {
  try {
    const id = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    execute(
      `INSERT INTO audit_logs (id, user_id, user_role, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, role, action, entityType, entityId, details, String(ip), new Date().toISOString()]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Helper to create notifications
function createNotification(userId: string, title: string, titleTa: string, message: string, messageTa: string, type: string, link?: string) {
  try {
    const id = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    execute(
      `INSERT INTO notifications (id, user_id, title, title_ta, message, message_ta, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, title, titleTa, message, messageTa, type, link || null, new Date().toISOString()]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// -------------------------------------------------------------
// AUTH & USERS
// -------------------------------------------------------------

// List demo users for 1-click test login
apiRouter.get('/auth/demo-users', (req: Request, res: Response) => {
  const demoUsers = [
    { role: 'admin', email: 'admin@uyirthunai.org', name: 'Dr. Meenakshi Sundaram', title: 'Administrator', password: 'admin123' },
    { role: 'hospital_staff', email: 'staff.rajesh@apollo-hospital.org', name: 'Rajesh Kannan', title: 'Hospital Blood Bank Officer', password: 'hospital123' },
    { role: 'donor', email: 'donor.kavitha@gmail.com', name: 'Kavitha Ramanathan', title: 'Registered Blood Donor (O+)', password: 'donor123' },
    { role: 'pharmacy_staff', email: 'pharmacist.anand@medplus-tn.org', name: 'Anandhan Selvaraj', title: 'Licensed Chief Pharmacist', password: 'pharma123' },
    { role: 'courier', email: 'courier.murugan@fastmed-logistics.org', name: 'Murugan Perumal', title: 'Medicine Delivery Partner', password: 'courier123' },
    { role: 'patient', email: 'patient.priya@outlook.com', name: 'S. Priya', title: 'Patient / Requester', password: 'patient123' },
  ];
  res.json({ demoUsers });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, full_name, role, phone, city, locality, blood_group, age, gender } = req.body;

  if (!email || !password || !full_name || !role) {
    res.status(400).json({ error: 'Email, password, full name, and role are required.' });
    return;
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const userId = `USR-${Date.now()}`;
  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  execute(
    `INSERT INTO users (id, email, password_hash, full_name, role, phone, city, locality, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, email.toLowerCase().trim(), passwordHash, full_name.trim(), role, phone || null, city || null, locality || null, now, now]
  );

  // If role is donor, insert donor record
  if (role === 'donor') {
    const donorId = `DNR-${Date.now()}`;
    execute(
      `INSERT INTO donors (id, user_id, blood_group, availability_status, last_donation_date, age, gender, consent_emergency, total_donations, verified_badge, created_at)
       VALUES (?, ?, ?, 'available', null, ?, ?, 1, 0, 0, ?)`,
      [donorId, userId, blood_group || 'O+', age ? Number(age) : null, gender || null, now]
    );
  }

  const user = {
    id: userId,
    email: email.toLowerCase().trim(),
    role,
    full_name: full_name.trim(),
    phone,
    city,
    locality,
  };

  logAudit(userId, role, 'REGISTER', 'User', userId, `New account registered as ${role}`, req);
  const token = generateToken(user);
  res.status(201).json({ token, user });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user || !comparePassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email address or password.' });
    return;
  }

  const authUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    phone: user.phone,
    city: user.city,
    locality: user.locality,
  };

  logAudit(user.id, user.role, 'LOGIN', 'User', user.id, `User logged in`, req);
  const token = generateToken(authUser);
  res.json({ token, user: authUser });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let donorInfo = null;
  if (user.role === 'donor') {
    donorInfo = queryOne('SELECT * FROM donors WHERE user_id = ?', [user.id]);
  }
  res.json({ user, donorInfo });
});

// -------------------------------------------------------------
// BLOOD DONORS & COORDINATION
// -------------------------------------------------------------

// List donors with role-based privacy masking
apiRouter.get('/blood/donors', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { blood_group, city, availability } = req.query;
  let sql = `
    SELECT d.id as donor_id, d.blood_group, d.availability_status, d.last_donation_date,
           d.age, d.gender, d.consent_emergency, d.total_donations, d.verified_badge, d.created_at,
           u.id as user_id, u.full_name, u.email, u.phone, u.city, u.locality
    FROM donors d
    JOIN users u ON d.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (blood_group) {
    sql += ` AND d.blood_group = ?`;
    params.push(blood_group);
  }
  if (city) {
    sql += ` AND LOWER(u.city) LIKE ?`;
    params.push(`%${String(city).toLowerCase().trim()}%`);
  }
  if (availability) {
    sql += ` AND d.availability_status = ?`;
    params.push(availability);
  }

  sql += ` ORDER BY d.verified_badge DESC, d.total_donations DESC`;

  const rows = queryAll(sql, params);

  // Mask phone numbers and emails for unauthorized roles to protect donor privacy
  const isPrivileged = req.user!.role === 'hospital_staff' || req.user!.role === 'admin';
  const sanitized = rows.map(r => {
    if (!isPrivileged && r.user_id !== req.user!.id) {
      return {
        ...r,
        phone: r.phone ? r.phone.replace(/(\+\d{2}\s\d{2})\d{4}(\d{4})/, '$1 **** $2') : 'Protected',
        email: r.email ? r.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Protected',
      };
    }
    return r;
  });

  res.json({ donors: sanitized });
});

// Update current user's donor profile/availability
apiRouter.put('/blood/donors/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { blood_group, availability_status, last_donation_date, age, gender } = req.body;
  const user = req.user!;

  let donor = queryOne('SELECT * FROM donors WHERE user_id = ?', [user.id]);
  if (!donor) {
    const donorId = `DNR-${Date.now()}`;
    execute(
      `INSERT INTO donors (id, user_id, blood_group, availability_status, last_donation_date, age, gender, consent_emergency, total_donations, verified_badge, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?)`,
      [donorId, user.id, blood_group || 'O+', availability_status || 'available', last_donation_date || null, age ? Number(age) : null, gender || null, new Date().toISOString()]
    );
  } else {
    execute(
      `UPDATE donors
       SET blood_group = COALESCE(?, blood_group),
           availability_status = COALESCE(?, availability_status),
           last_donation_date = ?,
           age = COALESCE(?, age),
           gender = COALESCE(?, gender)
       WHERE user_id = ?`,
      [blood_group, availability_status, last_donation_date, age ? Number(age) : null, gender, user.id]
    );
  }

  logAudit(user.id, user.role, 'UPDATE_DONOR_PROFILE', 'Donor', user.id, 'Updated donor profile details', req);
  const updated = queryOne('SELECT * FROM donors WHERE user_id = ?', [user.id]);
  res.json({ donor: updated });
});

// Emergency Blood Requests
apiRouter.get('/blood/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status, urgency, blood_group, city } = req.query;
  let sql = `
    SELECT br.*, u.full_name as requester_name, u.role as requester_role,
           (SELECT COUNT(*) FROM donor_matches WHERE request_id = br.id) as potential_matches_count,
           (SELECT COUNT(*) FROM donor_matches WHERE request_id = br.id AND status = 'accepted') as accepted_donors_count
    FROM blood_requests br
    JOIN users u ON br.requester_user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'All') {
    sql += ` AND br.status = ?`;
    params.push(status);
  }
  if (urgency && urgency !== 'All') {
    sql += ` AND br.urgency_level = ?`;
    params.push(urgency);
  }
  if (blood_group && blood_group !== 'All') {
    sql += ` AND br.blood_group = ?`;
    params.push(blood_group);
  }
  if (city) {
    sql += ` AND LOWER(br.hospital_city) LIKE ?`;
    params.push(`%${String(city).toLowerCase().trim()}%`);
  }

  sql += ` ORDER BY 
    CASE br.urgency_level 
      WHEN 'critical' THEN 1 
      WHEN 'urgent' THEN 2 
      ELSE 3 
    END, 
    br.created_at DESC`;

  const requests = queryAll(sql, params);
  res.json({ requests });
});

apiRouter.post('/blood/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    patient_reference_id,
    patient_name,
    blood_group,
    units_required,
    urgency_level,
    hospital_name,
    hospital_city,
    hospital_locality,
    contact_person,
    contact_phone,
    required_by_date,
    clinical_notes,
  } = req.body;

  if (!patient_name || !blood_group || !units_required || !hospital_name || !hospital_city || !contact_phone) {
    res.status(400).json({ error: 'Please provide all mandatory fields for blood request creation.' });
    return;
  }

  const requestId = `BR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const now = new Date().toISOString();
  const patientRef = patient_reference_id ? patient_reference_id.trim() : `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

  execute(
    `INSERT INTO blood_requests (id, requester_user_id, patient_reference_id, patient_name, blood_group, units_required, units_fulfilled, urgency_level, hospital_name, hospital_city, hospital_locality, contact_person, contact_phone, required_by_date, clinical_notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)`,
    [
      requestId,
      req.user!.id,
      patientRef,
      patient_name.trim(),
      blood_group,
      Number(units_required),
      urgency_level || 'urgent',
      hospital_name.trim(),
      hospital_city.trim(),
      hospital_locality ? hospital_locality.trim() : '',
      contact_person ? contact_person.trim() : req.user!.full_name,
      contact_phone.trim(),
      required_by_date || now,
      clinical_notes ? clinical_notes.trim() : null,
      now,
      now,
    ]
  );

  logAudit(req.user!.id, req.user!.role, 'CREATE_BLOOD_REQUEST', 'BloodRequest', requestId, `Emergency request for ${units_required} units of ${blood_group}`, req);

  // Auto-run donor matching engine immediately!
  runMatchingForRequest(requestId);

  const created = queryOne('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
  res.status(201).json({ request: created });
});

// Run Matching Engine for a Request
function runMatchingForRequest(requestId: string) {
  const request = queryOne('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
  if (!request) return [];

  // Fetch all registered donors with user details
  const donors = queryAll(`
    SELECT d.*, u.full_name, u.city, u.locality, u.phone, u.email
    FROM donors d
    JOIN users u ON d.user_id = u.id
    WHERE d.consent_emergency = 1
  `);

  const results: any[] = [];
  const now = new Date().toISOString();

  donors.forEach(donor => {
    const comp = evaluateCompatibility(
      request.blood_group,
      donor.blood_group,
      donor.availability_status,
      donor.city,
      request.hospital_city,
      donor.locality,
      request.hospital_locality,
      donor.last_donation_date,
      donor.age,
      request.urgency_level
    );

    if (comp.isCompatible) {
      const matchId = `MCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      // Check if match already exists
      const existing = queryOne('SELECT id FROM donor_matches WHERE request_id = ? AND donor_id = ?', [requestId, donor.id]);
      if (!existing) {
        execute(
          `INSERT INTO donor_matches (id, request_id, donor_id, compatibility_score, match_reasons, status, donor_response_time, staff_notes, created_at)
           VALUES (?, ?, ?, ?, ?, 'notified', null, null, ?)`,
          [matchId, requestId, donor.id, comp.score, JSON.stringify(comp.reasons), now]
        );

        // Send in-app notification to the matched donor
        createNotification(
          donor.user_id,
          `Urgent Blood Need: ${request.blood_group} at ${request.hospital_name}`,
          `அவசர இரத்தத் தேவை: ${request.blood_group} - ${request.hospital_name}`,
          `An urgent requirement for ${request.blood_group} (${request.units_required} units) was posted. You are a compatible candidate. Ref: ${request.id}`,
          `${request.hospital_name} மருத்துவமனையில் ${request.blood_group} இரத்த தேவை உள்ளது. நீங்கள் தகுதியுள்ள கொடையாளர். குறிப்பு: ${request.id}`,
          'blood_request',
          `/blood-requests/${request.id}`
        );
      }
      results.push({ donor, comp });
    }
  });

  // Update request status to 'Matching in Progress' or 'Awaiting Donor Response'
  if (results.length > 0) {
    execute(
      `UPDATE blood_requests SET status = 'Awaiting Donor Response', updated_at = ? WHERE id = ? AND status = 'Submitted'`,
      [now, requestId]
    );
  }

  return results;
}

apiRouter.post('/blood/requests/:id/match', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const matches = runMatchingForRequest(id);
  logAudit(req.user!.id, req.user!.role, 'RUN_MATCHING_ENGINE', 'BloodRequest', id, `Matching engine executed, found ${matches.length} candidates`, req);
  res.json({ message: `Matching completed. Evaluated and identified ${matches.length} compatible candidates.`, matchesCount: matches.length });
});

apiRouter.get('/blood/requests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const request = queryOne(
    `SELECT br.*, u.full_name as requester_name, u.email as requester_email, u.phone as requester_phone
     FROM blood_requests br
     JOIN users u ON br.requester_user_id = u.id
     WHERE br.id = ?`,
    [id]
  );

  if (!request) {
    res.status(404).json({ error: 'Blood request not found.' });
    return;
  }

  // Fetch matches with donor details
  const matches = queryAll(
    `SELECT m.*, d.blood_group, d.availability_status, d.last_donation_date, d.total_donations, d.verified_badge,
            u.id as donor_user_id, u.full_name as donor_name, u.phone as donor_phone, u.city as donor_city, u.locality as donor_locality
     FROM donor_matches m
     JOIN donors d ON m.donor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE m.request_id = ?
     ORDER BY m.compatibility_score DESC`,
    [id]
  );

  // Mask donor phone for non-staff
  const isPrivileged = req.user!.role === 'hospital_staff' || req.user!.role === 'admin';
  const sanitizedMatches = matches.map(m => {
    let parsedReasons = [];
    try {
      parsedReasons = JSON.parse(m.match_reasons);
    } catch {
      parsedReasons = [m.match_reasons];
    }
    return {
      ...m,
      match_reasons: parsedReasons,
      donor_phone: isPrivileged || m.donor_user_id === req.user!.id ? m.donor_phone : 'Protected by Medical Privacy',
    };
  });

  res.json({ request, matches: sanitizedMatches });
});

// Donor responds to matching notification (Accept / Decline / Unavailable)
apiRouter.post('/blood/matches/:id/respond', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { response_action, notes } = req.body; // 'accepted', 'declined', 'unavailable'

  if (!['accepted', 'declined', 'unavailable'].includes(response_action)) {
    res.status(400).json({ error: 'Valid response_action must be accepted, declined, or unavailable.' });
    return;
  }

  const match = queryOne(
    `SELECT m.*, d.user_id as donor_user_id, br.id as request_id, br.requester_user_id, br.patient_name, br.blood_group, br.hospital_name, u.full_name as donor_name
     FROM donor_matches m
     JOIN donors d ON m.donor_id = d.id
     JOIN users u ON d.user_id = u.id
     JOIN blood_requests br ON m.request_id = br.id
     WHERE m.id = ?`,
    [id]
  );

  if (!match) {
    res.status(404).json({ error: 'Match record not found.' });
    return;
  }

  // Only donor themselves, hospital staff, or admin can respond
  if (match.donor_user_id !== req.user!.id && req.user!.role !== 'hospital_staff' && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Unauthorized: You can only respond to your own donor invitations.' });
    return;
  }

  const now = new Date().toISOString();
  execute(
    `UPDATE donor_matches
     SET status = ?, donor_response_time = ?, staff_notes = COALESCE(?, staff_notes)
     WHERE id = ?`,
    [response_action, now, notes || null, id]
  );

  if (response_action === 'accepted') {
    // Notify hospital staff
    createNotification(
      match.requester_user_id,
      `Donor Accepted: ${match.donor_name} for Request ${match.request_id}`,
      `கொடையாளர் ஏற்றுக்கொண்டார்: ${match.donor_name} - ${match.request_id}`,
      `Candidate donor ${match.donor_name} has accepted to donate ${match.blood_group} for patient ${match.patient_name}. Please perform clinical pre-screening.`,
      `கொடையாளர் ${match.donor_name} இரத்த தானம் செய்ய ஒப்புதல் அளித்துள்ளார். மருத்துவ பரிசோதனைக்கு தயார் செய்க.`,
      'donor_accepted',
      `/blood-requests/${match.request_id}`
    );

    // Update request status to 'Under Staff Review'
    execute(
      `UPDATE blood_requests SET status = 'Under Staff Review', updated_at = ? WHERE id = ? AND status != 'Fulfilled'`,
      [now, match.request_id]
    );
  }

  logAudit(req.user!.id, req.user!.role, 'DONOR_RESPONSE', 'DonorMatch', id, `Donor responded: ${response_action}`, req);
  res.json({ message: `Response '${response_action}' recorded successfully.`, matchId: id });
});

// Hospital staff confirms clinical fulfillment
apiRouter.post('/blood/matches/:id/confirm', requireAuth, requireRole(['hospital_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { staff_notes, mark_fulfilled } = req.body;

  const match = queryOne(
    `SELECT m.*, d.id as donor_id, d.user_id as donor_user_id, br.id as request_id, br.units_required, br.units_fulfilled
     FROM donor_matches m
     JOIN donors d ON m.donor_id = d.id
     JOIN blood_requests br ON m.request_id = br.id
     WHERE m.id = ?`,
    [id]
  );

  if (!match) {
    res.status(404).json({ error: 'Match record not found.' });
    return;
  }

  const now = new Date().toISOString();
  execute(
    `UPDATE donor_matches
     SET status = 'reviewed', staff_notes = ?
     WHERE id = ?`,
    [staff_notes || 'Clinically confirmed and verified by hospital blood bank officer.', id]
  );

  // Update donor total donations & last donation date
  execute(
    `UPDATE donors
     SET total_donations = total_donations + 1, last_donation_date = ?, availability_status = 'on_hold'
     WHERE id = ?`,
    [now.split('T')[0], match.donor_id]
  );

  // Update fulfilled units on request
  const newFulfilled = match.units_fulfilled + 1;
  const isComplete = newFulfilled >= match.units_required || mark_fulfilled;
  const newStatus = isComplete ? 'Fulfilled' : 'Under Staff Review';

  execute(
    `UPDATE blood_requests
     SET units_fulfilled = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [newFulfilled, newStatus, now, match.request_id]
  );

  createNotification(
    match.donor_user_id,
    'Donation Completed & Confirmed! Thank You',
    'இரத்த தானம் வெற்றிகரமாக நிறைவுற்றது! நன்றி',
    `Your blood donation for request ${match.request_id} has been verified by clinical blood bank staff. You helped save a life!`,
    `உங்கள் இரத்த தானம் மருத்துவ ரீதியாக உறுதி செய்யப்பட்டது. ஒரு உயிரைக் காப்பாற்றியதற்கு மனமார்ந்த நன்றி!`,
    'system',
    `/blood-requests/${match.request_id}`
  );

  logAudit(req.user!.id, req.user!.role, 'CONFIRM_DONATION', 'BloodRequest', match.request_id, `Clinically confirmed donation unit from donor ${match.donor_id}`, req);
  res.json({ message: 'Donation successfully verified and recorded.', unitsFulfilled: newFulfilled, status: newStatus });
});

// Update Blood Request Status
apiRouter.put('/blood/requests/:id/status', requireAuth, requireRole(['hospital_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, clinical_notes } = req.body;

  const validStatuses = ['Submitted', 'Matching in Progress', 'Awaiting Donor Response', 'Under Staff Review', 'Fulfilled', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const now = new Date().toISOString();
  execute(
    `UPDATE blood_requests
     SET status = ?, clinical_notes = COALESCE(?, clinical_notes), updated_at = ?
     WHERE id = ?`,
    [status, clinical_notes || null, now, id]
  );

  logAudit(req.user!.id, req.user!.role, 'UPDATE_REQUEST_STATUS', 'BloodRequest', id, `Updated status to ${status}`, req);
  res.json({ message: `Request status updated to ${status}` });
});

// -------------------------------------------------------------
// PHARMACY & MEDICINE DELIVERIES
// -------------------------------------------------------------

// Medicines catalogue
apiRouter.get('/pharmacy/medicines', (req: Request, res: Response) => {
  const { search, category, prescription_required, stock_status } = req.query;
  let sql = 'SELECT * FROM medicines WHERE 1=1';
  const params: any[] = [];

  if (search) {
    sql += ` AND (LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(manufacturer) LIKE ?)`;
    const term = `%${String(search).toLowerCase().trim()}%`;
    params.push(term, term, term);
  }
  if (category && category !== 'All') {
    sql += ` AND category = ?`;
    params.push(category);
  }
  if (prescription_required !== undefined && prescription_required !== '') {
    sql += ` AND prescription_required = ?`;
    params.push(Number(prescription_required));
  }
  if (stock_status && stock_status !== 'All') {
    sql += ` AND status = ?`;
    params.push(stock_status);
  }

  sql += ' ORDER BY name ASC';
  const medicines = queryAll(sql, params);
  res.json({ medicines });
});

apiRouter.get('/pharmacy/medicines/:id', (req: Request, res: Response) => {
  const medicine = queryOne('SELECT * FROM medicines WHERE id = ?', [req.params.id]);
  if (!medicine) {
    res.status(404).json({ error: 'Medicine not found.' });
    return;
  }
  res.json({ medicine });
});

// Update stock (Pharmacy staff / Admin)
apiRouter.put('/pharmacy/medicines/:id/stock', requireAuth, requireRole(['pharmacy_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { stock_quantity, min_threshold, price_inr } = req.body;

  const current = queryOne('SELECT * FROM medicines WHERE id = ?', [id]);
  if (!current) {
    res.status(404).json({ error: 'Medicine not found.' });
    return;
  }

  const newStock = stock_quantity !== undefined ? Number(stock_quantity) : current.stock_quantity;
  const newThreshold = min_threshold !== undefined ? Number(min_threshold) : current.min_threshold;
  const newPrice = price_inr !== undefined ? Number(price_inr) : current.price_inr;

  let newStatus = 'in_stock';
  if (newStock === 0) newStatus = 'out_of_stock';
  else if (newStock <= newThreshold) newStatus = 'low_stock';

  const now = new Date().toISOString();
  execute(
    `UPDATE medicines
     SET stock_quantity = ?, min_threshold = ?, price_inr = ?, status = ?, last_updated = ?
     WHERE id = ?`,
    [newStock, newThreshold, newPrice, newStatus, now, id]
  );

  logAudit(req.user!.id, req.user!.role, 'UPDATE_STOCK', 'Medicine', id, `Updated stock to ${newStock} units`, req);
  res.json({ message: 'Medicine stock updated successfully.', medicine: queryOne('SELECT * FROM medicines WHERE id = ?', [id]) });
});

// Add new medicine (Pharmacy staff / Admin)
apiRouter.post('/pharmacy/medicines', requireAuth, requireRole(['pharmacy_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { name, category, strength, dosage_form, manufacturer, stock_quantity, min_threshold, price_inr, prescription_required, description, side_effects, storage_instructions } = req.body;

  if (!name || !category || !strength || !dosage_form || price_inr === undefined || stock_quantity === undefined) {
    res.status(400).json({ error: 'Name, category, strength, dosage form, price, and stock are required.' });
    return;
  }

  const id = `MED-${Date.now().toString().slice(-4)}`;
  const stock = Number(stock_quantity);
  const threshold = min_threshold ? Number(min_threshold) : 10;
  let status = 'in_stock';
  if (stock === 0) status = 'out_of_stock';
  else if (stock <= threshold) status = 'low_stock';

  const now = new Date().toISOString();
  execute(
    `INSERT INTO medicines (id, name, category, strength, dosage_form, manufacturer, stock_quantity, min_threshold, price_inr, prescription_required, status, description, side_effects, storage_instructions, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name.trim(),
      category.trim(),
      strength.trim(),
      dosage_form.trim(),
      manufacturer ? manufacturer.trim() : 'Verified Pharma Manufacturer',
      stock,
      threshold,
      Number(price_inr),
      prescription_required ? 1 : 0,
      status,
      description || null,
      side_effects || null,
      storage_instructions || null,
      now,
    ]
  );

  logAudit(req.user!.id, req.user!.role, 'CREATE_MEDICINE', 'Medicine', id, `Added ${name} (${strength})`, req);
  res.status(201).json({ medicine: queryOne('SELECT * FROM medicines WHERE id = ?', [id]) });
});

// Prescriptions
apiRouter.post('/prescriptions/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { patient_name, doctor_name, clinic_hospital, file_name, file_type, file_data } = req.body;

  if (!patient_name || !file_name || !file_data) {
    res.status(400).json({ error: 'Patient name and prescription file data are required.' });
    return;
  }

  // Validate allowed file type: images or pdf
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf', 'image/svg+xml'];
  if (file_type && !allowed.some(t => file_type.includes(t.split('/')[1]))) {
    res.status(400).json({ error: 'Invalid file format. Allowed: PNG, JPEG, WEBP, PDF.' });
    return;
  }

  const id = `RX-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const now = new Date().toISOString();

  execute(
    `INSERT INTO prescriptions (id, user_id, patient_name, doctor_name, clinic_hospital, file_name, file_type, file_data, status, reviewer_id, reviewer_notes, reviewed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', null, null, null, ?)`,
    [
      id,
      req.user!.id,
      patient_name.trim(),
      doctor_name ? doctor_name.trim() : 'Registered Medical Practitioner',
      clinic_hospital ? clinic_hospital.trim() : 'Authorized Clinical Facility',
      file_name,
      file_type || 'image/png',
      file_data,
      now,
    ]
  );

  // Notify pharmacy staff
  const pharmaUsers = queryAll(`SELECT id FROM users WHERE role = 'pharmacy_staff' OR role = 'admin'`);
  pharmaUsers.forEach(u => {
    createNotification(
      u.id,
      `New Prescription Uploaded: ${id}`,
      `புதிய பரிந்துரைச்சீட்டு பதிவேற்றப்பட்டது: ${id}`,
      `Patient ${patient_name} submitted prescription ${id} awaiting clinical verification.`,
      `நோயாளி ${patient_name} பரிந்துரைச்சீட்டு ${id} சமர்ப்பித்துள்ளார். சரிபார்க்கவும்.`,
      'prescription_update',
      `/pharmacy-review`
    );
  });

  logAudit(req.user!.id, req.user!.role, 'UPLOAD_PRESCRIPTION', 'Prescription', id, `Prescription uploaded for ${patient_name}`, req);
  res.status(201).json({ prescription: queryOne('SELECT * FROM prescriptions WHERE id = ?', [id]) });
});

// Get prescriptions list
apiRouter.get('/prescriptions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const isPharmaOrAdmin = req.user!.role === 'pharmacy_staff' || req.user!.role === 'admin';

  let sql = `
    SELECT p.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
           rev.full_name as reviewer_name
    FROM prescriptions p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN users rev ON p.reviewer_id = rev.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Patient can only see their own prescriptions
  if (!isPharmaOrAdmin) {
    sql += ` AND p.user_id = ?`;
    params.push(req.user!.id);
  }

  if (status && status !== 'All') {
    sql += ` AND p.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY p.created_at DESC`;
  const prescriptions = queryAll(sql, params);
  res.json({ prescriptions });
});

// Single prescription detail
apiRouter.get('/prescriptions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prescription = queryOne(
    `SELECT p.*, u.full_name as user_name, u.email as user_email, u.phone as user_phone,
            rev.full_name as reviewer_name
     FROM prescriptions p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN users rev ON p.reviewer_id = rev.id
     WHERE p.id = ?`,
    [id]
  );

  if (!prescription) {
    res.status(404).json({ error: 'Prescription not found.' });
    return;
  }

  // Access check
  if (req.user!.role !== 'pharmacy_staff' && req.user!.role !== 'admin' && prescription.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Unauthorized to view this medical prescription.' });
    return;
  }

  res.json({ prescription });
});

// Pharmacy Staff reviews prescription (Approve / Reject / Correction Requested)
apiRouter.post('/prescriptions/:id/review', requireAuth, requireRole(['pharmacy_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, reviewer_notes } = req.body; // 'Approved', 'Rejected', 'Correction Requested'

  if (!['Approved', 'Rejected', 'Correction Requested'].includes(action)) {
    res.status(400).json({ error: 'Action must be Approved, Rejected, or Correction Requested.' });
    return;
  }

  const prescription = queryOne('SELECT * FROM prescriptions WHERE id = ?', [id]);
  if (!prescription) {
    res.status(404).json({ error: 'Prescription not found.' });
    return;
  }

  const now = new Date().toISOString();
  execute(
    `UPDATE prescriptions
     SET status = ?, reviewer_id = ?, reviewer_notes = ?, reviewed_at = ?
     WHERE id = ?`,
    [action, req.user!.id, reviewer_notes || `Prescription status updated to ${action} by licensed pharmacy staff.`, now, id]
  );

  // If there are pending orders tied to this prescription, update their status accordingly!
  if (action === 'Approved') {
    execute(
      `UPDATE orders
       SET status = 'Approved', updated_at = ?
       WHERE prescription_id = ? AND status = 'Awaiting Prescription Review'`,
      [now, id]
    );
  } else if (action === 'Rejected') {
    execute(
      `UPDATE orders
       SET status = 'Rejected', pharmacy_notes = ?, updated_at = ?
       WHERE prescription_id = ? AND status = 'Awaiting Prescription Review'`,
      [`Prescription was rejected: ${reviewer_notes || 'Invalid medical documentation'}`, now, id]
    );
  }

  // Notify patient
  createNotification(
    prescription.user_id,
    `Prescription ${action}: ${id}`,
    `பரிந்துரைச்சீட்டு ${action === 'Approved' ? 'அங்கீகரிக்கப்பட்டது' : 'சரிபார்க்கப்பட்டது'}: ${id}`,
    `Your prescription has been marked as ${action} by Pharmacist ${req.user!.full_name}. Notes: ${reviewer_notes || 'None'}`,
    `உங்கள் பரிந்துரைச்சீட்டு மருந்தாளர் ${req.user!.full_name} அவர்களால் ${action === 'Approved' ? 'அங்கீகரிக்கப்பட்டது' : 'மறுஆய்வு செய்யப்பட்டது'}. குறிப்பு: ${reviewer_notes || 'இல்லை'}`,
    'prescription_update',
    `/prescriptions/${id}`
  );

  logAudit(req.user!.id, req.user!.role, 'REVIEW_PRESCRIPTION', 'Prescription', id, `Prescription marked as ${action}`, req);
  res.json({ message: `Prescription successfully marked as ${action}.`, prescription: queryOne('SELECT * FROM prescriptions WHERE id = ?', [id]) });
});

// Medicine Orders
apiRouter.get('/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query;
  const role = req.user!.role;

  let sql = `
    SELECT o.*, u.full_name as user_name, u.email as user_email,
           c.full_name as courier_name, c.phone as courier_phone,
           (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN users c ON o.courier_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role === 'patient') {
    sql += ` AND o.user_id = ?`;
    params.push(req.user!.id);
  } else if (role === 'courier') {
    sql += ` AND o.courier_id = ?`;
    params.push(req.user!.id);
  }

  if (status && status !== 'All') {
    sql += ` AND o.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY o.created_at DESC`;
  const orders = queryAll(sql, params);
  res.json({ orders });
});

apiRouter.post('/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { items, prescription_id, delivery_address, delivery_city, delivery_phone, payment_method } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Cart is empty. Please select medicines.' });
    return;
  }
  if (!delivery_address || !delivery_city || !delivery_phone) {
    res.status(400).json({ error: 'Delivery address, city, and contact phone are required.' });
    return;
  }

  // 1. Verify stock availability and prescription requirements on the server
  let totalAmount = 0;
  let requiresPrescription = false;

  for (const item of items) {
    const med = queryOne('SELECT * FROM medicines WHERE id = ?', [item.medicine_id]);
    if (!med) {
      res.status(400).json({ error: `Medicine with ID ${item.medicine_id} does not exist.` });
      return;
    }
    if (med.stock_quantity < item.quantity) {
      res.status(400).json({
        error: `Insufficient stock for "${med.name}". Requested: ${item.quantity}, Available: ${med.stock_quantity}.`,
      });
      return;
    }
    if (med.prescription_required === 1) {
      requiresPrescription = true;
    }
    totalAmount += med.price_inr * item.quantity;
  }

  // 2. Validate prescription requirement
  let orderStatus = 'Submitted';
  if (requiresPrescription) {
    if (!prescription_id) {
      res.status(400).json({
        error: 'One or more selected medicines strictly require a valid doctor prescription. Please attach an approved prescription.',
      });
      return;
    }

    const rx = queryOne('SELECT * FROM prescriptions WHERE id = ?', [prescription_id]);
    if (!rx) {
      res.status(400).json({ error: 'The attached prescription does not exist.' });
      return;
    }

    if (rx.status === 'Approved') {
      orderStatus = 'Approved';
    } else {
      orderStatus = 'Awaiting Prescription Review';
    }
  }

  const orderId = `ORD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const now = new Date().toISOString();

  // 3. Atomically deduct stock from medicines
  for (const item of items) {
    const med = queryOne('SELECT * FROM medicines WHERE id = ?', [item.medicine_id]);
    const updatedStock = med.stock_quantity - item.quantity;
    let newStatus = 'in_stock';
    if (updatedStock === 0) newStatus = 'out_of_stock';
    else if (updatedStock <= med.min_threshold) newStatus = 'low_stock';

    execute(
      `UPDATE medicines SET stock_quantity = ?, status = ?, last_updated = ? WHERE id = ?`,
      [updatedStock, newStatus, now, item.medicine_id]
    );

    // If stock hit low stock, notify pharmacy staff
    if (newStatus === 'low_stock') {
      const pharmaUsers = queryAll(`SELECT id FROM users WHERE role = 'pharmacy_staff' OR role = 'admin'`);
      pharmaUsers.forEach(u => {
        createNotification(
          u.id,
          `Low Stock Warning: ${med.name}`,
          `குறைந்த இருப்பு எச்சரிக்கை: ${med.name}`,
          `Stock for ${med.name} dropped to ${updatedStock} units (Threshold: ${med.min_threshold}).`,
          `${med.name} மருந்தின் இருப்பு ${updatedStock} ஆக குறைந்துள்ளது.`,
          'inventory_alert',
          '/pharmacy-inventory'
        );
      });
    }
  }

  // 4. Create Order
  execute(
    `INSERT INTO orders (id, user_id, prescription_id, total_amount, delivery_address, delivery_city, delivery_phone, payment_method, payment_status, status, courier_id, pharmacy_notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, null, ?, ?)`,
    [
      orderId,
      req.user!.id,
      prescription_id || null,
      Number(totalAmount.toFixed(2)),
      delivery_address.trim(),
      delivery_city.trim(),
      delivery_phone.trim(),
      payment_method || 'Demo Cash on Delivery',
      payment_method?.includes('Online') ? 'Paid' : 'Pending',
      orderStatus,
      now,
      now,
    ]
  );

  // 5. Create Order Items
  items.forEach((item, index) => {
    const med = queryOne('SELECT name, price_inr FROM medicines WHERE id = ?', [item.medicine_id]);
    execute(
      `INSERT INTO order_items (id, order_id, medicine_id, medicine_name, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`ITM-${orderId}-${index + 1}`, orderId, item.medicine_id, med.name, item.quantity, med.price_inr, med.price_inr * item.quantity]
    );
  });

  // 6. Notify Pharmacy Staff of new order
  const pharmaUsers = queryAll(`SELECT id FROM users WHERE role = 'pharmacy_staff' OR role = 'admin'`);
  pharmaUsers.forEach(u => {
    createNotification(
      u.id,
      `New Medicine Order: ${orderId} (₹${totalAmount.toFixed(2)})`,
      `புதிய மருந்து ஆர்டர்: ${orderId} (₹${totalAmount.toFixed(2)})`,
      `Order ${orderId} received from ${req.user!.full_name}. Status: ${orderStatus}.`,
      `${req.user!.full_name} இடமிருந்து புதிய மருந்து ஆர்டர் ${orderId} பெறப்பட்டுள்ளது.`,
      'order_status',
      `/orders/${orderId}`
    );
  });

  logAudit(req.user!.id, req.user!.role, 'CREATE_ORDER', 'Order', orderId, `Created order with ${items.length} items totaling ₹${totalAmount.toFixed(2)}`, req);
  res.status(201).json({ orderId, status: orderStatus, totalAmount });
});

// Single Order Detail with Items and Timeline
apiRouter.get('/orders/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = queryOne(
    `SELECT o.*, u.full_name as user_name, u.email as user_email,
            c.full_name as courier_name, c.phone as courier_phone,
            p.patient_name as rx_patient, p.doctor_name as rx_doctor, p.status as rx_status
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN users c ON o.courier_id = c.id
     LEFT JOIN prescriptions p ON o.prescription_id = p.id
     WHERE o.id = ?`,
    [id]
  );

  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  // Access check
  const isPrivileged = ['pharmacy_staff', 'admin', 'courier'].includes(req.user!.role);
  if (!isPrivileged && order.user_id !== req.user!.id) {
    res.status(403).json({ error: 'Unauthorized to view this order.' });
    return;
  }

  const items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [id]);
  const deliveryHistory = queryAll('SELECT * FROM delivery_assignments WHERE order_id = ? ORDER BY timestamp DESC', [id]);

  res.json({ order, items, deliveryHistory });
});

// Update Order Status (Pharmacy Staff / Admin)
apiRouter.put('/orders/:id/status', requireAuth, requireRole(['pharmacy_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, pharmacy_notes } = req.body;

  const validStatuses = ['Submitted', 'Awaiting Prescription Review', 'Approved', 'Processing', 'Ready for Dispatch', 'Courier Assigned', 'Out for Delivery', 'Delivered', 'Rejected', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid order status. Allowed: ${validStatuses.join(', ')}` });
    return;
  }

  const order = queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const now = new Date().toISOString();
  execute(
    `UPDATE orders
     SET status = ?, pharmacy_notes = COALESCE(?, pharmacy_notes), updated_at = ?
     WHERE id = ?`,
    [status, pharmacy_notes || null, now, id]
  );

  // Notify customer
  createNotification(
    order.user_id,
    `Order Status Updated: ${status}`,
    `ஆர்டர் நிலை புதுப்பிக்கப்பட்டது: ${status}`,
    `Your order ${id} is now ${status}. Notes: ${pharmacy_notes || 'None'}`,
    `உங்கள் ஆர்டர் ${id} இப்போது ${status} நிலையில் உள்ளது.`,
    'order_status',
    `/orders/${id}`
  );

  logAudit(req.user!.id, req.user!.role, 'UPDATE_ORDER_STATUS', 'Order', id, `Status updated to ${status}`, req);
  res.json({ message: `Order status updated to ${status}.` });
});

// Assign Courier to Order (Pharmacy Staff / Admin)
apiRouter.post('/orders/:id/assign-courier', requireAuth, requireRole(['pharmacy_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { courier_id, notes } = req.body;

  const courier = queryOne('SELECT * FROM users WHERE id = ? AND role = "courier"', [courier_id]);
  if (!courier) {
    res.status(400).json({ error: 'Selected user is not a valid delivery partner.' });
    return;
  }

  const now = new Date().toISOString();
  execute(
    `UPDATE orders
     SET courier_id = ?, status = 'Courier Assigned', updated_at = ?
     WHERE id = ?`,
    [courier_id, now, id]
  );

  const assignId = `DEL-${Date.now()}`;
  execute(
    `INSERT INTO delivery_assignments (id, order_id, courier_id, assigned_by, pickup_status, status_note, timestamp)
     VALUES (?, ?, ?, ?, 'assigned', ?, ?)`,
    [assignId, id, courier_id, req.user!.id, notes || 'Assigned to courier for pickup from pharmacy hub', now]
  );

  // Notify courier
  createNotification(
    courier_id,
    `New Delivery Assignment: ${id}`,
    `புதிய விநியோகப் பணி: ${id}`,
    `You have been assigned order ${id}. Please proceed to collect package.`,
    `ஆர்டர் ${id} உங்களுக்கு ஒதுக்கப்பட்டுள்ளது. பார்சலை பெற்றுக்கொள்ளவும்.`,
    'order_status',
    '/courier'
  );

  logAudit(req.user!.id, req.user!.role, 'ASSIGN_COURIER', 'Order', id, `Assigned courier ${courier.full_name}`, req);
  res.json({ message: `Courier ${courier.full_name} assigned successfully.` });
});

// List couriers for assignment dropdown
apiRouter.get('/couriers', requireAuth, requireRole(['pharmacy_staff', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const couriers = queryAll('SELECT id, full_name, email, phone, city, locality FROM users WHERE role = "courier"');
  res.json({ couriers });
});

// Courier Deliveries List
apiRouter.get('/courier/deliveries', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const isCourier = req.user!.role === 'courier';
  let sql = `
    SELECT o.*, u.full_name as customer_name, u.phone as customer_phone,
           da.pickup_status, da.status_note as last_delivery_note
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN delivery_assignments da ON da.order_id = o.id
    WHERE o.courier_id IS NOT NULL
  `;
  const params: any[] = [];

  if (isCourier) {
    sql += ` AND o.courier_id = ?`;
    params.push(req.user!.id);
  }

  sql += ` ORDER BY o.created_at DESC`;
  const deliveries = queryAll(sql, params);
  res.json({ deliveries });
});

// Courier Updates Delivery Status
apiRouter.put('/courier/deliveries/:orderId/status', requireAuth, requireRole(['courier', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const { pickup_status, status_note } = req.body; // 'picked_up', 'in_transit', 'delivered', 'failed'

  const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const now = new Date().toISOString();
  let mappedOrderStatus = order.status;
  if (pickup_status === 'picked_up') mappedOrderStatus = 'Processing';
  else if (pickup_status === 'in_transit') mappedOrderStatus = 'Out for Delivery';
  else if (pickup_status === 'delivered') mappedOrderStatus = 'Delivered';

  execute(
    `UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`,
    [mappedOrderStatus, now, orderId]
  );

  const assignId = `DEL-${Date.now()}`;
  execute(
    `INSERT INTO delivery_assignments (id, order_id, courier_id, assigned_by, pickup_status, status_note, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [assignId, orderId, req.user!.id, req.user!.id, pickup_status, status_note || null, now]
  );

  // Notify customer
  createNotification(
    order.user_id,
    `Delivery Update: ${mappedOrderStatus}`,
    `விநியோக நிலை: ${mappedOrderStatus}`,
    `Your order ${orderId} is now ${mappedOrderStatus}. Note: ${status_note || 'Courier in transit'}`,
    `உங்கள் ஆர்டர் ${orderId} நிலை: ${mappedOrderStatus}.`,
    'order_status',
    `/orders/${orderId}`
  );

  logAudit(req.user!.id, req.user!.role, 'UPDATE_DELIVERY_STATUS', 'Order', orderId, `Courier updated delivery to ${pickup_status}`, req);
  res.json({ message: `Delivery status updated to ${pickup_status}.` });
});

// -------------------------------------------------------------
// DASHBOARD STATS & REAL-TIME DATA
// -------------------------------------------------------------

apiRouter.get('/dashboard/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  // Blood module stats
  const totalRequests = queryOne('SELECT COUNT(*) as count FROM blood_requests').count;
  const criticalRequests = queryOne('SELECT COUNT(*) as count FROM blood_requests WHERE urgency_level = "critical" AND status != "Fulfilled" AND status != "Cancelled"').count;
  const activeRequests = queryOne('SELECT COUNT(*) as count FROM blood_requests WHERE status IN ("Submitted", "Matching in Progress", "Awaiting Donor Response", "Under Staff Review")').count;
  const fulfilledRequests = queryOne('SELECT COUNT(*) as count FROM blood_requests WHERE status = "Fulfilled"').count;
  const totalDonors = queryOne('SELECT COUNT(*) as count FROM donors').count;
  const availableDonors = queryOne('SELECT COUNT(*) as count FROM donors WHERE availability_status = "available"').count;

  // Pharmacy module stats
  const totalMedicines = queryOne('SELECT COUNT(*) as count FROM medicines').count;
  const lowStockCount = queryOne('SELECT COUNT(*) as count FROM medicines WHERE status = "low_stock" OR status = "out_of_stock"').count;
  const pendingPrescriptions = queryOne('SELECT COUNT(*) as count FROM prescriptions WHERE status IN ("Submitted", "Under Review")').count;
  const activeOrders = queryOne('SELECT COUNT(*) as count FROM orders WHERE status NOT IN ("Delivered", "Cancelled", "Rejected")').count;
  const deliveredOrders = queryOne('SELECT COUNT(*) as count FROM orders WHERE status = "Delivered"').count;

  // Blood group inventory/availability distribution
  const bloodDistribution = queryAll(`
    SELECT blood_group, COUNT(*) as donor_count,
           SUM(CASE WHEN availability_status = 'available' THEN 1 ELSE 0 END) as available_count
    FROM donors
    GROUP BY blood_group
    ORDER BY blood_group ASC
  `);

  res.json({
    blood: {
      totalRequests,
      criticalRequests,
      activeRequests,
      fulfilledRequests,
      totalDonors,
      availableDonors,
      bloodDistribution,
    },
    pharmacy: {
      totalMedicines,
      lowStockCount,
      pendingPrescriptions,
      activeOrders,
      deliveredOrders,
    },
  });
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { unread } = req.query;
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (unread === 'true') {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';
  const notifications = queryAll(sql, params);
  const unreadCount = queryOne('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.user!.id]).count;

  res.json({ notifications, unreadCount });
});

apiRouter.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
  res.json({ success: true });
});

apiRouter.put('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user!.id]);
  res.json({ success: true });
});

// -------------------------------------------------------------
// ADMIN & AUDIT LOGS
// -------------------------------------------------------------

apiRouter.get('/audit-logs', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { role, action } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (role && role !== 'All') {
    sql += ' AND user_role = ?';
    params.push(role);
  }
  if (action && action !== 'All') {
    sql += ' AND action = ?';
    params.push(action);
  }

  sql += ' ORDER BY created_at DESC LIMIT 100';
  const logs = queryAll(sql, params);
  res.json({ logs });
});

apiRouter.get('/users', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.query;
  let sql = 'SELECT id, email, full_name, role, phone, city, locality, created_at FROM users WHERE 1=1';
  const params: any[] = [];

  if (role && role !== 'All') {
    sql += ' AND role = ?';
    params.push(role);
  }

  sql += ' ORDER BY created_at DESC';
  const users = queryAll(sql, params);
  res.json({ users });
});

apiRouter.put('/users/:id/role', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['patient', 'donor', 'hospital_staff', 'pharmacy_staff', 'courier', 'admin'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Invalid role. Allowed: ${validRoles.join(', ')}` });
    return;
  }

  execute('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, new Date().toISOString(), id]);
  logAudit(req.user!.id, req.user!.role, 'CHANGE_USER_ROLE', 'User', id, `Updated role to ${role}`, req);
  res.json({ message: `Role updated to ${role}` });
});

// Reset demo database if requested
apiRouter.post('/system/reset-demo', requireAuth, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    // Delete all dynamic records and re-seed
    execute('DELETE FROM notifications;');
    execute('DELETE FROM delivery_assignments;');
    execute('DELETE FROM order_items;');
    execute('DELETE FROM orders;');
    execute('DELETE FROM prescriptions;');
    execute('DELETE FROM donor_matches;');
    execute('DELETE FROM blood_requests;');
    execute('DELETE FROM medicines;');
    execute('DELETE FROM donors;');
    execute('DELETE FROM users;');
    execute('DELETE FROM audit_logs;');

    // Re-run seed
    import('./seedData.js').then(mod => {
      mod.seedDemoData();
      logAudit(req.user!.id, 'admin', 'RESET_DEMO_DATA', 'System', 'ALL', 'Admin reset and re-seeded all demo records', req);
      res.json({ message: 'Demo data re-seeded successfully.' });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
