import { Request, Response } from 'express';
import subscriptionService from '../services/SubscriptionService';
import logger from '../config/logger';

interface AuthenticatedRequest extends Request {
  user?: { id: number };
}

const subscriptionController = {
  async getSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const subscription = await subscriptionService.getSubscription(userId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      logger.info(`Retrieved subscription status for user ${userId}`);
      
      res.status(200).json({
        success: true,
        data: subscription
      });
    } catch (error: any) {
      logger.error('Error getting subscription status:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get subscription status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  async addCredits(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      const { credits } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (!credits || credits <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid credits amount is required'
        });
      }

      await subscriptionService.addCredits(userId, credits);
      const updatedSubscription = await subscriptionService.getSubscription(userId);
      
      logger.info(`Added ${credits} credits to user ${userId}`);
      
      res.status(200).json({
        success: true,
        message: `Successfully added ${credits} credits`,
        data: updatedSubscription
      });
    } catch (error: any) {
      logger.error('Error adding credits:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to add credits',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  async upgradeToPremium(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await subscriptionService.upgradeToPremium(userId);
      const updatedSubscription = await subscriptionService.getSubscription(userId);
      
      logger.info(`Upgraded user ${userId} to premium`);
      
      res.status(200).json({
        success: true,
        message: 'Successfully upgraded to premium',
        data: updatedSubscription
      });
    } catch (error: any) {
      logger.error('Error upgrading to premium:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to upgrade to premium',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  async downgradeToFree(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await subscriptionService.downgradeToFree(userId);
      const updatedSubscription = await subscriptionService.getSubscription(userId);
      
      logger.info(`Downgraded user ${userId} to free tier`);
      
      res.status(200).json({
        success: true,
        message: 'Successfully downgraded to free tier',
        data: updatedSubscription
      });
    } catch (error: any) {
      logger.error('Error downgrading to free:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to downgrade to free tier',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  async resetMonthlyBalance(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      await subscriptionService.resetMonthlyBalance(userId);
      const updatedSubscription = await subscriptionService.getSubscription(userId);
      
      logger.info(`Reset monthly balance for user ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Monthly balance reset successfully',
        data: updatedSubscription
      });
    } catch (error: any) {
      logger.error('Error resetting monthly balance:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to reset monthly balance',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

export default subscriptionController;