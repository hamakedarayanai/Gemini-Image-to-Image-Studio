
import React from 'react';
import { LoadingSpinner, ErrorIcon, DownloadIcon, MaximizeIcon } from './Icons';

interface GeneratedImageDisplayProps {
  imageUrl: string | null;
  text: string | null;
  isLoading: boolean;
  error: string | null;
  onPreview: () => void;
}

export const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, text, isLoading, error, onPreview }) => {

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    // create a unique filename
    link.download = `gemini-generated-${new Date().toISOString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full aspect-square bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center p-4 text-center">
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
          <LoadingSpinner />
          <p className="text-lg font-semibold">Generating your masterpiece...</p>
          <p className="text-sm text-gray-500">This may take a moment, especially for complex edits.</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 text-red-400">
          <ErrorIcon />
          <p className="font-semibold">Generation Failed</p>
          <p className="text-sm text-red-200 bg-red-900/30 border border-red-800 p-3 rounded-lg max-w-md shadow-lg">{error}</p>
        </div>
      )}

      {!isLoading && !error && imageUrl && (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4">
           <div className="relative group w-full h-full max-h-[calc(100%-4rem)]">
            <img src={imageUrl} alt="Generated" className="w-full h-full object-contain rounded-md shadow-lg" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex items-center justify-center gap-4">
              <button 
                onClick={onPreview}
                className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-colors"
                aria-label="Preview image"
              >
                <MaximizeIcon />
              </button>
              <button 
                onClick={handleDownload}
                className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-teal-600 transition-colors"
                aria-label="Download image"
              >
                <DownloadIcon />
              </button>
            </div>
           </div>
           {text && <p className="w-full text-center text-gray-300 bg-gray-800 p-3 rounded-md text-sm">{text}</p>}
        </div>
      )}
      
      {!isLoading && !error && !imageUrl && (
        <div className="text-gray-500">
          <p className="text-lg">Your generated image will appear here.</p>
          <p className="text-sm mt-1">Upload an image and provide a prompt to start.</p>
        </div>
      )}
    </div>
  );
};
