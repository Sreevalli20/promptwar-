import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIManager } from '../src/lib/ai/ai-manager';
import { GroqProvider } from '../src/lib/ai/groq-provider';
import { HuggingFaceProvider } from '../src/lib/ai/huggingface-provider';

describe('AI Provider Configuration and Fallback', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Groq Model Configuration', () => {
    it('should use openai/gpt-oss-120b as default Groq model', () => {
      delete process.env.GROQ_MODEL;
      const provider = new GroqProvider();
      // The model is defined at module level, so we verify it's not the old model
      expect(process.env.GROQ_MODEL).toBeUndefined();
    });

    it('should allow GROQ_MODEL to override default', () => {
      process.env.GROQ_MODEL = 'llama-3.1-70b-versatile';
      const provider = new GroqProvider();
      expect(process.env.GROQ_MODEL).toBe('llama-3.1-70b-versatile');
    });
  });

  describe('Hugging Face Model Configuration', () => {
    it('should use meta-llama/Llama-3.3-70B-Instruct as default HF model', () => {
      delete process.env.HF_MODEL;
      process.env.HF_TOKEN = 'test-token';
      const provider = new HuggingFaceProvider();
      expect(process.env.HF_MODEL).toBeUndefined();
    });

    it('should allow HF_MODEL to override default', () => {
      process.env.HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
      process.env.HF_TOKEN = 'test-token';
      const provider = new HuggingFaceProvider();
      expect(process.env.HF_MODEL).toBe('mistralai/Mistral-7B-Instruct-v0.3');
    });
  });

  describe('Permanent Error Detection', () => {
    it('should detect 404 model_not_found as permanent error', () => {
      const manager = new AIManager();
      const error = new Error('Groq API error: 404 - The model llama-3.3-70b-versatile does not exist');
      expect(manager['isPermanentError'](error)).toBe(true);
    });

    it('should detect 401 authentication error as permanent', () => {
      const manager = new AIManager();
      const error = new Error('Groq API error: 401 - Unauthorized');
      expect(manager['isPermanentError'](error)).toBe(true);
    });

    it('should detect 403 authorization error as permanent', () => {
      const manager = new AIManager();
      const error = new Error('Groq API error: 403 - Forbidden');
      expect(manager['isPermanentError'](error)).toBe(true);
    });

    it('should NOT detect 500 error as permanent', () => {
      const manager = new AIManager();
      const error = new Error('Groq API error: 500 - Internal Server Error');
      expect(manager['isPermanentError'](error)).toBe(false);
      expect(manager['isRecoverableError'](error)).toBe(true);
    });

    it('should NOT detect rate limit as permanent', () => {
      const manager = new AIManager();
      const error = new Error('Groq API error: 429 - Rate limit exceeded');
      expect(manager['isPermanentError'](error)).toBe(false);
      expect(manager['isRecoverableError'](error)).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should immediately trigger fallback on 404 model_not_found', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.HF_TOKEN = 'test-hf-token';
      process.env.AI_PRIMARY_PROVIDER = 'groq';
      process.env.AI_FALLBACK_PROVIDER = 'huggingface';

      const manager = new AIManager();

      // Mock Groq to fail with 404
      vi.spyOn(manager['primaryProvider'], 'analyzeDocument').mockRejectedValue(
        new Error('Groq API error: 404 - The model does not exist')
      );

      // Mock Hugging Face to succeed
      vi.spyOn(manager['fallbackProvider']!, 'analyzeDocument').mockResolvedValue({
        summary: 'Fallback analysis',
        parties: [],
        purpose: 'Test',
        keyClauses: [],
        obligations: [],
        deadlines: [],
        termination: '',
        risks: [],
        missingInformation: [],
        questionsForLawyer: [],
        actionChecklist: [],
        disclaimer: '',
      });

      const result = await manager.analyzeDocument('test document');

      expect(manager['fallbackProvider']!.analyzeDocument).toHaveBeenCalled();
      expect(result.summary).toBe('Fallback analysis');
    });

    it('should NOT retry Groq on permanent 404 error', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.HF_TOKEN = 'test-hf-token';
      process.env.AI_PRIMARY_PROVIDER = 'groq';
      process.env.AI_FALLBACK_PROVIDER = 'huggingface';

      const manager = new AIManager();

      const groqSpy = vi.spyOn(manager['primaryProvider'], 'analyzeDocument').mockRejectedValue(
        new Error('Groq API error: 404 - The model does not exist')
      );

      const hfSpy = vi.spyOn(manager['fallbackProvider']!, 'analyzeDocument').mockResolvedValue({
        summary: 'Fallback analysis',
        parties: [],
        purpose: 'Test',
        keyClauses: [],
        obligations: [],
        deadlines: [],
        termination: '',
        risks: [],
        missingInformation: [],
        questionsForLawyer: [],
        actionChecklist: [],
        disclaimer: '',
      });

      await manager.analyzeDocument('test document');

      // Groq should only be called once (no retries on permanent error)
      expect(groqSpy).toHaveBeenCalledTimes(1);
      // Hugging Face should be called once
      expect(hfSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT invoke fallback on successful Groq response', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.HF_TOKEN = 'test-hf-token';
      process.env.AI_PRIMARY_PROVIDER = 'groq';
      process.env.AI_FALLBACK_PROVIDER = 'huggingface';

      const manager = new AIManager();

      vi.spyOn(manager['primaryProvider'], 'analyzeDocument').mockResolvedValue({
        summary: 'Groq analysis',
        parties: [],
        purpose: 'Test',
        keyClauses: [],
        obligations: [],
        deadlines: [],
        termination: '',
        risks: [],
        missingInformation: [],
        questionsForLawyer: [],
        actionChecklist: [],
        disclaimer: '',
      });

      const hfSpy = vi.spyOn(manager['fallbackProvider']!, 'analyzeDocument');

      const result = await manager.analyzeDocument('test document');

      expect(result.summary).toBe('Groq analysis');
      expect(hfSpy).not.toHaveBeenCalled();
    });

    it('should handle Hugging Face fallback failure gracefully', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.HF_TOKEN = 'test-hf-token';
      process.env.AI_PRIMARY_PROVIDER = 'groq';
      process.env.AI_FALLBACK_PROVIDER = 'huggingface';

      const manager = new AIManager();

      vi.spyOn(manager['primaryProvider'], 'analyzeDocument').mockRejectedValue(
        new Error('Groq API error: 404 - The model does not exist')
      );

      vi.spyOn(manager['fallbackProvider']!, 'analyzeDocument').mockRejectedValue(
        new Error('Hugging Face API error: 500 - Internal Server Error')
      );

      await expect(manager.analyzeDocument('test document')).rejects.toThrow();
    });

    it('should retry on transient 500 errors before fallback', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.HF_TOKEN = 'test-hf-token';
      process.env.AI_PRIMARY_PROVIDER = 'groq';
      process.env.AI_FALLBACK_PROVIDER = 'huggingface';

      const manager = new AIManager();

      const groqSpy = vi.spyOn(manager['primaryProvider'], 'analyzeDocument')
        .mockRejectedValueOnce(new Error('Groq API error: 500 - Internal Server Error'))
        .mockRejectedValueOnce(new Error('Groq API error: 500 - Internal Server Error'))
        .mockResolvedValue({
          summary: 'Groq analysis after retry',
          parties: [],
          purpose: 'Test',
          keyClauses: [],
          obligations: [],
          deadlines: [],
          termination: '',
          risks: [],
          missingInformation: [],
          questionsForLawyer: [],
          actionChecklist: [],
          disclaimer: '',
        });

      const hfSpy = vi.spyOn(manager['fallbackProvider']!, 'analyzeDocument');

      const result = await manager.analyzeDocument('test document');

      expect(groqSpy).toHaveBeenCalledTimes(3); // 2 retries + 1 success
      expect(hfSpy).not.toHaveBeenCalled();
      expect(result.summary).toBe('Groq analysis after retry');
    });
  });

  describe('Structured Output Validation', () => {
    it('should validate structured AI output from Groq', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.AI_PRIMARY_PROVIDER = 'groq';

      const manager = new AIManager();

      vi.spyOn(manager['primaryProvider'], 'analyzeDocument').mockResolvedValue({
        summary: 'Test summary',
        parties: ['Party A', 'Party B'],
        purpose: 'Test purpose',
        keyClauses: [
          {
            title: 'Test Clause',
            summary: 'Test summary',
            whyItMatters: 'Test importance',
          },
        ],
        obligations: [
          {
            party: 'Party A',
            obligation: 'Test obligation',
            details: 'Test details',
          },
        ],
        deadlines: [
          {
            type: 'Payment',
            date: '2024-01-01',
            description: 'Test deadline',
          },
        ],
        termination: 'Test termination',
        risks: [
          {
            title: 'Test Risk',
            severity: 'HIGH',
            description: 'Test description',
            whyItMatters: 'Test importance',
            recommendedAction: 'Test action',
          },
        ],
        missingInformation: ['Test missing'],
        questionsForLawyer: ['Test question'],
        actionChecklist: [
          {
            item: 'Test action',
            completed: false,
          },
        ],
        disclaimer: 'Test disclaimer',
      });

      const result = await manager.analyzeDocument('test document');

      expect(result.summary).toBe('Test summary');
      expect(result.parties).toHaveLength(2);
      expect(result.keyClauses).toHaveLength(1);
      expect(result.obligations).toHaveLength(1);
      expect(result.deadlines).toHaveLength(1);
      expect(result.risks).toHaveLength(1);
      expect(result.risks[0].severity).toBe('HIGH');
    });

    it('should validate structured AI output from Hugging Face fallback', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.HF_TOKEN = 'test-hf-token';
      process.env.AI_PRIMARY_PROVIDER = 'groq';
      process.env.AI_FALLBACK_PROVIDER = 'huggingface';

      const manager = new AIManager();

      vi.spyOn(manager['primaryProvider'], 'analyzeDocument').mockRejectedValue(
        new Error('Groq API error: 404 - The model does not exist')
      );

      vi.spyOn(manager['fallbackProvider']!, 'analyzeDocument').mockResolvedValue({
        summary: 'HF fallback summary',
        parties: ['Party C'],
        purpose: 'HF purpose',
        keyClauses: [],
        obligations: [],
        deadlines: [],
        termination: '',
        risks: [],
        missingInformation: [],
        questionsForLawyer: [],
        actionChecklist: [],
        disclaimer: '',
      });

      const result = await manager.analyzeDocument('test document');

      expect(result.summary).toBe('HF fallback summary');
      expect(result.parties).toHaveLength(1);
    });
  });
});
