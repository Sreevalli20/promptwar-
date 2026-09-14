import { z } from 'zod';

export const DocumentAnalysisSchema = z.object({
  summary: z.string(),
  parties: z.array(z.string()),
  purpose: z.string(),
  keyClauses: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    whyItMatters: z.string(),
    source: z.string().optional(),
  })),
  obligations: z.array(z.object({
    party: z.string(),
    obligation: z.string(),
    details: z.string(),
  })),
  deadlines: z.array(z.object({
    type: z.string(),
    date: z.string(),
    description: z.string(),
  })),
  termination: z.string(),
  risks: z.array(z.object({
    title: z.string(),
    severity: z.enum(['HIGH', 'MEDIUM', 'LOW', 'INFO']),
    description: z.string(),
    whyItMatters: z.string(),
    source: z.string().optional(),
    recommendedAction: z.string(),
  })),
  missingInformation: z.array(z.string()),
  questionsForLawyer: z.array(z.string()),
  actionChecklist: z.array(z.object({
    item: z.string(),
    completed: z.boolean(),
  })),
  disclaimer: z.string(),
});

export const QAResponseSchema = z.object({
  answer: z.string(),
  supportingEvidence: z.array(z.string()),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  disclaimer: z.string(),
});

export const ComparisonResultSchema = z.array(z.object({
  category: z.string(),
  documentA: z.string(),
  documentB: z.string(),
  changeType: z.enum(['ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED']),
  importance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  explanation: z.string(),
}));

export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
});

export const QuestionSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(1000, 'Question too long'),
  documentText: z.string().optional(),
  file: z.any().optional(),
}).refine(data => data.documentText || data.file, {
  message: 'Either documentText or file must be provided',
});