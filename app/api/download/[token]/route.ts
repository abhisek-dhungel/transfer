import prisma from '@/lib/db';
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

  const transfer = await prisma.transfer.findUnique({ where: { token } });
  if (!transfer || transfer.deletedAt) {
    return NextResponse.json({ error: 'This download link is invalid or no longer available.' }, { status: 404 });
  }

  if (transfer.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This transfer has expired.' }, { status: 410 });
  }

  if (transfer.status !== 'SENT') {
    return NextResponse.json({ error: 'Transfer is not available.' }, { status: 400 });
  }

  // Generate short-lived signed Cloudinary URL (1 hour)
  const signedUrl = getSignedDownloadUrl(transfer.cloudinaryPublicId, transfer.cloudinaryResource, 3600);

  await prisma.transfer.update({
    where: { id: transfer.id },
    data: {
      downloadCount: { increment: 1 },
      downloadedAt: transfer.downloadedAt ?? new Date(),
    },
  });

  return NextResponse.redirect(signedUrl, { status: 302 });
}
