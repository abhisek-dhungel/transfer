import { NextResponse } from 'next/server';
import { uploadSignatureSchema } from '@/lib/validation';
import { getSignedUploadParams } from '@/lib/cloudinary';
import { checkRateLimit, getIP } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getIP(request);
  const rl = await checkRateLimit(`sig:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parse = uploadSignatureSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
  const { fileName, fileType } = parse.data;
  const { uploadUrl, fields } = getSignedUploadParams(fileName, fileType);
  return NextResponse.json({ uploadUrl, fields });
}
