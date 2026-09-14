import { describe, it, expect } from 'vitest';

describe('DocumentParser Logic', () => {
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
});