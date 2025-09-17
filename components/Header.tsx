
import React from 'react';
import { SparklesIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 mb-2">
        Gemini Image-to-Image Studio
      </h1>
      <p className="flex items-center justify-center gap-2 text-lg text-gray-400">
        <SparklesIcon />
        Transform your images with the power of generative AI
      </p>
    </header>
  );
};
