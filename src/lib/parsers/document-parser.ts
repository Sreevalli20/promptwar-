import mammoth from 'mammoth';
// Use Node-compatible legacy build for server-side PDF parsing
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function parsePDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; numpages: number }> {
  // Convert ArrayBuffer to Buffer for Node compatibility
  const buffer = Buffer.from(arrayBuffer);
  
  // Load PDF directly from buffer - no worker needed for server-side
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return {
    text: fullText,
    numpages: pdf.numPages,
  };
}

export interface ParseResult {
  text: string;
  metadata?: {
    fileName: string;
    fileType: string;
    pageCount?: number;
  };
}

export class DocumentParser {
  static async parseFile(file: File): Promise<ParseResult> {
    const fileType = this.getFileType(file.name);
    
    switch (fileType) {
      case 'pdf':
        return this.parsePDF(file);
      case 'docx':
        return this.parseDOCX(file);
      case 'txt':
      case 'md':
        return this.parseText(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private static getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const supportedTypes = {
      'pdf': 'pdf',
      'docx': 'docx',
      'txt': 'txt',
      'md': 'md',
    };
    
    return supportedTypes[extension as keyof typeof supportedTypes] || 'unknown';
  }

  private static async parsePDF(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Check for empty file
      if (arrayBuffer.byteLength === 0) {
        throw new Error('PDF file is empty');
      }
      
      const data = await parsePDF(arrayBuffer);
      
      // Check for empty extraction (e.g., scanned/image-only PDF)
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF contains no extractable text (may be scanned or image-only)');
      }
      
      // Enforce 100,000 character limit
      const maxLength = 100000;
      if (data.text.length > maxLength) {
        return {
          text: data.text.substring(0, maxLength),
          metadata: {
            fileName: file.name,
            fileType: 'pdf',
            pageCount: data.numpages,
          },
        };
      }
      
      return {
        text: data.text,
        metadata: {
          fileName: file.name,
          fileType: 'pdf',
          pageCount: data.numpages,
        },
      };
    } catch (error) {
      console.error('PDF parsing failed:', error);
      
      // Convert specific errors to safe application messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
        throw new Error('PDF is password-protected and cannot be parsed');
      }
      if (errorMessage.includes('empty')) {
        throw new Error('PDF file is empty or corrupted');
      }
      if (errorMessage.includes('no extractable text')) {
        throw new Error('PDF contains no extractable text (may be scanned or image-only)');
      }
      if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupted')) {
        throw new Error('PDF file is corrupted or malformed');
      }
      
      // Generic error for other cases
      throw new Error('Failed to parse PDF file');
    }
  }

  private static async parseDOCX(file: File): Promise<ParseResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        text: result.value,
        metadata: {
          fileName: file.name,
          fileType: 'docx',
        },
      };
    } catch (error) {
      console.error('DOCX parsing failed:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  private static async parseText(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      
      return {
        text,
        metadata: {
          fileName: file.name,
          fileType: file.name.endsWith('.md') ? 'md' : 'txt',
        },
      };
    } catch (error) {
      console.error('Text parsing failed:', error);
      throw new Error('Failed to parse text file');
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
    
    // Reject empty files
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    // Check file size limit
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!supportedTypes.includes(extension)) {
      return { valid: false, error: `Unsupported file type: .${extension}. Supported types: PDF, DOCX, TXT, MD` };
    }
    
    // Additional DOCX-specific validation
    if (extension === 'docx') {
      // Check MIME type if available
      const validMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/octet-stream'
      ];
      if (file.type && !validMimeTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid DOCX file type' };
      }
    }
    
    return { valid: true };
  }
}