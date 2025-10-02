import React, { useEffect, useState } from 'react';
import { ErrorIcon, DownloadIcon, MaximizeIcon, LogoIcon } from './Icons';

interface GeneratedImageDisplayProps {
  imageUrl: string | null;
  baseImageUrl?: string | null;
  text: string | null;
  isLoading: boolean;
  error: string | null;
  onPreview: () => void;
}

const loadingMessages = [
  "Conjuring pixels...",
  "Applying artistic flair...",
  "Gemini is thinking...",
  "Reticulating splines...",
  "Polishing the masterpiece...",
];


export const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ imageUrl, baseImageUrl, text, isLoading, error, onPreview }) => {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `gemini-generated-${new Date().toISOString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 text-gray-200 overflow-hidden">
          {baseImageUrl && (
            <img 
              src={baseImageUrl} 
              alt="Loading background" 
              className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-20" 
            />
          )}
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 bg-black/40 rounded-lg">
            <div className="w-16 h-16 border-4 border-dashed border-indigo-400/50 rounded-full animate-spin-slow">
               <div className="w-full h-full border-4 border-teal-400/50 rounded-full animate-pulse-glow animate-spin-reverse-slow"/>
            </div>
            <p className="text-lg font-semibold mt-4">{currentMessage}</p>
            <p className="text-sm text-gray-400">This may take a moment.</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-red-400 animate-fadeIn">
          <ErrorIcon />
          <p className="font-semibold text-lg">Generation Failed</p>
          <p className="text-sm text-red-200 bg-red-900/30 border border-red-800 p-3 rounded-lg max-w-md shadow-lg">{error}</p>
        </div>
      );
    }

    if (imageUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 animate-fadeIn">
           <div className="relative group w-full h-full max-h-[calc(100%-4rem)]">
            <img src={imageUrl} alt="Generated" className="w-full h-full object-contain rounded-md shadow-lg" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md flex items-center justify-center gap-4">
              <button 
                onClick={onPreview}
                className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-indigo-600 transition-all transform hover:scale-110"
                aria-label="Preview image"
              >
                <MaximizeIcon />
              </button>
              <button 
                onClick={handleDownload}
                className="p-3 bg-gray-800/80 rounded-full text-white hover:bg-teal-600 transition-all transform hover:scale-110"
                aria-label="Download image"
              >
                <DownloadIcon />
              </button>
            </div>
           </div>
           {text && <p className="w-full text-center text-gray-300 bg-gray-800/70 p-3 rounded-md text-sm">{text}</p>}
        </div>
      );
    }
    
    return (
      <div className="text-gray-600 flex flex-col items-center justify-center gap-4">
        <div className="opacity-20">
            <LogoIcon />
        </div>
        <p className="text-lg text-gray-500">Your generated image will appear here</p>
        <p className="text-sm mt-1 text-gray-600">Upload an image and provide a prompt to start</p>
      </div>
    );
  };

  return (
    <div className="w-full h-full aspect-square bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center p-4 text-center">
      {renderContent()}
    </div>
  );
};