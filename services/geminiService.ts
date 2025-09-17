
import { GoogleGenAI, Modality, GenerateContentResponse, Part } from "@google/genai";

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]);
      } else {
        reject(new Error("Failed to read file."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const generateImageFromImage = async (
  baseImage: File,
  referenceImage: File | null,
  prompt: string
): Promise<{ imageUrl: string | null; text: string | null }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: Part[] = [];

  parts.push(await fileToGenerativePart(baseImage));

  if (referenceImage) {
    parts.push(await fileToGenerativePart(referenceImage));
  }

  if (prompt.trim()) {
    parts.push({ text: prompt });
  }
  
  if (parts.length === 1 && !prompt.trim()) {
    // Add a default prompt if only one image is provided with no text
    parts.push({ text: "Slightly enhance this image, improve lighting and colors." });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  let imageUrl: string | null = null;
  let text: string | null = null;
  let hasImageOutput = false;

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      text = part.text;
    } else if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
      hasImageOutput = true;
    }
  }

  if (!hasImageOutput) {
    throw new Error(text || "API did not return an image. It might be due to a safety policy violation.");
  }

  return { imageUrl, text };
};
