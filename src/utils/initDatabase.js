const User = require('../models/User')
const logger = require('../config/logger')

async function initDatabase() {
  try {
    logger.info('Initializing database tables...')
    
    await User.createTable()
    
    logger.info('Database initialization completed successfully')
  } catch (error) {
    logger.error('Database initialization failed:', error)
    throw error
  }
}

module.exports = { initDatabase }