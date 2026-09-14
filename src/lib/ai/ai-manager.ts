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
    return this.withFallback(() => this.primaryProvider.analyzeDocument(documentText));
  }

  async askQuestion(documentText: string, question: string): Promise<QAResponse> {
    return this.withFallback(() => this.primaryProvider.askQuestion(documentText, question));
  }

  async compareDocuments(
    documentAText: string,
    documentBText: string
  ): Promise<ComparisonResult[]> {
    return this.withFallback(() => 
      this.primaryProvider.compareDocuments(documentAText, documentBText)
    );
  }

  private async withFallback<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`AI operation attempt ${attempt + 1} failed:`, error);

        // Check if this is a recoverable error that warrants retry
        if (this.isRecoverableError(error) && attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(delay);
          continue;
        }

        // If we have a fallback provider and this is the last retry, try it
        if (this.fallbackProvider && attempt === this.maxRetries) {
          console.log('Attempting fallback provider...');
          try {
            return await operation.call(this.fallbackProvider);
          } catch (fallbackError) {
            console.error('Fallback provider also failed:', fallbackError);
            lastError = fallbackError as Error;
          }
        }
      }
    }

    throw new Error(
      `AI operation failed after ${this.maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  private isRecoverableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const recoverablePatterns = [
      'rate limit',
      'timeout',
      'temporary',
      '503',
      '502',
      '504',
      'econnreset',
      'etimedout',
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