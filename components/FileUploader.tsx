import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileInfo {
  file: File;
  previewUrl: string;
}

type Props = {
  fileInfo: FileInfo | null;
  setFileInfo: React.Dispatch<React.SetStateAction<FileInfo | null>>;
};

export default function FileUploader({ fileInfo, setFileInfo }: Props) {
  const maxSize = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 100) * 1024 * 1024;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > maxSize) {
      alert(`File exceeds maximum size of ${maxSize / (1024 * 1024)} MB`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setFileInfo({ file, previewUrl });
  }, [maxSize, setFileInfo]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize,
    accept: {
      'application/pdf': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
      'application/vnd.ms-excel': [],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
      'application/vnd.ms-powerpoint': [],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
      'application/zip': [],
      'application/x-rar-compressed': [],
      'text/plain': [],
      'text/csv': [],
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'video/mp4': [],
      'video/quicktime': [],
    },
  });

  const removeFile = () => {
    if (fileInfo) {
      URL.revokeObjectURL(fileInfo.previewUrl);
    }
    setFileInfo(null);
  };

  return (
    <div className="space-y-4">
      {fileInfo ? (
        <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{fileInfo.file.name}</span>
            <span className="text-sm text-gray-500">{(fileInfo.file.size / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="text-sm text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'} `}
        >
          <input {...getInputProps()} />
          <p className="text-lg font-medium text-gray-700">Drop your file here</p>
          <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">Maximum file size: {maxSize / (1024 * 1024)} MB</p>
        </div>
      )}
    </div>
  );
}
