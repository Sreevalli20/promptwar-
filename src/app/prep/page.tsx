'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { DocumentUpload } from '@/components/ui/document-upload';
import { CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { DocumentAnalysis } from '@/lib/ai/provider';

export default function PrepPage() {
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

  const toggleChecklistItem = (index: number) => {
    if (!analysis) return;
    const updatedChecklist = [...analysis.actionChecklist];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    setAnalysis({ ...analysis, actionChecklist: updatedChecklist });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Action & Preparation
          </h1>
          <p className="text-slate-600">
            Review your action checklist and prepare questions for your legal consultation.
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
                    Preparing Analysis
                  </h2>
                  <p className="text-slate-600">Generating action items and preparation materials...</p>
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
                      <CheckSquare className="h-8 w-8 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                        <p className="text-sm text-slate-500">Action checklist ready</p>
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

                {analysis?.actionChecklist && analysis.actionChecklist.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Action Checklist</h2>
                    <p className="text-sm text-slate-600 mb-4">
                      Complete these items based on your document analysis:
                    </p>
                    <ul className="space-y-3">
                      {analysis.actionChecklist.map((item, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={`checklist-${index}`}
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(index)}
                            className="mt-1 h-4 w-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                          />
                          <label
                            htmlFor={`checklist-${index}`}
                            className={`text-sm cursor-pointer ${
                              item.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                            }`}
                          >
                            {item.item}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis?.questionsForLawyer && analysis.questionsForLawyer.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Questions for Your Lawyer</h2>
                    <p className="text-sm text-slate-600 mb-4">
                      Take these questions to your legal consultation:
                    </p>
                    <ul className="space-y-3">
                      {analysis.questionsForLawyer.map((question: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="text-slate-400 mt-1">•</span>
                          <span className="text-sm text-slate-700">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis?.missingInformation && analysis.missingInformation.length > 0 && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Missing Information</h2>
                    <p className="text-sm text-slate-600 mb-4">
                      The following information could not be determined from the document:
                    </p>
                    <ul className="space-y-2">
                      {analysis.missingInformation.map((info: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{info}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Legal Disclaimer:</strong> This action checklist and preparation materials are based on AI analysis of the provided document. They are not legal advice. For legally binding guidance, consult a qualified legal professional.
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