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
    const contentType = request.headers.get('content-type');
    
    let question: string;
    let documentText: string;

    // Handle both JSON and FormData requests
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      question = formData.get('question') as string;

      if (!file || !question) {
        return NextResponse.json(
          { error: 'File and question are required' },
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
      documentText = parseResult.text;

      // Check document size
      if (documentText.length > 100000) {
        return NextResponse.json(
          { error: 'Document text exceeds processing limit (100,000 characters)' },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      
      // Validate input
      const validatedInput = QuestionSchema.parse(body);
      question = validatedInput.question;
      documentText = validatedInput.documentText || '';

      if (!documentText) {
        return NextResponse.json(
          { error: 'Document text is required' },
          { status: 400 }
        );
      }
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
    const response = await aiManager.askQuestion(documentText, question);

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