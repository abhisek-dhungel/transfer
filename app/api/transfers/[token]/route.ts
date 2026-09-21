import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM transfers WHERE token = ?',
    args: [token],
  });

  const transfer = result.rows[0];

  if (!transfer || transfer.deletedAt) {
    return NextResponse.json(
      { error: 'This download link is invalid or no longer available.' },
      { status: 404 }
    );
  }

  const expiresAt = new Date(transfer.expiresAt as string);
  if (expiresAt < new Date()) {
    return NextResponse.json({ error: 'This transfer has expired.' }, { status: 410 });
  }

  return NextResponse.json({
    senderName: transfer.senderName,
    originalFileName: transfer.originalFileName,
    fileSize: transfer.fileSize,
    mimeType: transfer.mimeType,
    expiresAt: transfer.expiresAt,
    downloadCount: transfer.downloadCount,
  });
}
