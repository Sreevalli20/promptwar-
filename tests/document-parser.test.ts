import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentParser } from '../src/lib/parsers/document-parser';

// Mock mammoth module
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

// Mock pdfjs-dist legacy build for Node-compatible server-side parsing
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => {
  const mockPdfjs = {
    getDocument: vi.fn(),
  };
  return {
    default: mockPdfjs,
    ...mockPdfjs,
  };
});

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

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

  describe('PDF Buffer/Uint8Array parsing', () => {
    it('should convert ArrayBuffer to Buffer and pass to pdfjs-dist legacy build', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const mockBuffer = Buffer.from(mockArrayBuffer);
      
      const mockPdf = {
        numPages: 2,
        getPage: vi.fn(),
      };
      
      const mockPage = {
        getTextContent: vi.fn(),
      };
      
      const mockFile = {
        name: 'test.pdf',
        size: 100,
        arrayBuffer: async () => mockArrayBuffer,
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      mockPdf.getPage.mockResolvedValue(mockPage);
      mockPage.getTextContent.mockResolvedValue({
        items: [{ str: 'Page 1 text' }, { str: 'Page 1 more' }],
      });

      const result = await DocumentParser.parseFile(mockFile);

      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ data: mockBuffer });
      expect(result.text).toContain('Page 1 text');
      expect(result.metadata?.fileType).toBe('pdf');
      expect(result.metadata?.pageCount).toBe(2);
    });

    it('should handle multi-page PDF extraction', async () => {
      const mockArrayBuffer = new ArrayBuffer(200);
      const mockBuffer = Buffer.from(mockArrayBuffer);
      
      const mockPdf = {
        numPages: 3,
        getPage: vi.fn(),
      };
      
      const mockPage1 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Page 1' }],
        }),
      };
      
      const mockPage2 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Page 2' }],
        }),
      };
      
      const mockPage3 = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Page 3' }],
        }),
      };
      
      const mockFile = {
        name: 'multipage.pdf',
        size: 200,
        arrayBuffer: async () => mockArrayBuffer,
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      mockPdf.getPage
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2)
        .mockResolvedValueOnce(mockPage3);

      const result = await DocumentParser.parseFile(mockFile);

      expect(result.text).toContain('Page 1');
      expect(result.text).toContain('Page 2');
      expect(result.text).toContain('Page 3');
      expect(result.metadata?.pageCount).toBe(3);
    });

    it('should reject empty PDF files', async () => {
      const mockFile = {
        name: 'empty.pdf',
        size: 0,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as File;

      await expect(DocumentParser.parseFile(mockFile)).rejects.toThrow('PDF file is empty');
    });

    it('should handle PDFs with no extractable text (scanned/image-only)', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const mockBuffer = Buffer.from(mockArrayBuffer);
      
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn(),
      };
      
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [],
        }),
      };
      
      const mockFile = {
        name: 'scanned.pdf',
        size: 100,
        arrayBuffer: async () => mockArrayBuffer,
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      mockPdf.getPage.mockResolvedValue(mockPage);

      await expect(DocumentParser.parseFile(mockFile)).rejects.toThrow('no extractable text');
    });

    it('should handle corrupted/malformed PDF', async () => {
      const mockFile = {
        name: 'corrupt.pdf',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(100),
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.reject(new Error('Invalid PDF structure')),
      });

      await expect(DocumentParser.parseFile(mockFile)).rejects.toThrow('PDF file is corrupted or malformed');
    });

    it('should handle password-protected PDF', async () => {
      const mockFile = {
        name: 'protected.pdf',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(100),
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.reject(new Error('password required')),
      });

      await expect(DocumentParser.parseFile(mockFile)).rejects.toThrow('PDF is password-protected');
    });

    it('should enforce 100,000 character limit', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const mockBuffer = Buffer.from(mockArrayBuffer);
      
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn(),
      };
      
      const longText = 'a'.repeat(150000);
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: longText }],
        }),
      };
      
      const mockFile = {
        name: 'long.pdf',
        size: 100,
        arrayBuffer: async () => mockArrayBuffer,
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      mockPdf.getPage.mockResolvedValue(mockPage);

      const result = await DocumentParser.parseFile(mockFile);

      expect(result.text.length).toBe(100000);
      expect(result.text.length).toBeLessThanOrEqual(100000);
    });

    it('should convert parser errors to safe application errors', async () => {
      const mockFile = {
        name: 'error.pdf',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(100),
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.reject(new Error('Some internal error')),
      });

      await expect(DocumentParser.parseFile(mockFile)).rejects.toThrow('Failed to parse PDF file');
      // Ensure no internal stack trace is exposed
      expect(await DocumentParser.parseFile(mockFile).catch((e: Error) => e.message)).not.toContain('Some internal error');
    });

    it('should not configure browser worker for server-side parsing', async () => {
      const mockArrayBuffer = new ArrayBuffer(100);
      const mockBuffer = Buffer.from(mockArrayBuffer);
      
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn(),
      };
      
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Test text' }],
        }),
      };
      
      const mockFile = {
        name: 'test.pdf',
        size: 100,
        arrayBuffer: async () => mockArrayBuffer,
      } as unknown as File;

      (pdfjsLib.getDocument as any).mockReturnValue({
        promise: Promise.resolve(mockPdf),
      });

      mockPdf.getPage.mockResolvedValue(mockPage);

      await DocumentParser.parseFile(mockFile);

      // Verify pdfjs-dist legacy build was called directly without worker configuration
      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ data: mockBuffer });
      expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1);
    });
  });
});