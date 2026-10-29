import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

export const officialLinks = Object.freeze({ home: 'https://imageunblur.ai/', pricing: 'https://imageunblur.ai/pricing', contact: 'https://imageunblur.ai/contact' });
const allowedFormats = new Set(['jpg', 'jpeg', 'png', 'webp']);

export function checkImage({ format, sizeBytes, width, height }) {
  const errors = [];
  const normalized = format.trim().replace(/^\./, '').toLowerCase();
  const megapixels = width * height / 1_000_000;
  if (!allowedFormats.has(normalized)) errors.push('Use JPG, PNG, or WebP; HEIC, GIF, and SVG are not supported.');
  if (sizeBytes > 20_000_000) errors.push('File exceeds the 20 MB website limit.');
  if (width < 64 || height < 64 || width > 16384 || height > 16384) errors.push('Each side must be between 64 and 16,384 pixels.');
  if (megapixels > 24) errors.push('Image exceeds the 24 megapixel website limit.');
  return { acceptedByPublishedLimits: errors.length === 0, format: normalized, megapixels: Number(megapixels.toFixed(2)), errors, nextStep: errors.length ? 'Adjust the file locally before opening the official uploader.' : 'Choose Basic or Pro on the official site, then upload there. This check does not inspect image pixels.' };
}

export function recommendModel({ blurType, severity, containsTextOrFaces }) {
  if (blurType === 'intentional-obscuring') return {
    suggestedFirstTry: 'none',
    reason: 'Intentionally hidden detail cannot be reliably recovered from the visible image.',
    caution: 'Do not treat generated detail as the original hidden information.',
    officialTool: officialLinks.home,
  };
  const basic = severity !== 'heavy' || containsTextOrFaces;
  return {
    suggestedFirstTry: basic ? 'Basic' : 'Pro',
    reason: basic ? 'Basic is the more faithful first pass, especially for faces or text.' : 'The official guide suggests Pro for heavy blur when more rebuilding is acceptable.',
    caution: 'Compare the output closely with the original; Pro can change faces, text, or textures.',
    officialTool: officialLinks.home,
  };
}

const reply = value => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
export function createServer() {
  const server = new McpServer({ name: 'imageunblur-image-preflight', version: '0.1.0' });
  server.registerTool('check_image_metadata', { title: 'Check image upload limits', description: 'Check only file format, byte size, and dimensions against published Image Unblur limits. No image file is sent.', inputSchema: z.object({ format: z.string().min(1).max(20), sizeBytes: z.number().int().nonnegative(), width: z.number().int().positive(), height: z.number().int().positive() }) }, async input => reply(checkImage(input)));
  server.registerTool('plan_enhancement', { title: 'Plan an enhancement', description: 'Choose a cautious first model from blur symptoms. It does not inspect or modify an image.', inputSchema: z.object({ blurType: z.enum(['motion', 'out-of-focus', 'compression', 'old-scan', 'intentional-obscuring']), severity: z.enum(['mild', 'moderate', 'heavy']), containsTextOrFaces: z.boolean() }) }, async input => reply(recommendModel(input)));
  server.registerTool('get_official_links', { title: 'Official Image Unblur links', description: 'Return allowlisted official product links.', inputSchema: z.object({}) }, async () => reply(officialLinks));
  return server;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) void serveStdio(createServer);
