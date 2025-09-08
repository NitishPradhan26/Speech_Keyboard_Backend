import OpenAI from 'openai';
import { Readable } from 'stream';
import logger from '../config/logger';
import { TranscriptionProvider, AudioInput, TranscriptionResult } from '../interfaces/TranscriptionProvider';
import { TextProcessor, TextInput, TextProcessingResult } from '../interfaces/TextProcessor';

export class OpenAIService implements TranscriptionProvider, TextProcessor {
  private openai: OpenAI;
  private defaultPrompt: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.defaultPrompt = `You are a writing assistant. When given a raw transcript, correct any grammatical errors, punctuation, and make the phrasing clear and professional without altering the original meaning. Maintain the speaker's tone and intent. Only return the corrected text, no additional commentary.`;
  }

  // TranscriptionProvider implementation
  async transcribe(audio: AudioInput): Promise<TranscriptionResult> {
    try {
      logger.info(`[OpenAI] Starting transcription for file: ${audio.filename}`);
      
      // Convert buffer to a readable stream with file info
      const audioStream = Readable.from(audio.audioBuffer);
      (audioStream as any).path = audio.filename;

      const startTime = Date.now();
      
      // Call OpenAI Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioStream as any,
        model: 'whisper-1',
        response_format: 'verbose_json',
        language: 'en', // Could be made configurable
      });

      const processingTime = Date.now() - startTime;

      logger.info(`[OpenAI] Transcription completed in ${processingTime}ms for: ${audio.filename}`);
      
      return {
        success: true,
        transcript: transcription.text,
        duration: transcription.duration,
        metadata: {
          language: transcription.language || 'en',
        },
      };
    } catch (error: any) {
      logger.error('[OpenAI] Transcription failed:', error);
      
      return {
        success: false,
        error: this.handleError(error, 'transcription'),
      };
    }
  }

  // TextProcessor implementation
  async processText(input: TextInput): Promise<TextProcessingResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`[OpenAI] Starting text processing for text: ${input.rawText.substring(0, 100)}...`);
      
      const userPrompt = input.prompt || '';
      
      // Call OpenAI ChatGPT API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: userPrompt + 
              `\n\nThe above prompt is optional user guidance to help set the tone, style, or context.
              \n\nNow, follow these core instructions regardless of the prompt:
              You are a helpful writing assistant. Your task is to:
              1. Correct grammar and spelling mistakes in the given text.
              2. Improve readability by restructuring the text:
                - Break into multiple paragraphs where it makes sense.
                - Use bullet points for lists or sequences.
              3. Preserve the speaker's tone and meaning.
              4. Do not add or remove information—only clean up and organize what's there.
              5. Return ONLY the cleaned-up and formatted transcript in JSON format as: {"corrected": "..."}`
          },
          {
            role: 'user',
            content: input.rawText
          }
        ],
        temperature: 0.0,
        max_tokens: Math.max(input.rawText.length * 2, 1000),
      });

      const processingTime = Date.now() - startTime;
      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse JSON response
      const json = JSON.parse(content);
      const processedText = json.corrected || input.rawText;

      logger.info(`[OpenAI] Text processing completed in ${processingTime}ms`);
      
      return {
        success: true,
        processedText,
        originalText: input.rawText,
        promptUsed: userPrompt || this.defaultPrompt,
        metadata: {
          tokensUsed: completion.usage?.total_tokens,
          processingTime,
          model: 'gpt-4o',
        },
      };
    } catch (error: any) {
      logger.error('[OpenAI] Text processing failed:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        originalText: input.rawText,
        error: this.handleError(error, 'text processing'),
        metadata: {
          processingTime,
        },
      };
    }
  }

  getDefaultPrompt(): string {
    return this.defaultPrompt;
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  private handleError(error: any, operation: string): string {
    // Handle different types of OpenAI errors
    if (error.response) {
      const apiError = error.response.data?.error;
      if (apiError) {
        logger.error(`[OpenAI] API Error for ${operation}:`, apiError);
        return `${apiError.message || 'OpenAI API error'}`;
      }
    }
    
    if (error.code === 'insufficient_quota') {
      return 'OpenAI API quota exceeded. Please check your billing.';
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return 'OpenAI API rate limit exceeded. Please try again later.';
    }

    if (error.code === 'invalid_api_key') {
      return 'Invalid OpenAI API key configuration.';
    }

    if (error.message?.includes('timeout')) {
      return `${operation} request timed out. Please try again.`;
    }
    
    return error.message || `Unknown ${operation} error occurred.`;
  }
}

// Export singleton instance
export default new OpenAIService();