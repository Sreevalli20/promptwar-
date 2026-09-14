export interface AIProvider {
  analyzeDocument(documentText: string): Promise<DocumentAnalysis>;
  askQuestion(documentText: string, question: string): Promise<QAResponse>;
  compareDocuments(documentAText: string, documentBText: string): Promise<ComparisonResult[]>;
}

export interface DocumentAnalysis {
  summary: string;
  parties: string[];
  purpose: string;
  keyClauses: Clause[];
  obligations: Obligation[];
  deadlines: Deadline[];
  termination: string;
  risks: Risk[];
  missingInformation: string[];
  questionsForLawyer: string[];
  actionChecklist: ActionItem[];
  disclaimer: string;
}

export interface Clause {
  title: string;
  summary: string;
  whyItMatters: string;
  source?: string;
}

export interface Obligation {
  party: string;
  obligation: string;
  details: string;
}

export interface Deadline {
  type: string;
  date: string;
  description: string;
}

export interface Risk {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  whyItMatters: string;
  source?: string;
  recommendedAction: string;
}

export interface ActionItem {
  item: string;
  completed: boolean;
}

export interface QAResponse {
  answer: string;
  supportingEvidence: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  disclaimer: string;
}

export interface ComparisonResult {
  category: string;
  documentA: string;
  documentB: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}