import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking on the image itself
      >
        <img src={imageUrl} alt="Generated preview" className="object-contain w-auto h-auto max-w-full max-h-full rounded-lg shadow-2xl" />
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-red-600 rounded-full p-2 text-white transition-colors duration-200"
          aria-label="Close preview"
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
