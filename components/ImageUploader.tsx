
import React, { useRef } from 'react';
import type { UploadedFile } from '../types';
import { UploadIcon, XIcon } from './Icons';

interface ImageUploaderProps {
  title: string;
  description: string;
  file: UploadedFile | null;
  onFileChange: (file: UploadedFile) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, file, onFileChange, onClear }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileChange({
        file: selectedFile,
        previewUrl: URL.createObjectURL(selectedFile),
      });
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-gray-200">{title}</h3>
      <p className="text-sm text-gray-500 mb-1">{description}</p>
      <div
        className="relative w-full aspect-square bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 hover:border-indigo-500 transition-colors duration-300 flex items-center justify-center cursor-pointer group"
        onClick={handleContainerClick}
      >
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        {file ? (
          <>
            <img src={file.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 rounded-full p-1.5 text-white transition-all duration-200"
              aria-label="Clear image"
            >
              <XIcon />
            </button>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <UploadIcon />
            <p className="mt-2 text-sm">Click to upload</p>
          </div>
        )}
      </div>
    </div>
  );
};
