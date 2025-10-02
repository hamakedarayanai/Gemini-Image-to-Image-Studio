import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { PromptInput } from './components/PromptInput';
import { GeneratedImageDisplay } from './components/GeneratedImageDisplay';
import { generateImageFromImage } from './services/geminiService';
import { UploadedFile } from './types';
import { WandIcon } from './components/Icons';
import { ImagePreviewModal } from './components/ImagePreviewModal';

const promptSuggestions = [
  'Add a futuristic element',
  'Make it a fantasy scene',
  'Change season to winter',
  'Apply a vintage photo effect',
];

function App() {
  const [baseImage, setBaseImage] = useState<UploadedFile | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const handleGenerate = useCallback(async () => {
    if (!baseImage) {
      setError('Please upload a base image to begin.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedText(null);

    try {
      const result = await generateImageFromImage(
        baseImage.file,
        referenceImage?.file ?? null,
        prompt
      );
      setGeneratedImageUrl(result.imageUrl);
      setGeneratedText(result.text);
    } catch (e) {
      const err = e as Error;
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, referenceImage, prompt]);

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(prev => prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion);
  };


  return (
    <div className="min-h-screen text-gray-200 font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
          {/* Controls Column */}
          <div className="flex flex-col gap-6 p-6 bg-gray-900/50 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-indigo-400">1. Upload Images</h2>
            <ImageUploader
              title="Base Image"
              description="The image you want to edit."
              file={baseImage}
              onFileChange={setBaseImage}
              onClear={() => setBaseImage(null)}
            />
            <ImageUploader
              title="Reference Image (Optional)"
              description="Influence the style or content."
              file={referenceImage}
              onFileChange={setReferenceImage}
              onClear={() => setReferenceImage(null)}
            />

            <h2 className="text-2xl font-bold text-indigo-400 mt-4">2. Describe Your Edit</h2>
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              placeholder="e.g., 'make the sky a vibrant sunset' or 'add a futuristic car'"
            />

            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-xs font-medium text-indigo-300 bg-indigo-900/50 border border-indigo-800 rounded-full hover:bg-indigo-900 hover:text-indigo-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            <div className="mt-auto pt-6">
              <button
                onClick={handleGenerate}
                disabled={!baseImage || isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 disabled:from-indigo-900/50 disabled:to-teal-900/50 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/30"
              >
                <WandIcon />
                {isLoading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>

          {/* Output Column */}
          <div className="flex flex-col gap-6 p-6 bg-gray-900/50 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-teal-400">Result</h2>
            <GeneratedImageDisplay
              imageUrl={generatedImageUrl}
              baseImageUrl={baseImage?.previewUrl}
              text={generatedText}
              isLoading={isLoading}
              error={error}
              onPreview={() => setIsPreviewOpen(true)}
            />
          </div>
        </div>
      </main>
      <ImagePreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        imageUrl={generatedImageUrl} 
      />
    </div>
  );
}

export default App;