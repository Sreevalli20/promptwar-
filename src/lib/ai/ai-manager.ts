import { AIProvider, DocumentAnalysis, QAResponse, ComparisonResult } from './provider';
import { GroqProvider } from './groq-provider';
import { HuggingFaceProvider } from './huggingface-provider';

export class AIManager implements AIProvider {
  private primaryProvider: AIProvider;
  private fallbackProvider: AIProvider | null = null;
  private maxRetries = 2;

  constructor() {
    const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'groq';
    const fallbackProvider = process.env.AI_FALLBACK_PROVIDER || 'huggingface';

    this.primaryProvider = this.createProvider(primaryProvider);
    
    if (fallbackProvider && fallbackProvider !== primaryProvider) {
      try {
        this.fallbackProvider = this.createProvider(fallbackProvider);
      } catch (error) {
        console.warn(`Failed to initialize fallback provider ${fallbackProvider}:`, error);
      }
    }
  }

  private createProvider(providerName: string): AIProvider {
    switch (providerName.toLowerCase()) {
      case 'groq':
        return new GroqProvider();
      case 'huggingface':
        return new HuggingFaceProvider();
      default:
        console.warn(`Unknown provider ${providerName}, defaulting to Groq`);
        return new GroqProvider();
    }
  }

  async analyzeDocument(documentText: string): Promise<DocumentAnalysis> {
    return this.withFallback(
      () => this.primaryProvider.analyzeDocument(documentText),
      this.fallbackProvider ? () => this.fallbackProvider!.analyzeDocument(documentText) : undefined
    );
  }

  async askQuestion(documentText: string, question: string): Promise<QAResponse> {
    return this.withFallback(
      () => this.primaryProvider.askQuestion(documentText, question),
      this.fallbackProvider ? () => this.fallbackProvider!.askQuestion(documentText, question) : undefined
    );
  }

  async compareDocuments(
    documentAText: string,
    documentBText: string
  ): Promise<ComparisonResult[]> {
    return this.withFallback(
      () => this.primaryProvider.compareDocuments(documentAText, documentBText),
      this.fallbackProvider ? () => this.fallbackProvider!.compareDocuments(documentAText, documentBText) : undefined
    );
  }

  private async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await primaryOperation();
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        lastError = errorObj;
        // Don't log full error details to avoid exposing sensitive information
        const errorMessage = errorObj.message;
        console.error(`AI operation attempt ${attempt + 1} failed: ${errorMessage}`);

        // Check if this is a permanent error that should immediately trigger fallback
        if (this.isPermanentError(errorObj) && fallbackOperation) {
          console.log('Permanent error detected, immediately switching to fallback provider...');
          try {
            return await fallbackOperation();
          } catch (fallbackError) {
            const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
            console.error(`Fallback provider also failed: ${fallbackErrorMessage}`);
            lastError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
            break;
          }
        }

        // Check if this is a recoverable error that warrants retry
        if (this.isRecoverableError(errorObj) && attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(delay);
          continue;
        }

        // If we have a fallback provider and this is the last retry, try it
        if (fallbackOperation && attempt === this.maxRetries) {
          console.log('Attempting fallback provider...');
          try {
            return await fallbackOperation();
          } catch (fallbackError) {
            const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
            console.error(`Fallback provider also failed: ${fallbackErrorMessage}`);
            lastError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
          }
        }
      }
    }

    throw new Error(
      `AI operation failed after ${this.maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }


  private isPermanentError(error: Error): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const permanentPatterns = [
      '404',
      'model_not_found',
      'model does not exist',
      '401',
      '403',
      'authentication',
      'authorization',
    ];
    
    return permanentPatterns.some(pattern => errorMessage.includes(pattern));
  }

  private isRecoverableError(error: Error): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const recoverablePatterns = [
      'rate limit',
      'timeout',
      'temporary',
      '503',
      '502',
      '504',
      '500',
      'econnreset',
      'etimedout',
      'request timeout',
    ];
    
    return recoverablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let aiManagerInstance: AIManager | null = null;

export function getAIManager(): AIManager {
  if (!aiManagerInstance) {
    aiManagerInstance = new AIManager();
  }
  return aiManagerInstance;
}