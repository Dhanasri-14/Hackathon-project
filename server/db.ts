import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DB_DIR, 'uyirthunai.db');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Failed to load existing database file, creating fresh:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');
  initSchema(dbInstance);
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error persisting database to disk:', err);
  }
}

// Helper to run query returning array of objects
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

// Helper to run query returning single object or null
export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper to execute INSERT, UPDATE, DELETE with automatic persistence
export function execute(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDb();
}

function initSchema(db: Database): void {
  // 1. Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      locality TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Donors
  db.run(`
    CREATE TABLE IF NOT EXISTS donors (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      blood_group TEXT NOT NULL,
      availability_status TEXT NOT NULL DEFAULT 'available',
      last_donation_date TEXT,
      age INTEGER,
      gender TEXT,
      consent_emergency INTEGER NOT NULL DEFAULT 1,
      total_donations INTEGER NOT NULL DEFAULT 0,
      verified_badge INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Blood Requests
  db.run(`
    CREATE TABLE IF NOT EXISTS blood_requests (
      id TEXT PRIMARY KEY,
      requester_user_id TEXT NOT NULL,
      patient_reference_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      units_required INTEGER NOT NULL,
      units_fulfilled INTEGER NOT NULL DEFAULT 0,
      urgency_level TEXT NOT NULL,
      hospital_name TEXT NOT NULL,
      hospital_city TEXT NOT NULL,
      hospital_locality TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      required_by_date TEXT NOT NULL,
      clinical_notes TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (requester_user_id) REFERENCES users(id)
    );
  `);

  // 4. Donor Matches
  db.run(`
    CREATE TABLE IF NOT EXISTS donor_matches (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      donor_id TEXT NOT NULL,
      compatibility_score INTEGER NOT NULL,
      match_reasons TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'notified',
      donor_response_time TEXT,
      staff_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (request_id) REFERENCES blood_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE
    );
  `);

  // 5. Medicines
  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      strength TEXT NOT NULL,
      dosage_form TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL,
      min_threshold INTEGER NOT NULL DEFAULT 10,
      price_inr REAL NOT NULL,
      prescription_required INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'in_stock',
      description TEXT,
      side_effects TEXT,
      storage_instructions TEXT,
      last_updated TEXT NOT NULL
    );
  `);

  // 6. Prescriptions
  db.run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      clinic_hospital TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_data TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      reviewer_id TEXT,
      reviewer_notes TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 7. Orders
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      prescription_id TEXT,
      total_amount REAL NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_city TEXT NOT NULL,
      delivery_phone TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      status TEXT NOT NULL DEFAULT 'Submitted',
      courier_id TEXT,
      pharmacy_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );
  `);

  // 8. Order Items
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    );
  `);

  // 9. Delivery Assignments
  db.run(`
    CREATE TABLE IF NOT EXISTS delivery_assignments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      courier_id TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      pickup_status TEXT NOT NULL DEFAULT 'assigned',
      status_note TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );
  `);

  // 10. Notifications
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      title_ta TEXT NOT NULL,
      message TEXT NOT NULL,
      message_ta TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 11. Audit Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 12. Hospital Inpatient Admissions (Linked with live medicine orders & delivery tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS admissions (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      patient_phone TEXT,
      patient_age INTEGER,
      patient_gender TEXT,
      hospital_name TEXT NOT NULL,
      hospital_city TEXT NOT NULL,
      ward_number TEXT NOT NULL,
      bed_number TEXT NOT NULL,
      attending_physician TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      blood_group TEXT,
      admission_date TEXT NOT NULL,
      discharge_date TEXT,
      order_id TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      emergency_priority TEXT NOT NULL DEFAULT 'Standard',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 13. WebAuthn Authenticators
  db.run(`
    CREATE TABLE IF NOT EXISTS authenticators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      public_key BLOB NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 14. WebAuthn Challenges (Transient)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_challenges (
      user_id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Indexes for high performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_donors_blood ON donors(blood_group);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_cat ON medicines(category);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_authenticators_user ON authenticators(user_id);`);

  // Safe schema migrations for real payment & notification logging
  try { db.run(`ALTER TABLE orders ADD COLUMN payment_utr TEXT;`); } catch (_) {}
  try { db.run(`ALTER TABLE orders ADD COLUMN payment_time TEXT;`); } catch (_) {}
  try { db.run(`ALTER TABLE orders ADD COLUMN notification_sent_whatsapp INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.run(`ALTER TABLE orders ADD COLUMN notification_sent_email INTEGER DEFAULT 0;`); } catch (_) {}
  try { db.run(`ALTER TABLE orders ADD COLUMN notification_log TEXT;`); } catch (_) {}
}
