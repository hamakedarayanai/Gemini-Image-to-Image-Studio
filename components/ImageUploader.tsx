import React, { useRef, useState, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile: File | undefined) => {
    if (selectedFile) {
       if (!['image/png', 'image/jpeg', 'image/webp'].includes(selectedFile.type)) {
        alert('Please upload a valid image file (PNG, JPEG, WEBP).');
        return;
      }
      onFileChange({
        file: selectedFile,
        previewUrl: URL.createObjectURL(selectedFile),
      });
    }
  };
  
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0]);
  };

  const handleContainerClick = () => {
    inputRef.current?.click();
  };
  
  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  }, [handleDragEvents]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  }, [handleDragEvents]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  }, [handleDragEvents, handleFileSelect]);

  const dropzoneClasses = `relative w-full aspect-square bg-gray-900/50 rounded-lg border-2 border-dashed transition-colors duration-300 flex items-center justify-center cursor-pointer group ${
    isDragging ? 'border-indigo-400 bg-indigo-900/30' : 'border-gray-600 hover:border-indigo-500'
  }`;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-gray-200">{title}</h3>
      <p className="text-sm text-gray-500 mb-1">{description}</p>
      <div
        className={dropzoneClasses}
        onClick={handleContainerClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          ref={inputRef}
          onChange={onInputChange}
          className="hidden"
        />
        {file ? (
          <>
            <img src={file.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md animate-fadeIn" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 rounded-full p-1.5 text-white transition-all duration-200 transform hover:scale-110"
              aria-label="Clear image"
            >
              <XIcon />
            </button>
          </>
        ) : (
          <div className="text-center text-gray-500 pointer-events-none">
            <UploadIcon />
            <p className="mt-2 text-sm">{isDragging ? "Drop the image here" : "Click or drag to upload"}</p>
          </div>
        )}
      </div>
    </div>
  );
};