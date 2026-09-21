'use client';
import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

type Step = 'idle' | 'uploading' | 'creating' | 'emailing' | 'done' | 'error';

export default function TransferForm() {
  const [senderName, setSenderName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<null | {
    transferId: string; expiresAt: string; recipientEmail: string; fileName: string; fileSize: number; downloadUrl: string;
  }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const emailValid = validateEmail(recipientEmail);
  const canSubmit = senderName.trim().length > 0 && emailValid && file !== null && !fileSizeError && step === 'idle';

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileSizeError(`This file is larger than ${MAX_FILE_SIZE_MB} MB.`);
      setFile(null);
      return;
    }
    setFileSizeError('');
    setFile(selected);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit || !file) return;
    setStep('uploading');
    setErrorMsg('');
    setUploadProgress(0);

    try {
      // 1. Get signed upload params
      const sigRes = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!sigRes.ok) throw new Error('Failed to prepare upload. Please try again.');
      const { uploadUrl, fields } = await sigRes.json();

      // 2. Upload to Cloudinary via XHR (for progress tracking)
      const cloudinaryResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => formData.append(k, v as string));
        formData.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed. Please try again.'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.send(formData);
      });

      // 3. Create transfer record + send email
      setStep('creating');
      await new Promise(r => setTimeout(r, 300)); // brief pause for UI
      setStep('emailing');
      const transferRes = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName,
          recipientEmail,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          cloudinaryPublicId: cloudinaryResult.public_id,
          cloudinaryResource: cloudinaryResult.resource_type,
        }),
      });

      if (!transferRes.ok) {
        const err = await transferRes.json();
        throw new Error(err.error || 'Transfer failed. Please try again.');
      }

      const data = await transferRes.json();
      setSuccessData({
        transferId: data.transferId,
        expiresAt: data.expiresAt,
        recipientEmail: data.recipientEmail,
        fileName: data.originalFileName,
        fileSize: data.fileSize,
        downloadUrl: data.downloadUrl,
      });
      setStep('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setErrorMsg(msg);
      setStep('error');
    }
  };

  const reset = () => {
    setSenderName(''); setRecipientEmail(''); setEmailTouched(false);
    setFile(null); setFileSizeError(''); setUploadProgress(0);
    setStep('idle'); setErrorMsg(''); setSuccessData(null);
  };

  if (step === 'done' && successData) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your file is on its way.</h2>
        <p className="text-gray-600">
          We&apos;ve sent a secure download link to <strong>{successData.recipientEmail}</strong>.
        </p>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getFileIcon(successData.fileName)}</span>
            <div>
              <p className="font-semibold text-gray-900">{successData.fileName}</p>
              <p className="text-sm text-gray-500">{formatBytes(successData.fileSize)}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm text-gray-600">
            <p>📧 Recipient: <span className="font-medium">{successData.recipientEmail}</span></p>
            <p>🔑 Transfer ID: <span className="font-mono text-xs bg-gray-100 px-1 rounded">{successData.transferId.slice(0, 12)}…</span></p>
            <p>⏳ Expires: <span className="font-medium">{new Date(successData.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors">
            Send another file
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(successData.downloadUrl)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Copy download link
          </button>
        </div>
      </div>
    );
  }

  const stepLabel: Record<Step, string> = {
    idle: 'Send file',
    uploading: `Uploading… ${uploadProgress}%`,
    creating: 'Creating secure transfer…',
    emailing: 'Sending email…',
    done: 'File sent ✓',
    error: 'Try again',
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Sender Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="senderName">Your name</label>
        <input
          id="senderName" type="text" placeholder="John Doe" autoComplete="name"
          value={senderName} onChange={e => setSenderName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 text-sm transition-colors bg-white"
        />
      </div>

      {/* Recipient Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recipientEmail">Send to</label>
        <input
          id="recipientEmail" type="email" placeholder="recipient@example.com"
          value={recipientEmail}
          onChange={e => setRecipientEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 text-sm transition-colors bg-white ${emailTouched && !emailValid && recipientEmail ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-blue-500'}`}
        />
        {emailTouched && !emailValid && recipientEmail && (
          <p className="text-xs text-red-500 mt-1">Enter a valid email address.</p>
        )}
      </div>

      {/* File upload */}
      <div>
        {file ? (
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-3xl">{getFileIcon(file.name)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
              {step === 'uploading' && (
                <div className="mt-2">
                  <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
            {step === 'idle' && (
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg" aria-label="Remove file">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div
            role="button" tabIndex={0} aria-label="Upload file"
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 py-12 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/40'}`}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-1">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="font-semibold text-gray-800">Drop your file here</p>
            <p className="text-sm text-gray-500">or click to browse</p>
            <p className="text-xs text-gray-400">Maximum file size: {MAX_FILE_SIZE_MB} MB</p>
            <input
              ref={fileInputRef} type="file"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
              className="sr-only" tabIndex={-1}
            />
          </div>
        )}
        {fileSizeError && <p className="text-xs text-red-500 mt-1">{fileSizeError}</p>}
      </div>

      {/* Error message */}
      {step === 'error' && errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 
          ${canSubmit
            ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-md hover:shadow-lg active:scale-[0.99]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        {stepLabel[step]}
      </button>
    </div>
  );
}
