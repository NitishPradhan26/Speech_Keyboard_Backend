import express from 'express';
import subscriptionController from '../controllers/subscriptionController';

const router = express.Router();

// Get user's subscription status and balance
router.get('/status', subscriptionController.getSubscriptionStatus);

// Add credits to user's balance (pay-as-you-go model)
router.post('/add-credits', subscriptionController.addCredits);

// Upgrade user to premium subscription
router.post('/upgrade', subscriptionController.upgradeToPremium);

// Downgrade user back to free tier
router.post('/downgrade', subscriptionController.downgradeToFree);

// Reset monthly balance (mainly for testing/admin use)
router.post('/reset-balance', subscriptionController.resetMonthlyBalance);

export default router;