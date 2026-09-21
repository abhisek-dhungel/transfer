import { createClient, type Client } from '@libsql/client';

let db: Client;

function getDatabaseClient(): Client {
  // During build time, environment variables may not be available
  // We'll create a mock client or defer initialization
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    // Return a dummy client for build time
    // This will be replaced at runtime with actual credentials
    return null as any;
  }

  return createClient({
    url,
    authToken,
  });
}

if (process.env.NODE_ENV === 'production') {
  // In production, reuse the same client across invocations
  if (!(global as any).db) {
    (global as any).db = getDatabaseClient();
  }
  db = (global as any).db;
} else {
  // In development, create a new client
  db = getDatabaseClient();
}

export default db;

// Database schema initialization - call this at runtime, not during build
export async function initDatabase() {
  if (!db) {
    throw new Error('Database client not initialized. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      senderName TEXT NOT NULL,
      recipientEmail TEXT NOT NULL,
      subject TEXT NOT NULL,
      originalFileName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      mimeType TEXT NOT NULL,
      cloudinaryPublicId TEXT NOT NULL,
      cloudinaryResource TEXT NOT NULL,
      cloudinarySecureUrl TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SENT', 'FAILED')),
      downloadCount INTEGER DEFAULT 0,
      expiresAt TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      downloadedAt TEXT,
      deletedAt TEXT
    )
  `);

  // Create indexes for better query performance
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_token ON transfers(token)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_recipient_email ON transfers(recipientEmail)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_expires_at ON transfers(expiresAt)`);
}

// Helper types for TypeScript
export interface Transfer {
  id: number;
  token: string;
  senderName: string;
  recipientEmail: string;
  subject: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  cloudinaryPublicId: string;
  cloudinaryResource: string;
  cloudinarySecureUrl: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED';
  downloadCount: number;
  expiresAt: string;
  createdAt: string;
  downloadedAt: string | null;
  deletedAt: string | null;
}
