import Subscription from '../models/Subscription';
import logger from '../config/logger';

class SubscriptionService {
  /**
   * Check if user has enough balance for the request
   * Pure function - only checks, doesn't modify
   */
  async checkBalance(userId: number, requiredMins: number): Promise<{
    hasBalance: boolean;
    currentBalance: number;
  }> {
    const subscription = await Subscription.findByUserId(userId);
    
    if (!subscription) {
      logger.error(`Subscription not found for user ${userId} - this should not happen`);
      throw new Error('Subscription not found');
    }

    return {
      hasBalance: subscription.balance >= requiredMins,
      currentBalance: subscription.balance
    };
  }

  /**
   * Reset monthly balance by adding tier allowance to current balance
   * Separate responsibility from balance checking
   */
  async resetMonthlyBalance(userId: number): Promise<void> {
    const subscription = await Subscription.findByUserId(userId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.expiry_date && new Date(subscription.expiry_date) <= new Date()) {
      const monthlyAllowance = subscription.status === 'free' ? 10 : 1000;
      
      await Subscription.update(userId, {
        balance: subscription.balance + monthlyAllowance,
        expiry_date: this.getNextMonthFirstDay()
      });
      
      logger.info(`Reset monthly balance for user ${userId}, added ${monthlyAllowance} minutes`);
    }
  }

  /**
   * Deduct balance after successful transcription
   */
  async deductBalance(userId: number, minutes: number): Promise<void> {
    const result = await Subscription.deductBalance(userId, minutes);
    
    if (!result) {
      throw new Error('Failed to deduct balance');
    }
  }

  /**
   * Add purchased credits to user's balance
   */
  async addCredits(userId: number, credits: number): Promise<void> {
    const result = await Subscription.addBalance(userId, credits);
    
    if (!result) {
      throw new Error('Failed to add credits');
    }
    
    logger.info(`Added ${credits} credits to user ${userId}`);
  }

  /**
   * Upgrade user to premium tier
   */
  async upgradeToPremium(userId: number): Promise<void> {
    const subscription = await Subscription.findByUserId(userId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Add premium monthly allowance to existing balance
    const premiumAllowance = 1000;
    
    await Subscription.update(userId, {
      status: 'premium',
      balance: subscription.balance + premiumAllowance,
      expiry_date: this.getNextMonthFirstDay()
    });
    
    logger.info(`Upgraded user ${userId} to premium`);
  }

  /**
   * Downgrade user back to free tier
   */
  async downgradeToFree(userId: number): Promise<void> {
    const subscription = await Subscription.findByUserId(userId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await Subscription.update(userId, {
      status: 'free',
      expiry_date: this.getNextMonthFirstDay()
    });
    
    logger.info(`Downgraded user ${userId} to free tier`);
  }

  /**
   * Get user's subscription details
   */
  async getSubscription(userId: number) {
    return await Subscription.findByUserId(userId);
  }

  /**
   * Get the first day of next month
   */
  private getNextMonthFirstDay(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Create free tier subscription for new user
   */
  async createFreeSubscription(userId: number) {
    return await Subscription.create({
      user_id: userId,
      status: 'free',
      balance: 10,
      expiry_date: this.getNextMonthFirstDay()
    });
  }
}

export default new SubscriptionService();