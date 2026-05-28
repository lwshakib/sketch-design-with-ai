import { getSignedDownloadUrl } from "@/lib/s3";

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, any>;
    id?: string;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
    id?: string;
  };
}

export interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

/**
 * Preprocesses vision message contents (converts S3 paths and URLs into base64 inlineData)
 * and formats the message history for the Google GenAI SDK.
 */
export async function processMessages(messages: any[]): Promise<GeminiContent[]> {
  return Promise.all(
    messages.map(async (msg) => {
      const role = msg.role === "assistant" ? "model" : msg.role;

      // Handle simple string content
      if (typeof msg.content === "string") {
        return {
          role,
          parts: [{ text: msg.content }],
        };
      }

      const rawParts = Array.isArray(msg.content)
        ? msg.content
        : Array.isArray(msg.parts)
          ? msg.parts
          : null;

      if (rawParts) {
        let imageCount = 0;
        const parts = await Promise.all(
          rawParts.map(async (part: any) => {
            if (part.type === "text" || part.text) {
              return { text: part.text || part.content };
            }

            const isImage = part.type === "image" || part.type === "image_url";
            if (isImage) {
              const url = part.path || part.image_url?.url || part.url;
              if (!url) return null;

              if (url.startsWith("data:")) {
                const [header, data] = url.split(",");
                const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
                return {
                  inlineData: {
                    mimeType,
                    data,
                  },
                };
              }

              if (imageCount >= 2) return null; // Enforce 2-image limit
              imageCount++;

              try {
                let imageUrl = url;
                if (!url.startsWith("http")) {
                  // S3 path: generate signed download URL
                  imageUrl = await getSignedDownloadUrl(url);
                }

                const response = await fetch(imageUrl);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
                const buffer = Buffer.from(await response.arrayBuffer());
                const base64 = buffer.toString("base64");
                
                const ext = url.split(".").pop()?.toLowerCase() || "png";
                const mimeType = (ext === "jpg" || ext === "jpeg") ? "image/jpeg" : `image/${ext}`;

                return {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                };
              } catch (e) {
                console.error(`[processMessages] Vision processing failed for ${url}:`, e);
                return null;
              }
            }

            return null;
          })
        );

        return {
          role,
          parts: parts.filter(Boolean) as GeminiPart[],
        };
      }

      return {
        role,
        parts: [],
      };
    })
  );
}
