// lib/security.ts
import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token for download URLs.
 * Uses URL‑safe base64 encoding and truncates to 48 characters (≈288 bits).
 */
export function generateToken(byteLength = 36): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}
