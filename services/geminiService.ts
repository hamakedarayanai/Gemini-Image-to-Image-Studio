
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

    const candidate = response.candidates?.[0];

    // Case 1: No candidates returned, check promptFeedback for blocking.
    if (!candidate) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(
          `Request was blocked due to ${response.promptFeedback.blockReason}. ` +
          (response.promptFeedback.blockReasonMessage || 'Please adjust your prompt or images.')
        );
      }
      throw new Error("API returned no content. Your request may have been blocked for an unspecified reason.");
    }
    
    // The text part from the model might contain a more specific explanation for failure.
    const failureTextPart = candidate.content?.parts?.find(p => 'text' in p && p.text);
    const failureText = failureTextPart && 'text' in failureTextPart ? failureTextPart.text : undefined;


    // Case 2: Candidate exists, but generation finished for a bad reason.
    if (candidate.finishReason && ['SAFETY', 'RECITATION'].includes(candidate.finishReason)) {
      throw new Error(failureText || `Generation failed due to ${candidate.finishReason.toLowerCase()} policy.`);
    }
    
    let imageUrl: string | null = null;
    let text: string | null = null;
    let hasImageOutput = false;
    
    const responseParts = candidate.content?.parts ?? [];

    for (const part of responseParts) {
      if (part.text) {
        text = part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
        hasImageOutput = true;
      }
    }

    // Case 3: Candidate exists, but no image was returned.
    if (!hasImageOutput) {
      // The text part might explain why.
      throw new Error(text || "API did not return an image. This could be due to a safety policy violation or an issue with the prompt.");
    }

    return { imageUrl, text };
  } catch (e) {
    // Re-throw the error to be handled by the UI component
    // This allows custom errors from above to pass through, and also catches network/API key errors.
    const error = e as Error;
    console.error("Gemini API Error:", error);
    // Let's make sure it's always an error object with a message
    throw new Error(error.message || "An unknown error occurred during image generation.");
  }
};
