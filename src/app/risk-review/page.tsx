'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { DocumentUpload } from '@/components/ui/document-upload';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';

export default function RiskReviewPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'>('ALL');

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

  const filteredRisks = analysis?.risks?.filter((risk: any) => 
    severityFilter === 'ALL' || risk.severity === severityFilter
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Risk Review
          </h1>
          <p className="text-slate-600">
            Identify and understand potential concerns in your legal documents.
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
                    Scanning for Risks
                  </h2>
                  <p className="text-slate-600">Analyzing document for potential concerns...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
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
                      <Shield className="h-8 w-8 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                        <p className="text-sm text-slate-500">
                          {filteredRisks.length} risk{filteredRisks.length !== 1 ? 's' : ''} identified
                        </p>
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

                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Filter by Severity</h3>
                  <div className="flex flex-wrap gap-2">
                    {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((severity) => (
                      <button
                        key={severity}
                        onClick={() => setSeverityFilter(severity as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          severityFilter === severity
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {severity}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRisks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRisks.map((risk: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-slate-900">{risk.title}</h3>
                          <RiskBadge severity={risk.severity} />
                        </div>
                        
                        <p className="text-slate-700 mb-3">{risk.description}</p>
                        <p className="text-slate-600 mb-3">{risk.whyItMatters}</p>
                        <p className="text-slate-600 mb-3">{risk.recommendedAction}</p>
                        
                        {risk.source && (
                          <p className="text-sm text-slate-500">Source: {risk.source}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 p-8">
                    <div className="text-center">
                      <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No Risks Found
                      </h3>
                      <p className="text-slate-600">
                        No potential concerns were identified from the available document content.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Legal Disclaimer:</strong> This risk analysis is based on AI analysis of the provided document. Potential concerns identified here are not definitive legal conclusions. For high-risk or jurisdiction-specific matters, consult a qualified legal professional.
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