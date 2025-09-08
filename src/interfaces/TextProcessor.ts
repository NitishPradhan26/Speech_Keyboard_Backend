export interface TextInput {
  rawText: string;
  prompt?: string;
}

export interface TextProcessingResult {
  success: boolean;
  processedText?: string;
  originalText: string;
  promptUsed?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
  };
}

export interface TextProcessor {
  /**
   * Process raw text using AI model
   * @param input Text input containing raw text, optional prompt and options
   * @returns Promise containing processed text result
   */
  processText(input: TextInput): Promise<TextProcessingResult>;
  
  /**
   * Get default prompt for text processing
   */
  getDefaultPrompt(): string;
  
  /**
   * Get provider name for logging/identification
   */
  getProviderName(): string;
}