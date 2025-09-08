// Mock environment variables before importing anything
process.env.OPENAI_API_KEY = 'test-api-key';

import { OpenAIService } from '../../services/OpenAIService';
import { Readable } from 'stream';

// Mock OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

// Import OpenAI to get access to the mocked instance
import OpenAI from 'openai';
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// Mock logger
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('OpenAIService', () => {
  let openAIService: OpenAIService;
  let mockOpenAIInstance: any;
  let mockTranscriptionCreate: jest.Mock;
  let mockChatCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock functions
    mockTranscriptionCreate = jest.fn();
    mockChatCreate = jest.fn();
    
    // Create mock OpenAI instance
    mockOpenAIInstance = {
      audio: {
        transcriptions: {
          create: mockTranscriptionCreate,
        },
      },
      chat: {
        completions: {
          create: mockChatCreate,
        },
      },
    };
    
    // Mock the OpenAI constructor to return our mock instance
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance);
    
    openAIService = new OpenAIService();
  });


  describe('Service Interface', () => {
    it('should return correct provider name', () => {
      expect(openAIService.getProviderName()).toBe('OpenAI');
    });

    it('should return default prompt', () => {
      const defaultPrompt = openAIService.getDefaultPrompt();
      expect(defaultPrompt).toContain('writing assistant');
      expect(defaultPrompt).toContain('correct any grammatical errors');
    });
  });

  describe('TranscriptionProvider Interface', () => {
    const mockAudioInput = {
      audioBuffer: Buffer.from('mock audio data'),
      filename: 'test.wav',
      mimeType: 'audio/wav',
    };

    it('should return proper TranscriptionResult format on success', async () => {
      // Arrange
      const mockApiResponse = {
        text: 'Hello world',
        duration: 5.2,
        language: 'en',
      };
      mockTranscriptionCreate.mockResolvedValue(mockApiResponse);

      // Act
      const result = await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(result).toEqual({
        success: true,
        transcript: 'Hello world',
        duration: 5.2,
        metadata: {
          language: 'en',
        },
      });
    });

    it('should call OpenAI API with correct parameters', async () => {
      // Arrange
      const mockApiResponse = {
        text: 'Hello world',
        duration: 5.2,
        language: 'en',
      };
      mockTranscriptionCreate.mockResolvedValue(mockApiResponse);

      // Act
      await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(mockTranscriptionCreate).toHaveBeenCalledWith({
        file: expect.any(Readable),
        model: 'whisper-1',
        response_format: 'verbose_json',
        language: 'en',
      });

      // Check that the stream has the correct filename
      const callArgs = mockTranscriptionCreate.mock.calls[0][0];
      expect(callArgs.file.path).toBe('test.wav');
    });

    it('should handle OpenAI API rate limit error', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Rate limit exceeded',
              code: 'rate_limit_exceeded',
            },
          },
          status: 429,
        },
      };
      mockTranscriptionCreate.mockRejectedValue(mockError);

      // Act
      const result = await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Rate limit exceeded',
      });
    });

    it('should handle OpenAI API quota exceeded error', async () => {
      // Arrange
      const mockError = {
        code: 'insufficient_quota',
        message: 'You exceeded your current quota',
      };
      mockTranscriptionCreate.mockRejectedValue(mockError);

      // Act
      const result = await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'OpenAI API quota exceeded. Please check your billing.',
      });
    });

    it('should handle network timeout error', async () => {
      // Arrange
      const mockError = {
        message: 'Request timeout after 30000ms',
      };
      mockTranscriptionCreate.mockRejectedValue(mockError);

      // Act
      const result = await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'transcription request timed out. Please try again.',
      });
    });

    it('should handle invalid API key error', async () => {
      // Arrange
      const mockError = {
        code: 'invalid_api_key',
        message: 'Invalid API key provided',
      };
      mockTranscriptionCreate.mockRejectedValue(mockError);

      // Act
      const result = await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid OpenAI API key configuration.',
      });
    });

    it('should handle unknown error', async () => {
      // Arrange
      const mockError = {
        message: 'Unknown error occurred',
      };
      mockTranscriptionCreate.mockRejectedValue(mockError);

      // Act
      const result = await openAIService.transcribe(mockAudioInput);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Unknown error occurred',
      });
    });
  });

  describe('TextProcessor Interface', () => {
    const mockTextInput = {
      rawText: 'hello world how are you',
      prompt: 'Make it formal',
    };

    it('should return proper TextProcessingResult format on success', async () => {
      // Arrange
      const mockApiResponse = {
        choices: [{
          message: {
            content: '{"corrected": "Hello, world! How are you?"}'
          }
        }],
        usage: {
          total_tokens: 25
        }
      };
      mockChatCreate.mockResolvedValue(mockApiResponse);

      // Act
      const result = await openAIService.processText(mockTextInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processedText).toBe('Hello, world! How are you?');
      expect(result.originalText).toBe('hello world how are you');
      expect(result.promptUsed).toBe('Make it formal');
      expect(result.metadata?.tokensUsed).toBe(25);
      expect(result.metadata?.model).toBe('gpt-4o');
      expect(result.metadata?.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should call OpenAI API with correct parameters', async () => {
      // Arrange
      const mockApiResponse = {
        choices: [{
          message: {
            content: '{"corrected": "Hello, world! How are you?"}'
          }
        }],
        usage: { total_tokens: 25 }
      };
      mockChatCreate.mockResolvedValue(mockApiResponse);

      // Act
      await openAIService.processText(mockTextInput);

      // Assert
      expect(mockChatCreate).toHaveBeenCalledWith({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Make it formal')
          },
          {
            role: 'user',
            content: 'hello world how are you'
          }
        ],
        temperature: 0.0,
        max_tokens: Math.max('hello world how are you'.length * 2, 1000),
      });

      // Verify system message contains both user prompt and core instructions
      const systemMessage = mockChatCreate.mock.calls[0][0].messages[0].content;
      expect(systemMessage).toContain('Make it formal');
      expect(systemMessage).toContain('writing assistant');
      expect(systemMessage).toContain('{"corrected": "..."}');
    });

    it('should use default prompt when no custom prompt provided', async () => {
      // Arrange
      const inputWithoutPrompt = {
        rawText: 'hello world',
      };
      const mockApiResponse = {
        choices: [{
          message: {
            content: '{"corrected": "Hello, world!"}'
          }
        }],
        usage: { total_tokens: 15 }
      };
      mockChatCreate.mockResolvedValue(mockApiResponse);

      // Act
      const result = await openAIService.processText(inputWithoutPrompt);

      // Assert
      expect(result.success).toBe(true);
      expect(result.promptUsed).toBe(openAIService.getDefaultPrompt());
      
      // Verify system message contains core instructions
      const systemMessage = mockChatCreate.mock.calls[0][0].messages[0].content;
      expect(systemMessage).toContain('writing assistant');
      expect(systemMessage).toContain('core instructions');
    });

    it('should handle JSON parsing error gracefully', async () => {
      // Arrange
      const mockApiResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }],
        usage: { total_tokens: 10 }
      };
      mockChatCreate.mockResolvedValue(mockApiResponse);

      // Act
      const result = await openAIService.processText(mockTextInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.originalText).toBe('hello world how are you');
      expect(result.error).toContain('JSON');
    });

    it('should handle no content response', async () => {
      // Arrange
      const mockApiResponse = {
        choices: [{
          message: {
            content: null
          }
        }],
        usage: { total_tokens: 0 }
      };
      mockChatCreate.mockResolvedValue(mockApiResponse);

      // Act
      const result = await openAIService.processText(mockTextInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.originalText).toBe('hello world how are you');
      expect(result.error).toBe('No response content from OpenAI');
    });

    it('should fallback to original text when corrected field is missing', async () => {
      // Arrange
      const mockApiResponse = {
        choices: [{
          message: {
            content: '{"other_field": "some value"}'
          }
        }],
        usage: { total_tokens: 15 }
      };
      mockChatCreate.mockResolvedValue(mockApiResponse);

      // Act
      const result = await openAIService.processText(mockTextInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processedText).toBe('hello world how are you'); // Fallback to original
    });

    it('should handle OpenAI API error', async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Model overloaded',
              code: 'model_overloaded',
            },
          },
          status: 503,
        },
      };
      mockChatCreate.mockRejectedValue(mockError);

      // Act
      const result = await openAIService.processText(mockTextInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.originalText).toBe('hello world how are you');
      expect(result.error).toBe('Model overloaded');
      expect(result.metadata?.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});