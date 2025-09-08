import { TranscriptionProvider } from '../interfaces/TranscriptionProvider';
import { TextProcessor } from '../interfaces/TextProcessor';
import { OpenAIService } from '../services/OpenAIService';

/**
 * Service Provider Configuration
 * 
 * This configuration allows easy swapping of AI service providers.
 * To switch to a different provider (e.g., Google Cloud Speech-to-Text,
 * Azure Cognitive Services, or self-hosted models), simply:
 * 1. Create a new service class implementing the interfaces
 * 2. Update the provider instances below
 * 3. No changes needed in controllers or other business logic
 */

// Singleton instances
const openAIService = new OpenAIService();

// Current provider configuration
export const transcriptionProvider: TranscriptionProvider = openAIService;
export const textProcessor: TextProcessor = openAIService;

// Provider factory functions for dependency injection (optional)
export const getTranscriptionProvider = (): TranscriptionProvider => {
  return transcriptionProvider;
};

export const getTextProcessor = (): TextProcessor => {
  return textProcessor;
};

// Configuration info for logging/debugging
export const getProviderInfo = () => ({
  transcription: transcriptionProvider.getProviderName(),
  textProcessing: textProcessor.getProviderName(),
});