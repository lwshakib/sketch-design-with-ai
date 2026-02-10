export interface Artifact {
  id?: string;
  content: string;
  type: 'web' | 'app';
  isComplete: boolean;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
}

/**
 * Extracts all HTML artifacts from AI responses
 * Supports <artifact>, <web_artifact>, <mobile_artifact>, and <app_artifact>
 */
export function extractArtifacts(text: string): Artifact[] {
  const artifacts: Artifact[] = [];
  
  // Regex to find any of the opening tags and their content
  // Matches <web_artifact title="..."> or <web_artifact>
  const tagPattern = /<(web_artifact|app_artifact|artifact)([^>]*)>([\s\S]*?)(?:<\/\1>|$)/gi;
  let match;

  while ((match = tagPattern.exec(text)) !== null) {
    const tagName = match[1].toLowerCase();
    const attributes = match[2];
    const content = match[3].trim();

    // Simple title attribute parser
    const titleMatch = attributes.match(/title=["']([^"']+)["']/i);
    const defaultTitle = tagName === 'web_artifact' ? 'Web Design' : 'App Design';
    const title = titleMatch ? titleMatch[1] : defaultTitle;

    let type: 'web' | 'app' = 'app';
    if (tagName === 'web_artifact') type = 'web';

    artifacts.push({
      content,
      type,
      isComplete: text.toLowerCase().includes(`</${tagName}>`, match.index),
      title
    });
  }

  // Fallback for raw HTML without tags
  if (artifacts.length === 0) {
    const htmlMarkers = ['<!doctype html>', '<html', '<body', '<script', '<style'];
    const lowerText = text.toLowerCase();
    const hasHtml = htmlMarkers.some(marker => lowerText.includes(marker));
    
    if (hasHtml && text.length > 50) {
      let type: 'web' | 'app' = 'web';
      if (lowerText.includes('mobile') || lowerText.includes('phone') || lowerText.includes('app') || lowerText.includes('iphone')) {
        type = 'app';
      }

      artifacts.push({
        content: text.trim(),
        type,
        isComplete: false,
        title: "Untitled Design"
      });
    }
  }

  return artifacts;
}

/**
 * Removes all types of artifact blocks from text for display
 */
export function stripArtifact(text: string): string {
  return text
    .replace(/<(web_artifact|app_artifact|artifact)[^>]*>([\s\S]*?)<\/\1>/gi, '')
    // Also remove partial tags at the end
    .replace(/<(web_artifact|app_artifact|artifact)[^>]*>[\s\S]*$/gi, '')
    .trim();
}

/**
 * Renders HTML content into an iframe for safe sandboxed execution
 */
export function renderHTMLToCanvas(
  canvas: HTMLCanvasElement,
  htmlContent: string
): void {
  // Create an off-screen iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '1920px';
  iframe.style.height = '1080px';
  iframe.sandbox.add('allow-scripts');
  
  document.body.appendChild(iframe);

  // Write the HTML content to the iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for the iframe to fully load, then capture it to canvas
  iframe.onload = () => {
    setTimeout(() => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) return;

        // Get the rendered dimensions
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const width = Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth
        );
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );

        // Set iframe to actual content size
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;

        // Use html2canvas or similar library to capture the iframe
        // For now, we'll use a simple approach with canvas drawing
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale canvas to fit content
        const scale = Math.min(
          canvas.width / width,
          canvas.height / height
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);

        // Note: Direct iframe to canvas rendering requires additional libraries
        // This is a placeholder for the actual implementation
        // You would typically use html2canvas or similar here
        
        ctx.restore();
      } catch (error) {
        console.error('Error rendering HTML to canvas:', error);
      } finally {
        // Clean up
        document.body.removeChild(iframe);
      }
    }, 500);
  };
}

/**
 * Alternative: Render HTML in an iframe overlay instead of canvas
 * This provides better interactivity and fidelity
 */
export function createPreviewIframe(htmlContent: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.sandbox.add('allow-scripts', 'allow-same-origin');
  
  // Write content after iframe is in DOM
  setTimeout(() => {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  }, 0);

  return iframe;
}
