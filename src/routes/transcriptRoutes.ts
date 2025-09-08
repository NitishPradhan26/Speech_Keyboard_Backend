import express from 'express';
import transcriptController from '../controllers/transcriptController';

const router = express.Router();

// Main endpoint for audio transcription and correction
router.post('/transcribeAndCorrect', 
  transcriptController.uploadAudio, 
  transcriptController.transcribeAndCorrect
);

export default router;