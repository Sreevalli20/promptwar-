'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { DocumentUpload } from '@/components/ui/document-upload';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { DocumentAnalysis } from '@/lib/ai/provider';

export default function DocumentsPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    setError(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Documents
          </h1>
          <p className="text-slate-600">
            Upload and analyze legal documents to understand their key provisions.
          </p>
        </div>

        {!uploadedFile ? (
          <div className="mb-8">
            <DocumentUpload onUpload={handleUpload} />
          </div>
        ) : (
          <div className="space-y-6">
            {isAnalyzing ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Analyzing Document
                  </h2>
                  <p className="text-slate-600">Extracting key clauses and provisions...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Analysis Failed</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setError(null);
                        setAnalysis(null);
                      }}
                      className="text-sm font-medium text-red-700 hover:text-red-800"
                    >
                      Try with a different document
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                        <p className="text-sm text-slate-500">Document analyzed</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setAnalysis(null);
                      }}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {analysis?.keyClauses && analysis.keyClauses.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Key Clauses</h2>
                    <div className="space-y-4">
                      {analysis.keyClauses.map((clause, index: number) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">{clause.title}</h3>
                          <p className="text-sm text-slate-700 mb-2">{clause.summary}</p>
                          <p className="text-sm text-slate-600 mb-2">{clause.whyItMatters}</p>
                          {clause.source && (
                            <p className="text-xs text-slate-500">Source: {clause.source}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis?.obligations && analysis.obligations.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Obligations</h2>
                    <div className="space-y-3">
                      {analysis.obligations.map((obligation, index: number) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900">{obligation.party}</h3>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{obligation.obligation}</p>
                          <p className="text-sm text-slate-600">{obligation.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis?.deadlines && analysis.deadlines.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Deadlines</h2>
                    <div className="space-y-3">
                      {analysis.deadlines.map((deadline, index: number) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900">{deadline.type}</h3>
                            <span className="text-sm font-medium text-slate-600">{deadline.date}</span>
                          </div>
                          <p className="text-sm text-slate-600">{deadline.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis?.termination && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Termination</h2>
                    <p className="text-slate-700">{analysis.termination}</p>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Legal Disclaimer:</strong> This document analysis is provided for informational purposes only and does not constitute legal advice. For legally binding interpretations, consult a qualified legal professional.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}