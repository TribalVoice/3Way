import { MAX_DOCUMENT_CHARS, MAX_UPLOAD_BYTES } from './types';

export interface ExtractedDocument {
  fileName: string;
  text: string;
  truncated: boolean;
}

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'tsv',
  'json',
  'jsonl',
  'xml',
  'html',
  'htm',
  'css',
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'c',
  'h',
  'cpp',
  'hpp',
  'cs',
  'php',
  'sh',
  'bash',
  'zsh',
  'yml',
  'yaml',
  'toml',
  'ini',
  'env',
  'log',
  'sql',
  'r',
  'swift',
  'scala',
  'vue',
  'svelte',
  'graphql',
  'gql',
]);

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function clampText(text: string): { text: string; truncated: boolean } {
  const normalized = text.replace(/\u0000/g, '').trim();
  if (normalized.length <= MAX_DOCUMENT_CHARS) {
    return { text: normalized, truncated: false };
  }
  return {
    text: normalized.slice(0, MAX_DOCUMENT_CHARS) + '\n\n…[truncated]',
    truncated: true,
  };
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  // Dynamic import keeps pdf.js out of the initial bundle
  const pdfjs = await import('pdfjs-dist');
  const version = pdfjs.version || '4.10.38';
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const parts: string[] = [];
  const maxPages = Math.min(doc.numPages, 100);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        if (item && typeof item === 'object' && 'str' in item) {
          return String((item as { str: string }).str);
        }
        return '';
      })
      .join(' ');
    parts.push(pageText);
  }

  if (doc.numPages > maxPages) {
    parts.push(
      `\n[Only first ${maxPages} of ${doc.numPages} pages were extracted.]`
    );
  }

  return parts.join('\n\n');
}

/**
 * Extract plain text from a user-selected file for injection into the room.
 */
export async function extractTextFromFile(
  file: File
): Promise<ExtractedDocument> {
  if (file.size <= 0) {
    throw new Error('File is empty.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File is too large (max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB).`
    );
  }

  const fileName = file.name || 'document';
  const ext = extOf(fileName);
  const mime = (file.type || '').toLowerCase();

  let raw = '';

  if (ext === 'pdf' || mime === 'application/pdf') {
    try {
      raw = await extractPdfText(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF parse failed';
      throw new Error(
        `Could not extract text from PDF. ${msg}. Scanned image-only PDFs are not supported yet.`
      );
    }
  } else if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    TEXT_EXTENSIONS.has(ext) ||
    !ext
  ) {
    raw = await readAsText(file);
    const sample = raw.slice(0, 2000);
    const nonPrintable = (sample.match(/[^\x09\x0a\x0d\x20-\x7e]/g) || [])
      .length;
    if (sample.length > 0 && nonPrintable / sample.length > 0.3) {
      throw new Error(
        'This looks like a binary file. Use text, markdown, code, CSV, or PDF.'
      );
    }
  } else {
    throw new Error(
      `Unsupported file type (.${ext || 'unknown'}). Use text, code, CSV, Markdown, or PDF.`
    );
  }

  const { text, truncated } = clampText(raw);
  if (!text) {
    throw new Error(
      'No text could be extracted. The file may be empty or image-only.'
    );
  }

  return { fileName, text, truncated };
}
