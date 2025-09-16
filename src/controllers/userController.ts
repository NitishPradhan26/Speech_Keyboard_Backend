import { Request, Response } from 'express';
import User from '../models/User';
import subscriptionService from '../services/SubscriptionService';
import logger from '../config/logger';

const userController = {
  async getAllUsers(req: Request, res: Response): Promise<Response | void> {
    try {
      const users = await User.findAll()
      
      logger.info(`Retrieved ${users.length} users`)
      
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      })
    } catch (error: any) {
      logger.error('Error in getAllUsers controller:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  },

  async getUserById(req: Request, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID provided'
        })
      }

      const user = await User.findById(parseInt(id))
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      logger.info(`Retrieved user with ID: ${id}`)
      
      res.status(200).json({
        success: true,
        data: user
      })
    } catch (error: any) {
      logger.error('Error in getUserById controller:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  },

  async createUser(req: Request, res: Response): Promise<Response | void> {
    logger.info('User Post Endpoint: Creating user:', req.body)
    
    try {
      const { firebase_uid, email} = req.body

      if (!firebase_uid) {
        return res.status(400).json({
          success: false,
          message: 'Firebase UID is required'
        })
      }

      const existingUser = await User.findByFirebaseUid(firebase_uid)
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this Firebase UID already exists'
        })
      }

      // Create user first
      const newUser = await User.create({ firebase_uid, email})
      
      // Automatically create free subscription for new user
      await subscriptionService.createFreeSubscription(newUser.id)
      
      logger.info(`Created new user with ID: ${newUser.id} and free subscription`)
      
      res.status(201).json({
        success: true,
        message: 'User created successfully with free subscription',
        data: newUser
      })
    } catch (error: any) {
      logger.error('Error in createUser controller:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  }
}

export default userController;