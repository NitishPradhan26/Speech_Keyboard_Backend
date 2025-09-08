export interface AudioInput {
  audioBuffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  duration?: number;
  error?: string;
  metadata?: {
    language?: string;
    confidence?: number;
  };
}

export interface TranscriptionProvider {
  /**
   * Transcribe audio to text
   * @param audio Audio input containing buffer, filename, and MIME type
   * @returns Promise containing transcription result
   */
  transcribe(audio: AudioInput): Promise<TranscriptionResult>;
  
  /**
   * Get provider name for logging/identification
   */
  getProviderName(): string;
}