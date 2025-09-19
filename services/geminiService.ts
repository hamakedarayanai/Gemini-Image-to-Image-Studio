
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
  } else {
    // Add a default prompt if none is provided
    if (referenceImage) {
      parts.push({ text: "Use the style of the second image to modify the first image." });
    } else {
      parts.push({ text: "Slightly enhance this image, improve lighting and colors." });
    }
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Handle cases where the request was blocked before even reaching the model.
    if (!response.candidates?.length) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(
          `Request was blocked due to ${response.promptFeedback.blockReason}. ` +
          (response.promptFeedback.blockReasonMessage || 'Please adjust your prompt or images.')
        );
      }
      throw new Error("API returned no content. Your request may have been blocked for safety reasons.");
    }

    const candidate = response.candidates[0];
    const responseParts = candidate.content?.parts ?? [];
    
    // Extract all text and image data from the response parts.
    let imageUrl: string | null = null;
    const textParts: string[] = [];

    for (const part of responseParts) {
      if (part.text) {
        textParts.push(part.text);
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }

    const combinedText = textParts.join(' ').trim();

    // Check for explicit failure reasons from the model.
    if (candidate.finishReason && ['SAFETY', 'RECITATION'].includes(candidate.finishReason)) {
      throw new Error(combinedText || `Generation failed due to ${candidate.finishReason.toLowerCase()} policy.`);
    }

    // If there's no image in a successful response, it's an application-level error.
    // The model might have responded with text explaining why.
    if (!imageUrl) {
      throw new Error(combinedText || "The model did not return an image. This could be due to a safety policy violation or an issue with the prompt. Please try again with a different prompt or image.");
    }

    return { imageUrl, text: combinedText || null };

  } catch (e) {
    const error = e as Error;
    console.error("Gemini API Error:", error);
    // Re-throw with a consistent error message format.
    throw new Error(error.message || "An unknown error occurred during image generation.");
  }
};
