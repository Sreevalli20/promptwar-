'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { DocumentUpload } from '@/components/ui/document-upload';
import { Scale, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { ComparisonResult } from '@/lib/ai/provider';

export default function ComparePage() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!fileA || !fileB) return;

    setIsComparing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('fileA', fileA);
      formData.append('fileB', fileB);

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Comparison failed');
      }

      const data = await response.json();
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Compare Documents
          </h1>
          <p className="text-slate-600">
            Upload two documents to identify meaningful differences in their terms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Document A</h2>
            <DocumentUpload
              onUpload={setFileA}
              disabled={isComparing}
            />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Document B</h2>
            <DocumentUpload
              onUpload={setFileB}
              disabled={isComparing}
            />
          </div>
        </div>

        {fileA && fileB && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={handleCompare}
              disabled={isComparing}
              className="px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isComparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  <span>Compare Documents</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {comparison && comparison.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Comparison Results</h2>
            
            <div className="space-y-4">
              {comparison.map((item, index: number) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{item.category}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        item.changeType === 'ADDED' ? 'bg-green-100 text-green-800' :
                        item.changeType === 'REMOVED' ? 'bg-red-100 text-red-800' :
                        item.changeType === 'MODIFIED' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {item.changeType}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        item.importance === 'HIGH' ? 'bg-red-100 text-red-800' :
                        item.importance === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.importance}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">Document A</h4>
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{item.documentA}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-1">Document B</h4>
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{item.documentB}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600">{item.explanation}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Legal Disclaimer:</strong> This comparison is based on AI analysis of the provided documents. For legally binding interpretations, consult a qualified legal professional.
              </p>
            </div>
          </div>
        )}

        {comparison && comparison.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-center">
              <Scale className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Significant Differences Found</h3>
              <p className="text-slate-600">
                The documents appear to be materially identical based on the analysis.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}