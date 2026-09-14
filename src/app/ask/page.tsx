'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { DocumentUpload } from '@/components/ui/document-upload';
import { MessageSquare, Send, AlertCircle, Loader2 } from 'lucide-react';

export default function AskPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    setError(null);
    
    // For now, we'll analyze the document to get the text
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse document');
      }

      const data = await response.json();
      // In a real implementation, we'd store the document text server-side
      // For now, we'll use a placeholder - the actual text would come from the analysis
      setDocumentText('Document uploaded and ready for questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !uploadedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          documentText, // In real implementation, this would be the actual document text
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const data = await response.json();
      setAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Ask Your Document
          </h1>
          <p className="text-slate-600">
            Upload a document and ask questions about its contents.
          </p>
        </div>

        {!uploadedFile ? (
          <div className="mb-8">
            <DocumentUpload onUpload={handleUpload} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                    <p className="text-sm text-slate-500">Document ready for questions</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setDocumentText('');
                    setAnswer(null);
                  }}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Question
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What happens if I terminate early?"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                />
                <button
                  onClick={handleAsk}
                  disabled={isLoading || !question.trim()}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Asking...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Ask</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {answer && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Answer</h3>
                <p className="text-slate-700 mb-4">{answer.answer}</p>
                
                {answer.supportingEvidence && answer.supportingEvidence.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Supporting Evidence</h4>
                    <ul className="space-y-2">
                      {answer.supportingEvidence.map((evidence: string, index: number) => (
                        <li key={index} className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                          {evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm font-medium text-slate-700">Confidence:</span>
                  <span className={`text-sm font-medium ${
                    answer.confidence === 'HIGH' ? 'text-green-600' :
                    answer.confidence === 'MEDIUM' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {answer.confidence}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">{answer.disclaimer}</p>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Legal Disclaimer:</strong> LexiGuard provides AI-assisted legal information and document understanding. It does not provide legal advice, establish an attorney-client relationship, or replace a qualified legal professional.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}