import { NextRequest, NextResponse } from 'next/server';
import { DocumentParser } from '@/lib/parsers/document-parser';
import { getAIManager } from '@/lib/ai/ai-manager';
import { ComparisonResultSchema } from '@/lib/schemas/validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileA = formData.get('fileA') as File;
    const fileB = formData.get('fileB') as File;

    if (!fileA || !fileB) {
      return NextResponse.json(
        { error: 'Both files are required for comparison' },
        { status: 400 }
      );
    }

    // Validate both files
    const validationA = DocumentParser.validateFile(fileA);
    const validationB = DocumentParser.validateFile(fileB);

    if (!validationA.valid) {
      return NextResponse.json(
        { error: `File A: ${validationA.error}` },
        { status: 400 }
      );
    }

    if (!validationB.valid) {
      return NextResponse.json(
        { error: `File B: ${validationB.error}` },
        { status: 400 }
      );
    }

    // Parse both documents
    const [parseResultA, parseResultB] = await Promise.all([
      DocumentParser.parseFile(fileA),
      DocumentParser.parseFile(fileB),
    ]);

    // Check document sizes
    if (parseResultA.text.length > 100000 || parseResultB.text.length > 100000) {
      return NextResponse.json(
        { error: 'One or both documents exceed processing limit (100,000 characters)' },
        { status: 400 }
      );
    }

    // Compare with AI
    const aiManager = getAIManager();
    const comparison = await aiManager.compareDocuments(
      parseResultA.text,
      parseResultB.text
    );

    // Validate response
    const validatedComparison = ComparisonResultSchema.parse(comparison);

    return NextResponse.json({
      comparison: validatedComparison,
      metadata: {
        documentA: parseResultA.metadata,
        documentB: parseResultB.metadata,
      },
    });
  } catch (error) {
    console.error('Document comparison failed:', error);
    
    return NextResponse.json(
      { error: 'We couldn\'t compare these documents right now. Please try again.' },
      { status: 500 }
    );
  }
}