'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { DocumentUpload } from '@/components/ui/document-upload';
import { Scale, Upload, FileText, AlertCircle } from 'lucide-react';
import { DocumentAnalysis } from '@/lib/ai/provider';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    setError(null);
    
    // Automatically trigger analysis
    await analyzeDocument(file);
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!uploadedFile ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <Scale className="h-16 w-16 text-slate-700" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                LexiGuard
              </h1>
              <p className="text-xl text-slate-600 mb-2">
                Understand your legal documents clearly.
              </p>
              <p className="text-slate-500">
                Upload a document to identify important clauses, obligations, deadlines, risks, and questions.
              </p>
            </div>

            <DocumentUpload onUpload={handleUpload} />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <FileText className="h-8 w-8 text-slate-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">Document Analysis</h3>
                <p className="text-sm text-slate-600">
                  Get plain-English summaries and identify key clauses, obligations, and deadlines.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <AlertCircle className="h-8 w-8 text-slate-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">Risk Scanner</h3>
                <p className="text-sm text-slate-600">
                  Identify potential concerns and understand what matters in your documents.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <Upload className="h-8 w-8 text-slate-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Q&A</h3>
                <p className="text-sm text-slate-600">
                  Ask questions about your document and get answers with supporting evidence.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Legal Disclaimer:</strong> LexiGuard provides AI-assisted legal information and document understanding. It does not provide legal advice, establish an attorney-client relationship, or replace a qualified legal professional. For high-risk or jurisdiction-specific matters, consult a qualified legal professional.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {isAnalyzing ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Analyzing Document
                  </h2>
                  <p className="text-slate-600 mb-4">
                    Reading document...
                  </p>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>• Identifying key clauses</p>
                    <p>• Reviewing obligations</p>
                    <p>• Scanning for risks</p>
                    <p>• Preparing summary</p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      Analysis Failed
                    </h3>
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
            ) : analysis ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Document Analysis
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Summary</h3>
                      <p className="text-slate-700">{analysis.summary}</p>
                    </div>

                    {analysis.parties.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Parties</h3>
                        <ul className="list-disc list-inside text-slate-700">
                          {analysis.parties.map((party: string, index: number) => (
                            <li key={index}>{party}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Purpose</h3>
                      <p className="text-slate-700">{analysis.purpose}</p>
                    </div>

                    {analysis.keyClauses.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Key Clauses</h3>
                        <div className="space-y-4">
                          {analysis.keyClauses.map((clause, index: number) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <h4 className="font-medium text-slate-900 mb-2">{clause.title}</h4>
                              <p className="text-sm text-slate-700 mb-2">{clause.summary}</p>
                              <p className="text-sm text-slate-600">{clause.whyItMatters}</p>
                              {clause.source && (
                                <p className="text-xs text-slate-500 mt-2">Source: {clause.source}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.risks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Potential Concerns</h3>
                        <div className="space-y-4">
                          {analysis.risks.map((risk, index: number) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-slate-900">{risk.title}</h4>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  risk.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  risk.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                  risk.severity === 'LOW' ? 'bg-blue-100 text-blue-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}>
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 mb-2">{risk.description}</p>
                              <p className="text-sm text-slate-600 mb-2">{risk.whyItMatters}</p>
                              <p className="text-sm text-slate-600">{risk.recommendedAction}</p>
                              {risk.source && (
                                <p className="text-xs text-slate-500 mt-2">Source: {risk.source}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.actionChecklist.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Action Checklist</h3>
                        <ul className="space-y-2">
                          {analysis.actionChecklist.map((item, index: number) => (
                            <li key={index} className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-slate-600 border-slate-300 rounded"
                                checked={item.completed}
                                onChange={() => {
                                  const updatedChecklist = [...analysis.actionChecklist];
                                  updatedChecklist[index].completed = !updatedChecklist[index].completed;
                                  setAnalysis({ ...analysis, actionChecklist: updatedChecklist });
                                }}
                              />
                              <span className="text-sm text-slate-700">{item.item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.questionsForLawyer.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Questions for a Lawyer</h3>
                        <ul className="space-y-2">
                          {analysis.questionsForLawyer.map((question: string, index: number) => (
                            <li key={index} className="flex items-start space-x-3">
                              <span className="text-slate-400 mt-1">•</span>
                              <span className="text-sm text-slate-700">{question}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Disclaimer:</strong> {analysis.disclaimer}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setAnalysis(null);
                  }}
                  className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Upload Another Document
                </button>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}