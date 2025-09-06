const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const logger = require('./config/logger')
const userRoutes = require('./routes/userRoutes')

const app = express()
const PORT = process.env.PORT || 3000

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})

app.use(helmet())
app.use(cors())
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', userRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Speech Keyboard Backend is running',
    timestamp: new Date().toISOString()
  })
})

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  })
})

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})