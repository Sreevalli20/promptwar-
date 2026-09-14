# LexiGuard — AI Legal Document Navigator

**Tagline:** Understand your legal documents. Spot what matters. Prepare your next step.

## Challenge & Problem Context

**Challenge:** AI for Legal Assistance & Access (Hack2Skill PromptWars: Virtual Edition)

**Problem:** Legal information is dense, complex, and intimidating. Users need generative AI tools to understand documents, spot risks/obligations/deadlines, ask questions, compare versions, and prepare for legal consults without treating the AI as an actual law firm or lawyer.

**Solution:** LexiGuard is an AI-powered legal document navigator that provides plain-English summaries, identifies key clauses, extracts obligations and deadlines, performs risk analysis, enables document-grounded Q&A, compares documents, and generates action checklists to help users prepare for professional legal consultations.

## Features

- **Document Analysis:** Plain-English executive summaries, party identification, purpose extraction
- **Clause Explorer:** Structured display of key contractual provisions with explanations
- **Obligation Tracking:** Clear identification of what each party must do
- **Deadline Extraction:** Dates, notice periods, payment terms, renewal schedules
- **Risk Scanner:** Severity-classified potential concerns (HIGH/MEDIUM/LOW/INFO)
- **Document Q&A:** Ask questions about your document with supporting evidence
- **Document Comparison:** Side-by-side analysis of two documents to identify differences
- **Action Checklist:** Concrete next steps based on document analysis
- **Lawyer Preparation:** Generated questions and topics for legal consultations
- **Privacy-Focused:** No unnecessary document storage, server-side secret management

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  (Next.js 14/15 App Router + TypeScript + Tailwind CSS)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes / Server Actions                    │
│  - /api/analyze    - Document analysis endpoint                 │
│  - /api/ask        - Document Q&A endpoint                      │
│  - /api/compare    - Document comparison endpoint                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Provider Abstraction                     │
│  - AIManager class with fallback logic                          │
│  - Structured response validation with Zod                      │
│  - Prompt injection defense                                      │
└────────┬──────────────────────────────────────┬─────────────────┘
         │                                      │
         ▼                                      ▼
┌──────────────────────┐           ┌──────────────────────────────┐
│   Groq (Primary)     │           │  Hugging Face (Fallback)     │
│   - llama-3.3-70b    │           │  - Llama-3.3-70B-Instruct     │
│   - Fast inference   │           │  - Secondary provider         │
│   - Rate limit       │           │  - Provider error handling     │
│   handling           │           │                              │
└──────────────────────┘           └──────────────────────────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  Document Parser   │
              │  - PDF (pdfjs-dist)│
              │  - DOCX (mammoth)  │
              │  - TXT/MD (native) │
              └─────────────────────┘
```

## GenAI Mapping

### Groq (Primary AI Provider)
- **Document Summarization:** Executive summaries and plain-English explanations
- **Clause Extraction:** Identification and explanation of key contractual provisions
- **Risk Analysis:** Severity classification and explanation of potential concerns
- **Obligation Extraction:** Party-specific obligations and responsibilities
- **Deadline Extraction:** Time-sensitive terms and dates
- **Document Q&A:** Document-grounded question answering with evidence
- **Document Comparison:** Side-by-side analysis of document differences
- **Action Checklist Operations:** Generation of actionable next steps
- **Lawyer Preparation:** Generation of questions for legal consultations

### Hugging Face (Secondary/Fallback Provider)
- **Secondary Inference:** Fallback provider for supported operations when Groq is temporarily unavailable
- **Controlled Fallback:** Activated only after Groq retry attempts fail
- **Error Handling:** Graceful degradation when primary provider has issues

## Security

- **Server-Side Secret Management:** API keys accessed only in server-side code (Next.js API routes)
- **No Client-Side Secrets:** No `NEXT_PUBLIC_` prefixes for sensitive environment variables
- **Input Validation:** File type, size, and content validation with Zod schemas
- **Prompt Injection Defense:** Detection and blocking of prompt injection attempts
- **Output Validation:** Structured AI responses validated against Zod schemas
- **Safe Error Handling:** No stack traces or internal errors exposed to users
- **No Secret Logging:** API keys and sensitive data never logged
- **Request Size Limits:** File size (10MB) and document text (100,000 characters) limits
- **Timeout Handling:** Configurable timeouts for AI API calls
- **Provider Failure Handling:** Controlled retry with exponential backoff and fallback

## Efficiency

- **Bounded Context:** Document text limited to 100,000 characters for processing
- **Chunking Strategy:** Large documents processed in manageable chunks
- **Minimal AI Requests:** Single analysis request per document, context reused for Q&A
- **Controlled Fallback:** No automatic retries, limited to recoverable errors
- **No Duplicate Requests:** Analysis results cached for document session
- **Optimized Assets:** Minimal dependencies, no unnecessary packages
- **Lazy Loading:** Components and routes loaded on demand
- **Serverless Compatible:** No local file dependencies, suitable for Vercel deployment

## Testing

- **Validation Tests:** Zod schema validation for all AI responses
- **Input Validation:** File type, size, and content validation
- **Security Tests:** Prompt injection detection and blocking
- **Error Handling:** Graceful error handling and user-friendly messages
- **Schema Validation:** Runtime validation of AI response structures
- **Manual Testing:** Complete user flow testing with real documents

## Accessibility

- **Semantic HTML:** Proper heading hierarchy and landmark elements
- **ARIA Labels:** Screen reader-friendly controls and navigation
- **Keyboard Navigation:** Full keyboard accessibility throughout the interface
- **Focus Management:** Visible focus states and logical tab order
- **Color Contrast:** WCAG-compliant color ratios (especially for risk badges)
- **Non-Color Status Indicators:** Risk severity communicated via text labels, not just color
- **Responsive Design:** Mobile, tablet, and desktop layouts
- **Error Accessibility:** Accessible form errors and notifications
- **Loading States:** Screen-reader-friendly loading indicators
- **Reduced Motion:** No distracting animations or excessive motion

## Deployment

### Vercel Deployment
1. Push code to GitHub repository
2. Import repository in Vercel
3. Configure environment variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `HF_TOKEN`: Your Hugging Face token (optional, for fallback)
   - `GROQ_MODEL`: Model name (default: `llama-3.3-70b-versatile`)
   - `AI_PRIMARY_PROVIDER`: Primary provider (default: `groq`)
   - `AI_FALLBACK_PROVIDER`: Fallback provider (default: `huggingface`)
4. Deploy

### Local Development
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your API keys to .env
# GROQ_API_KEY=your_groq_api_key
# HF_TOKEN=your_hugging_face_token

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env` file with the following variables:

```env
GROQ_API_KEY=your_groq_api_key_here
HF_TOKEN=your_hugging_face_token_here
GROQ_MODEL=llama-3.3-70b-versatile
AI_PRIMARY_PROVIDER=groq
AI_FALLBACK_PROVIDER=huggingface
```

**Important:** Never commit actual API keys or secrets to the repository. Use `.env.example` as a template.

## Legal Disclaimer

**LexiGuard provides AI-assisted legal information and document understanding. It does not provide legal advice, establish an attorney-client relationship, or replace a qualified legal professional.**

The analysis, summaries, risk assessments, and recommendations provided by LexiGuard are for informational purposes only and should not be relied upon as definitive legal conclusions. Legal documents often contain jurisdiction-specific provisions, complex terms, and implications that may not be fully captured by AI analysis.

For high-risk matters, jurisdiction-specific issues, or legally binding interpretations, you should consult with a qualified legal professional. LexiGuard and its developers are not responsible for any decisions made based on the information provided by this application.

## Limitations

- **AI Limitations:** AI may misinterpret complex legal language or miss jurisdiction-specific nuances
- **Provider Limits:** Groq and Hugging Face have rate limits and availability constraints
- **Document Extraction:** PDF parsing may not preserve perfect formatting or complex layouts
- **Legal Jurisdiction:** Not optimized for specific legal jurisdictions or local laws
- **Document Size:** Limited to 10MB files and 100,000 characters of text
- **Language:** Optimized for English-language documents
- **No Legal Advice:** Does not provide legally binding interpretations or advice

## Supported File Formats

- **PDF (.pdf)** - Using pdfjs-dist
- **Microsoft Word (.docx)** - Using mammoth
- **Plain Text (.txt)** - Native support
- **Markdown (.md)** - Native support

**Maximum file size:** 10MB

## Repository Structure

```
promptwar-/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # Document analysis endpoint
│   │   ├── ask/route.ts          # Q&A endpoint
│   │   └── compare/route.ts      # Document comparison endpoint
│   ├── ask/page.tsx              # Q&A interface
│   ├── compare/page.tsx          # Document comparison interface
│   ├── documents/page.tsx        # Document analysis interface
│   ├── page.tsx                  # Dashboard/landing page
│   ├── prep/page.tsx             # Action checklist interface
│   ├── risk-review/page.tsx      # Risk scanner interface
│   └── settings/page.tsx         # Settings and about page
├── components/
│   └── ui/
│       ├── document-upload.tsx   # File upload component
│       ├── navigation.tsx        # Main navigation
│       └── risk-badge.tsx        # Risk severity badge
├── lib/
│   ├── ai/
│   │   ├── ai-manager.ts         # AI provider manager with fallback
│   │   ├── groq-provider.ts      # Groq API implementation
│   │   ├── huggingface-provider.ts # Hugging Face API implementation
│   │   └── provider.ts           # AI provider interface
│   ├── parsers/
│   │   └── document-parser.ts    # Document parsing utilities
│   ├── schemas/
│   │   └── validation.ts         # Zod validation schemas
│   └── utils.ts                  # Utility functions
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies and scripts
├── README.md                     # This file
└── tsconfig.json                 # TypeScript configuration
```

## Tech Stack

- **Framework:** Next.js 14/15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Provider:** Groq (primary), Hugging Face (fallback)
- **Document Parsing:** pdfjs-dist, mammoth
- **Validation:** Zod
- **Icons:** Lucide React
- **Deployment:** Vercel

## Future Enhancements

- User authentication and document history
- Advanced document comparison with diff visualization
- Support for additional file formats
- Integration with legal databases
- Multi-language support
- Collaborative document review features
- Export analysis results to various formats

## License

This project is submitted for the Hack2Skill PromptWars: Virtual (Exclusive Edition) competition.

## Contact

For questions about this project or the competition, please refer to the Hack2Skill challenge guidelines.