import React from 'react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  placeholder: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, onPromptChange, placeholder }) => {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full p-3 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-300 placeholder-gray-500 resize-none"
      />
    </div>
  );
};