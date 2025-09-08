import { Request, Response } from 'express';
import transcriptController from '../../controllers/transcriptController';
import { transcriptionProvider, textProcessor } from '../../config/serviceProvider';

// Mock the service providers
jest.mock('../../config/serviceProvider', () => ({
  transcriptionProvider: {
    transcribe: jest.fn(),
    getProviderName: jest.fn().mockReturnValue('MockTranscriptionProvider'),
  },
  textProcessor: {
    processText: jest.fn(),
    getProviderName: jest.fn().mockReturnValue('MockTextProcessor'),
  },
}));

// Mock logger to avoid console output during tests
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('TranscriptController - transcribeAndCorrect', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup mock response with proper chaining
    jsonSpy = jest.fn();
    statusSpy = jest.fn();
    
    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };
    
    // Make status return the response object for chaining
    statusSpy.mockReturnValue(mockRes);
  });

  describe('1. Input Validation', () => {
    it('should return 400 when no audio file provided', async () => {
      // Arrange
      mockReq = {
        file: undefined, // No file uploaded
        body: {},
      };

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'No audio file provided',
      });
    });
  });

  describe('2. Service Orchestration (Happy Path)', () => {
    it('should call transcriptionProvider with correct parameters', async () => {
      // Arrange
      const mockBuffer = Buffer.from('mock audio data');
      mockReq = {
        file: {
          buffer: mockBuffer,
          originalname: 'test.wav',
          mimetype: 'audio/wav',
        } as Express.Multer.File,
        body: {},
      };

      const mockTranscriptionResult = {
        success: true,
        transcript: 'Hello world',
        duration: 5.2,
      };

      const mockCorrectionResult = {
        success: true,
        processedText: 'Hello, world!',
        originalText: 'Hello world',
        promptUsed: 'default prompt',
      };

      (transcriptionProvider.transcribe as jest.Mock).mockResolvedValue(mockTranscriptionResult);
      (textProcessor.processText as jest.Mock).mockResolvedValue(mockCorrectionResult);

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(transcriptionProvider.transcribe).toHaveBeenCalledWith({
        audioBuffer: mockBuffer,
        filename: 'test.wav',
        mimeType: 'audio/wav',
      });
    });

    it('should call textProcessor with transcription result', async () => {
      // Arrange
      mockReq = {
        file: {
          buffer: Buffer.from('mock audio data'),
          originalname: 'test.wav',
          mimetype: 'audio/wav',
        } as Express.Multer.File,
        body: {},
      };

      const mockTranscriptionResult = {
        success: true,
        transcript: 'Hello world',
        duration: 5.2,
      };

      const mockCorrectionResult = {
        success: true,
        processedText: 'Hello, world!',
        originalText: 'Hello world',
        promptUsed: 'default prompt',
      };

      (transcriptionProvider.transcribe as jest.Mock).mockResolvedValue(mockTranscriptionResult);
      (textProcessor.processText as jest.Mock).mockResolvedValue(mockCorrectionResult);

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(textProcessor.processText).toHaveBeenCalledWith({
        rawText: 'Hello world',
        prompt: undefined,
      });
    });

    it('should return 200 with complete response structure on success', async () => {
      // Arrange
      mockReq = {
        file: {
          buffer: Buffer.from('mock audio data'),
          originalname: 'test.wav',
          mimetype: 'audio/wav',
        } as Express.Multer.File,
        body: {},
      };

      const mockTranscriptionResult = {
        success: true,
        transcript: 'Hello world',
        duration: 5.2,
      };

      const mockCorrectionResult = {
        success: true,
        processedText: 'Hello, world!',
        originalText: 'Hello world',
        promptUsed: 'default prompt',
      };

      (transcriptionProvider.transcribe as jest.Mock).mockResolvedValue(mockTranscriptionResult);
      (textProcessor.processText as jest.Mock).mockResolvedValue(mockCorrectionResult);

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          rawTranscript: 'Hello world',
          finalText: 'Hello, world!',
          duration: 5.2,
          promptUsed: 'default prompt',
        },
      });
    });
  });

  describe('3. Error Handling', () => {
    it('should return 422 when transcription fails', async () => {
      // Arrange
      mockReq = {
        file: {
          buffer: Buffer.from('mock audio data'),
          originalname: 'test.wav',
          mimetype: 'audio/wav',
        } as Express.Multer.File,
        body: {},
      };

      const mockTranscriptionResult = {
        success: false,
        error: 'OpenAI API quota exceeded',
      };

      (transcriptionProvider.transcribe as jest.Mock).mockResolvedValue(mockTranscriptionResult);

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(422);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: 'Transcription failed',
        error: 'OpenAI API quota exceeded',
      });
      
      // TextProcessor should not be called when transcription fails
      expect(textProcessor.processText).not.toHaveBeenCalled();
    });

    it('should return 200 with raw transcript when correction fails', async () => {
      // Arrange
      mockReq = {
        file: {
          buffer: Buffer.from('mock audio data'),
          originalname: 'test.wav',
          mimetype: 'audio/wav',
        } as Express.Multer.File,
        body: {},
      };

      const mockTranscriptionResult = {
        success: true,
        transcript: 'Hello world',
        duration: 5.2,
      };

      const mockCorrectionResult = {
        success: false,
        originalText: 'Hello world',
        error: 'Rate limit exceeded',
      };

      (transcriptionProvider.transcribe as jest.Mock).mockResolvedValue(mockTranscriptionResult);
      (textProcessor.processText as jest.Mock).mockResolvedValue(mockCorrectionResult);

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          rawTranscript: 'Hello world',
          finalText: 'Hello world', // Falls back to raw transcript
          duration: 5.2,
          correctionFailed: true,
          correctionError: 'Rate limit exceeded',
        },
      });
    });
  });

  describe('4. Parameter Passing', () => {
    it('should pass custom prompt to textProcessor', async () => {
      // Arrange
      mockReq = {
        file: {
          buffer: Buffer.from('mock audio data'),
          originalname: 'test.wav',
          mimetype: 'audio/wav',
        } as Express.Multer.File,
        body: {
          prompt: 'Custom grammar correction prompt',
        },
      };

      const mockTranscriptionResult = {
        success: true,
        transcript: 'Hello world',
        duration: 5.2,
      };

      const mockCorrectionResult = {
        success: true,
        processedText: 'Hello, world!',
        originalText: 'Hello world',
        promptUsed: 'Custom grammar correction prompt',
      };

      (transcriptionProvider.transcribe as jest.Mock).mockResolvedValue(mockTranscriptionResult);
      (textProcessor.processText as jest.Mock).mockResolvedValue(mockCorrectionResult);

      // Act
      await transcriptController.transcribeAndCorrect(mockReq as Request, mockRes as Response);

      // Assert
      expect(textProcessor.processText).toHaveBeenCalledWith({
        rawText: 'Hello world',
        prompt: 'Custom grammar correction prompt',
      });
    });

  });
});