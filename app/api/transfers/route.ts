import prisma from '@/lib/db';
import { sendTransferEmail } from '@/lib/email';
import { generateToken } from '@/lib/security';
import { transferCreateSchema } from '@/lib/validation';
import { checkRateLimit, getIP } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_MB || 100) * 1024 * 1024;
const EXPIRY_DAYS = Number(process.env.TRANSFER_EXPIRY_DAYS || 7);

export async function POST(request: Request) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`tx:${ip}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "You've reached the sending limit. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parse = transferCreateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid request', details: parse.error.flatten() }, { status: 400 });
  }

  const { senderName, recipientEmail, originalFileName, fileSize, mimeType, cloudinaryPublicId, cloudinaryResource } = parse.data;

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 100 MB limit.' }, { status: 413 });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const downloadUrl = `${appUrl}/download/${token}`;

  let transfer;
  try {
    transfer = await prisma.transfer.create({
      data: { token, senderName, recipientEmail, originalFileName, fileSize, mimeType, cloudinaryPublicId, cloudinaryResource, status: 'PENDING', expiresAt },
    });
  } catch (e) {
    console.error('[/api/transfers] DB error', e);
    return NextResponse.json({ error: 'Failed to create transfer. Please try again.' }, { status: 500 });
  }

  try {
    await sendTransferEmail({
      recipientEmail,
      senderName,
      fileName: originalFileName,
      fileSizeMb: (fileSize / (1024 * 1024)).toFixed(2),
      downloadUrl,
      expiresAt,
    });
  } catch (e) {
    console.error('[/api/transfers] Email error', e);
    await prisma.transfer.update({ where: { id: transfer.id }, data: { status: 'FAILED' } });
    return NextResponse.json(
      { error: "We couldn't send the email. Your file was uploaded, but the transfer could not be completed. Please try again." },
      { status: 500 }
    );
  }

  await prisma.transfer.update({ where: { id: transfer.id }, data: { status: 'SENT' } });

  return NextResponse.json({
    success: true,
    transferId: token,
    expiresAt: expiresAt.toISOString(),
    recipientEmail,
    originalFileName,
    fileSize,
    downloadUrl,
  });
}
