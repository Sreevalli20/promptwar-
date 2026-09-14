import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

async function parsePDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; numpages: number }> {
  // Convert ArrayBuffer to Buffer for pdf-parse compatibility
  const buffer = Buffer.from(arrayBuffer);
  
  // Parse PDF using pdf-parse (Node.js compatible)
  const data = await pdfParse(buffer);
  
  return {
    text: data.text,
    numpages: data.numpages,
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
      case 'csv':
      case 'json':
      case 'html':
      case 'htm':
        return this.parseText(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOCX, TXT, MD, CSV, JSON, HTML`);
    }
  }

  private static getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const supportedTypes = {
      'pdf': 'pdf',
      'docx': 'docx',
      'txt': 'txt',
      'md': 'md',
      'csv': 'csv',
      'json': 'json',
      'html': 'html',
      'htm': 'html',
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
        throw new Error('This PDF appears to contain scanned images rather than selectable text. Please upload a text-based PDF or use OCR.');
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
      if (errorMessage.includes('scanned') || errorMessage.includes('no extractable text')) {
        throw new Error('This PDF appears to contain scanned images rather than selectable text. Please upload a text-based PDF or use OCR.');
      }
      if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupted')) {
        throw new Error('PDF file is corrupted or malformed');
      }
      
      // Generic error for other cases
      throw new Error('Unable to extract readable text from this PDF. Please try a text-based PDF.');
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
      const fileType = this.getFileType(file.name);
      
      return {
        text,
        metadata: {
          fileName: file.name,
          fileType,
        },
      };
    } catch (error) {
      console.error('Text parsing failed:', error);
      throw new Error('Failed to parse text file');
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = ['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'html', 'htm'];
    
    // Reject empty files
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    // Check file size limit
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Validate file extension (primary check)
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!supportedTypes.includes(extension)) {
      return { valid: false, error: `Unsupported file type: .${extension}. Supported types: PDF, DOCX, TXT, MD, CSV, JSON, HTML` };
    }
    
    // Additional MIME type validation for PDF
    if (extension === 'pdf') {
      const validPdfMimeTypes = [
        'application/pdf',
        'application/x-pdf',
        'application/octet-stream'
      ];
      if (file.type && !validPdfMimeTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid PDF file type' };
      }
    }
    
    // Additional MIME type validation for DOCX
    if (extension === 'docx') {
      const validDocxMimeTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/octet-stream'
      ];
      if (file.type && !validDocxMimeTypes.includes(file.type)) {
        return { valid: false, error: 'Invalid DOCX file type' };
      }
    }
    
    return { valid: true };
  }
}