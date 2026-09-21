import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function initDatabase() {
  console.log('Initializing Turso database...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      senderName TEXT NOT NULL,
      recipientEmail TEXT NOT NULL,
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

  console.log('Created transfers table');

  // Create indexes for better query performance
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_token ON transfers(token)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_recipient_email ON transfers(recipientEmail)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_expires_at ON transfers(expiresAt)`);

  console.log('Created indexes');
  console.log('Database initialization complete!');
}

initDatabase().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
