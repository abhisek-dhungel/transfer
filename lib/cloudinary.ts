import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Initialize Cloudinary with server‑side credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a signed upload preset (or direct parameters) for a browser upload.
 * Returns the upload URL (Cloudinary endpoint) and any required fields.
 */
export function getSignedUploadParams(fileName: string, fileType: string) {
  // Use a pre‑configured unsigned preset if you prefer; here we generate a signed form.
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: 'techsastra-transfers',
    public_id: `${Date.now()}_${fileName.replace(/\s+/g, '_')}`,
    resource_type: 'auto',
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`;
  return { uploadUrl, fields: { ...params, signature, api_key: process.env.CLOUDINARY_API_KEY } };
}

/**
 * Generate a time‑limited signed URL for downloading a Cloudinary asset.
 */
export function getSignedDownloadUrl(publicId: string, resourceType: string, expiresInSec = 3600) {
  const url = cloudinary.url(publicId, {
    resource_type: resourceType as any,
    type: 'authenticated',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSec,
  });
  return url;
}

export type CloudinaryUploadResult = UploadApiResponse;
