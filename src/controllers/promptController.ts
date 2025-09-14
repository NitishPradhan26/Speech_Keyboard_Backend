import { Request, Response } from 'express';
import logger from '../config/logger';
import Prompt, { CreatePromptData, UpdatePromptData } from '../models/Prompt';

class PromptController {
  /**
   * Create a new prompt
   * POST /api/prompts
   */
  async createPrompt(req: Request, res: Response): Promise<Response | void> {
    try {
      const { user_id, title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      const promptData: CreatePromptData = {
        user_id,
        title,
        content,
        is_default: false
      };

      const newPrompt = await Prompt.create(promptData);
      
      logger.info(`Created new prompt with ID: ${newPrompt.id}`);
      
      return res.status(201).json({
        success: true,
        message: 'Prompt created successfully',
        data: newPrompt
      });
    } catch (error: any) {
      logger.error('Error in createPrompt controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create prompt',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update existing prompt
   * PUT /api/prompts/:id
   */
  async updatePrompt(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { title, content, is_default } = req.body;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid prompt ID provided'
        });
      }

      const updateData: UpdatePromptData = {
        title,
        content,
        is_default
      };

      const updatedPrompt = await Prompt.update(parseInt(id), updateData);
      
      if (!updatedPrompt) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      logger.info(`Updated prompt with ID: ${id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Prompt updated successfully',
        data: updatedPrompt
      });
    } catch (error: any) {
      logger.error('Error in updatePrompt controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update prompt',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete prompt by ID
   * DELETE /api/prompts/:id
   */
  async deletePrompt(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid prompt ID provided'
        });
      }

      const deletedPrompt = await Prompt.delete(parseInt(id));
      
      if (!deletedPrompt) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      logger.info(`Deleted prompt with ID: ${id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Prompt deleted successfully',
        data: deletedPrompt
      });
    } catch (error: any) {
      logger.error('Error in deletePrompt controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to delete prompt',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get prompts by user ID
   * GET /api/prompts/user/:userId
   */
  async getPromptsByUserId(req: Request, res: Response): Promise<Response | void> {
    try {
      const { userId } = req.params;
      
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID provided'
        });
      }

      const prompts = await Prompt.findByUserId(parseInt(userId));
      
      logger.info(`Retrieved ${prompts.length} prompts for user: ${userId}`);
      
      return res.status(200).json({
        success: true,
        count: prompts.length,
        data: prompts
      });
    } catch (error: any) {
      logger.error('Error in getPromptsByUserId controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user prompts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get prompt by ID
   * GET /api/prompts/:id
   */
  async getPromptById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid prompt ID provided'
        });
      }

      const prompt = await Prompt.findById(parseInt(id));
      
      if (!prompt) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      logger.info(`Retrieved prompt with ID: ${id}`);
      
      return res.status(200).json({
        success: true,
        data: prompt
      });
    } catch (error: any) {
      logger.error('Error in getPromptById controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve prompt',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all default prompts
   * GET /api/prompts/defaults
   */
  async getDefaultPrompts(req: Request, res: Response): Promise<Response | void> {
    try {
      const prompts = await Prompt.findDefaultPrompts();
      
      logger.info(`Retrieved ${prompts.length} default prompts`);
      
      return res.status(200).json({
        success: true,
        count: prompts.length,
        data: prompts
      });
    } catch (error: any) {
      logger.error('Error in getDefaultPrompts controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve default prompts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

export default new PromptController();