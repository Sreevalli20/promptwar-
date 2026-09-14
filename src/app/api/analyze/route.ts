import { NextRequest, NextResponse } from 'next/server';
import { DocumentParser } from '@/lib/parsers/document-parser';
import { getAIManager } from '@/lib/ai/ai-manager';
import { DocumentAnalysisSchema } from '@/lib/schemas/validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = DocumentParser.validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Parse document
    const parseResult = await DocumentParser.parseFile(file);

    // Check if document text is too large
    if (parseResult.text.length > 100000) {
      return NextResponse.json(
        { error: 'Document text exceeds processing limit (100,000 characters)' },
        { status: 400 }
      );
    }

    // Analyze with AI
    const aiManager = getAIManager();
    const analysis = await aiManager.analyzeDocument(parseResult.text);

    // Validate response
    const validatedAnalysis = DocumentAnalysisSchema.parse(analysis);

    return NextResponse.json({
      analysis: validatedAnalysis,
      metadata: parseResult.metadata,
    });
  } catch (error) {
    console.error('Document analysis failed:', error);
    
    // Don't expose internal errors to client
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    
    return NextResponse.json(
      { error: 'We couldn\'t analyze this document right now. Please try again.' },
      { status: 500 }
    );
  }
}