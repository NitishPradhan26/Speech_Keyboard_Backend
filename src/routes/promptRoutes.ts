import express from 'express';
import promptController from '../controllers/promptController';

const router = express.Router();

// Get prompts by user ID - must come before /:id to avoid conflicts
router.get('/user/:userId', promptController.getPromptsByUserId);

// Get default prompts
router.get('/defaults', promptController.getDefaultPrompts);

// CRUD operations
router.post('/', promptController.createPrompt);           // Create new prompt
router.put('/:id', promptController.updatePrompt);        // Update existing prompt
router.delete('/:id', promptController.deletePrompt);     // Delete prompt
router.get('/:id', promptController.getPromptById);       // Get prompt by ID

export default router;