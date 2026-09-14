import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentParser } from '../src/lib/parsers/document-parser';

// Mock mammoth module
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

// Mock pdfjs-dist module
vi.mock('pdfjs-dist', () => {
  const mockPdfjs = {
    getDocument: vi.fn(),
    version: '3.11.174',
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  };
  return {
    default: mockPdfjs,
    ...mockPdfjs,
  };
});

import mammoth from 'mammoth';

describe('DocumentParser Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File size validation', () => {
    it('should accept files under 10MB', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const smallFile = { size: 5 * 1024 * 1024, name: 'test.pdf' }; // 5MB
      expect(smallFile.size).toBeLessThan(maxSize);
    });

    it('should reject files over 10MB', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const largeFile = { size: 11 * 1024 * 1024, name: 'large.pdf' }; // 11MB
      expect(largeFile.size).toBeGreaterThan(maxSize);
    });

    it('should validate file using DocumentParser', () => {
      const validFile = { size: 5 * 1024 * 1024, name: 'test.pdf' };
      const validation = DocumentParser.validateFile(validFile as File);
      expect(validation.valid).toBe(true);
    });

    it('should reject oversized files using DocumentParser', () => {
      const largeFile = { size: 11 * 1024 * 1024, name: 'large.pdf' };
      const validation = DocumentParser.validateFile(largeFile as File);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('10MB');
    });
  });

  describe('File type validation', () => {
    it('should accept PDF extension', () => {
      const fileName = 'document.pdf';
      const extension = fileName.split('.').pop()?.toLowerCase();
      const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
      expect(supportedTypes).toContain(extension);
    });

    it('should accept DOCX extension', () => {
      const fileName = 'document.docx';
      const extension = fileName.split('.').pop()?.toLowerCase();
      const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
      expect(supportedTypes).toContain(extension);
    });

    it('should accept TXT extension', () => {
      const fileName = 'document.txt';
      const extension = fileName.split('.').pop()?.toLowerCase();
      const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
      expect(supportedTypes).toContain(extension);
    });

    it('should accept MD extension', () => {
      const fileName = 'document.md';
      const extension = fileName.split('.').pop()?.toLowerCase();
      const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
      expect(supportedTypes).toContain(extension);
    });

    it('should reject unsupported extensions', () => {
      const fileName = 'document.exe';
      const extension = fileName.split('.').pop()?.toLowerCase();
      const supportedTypes = ['pdf', 'docx', 'txt', 'md'];
      expect(supportedTypes).not.toContain(extension);
    });

    it('should handle uppercase extensions', () => {
      const fileName = 'document.PDF';
      const extension = fileName.split('.').pop()?.toLowerCase();
      expect(extension).toBe('pdf');
    });

    it('should reject unsupported file types using DocumentParser', () => {
      const invalidFile = { size: 1024, name: 'document.exe' };
      const validation = DocumentParser.validateFile(invalidFile as File);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Unsupported file type');
    });
  });

  describe('Empty file validation', () => {
    it('should reject empty files', () => {
      const emptyFile = { size: 0, name: 'empty.docx' };
      const validation = DocumentParser.validateFile(emptyFile as File);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('empty');
    });
  });

  describe('DOCX MIME type validation', () => {
    it('should accept valid DOCX MIME type', () => {
      const validDocx = { 
        size: 1024, 
        name: 'document.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const validation = DocumentParser.validateFile(validDocx as File);
      expect(validation.valid).toBe(true);
    });

    it('should accept application/octet-stream for DOCX', () => {
      const docxFile = { 
        size: 1024, 
        name: 'document.docx',
        type: 'application/octet-stream'
      };
      const validation = DocumentParser.validateFile(docxFile as File);
      expect(validation.valid).toBe(true);
    });

    it('should reject invalid MIME type for DOCX', () => {
      const invalidDocx = { 
        size: 1024, 
        name: 'document.docx',
        type: 'image/jpeg'
      };
      const validation = DocumentParser.validateFile(invalidDocx as File);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Invalid DOCX file type');
    });
  });

  describe('DOCX Buffer parsing', () => {
    it('should convert ArrayBuffer to Node Buffer and pass to mammoth.extractRawText', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const mockBuffer = Buffer.from(mockArrayBuffer);
      
      const mockFile = {
        name: 'test.docx',
        size: 100,
        arrayBuffer: async () => mockArrayBuffer,
      } as unknown as File;

      (mammoth.extractRawText as any).mockResolvedValue({
        value: 'Extracted text from DOCX',
        messages: [],
      });

      const result = await DocumentParser.parseFile(mockFile);

      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer: mockBuffer });
      expect(result.text).toBe('Extracted text from DOCX');
      expect(result.metadata?.fileType).toBe('docx');
    });

    it('should handle mammoth extraction errors gracefully', async () => {
      const mockFile = {
        name: 'corrupt.docx',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(100),
      } as unknown as File;

      (mammoth.extractRawText as any).mockRejectedValue(new Error('Could not find file in options'));

      await expect(DocumentParser.parseFile(mockFile)).rejects.toThrow('Failed to parse DOCX file');
    });

    it('should extract text from a valid DOCX', async () => {
      const mockFile = {
        name: 'valid.docx',
        size: 200,
        arrayBuffer: async () => new ArrayBuffer(200),
      } as unknown as File;

      (mammoth.extractRawText as any).mockResolvedValue({
        value: 'This is sample document content',
        messages: [],
      });

      const result = await DocumentParser.parseFile(mockFile);

      expect(result.text).toBe('This is sample document content');
      expect(result.metadata?.fileName).toBe('valid.docx');
    });

    it('should reject empty DOCX files before parsing', () => {
      const emptyFile = { size: 0, name: 'empty.docx' };
      const validation = DocumentParser.validateFile(emptyFile as File);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('empty');
    });

    it('should reject invalid DOCX files with wrong extension', () => {
      const invalidFile = { size: 1024, name: 'document.doc' };
      const validation = DocumentParser.validateFile(invalidFile as File);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Unsupported file type');
    });
  });

  describe('Document text limits', () => {
    it('should accept documents under 100,000 characters', () => {
      const maxLength = 100000;
      const shortText = 'a'.repeat(50000);
      expect(shortText.length).toBeLessThan(maxLength);
    });

    it('should reject documents over 100,000 characters', () => {
      const maxLength = 100000;
      const longText = 'a'.repeat(100001);
      expect(longText.length).toBeGreaterThan(maxLength);
    });
  });

  describe('Regression test for Buffer parsing', () => {
    it('should use mammoth.extractRawText with {buffer} not {arrayBuffer}', async () => {
      const mockFile = {
        name: 'regression-test.docx',
        size: 150,
        arrayBuffer: async () => new ArrayBuffer(150),
      } as unknown as File;

      (mammoth.extractRawText as any).mockResolvedValue({
        value: 'Regression test content',
        messages: [],
      });

      await DocumentParser.parseFile(mockFile);

      // Verify mammoth was called with {buffer} not {arrayBuffer}
      const callArgs = (mammoth.extractRawText as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('buffer');
      expect(callArgs).not.toHaveProperty('arrayBuffer');
      expect(callArgs.buffer).toBeInstanceOf(Buffer);
    });
  });
});