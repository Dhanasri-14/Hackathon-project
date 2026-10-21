async function runTests() {
  console.log('=== STARTING UYIRTHUNAI END-TO-END WORKFLOW VERIFICATION ===\n');
  const baseUrl = 'http://localhost:3000';

  // Helper for fetch
  async function api(path: string, options: any = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  // 1. Health & Demo Users Check
  console.log('1. Checking Server & Demo Accounts:');
  const health = await api('/health');
  if (!health.ok || health.data.name !== 'UyirThunai') throw new Error('Health check failed');
  console.log('   [PASS] Server is healthy:', health.data.name);

  const demoUsersRes = await api('/api/auth/demo-users');
  if (!demoUsersRes.ok || demoUsersRes.data.demoUsers.length !== 6) throw new Error('Demo users count mismatch');
  console.log('   [PASS] All 6 demo roles verified:', demoUsersRes.data.demoUsers.map((u: any) => u.role).join(', '));

  // 2. Demo A — Blood Coordination Workflow
  console.log('\n2. Testing Blood Coordination Workflow:');
  // Login as Hospital Staff
  const hospLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'staff.rajesh@apollo-hospital.org', password: 'hospital123' }),
  });
  if (!hospLogin.ok) throw new Error('Hospital staff login failed');
  const hospToken = hospLogin.data.token;
  console.log('   [PASS] Hospital Blood Bank Officer logged in:', hospLogin.data.user.full_name);

  // Submit emergency blood request
  const newRequest = await api('/api/blood/requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hospToken}` },
    body: JSON.stringify({
      patient_reference_id: 'PAT-TEST-1001',
      patient_name: 'Test Emergency Patient',
      blood_group: 'O+',
      units_required: 2,
      urgency_level: 'critical',
      hospital_name: 'Apollo Speciality Hospital',
      hospital_city: 'Chennai',
      hospital_locality: 'Greams Road',
      contact_person: 'Rajesh Kannan',
      contact_phone: '+91 98402 34567',
      required_by_date: '2026-10-21 20:00',
      clinical_notes: 'Urgent bypass surgery requirement.',
    }),
  });
  if (!newRequest.ok) throw new Error(`Create request failed: ${JSON.stringify(newRequest.data)}`);
  const reqId = newRequest.data.request.id;
  console.log('   [PASS] Emergency blood request submitted successfully:', reqId);

  // Get request details & verify matching engine candidates
  const reqDetails = await api(`/api/blood/requests/${reqId}`, {
    headers: { Authorization: `Bearer ${hospToken}` },
  });
  if (!reqDetails.ok || reqDetails.data.matches.length === 0) throw new Error('Matching engine found no candidates');
  const firstMatch = reqDetails.data.matches[0];
  console.log(`   [PASS] Matching engine identified ${reqDetails.data.matches.length} candidates. Top candidate: ${firstMatch.donor_name} (${firstMatch.blood_group}) with ${firstMatch.compatibility_score}% score`);

  // Login as Donor Kavitha (O+)
  const donorLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'donor.kavitha@gmail.com', password: 'donor123' }),
  });
  if (!donorLogin.ok) throw new Error('Donor login failed');
  const donorToken = donorLogin.data.token;
  console.log('   [PASS] Registered Blood Donor logged in:', donorLogin.data.user.full_name);

  // Find match for Kavitha or top candidate and accept
  const matchToAccept = reqDetails.data.matches.find((m: any) => m.donor_user_id === donorLogin.data.user.id) || firstMatch;
  const donorResp = await api(`/api/blood/matches/${matchToAccept.id}/respond`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${donorToken}` },
    body: JSON.stringify({ response_action: 'accepted' }),
  });
  if (!donorResp.ok) throw new Error('Donor response failed');
  console.log('   [PASS] Donor successfully accepted request notification:', donorResp.data.message);

  // Hospital staff confirms clinical unit fulfillment
  const confirmDonation = await api(`/api/blood/matches/${matchToAccept.id}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hospToken}` },
    body: JSON.stringify({ staff_notes: 'Cross-match compatible. Hemoglobin 14.1 g/dL. Unit transfused.' }),
  });
  if (!confirmDonation.ok) throw new Error('Clinical confirmation failed');
  console.log(`   [PASS] Hospital staff clinically confirmed donation! Units fulfilled: ${confirmDonation.data.unitsFulfilled}, New Status: ${confirmDonation.data.status}`);

  // 3. Demo B — Pharmacy Prescription & Fulfilment Workflow
  console.log('\n3. Testing Pharmacy Prescription & Delivery Workflow:');
  // Login as Patient Priya
  const patientLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient.priya@outlook.com', password: 'patient123' }),
  });
  if (!patientLogin.ok) throw new Error('Patient login failed');
  const patientToken = patientLogin.data.token;
  console.log('   [PASS] Patient logged in:', patientLogin.data.user.full_name);

  // Patient uploads prescription
  const rxUpload = await api('/api/prescriptions/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      patient_name: 'S. Priya',
      doctor_name: 'Dr. K. Sundaram, MD',
      clinic_hospital: 'Tamil Nadu Multispeciality Clinic',
      file_name: 'test_rx.png',
      file_type: 'image/png',
      file_data: 'data:image/svg+xml;utf8,<svg><text>Prescription Test</text></svg>',
    }),
  });
  if (!rxUpload.ok) throw new Error('Prescription upload failed');
  const rxId = rxUpload.data.prescription.id;
  console.log('   [PASS] Prescription uploaded successfully:', rxId);

  // Pharmacist reviews and approves prescription
  const pharmaLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'pharmacist.anand@medplus-tn.org', password: 'pharma123' }),
  });
  if (!pharmaLogin.ok) throw new Error('Pharmacist login failed');
  const pharmaToken = pharmaLogin.data.token;
  console.log('   [PASS] Licensed Pharmacist logged in:', pharmaLogin.data.user.full_name);

  const rxReview = await api(`/api/prescriptions/${rxId}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pharmaToken}` },
    body: JSON.stringify({
      action: 'Approved',
      reviewer_notes: 'Doctor registration TN-MC-49201 verified. Approved for dispatch.',
    }),
  });
  if (!rxReview.ok) throw new Error('Prescription review failed');
  console.log('   [PASS] Pharmacist approved prescription:', rxId);

  // Patient orders prescription medication (Amoxicillin MED-001) + Paracetamol (MED-004)
  const orderRes = await api('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({
      items: [
        { medicine_id: 'MED-001', quantity: 1 },
        { medicine_id: 'MED-004', quantity: 2 },
      ],
      prescription_id: rxId,
      delivery_address: 'Flat 4B, Lotus Apartments, Adyar',
      delivery_city: 'Chennai',
      delivery_phone: '+91 98406 78901',
      payment_method: 'Simulated Online Transfer (UPI)',
    }),
  });
  if (!orderRes.ok) throw new Error(`Order placement failed: ${JSON.stringify(orderRes.data)}`);
  const orderId = orderRes.data.orderId;
  console.log(`   [PASS] Medicine order placed: ${orderId}, Total: ₹${orderRes.data.totalAmount}, Status: ${orderRes.data.status}`);

  // Pharmacist assigns courier
  const assignCourier = await api(`/api/orders/${orderId}/assign-courier`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pharmaToken}` },
    body: JSON.stringify({
      courier_id: 'USR-COURIER-01',
      notes: 'Hand over insulated medical cooler bag.',
    }),
  });
  if (!assignCourier.ok) throw new Error('Assign courier failed');
  console.log('   [PASS] Pharmacist assigned delivery courier partner to order');

  // Courier updates delivery progress
  const courierLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'courier.murugan@fastmed-logistics.org', password: 'courier123' }),
  });
  const courierToken = courierLogin.data.token;
  console.log('   [PASS] Courier partner logged in:', courierLogin.data.user.full_name);

  const pickupRes = await api(`/api/courier/deliveries/${orderId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${courierToken}` },
    body: JSON.stringify({ pickup_status: 'in_transit', status_note: 'Picked up from pharmacy counter. In transit.' }),
  });
  if (!pickupRes.ok) {
    console.error('PickupRes error:', pickupRes.status, pickupRes.data);
    throw new Error('Courier update in_transit failed');
  }

  const deliverRes = await api(`/api/courier/deliveries/${orderId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${courierToken}` },
    body: JSON.stringify({ pickup_status: 'delivered', status_note: 'Package handed directly to customer S. Priya.' }),
  });
  if (!deliverRes.ok) throw new Error('Courier update delivered failed');
  console.log('   [PASS] Courier updated delivery progress: Out for Delivery -> Delivered Successfully');

  // Verify final order status
  const finalOrder = await api(`/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  if (finalOrder.data.order.status !== 'Delivered') throw new Error(`Expected Delivered status, got ${finalOrder.data.order.status}`);
  console.log('   [PASS] Final order status verified as:', finalOrder.data.order.status);

  // 4. Demo C — Security & Role Permission Verification
  console.log('\n4. Testing Role-Based Security & Authorization Guards:');
  // Attempt unauthorized action: Patient trying to approve prescription
  const unauthRx = await api(`/api/prescriptions/${rxId}/review`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patientToken}` },
    body: JSON.stringify({ action: 'Approved' }),
  });
  if (unauthRx.status !== 403) throw new Error(`Expected 403 Forbidden for patient reviewing rx, got ${unauthRx.status}`);
  console.log('   [PASS] Unauthorized prescription review correctly blocked with HTTP 403 Forbidden');

  // Attempt unauthorized action: Donor trying to view admin audit logs
  const unauthAudit = await api('/api/audit-logs', {
    headers: { Authorization: `Bearer ${donorToken}` },
  });
  if (unauthAudit.status !== 403) throw new Error(`Expected 403 Forbidden for donor accessing audit logs, got ${unauthAudit.status}`);
  console.log('   [PASS] Unauthorized audit logs access correctly blocked with HTTP 403 Forbidden');

  // Attempt unauthenticated action without token
  const noAuth = await api('/api/blood/requests');
  if (noAuth.status !== 401) throw new Error(`Expected 401 Unauthorized for request without token, got ${noAuth.status}`);
  console.log('   [PASS] Unauthenticated request correctly rejected with HTTP 401 Unauthorized');

  // 5. Dashboard Statistics Verification
  console.log('\n5. Verifying Live Computed Database Statistics:');
  const statsRes = await api('/api/dashboard/stats', {
    headers: { Authorization: `Bearer ${hospToken}` },
  });
  if (!statsRes.ok) throw new Error('Stats retrieval failed');
  console.log('   [PASS] Live Blood Module Stats:', JSON.stringify(statsRes.data.blood));
  console.log('   [PASS] Live Pharmacy Module Stats:', JSON.stringify(statsRes.data.pharmacy));

  console.log('\n=== ALL WORKFLOW TESTS PASSED PERFECTLY (100% SUCCESS) ===\n');
}

runTests().catch(err => {
  console.error('\nFAILED TEST:', err);
  process.exit(1);
});
