import express from 'express';
import transcriptController from '../controllers/transcriptController';

const router = express.Router();

// Main endpoint for audio transcription and correction
router.post('/transcribeAndCorrect', 
  transcriptController.uploadAudio, 
  transcriptController.transcribeAndCorrect
);

// CRUD endpoints that exist in the controller
router.get('/:id', transcriptController.getTranscriptById);
router.post('/', transcriptController.createTranscript);
router.put('/:id', transcriptController.updateTranscript);
router.delete('/:id', transcriptController.deleteTranscript);

export default router;