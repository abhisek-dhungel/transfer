import { z } from 'zod';

export const uploadSignatureSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

export const transferCreateSchema = z.object({
  senderName: z.string().min(1),
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  originalFileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  cloudinaryPublicId: z.string().min(1),
  cloudinaryResource: z.string().min(1),
});

export const tokenLookupSchema = z.object({
  token: z.string().min(1),
});
