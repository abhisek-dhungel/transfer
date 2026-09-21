import db from '@/lib/db';
import { getSignedDownloadUrl } from '@/lib/cloudinary';
import { checkRateLimit, getIP } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const { token } = params;
  const ip = getIP(request);

  const rl = await checkRateLimit(`dl:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many download requests. Please try again later.' }, { status: 429 });
  }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM transfers WHERE token = ?',
    args: [token],
  });

  const transfer = result.rows[0];

  if (!transfer || transfer.deletedAt) {
    return NextResponse.json({ error: 'This download link is invalid or no longer available.' }, { status: 404 });
  }

  const expiresAt = new Date(transfer.expiresAt as string);
  if (expiresAt < new Date()) {
    return NextResponse.json({ error: 'This transfer has expired.' }, { status: 410 });
  }

  if (transfer.status !== 'SENT') {
    return NextResponse.json({ error: 'Transfer is not available.' }, { status: 400 });
  }

  // Generate short-lived signed Cloudinary URL (1 hour)
  const signedUrl = getSignedDownloadUrl(
    transfer.cloudinaryPublicId as string,
    transfer.cloudinaryResource as string,
    3600
  );

  // Update download count and downloadedAt
  const downloadedAt = transfer.downloadedAt ? transfer.downloadedAt : new Date().toISOString();
  await db.execute({
    sql: 'UPDATE transfers SET downloadCount = downloadCount + 1, downloadedAt = ? WHERE id = ?',
    args: [downloadedAt, transfer.id],
  });

  return NextResponse.redirect(signedUrl, { status: 302 });
}
