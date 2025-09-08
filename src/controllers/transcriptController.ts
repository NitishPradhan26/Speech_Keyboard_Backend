import { Request, Response } from 'express';
import multer from 'multer';
import logger from '../config/logger';
import { transcriptionProvider, textProcessor } from '../config/serviceProvider';

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper API limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});


class TranscriptController {
  // Middleware for file upload
  uploadAudio = upload.single('audio');

  /**
   * Main endpoint: Transcribe audio and correct grammar in one flow
   * POST /api/transcripts/transcribeAndCorrect
   */
  async transcribeAndCorrect(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file provided',
        });
      }

      const { buffer, originalname, mimetype } = req.file;
      const { prompt } = req.body;
      
      logger.info(`Processing transcription and correction for file: ${originalname}`);

      // Step 1: Transcribe audio using Whisper
      const transcriptionResult = await transcriptionProvider.transcribe({
        audioBuffer: buffer,
        filename: originalname,
        mimeType: mimetype,
      });

      if (!transcriptionResult.success) {
        return res.status(422).json({
          success: false,
          message: 'Transcription failed',
          error: transcriptionResult.error,
        });
      }

      // Step 2: Correct the transcribed text using ChatGPT
      const correctionResult = await textProcessor.processText({
        rawText: transcriptionResult.transcript!,
        prompt,
      });

      if (!correctionResult.success) {
        // Even if correction fails, return the raw transcript
        return res.status(200).json({
          success: true,
          data: {
            rawTranscript: transcriptionResult.transcript,
            finalText: transcriptionResult.transcript, // Fallback to raw
            duration: transcriptionResult.duration,
            correctionFailed: true,
            correctionError: correctionResult.error,
          },
        });
      }

      // Return successful result
      return res.status(200).json({
        success: true,
        data: {
          rawTranscript: transcriptionResult.transcript,
          finalText: correctionResult.processedText,
          duration: transcriptionResult.duration,
          promptUsed: correctionResult.promptUsed,
        },
      });
    } catch (error: any) {
      logger.error('Transcript controller error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error during processing',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      });
    }
  }
}

export default new TranscriptController();