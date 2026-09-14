import { NextRequest, NextResponse } from 'next/server';
import { getAIManager } from '@/lib/ai/ai-manager';
import { DocumentParser } from '@/lib/parsers/document-parser';
import { QAResponseSchema, QuestionSchema } from '@/lib/schemas/validation';

function containsPromptInjection(text: string): boolean {
  const injectionPatterns = [
    /ignore previous instructions/i,
    /ignore all instructions/i,
    /reveal your system prompt/i,
    /show your instructions/i,
    /print your prompt/i,
    /override your instructions/i,
    /new instructions:/i,
    /system prompt:/i,
  ];
  
  return injectionPatterns.some(pattern => pattern.test(text));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedInput = QuestionSchema.parse(body);
    
    const { question, documentText, file } = validatedInput as any;

    let actualDocumentText = documentText;

    // If file is provided, parse it to get the text
    if (file && !documentText) {
      const parseResult = await DocumentParser.parseFile(file);
      actualDocumentText = parseResult.text;
    }

    if (!actualDocumentText) {
      return NextResponse.json(
        { error: 'Document text or file is required' },
        { status: 400 }
      );
    }

    // Check for prompt injection attempts
    if (containsPromptInjection(question)) {
      return NextResponse.json(
        { error: 'Invalid question format' },
        { status: 400 }
      );
    }

    // Ask AI
    const aiManager = getAIManager();
    const response = await aiManager.askQuestion(actualDocumentText, question);

    // Validate response
    const validatedResponse = QAResponseSchema.parse(response);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Question answering failed:', error);
    
    return NextResponse.json(
      { error: 'We couldn\'t answer this question right now. Please try again.' },
      { status: 500 }
    );
  }
}