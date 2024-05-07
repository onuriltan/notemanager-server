import 'dotenv-safe/config'
import 'module-alias/register'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import mongoose from 'mongoose'
import helmet from 'helmet'
import { configurePassport } from './config/passport'
import { logger } from './config/pino'
import { configureAndRunMigrations } from './migrations'
import noteModule from './modules/notes'
import userModule from './modules/user'
import session from 'express-session'
// After you declare "app"
const bootServer = async () => {
  // Middleware
  const app = express()
  app.use(bodyParser.json())
  app.use(cors())
  app.use(cookieParser())
  app.use(passport.initialize())
  app.use(helmet())
  app.use(
    session({
      secret: process.env.JWT_SECRET,
      resave: true,
      saveUninitialized: true,
    })
  )

  // Connect to Mongo
  try {
    logger.warn('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    logger.info('MongoDB connected.')
  } catch (e) {
    logger.error('MongoDB failed to connect.')
    if (e instanceof Error) {
      throw e
    }
  }

  // Run Mongo migrations
  await configureAndRunMigrations()
  configurePassport()

  // Routes
  app.get('/', (_, res) => {
    res.send(`${process.env.APP_NAME} server is running`)
  })
  app.use('/api/notes', noteModule)
  app.use('/api/user', userModule)

  const port = process.env.PORT

  app.listen(port)
}

bootServer()
  .then(() => {
    const port = process.env.PORT
    logger.info(`${process.env.APP_NAME} is running on port ${port}`)
  })
  .catch((e) => {
    logger.error('Server is failed to boot.')
    if (e instanceof Error) {
      logger.error(e)
    }
  })
