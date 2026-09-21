import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface TransferMeta {
  senderName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: string;
  downloadCount: number;
}

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: 'Download File — TechSastra Send' };
}

async function getTransferMeta(token: string): Promise<TransferMeta | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${appUrl}/api/transfers/${token}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📋', pptx: '📋', zip: '🗜️', rar: '🗜️', txt: '📃',
    csv: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️',
    mp4: '🎬', mov: '🎬',
  };
  return icons[ext] ?? '📁';
}

export default async function DownloadPage({ params }: Props) {
  const { token } = params;
  const meta = await getTransferMeta(token);

  if (!meta) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 space-y-4">
        <div className="text-5xl">🔗</div>
        <h1 className="text-2xl font-bold text-gray-900">Link not found</h1>
        <p className="text-gray-500">This download link is invalid or no longer available.</p>
        <Link href="/" className="mt-4 inline-block px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors">
          Send a file instead
        </Link>
      </div>
    );
  }

  const expired = new Date(meta.expiresAt) < new Date();
  if (expired) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 space-y-4">
        <div className="text-5xl">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer expired</h1>
        <p className="text-gray-500">This file transfer has expired and is no longer available.</p>
        <Link href="/" className="mt-4 inline-block px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors">
          Send a new file
        </Link>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const downloadEndpoint = `${appUrl}/api/download/${token}`;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900">
            <strong>{meta.senderName}</strong> wants to send you a file
          </p>
          <p className="text-sm text-gray-500">via TechSastra Send</p>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-8 space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{getFileIcon(meta.originalFileName)}</span>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{meta.originalFileName}</p>
              <p className="text-sm text-gray-500">{formatBytes(meta.fileSize)}</p>
            </div>
          </div>
          <a
            href={downloadEndpoint}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-700 text-white rounded-xl font-semibold text-base hover:bg-blue-800 transition-colors shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download file
          </a>
          <p className="text-xs text-center text-gray-400">
            Available until{' '}
            {new Date(meta.expiresAt).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
        <p className="text-xs text-center text-gray-400">
          Powered by{' '}
          <Link href="/" className="text-blue-600 hover:underline">TechSastra Send</Link>
        </p>
      </div>
    </div>
  );
}
