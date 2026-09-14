import { describe, it, expect } from 'vitest';
import { DocumentAnalysisSchema, QAResponseSchema, ComparisonResultSchema, FileUploadSchema, QuestionSchema } from '../src/lib/schemas/validation';

describe('Schema Validation', () => {
  describe('DocumentAnalysisSchema', () => {
    it('should validate a complete document analysis', () => {
      const validAnalysis = {
        summary: 'This is a sample agreement between Party A and Party B',
        parties: ['Party A', 'Party B'],
        purpose: 'To establish a business relationship',
        keyClauses: [
          {
            title: 'Payment Terms',
            summary: 'Payment must be made within 30 days',
            whyItMatters: 'Late payments may incur penalties',
            source: 'Section 3.1'
          }
        ],
        obligations: [
          {
            party: 'Party A',
            obligation: 'Deliver goods by specified date',
            details: 'Delivery must be made within 15 business days'
          }
        ],
        deadlines: [
          {
            type: 'Payment',
            date: 'Within 30 days of invoice',
            description: 'Payment deadline for invoices'
          }
        ],
        termination: 'Either party may terminate with 30 days notice',
        risks: [
          {
            title: 'Late Payment Risk',
            severity: 'MEDIUM',
            description: 'Late payments may affect cash flow',
            whyItMatters: 'Could impact business operations',
            source: 'Section 4.2',
            recommendedAction: 'Monitor payment schedules closely'
          }
        ],
        missingInformation: ['Governing law jurisdiction'],
        questionsForLawyer: ['What jurisdiction governs this agreement?'],
        actionChecklist: [
          {
            item: 'Review payment terms',
            completed: false
          }
        ],
        disclaimer: 'LexiGuard provides AI-assisted legal information and document understanding. It does not provide legal advice.'
      };

      const result = DocumentAnalysisSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const minimalAnalysis = {
        summary: 'Basic summary',
        parties: ['Party A'],
        purpose: 'Basic purpose',
        keyClauses: [],
        obligations: [],
        deadlines: [],
        termination: 'Termination terms',
        risks: [],
        missingInformation: [],
        questionsForLawyer: [],
        actionChecklist: [],
        disclaimer: 'Disclaimer text'
      };

      const result = DocumentAnalysisSchema.safeParse(minimalAnalysis);
      expect(result.success).toBe(true);
    });

    it('should reject invalid risk severity', () => {
      const invalidAnalysis = {
        summary: 'Summary',
        parties: ['Party A'],
        purpose: 'Purpose',
        keyClauses: [],
        obligations: [],
        deadlines: [],
        termination: 'Termination',
        risks: [
          {
            title: 'Risk',
            severity: 'INVALID' as any,
            description: 'Description',
            whyItMatters: 'Why it matters',
            recommendedAction: 'Action'
          }
        ],
        missingInformation: [],
        questionsForLawyer: [],
        actionChecklist: [],
        disclaimer: 'Disclaimer'
      };

      const result = DocumentAnalysisSchema.safeParse(invalidAnalysis);
      expect(result.success).toBe(false);
    });
  });

  describe('QAResponseSchema', () => {
    it('should validate a complete Q&A response', () => {
      const validResponse = {
        answer: 'Based on the document, termination requires 30 days written notice',
        supportingEvidence: ['Section 5.1: Either party may terminate with 30 days written notice'],
        confidence: 'HIGH' as const,
        disclaimer: 'LexiGuard provides AI-assisted legal information. For legal advice, consult a qualified professional.'
      };

      const result = QAResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject invalid confidence level', () => {
      const invalidResponse = {
        answer: 'Answer',
        supportingEvidence: ['Evidence'],
        confidence: 'INVALID' as any,
        disclaimer: 'Disclaimer'
      };

      const result = QAResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('ComparisonResultSchema', () => {
    it('should validate comparison results', () => {
      const validComparison = [
        {
          category: 'payment',
          documentA: 'Payment within 30 days',
          documentB: 'Payment within 60 days',
          changeType: 'MODIFIED' as const,
          importance: 'HIGH' as const,
          explanation: 'Extended payment terms may affect cash flow'
        }
      ];

      const result = ComparisonResultSchema.safeParse(validComparison);
      expect(result.success).toBe(true);
    });

    it('should reject invalid change type', () => {
      const invalidComparison = [
        {
          category: 'payment',
          documentA: 'Payment terms',
          documentB: 'Different terms',
          changeType: 'INVALID' as any,
          importance: 'HIGH' as const,
          explanation: 'Explanation'
        }
      ];

      const result = ComparisonResultSchema.safeParse(invalidComparison);
      expect(result.success).toBe(false);
    });
  });

  describe('QuestionSchema', () => {
    it('should validate a question with document text', () => {
      const validQuestion = {
        question: 'What are the payment terms?',
        documentText: 'This agreement specifies payment terms...'
      };

      const result = QuestionSchema.safeParse(validQuestion);
      expect(result.success).toBe(true);
    });

    it('should reject empty question', () => {
      const invalidQuestion = {
        question: '',
        documentText: 'Document text'
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should reject question that is too long', () => {
      const invalidQuestion = {
        question: 'a'.repeat(1001),
        documentText: 'Document text'
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });

    it('should require either documentText or file', () => {
      const invalidQuestion = {
        question: 'What are the terms?'
      };

      const result = QuestionSchema.safeParse(invalidQuestion);
      expect(result.success).toBe(false);
    });
  });
});