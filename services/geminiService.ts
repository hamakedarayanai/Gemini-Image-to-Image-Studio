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
    // This should ideally not be shown to end-users, but providing a clean message.
    throw new Error("The application is not configured correctly. The API key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: Part[] = [];

  try {
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

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Handle cases where the request was blocked before even reaching the model.
    if (!response.candidates?.length) {
      let message = "Your request was blocked for safety reasons. Please try modifying your prompt or using a different image.";
      if (response.promptFeedback?.blockReason) {
        message = `Your request was blocked due to safety policies (${response.promptFeedback.blockReason}). Please adjust your prompt or images and try again.`;
      }
      throw new Error(message);
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
        const reason = candidate.finishReason.toLowerCase();
        let advice = "Please adjust your prompt or images and try again.";
        if (reason === 'recitation') {
            advice = "The model's response was blocked to avoid reciting existing content. Please try a more original prompt.";
        }
        throw new Error(combinedText || `Generation failed due to our ${reason} policy. ${advice}`);
    }

    // If there's no image in a successful response, it's an application-level error.
    if (!imageUrl) {
        throw new Error(combinedText || "The model responded but did not return an image. This can happen if the request is unclear or goes against safety policies. Try making your prompt more specific about the visual changes you'd like to see.");
    }

    return { imageUrl, text: combinedText || null };

  } catch (e) {
    const error = e as Error;
    console.error("Gemini API Error:", error);

    const message = error.message.toLowerCase();

    // Check for our custom user-friendly messages and re-throw them directly.
    const customErrorPrefixes = [
        'your request was blocked', 
        'generation failed',
        'the model responded',
        'the application is not configured'
    ];

    if (customErrorPrefixes.some(prefix => message.startsWith(prefix.toLowerCase()))) {
        throw error;
    }

    // Handle generic SDK or network errors with user-friendly advice.
    if (message.includes('failed to read file')) {
        throw new Error("Failed to process an uploaded image. Please ensure the file is not corrupted and try again.");
    }
    
    if (message.includes('invalid') || message.includes('unsupported') || message.includes('malformed')) {
        throw new Error("An uploaded image may be in an unsupported format or corrupted. Please use a standard format like JPEG, PNG, or WEBP and try again.");
    }

    // A catch-all for other unexpected errors.
    throw new Error("An unexpected error occurred. Please check your internet connection and try again. If the issue persists, the service may be temporarily unavailable.");
  }
};
