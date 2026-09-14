'use client';

import { Navigation } from '@/components/ui/navigation';
import { Settings, Info, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Settings & About
          </h1>
          <p className="text-slate-600">
            Application information and legal disclaimers.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Info className="h-6 w-6 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">About LexiGuard</h2>
                <p className="text-slate-700 mb-4">
                  LexiGuard is an AI-powered legal document navigator designed to help users understand legal documents by providing plain-English summaries, identifying key clauses, obligations, deadlines, and potential risks.
                </p>
                <p className="text-slate-700">
                  It uses advanced AI models to analyze documents and answer questions, but it is not a substitute for professional legal advice.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Legal Disclaimer</h2>
                <div className="space-y-3 text-slate-700">
                  <p>
                    <strong>LexiGuard provides AI-assisted legal information and document understanding.</strong> It does not provide legal advice, establish an attorney-client relationship, or replace a qualified legal professional.
                  </p>
                  <p>
                    The analysis, summaries, risk assessments, and recommendations provided by LexiGuard are for informational purposes only and should not be relied upon as definitive legal conclusions.
                  </p>
                  <p>
                    Legal documents often contain jurisdiction-specific provisions, complex terms, and implications that may not be fully captured by AI analysis. For high-risk matters, jurisdiction-specific issues, or legally binding interpretations, you should consult with a qualified legal professional.
                  </p>
                  <p>
                    LexiGuard and its developers are not responsible for any decisions made based on the information provided by this application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Settings className="h-6 w-6 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Privacy & Data</h2>
                <div className="space-y-3 text-slate-700">
                  <p>
                    <strong>Data Processing:</strong> Documents are processed server-side to extract text and perform AI analysis. Documents are not permanently stored unless you explicitly save them.
                  </p>
                  <p>
                    <strong>AI Providers:</strong> LexiGuard uses Groq as the primary AI provider, with Hugging Face as a fallback. Your document text is sent to these providers for analysis according to their respective privacy policies.
                  </p>
                  <p>
                    <strong>Sensitive Information:</strong> Avoid uploading documents containing unnecessary sensitive personal information, confidential business data, or trade secrets.
                  </p>
                  <p>
                    <strong>No Legal Privilege:</strong> Communications with LexiGuard do not establish attorney-client privilege or legal confidentiality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Supported Features</h2>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Document analysis with plain-English summaries</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Key clause identification and explanation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Obligation and deadline extraction</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Risk assessment with severity classification</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Document-grounded Q&A with evidence</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Document comparison</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Action checklist generation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Lawyer preparation materials</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Supported File Formats</h2>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>PDF (.pdf)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Microsoft Word (.docx)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Plain Text (.txt)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400 mt-1">•</span>
                <span>Markdown (.md)</span>
              </li>
            </ul>
            <p className="text-sm text-slate-500 mt-4">
              Maximum file size: 10MB
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}