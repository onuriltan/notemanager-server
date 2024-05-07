import passport from 'passport'
import UserEntity from '../modules/user/entity/user.entity'
import FacebookStrategy from 'passport-facebook'
import GoogleStrategy from 'passport-google-oauth20'
import { Strategy as TwitterStrategy } from 'passport-twitter'

import { logger } from './pino'

export const configurePassport = (): void => {
  passport.use(
    new FacebookStrategy.Strategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_APP_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        if (!profile) {
          logger.error('Profile object is not found from google login')
          done('', false, 'An error occured while login with google')
        }
        try {
          const email = profile.emails
            ? profile.emails[0].value
            : profile._json.email
          const existingUser = await UserEntity.findOne({
            email,
          })
          if (existingUser) {
            return done(null, existingUser)
          }
          const newUser = new UserEntity({
            active: true,
            method: 'facebook',
            email,
            facebook: {
              email,
            },
          })
          await newUser.save()
          done(null, newUser)
        } catch (e) {
          logger.error('An error occured from facebook login')
          if (e instanceof Error) {
            logger.error(e.message)
            done(e, false, e.message)
          }
        }
      }
    )
  )

  passport.use(
    new GoogleStrategy.Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CLIENT_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        if (!profile) {
          logger.error('Profile object is not found from google login')
          done('', false, 'An error occured while login with google')
        }
        try {
          const email = profile.emails
            ? profile.emails[0].value
            : profile._json.email
          const existingUser = await UserEntity.findOne({
            email,
          })
          if (existingUser) {
            return done('', existingUser)
          }
          const newUser = new UserEntity({
            active: true,
            method: 'google',
            email,
            google: {
              email,
            },
          })
          await newUser.save()
          done('', newUser)
        } catch (e) {
          logger.error('An error occured from google login')
          if (e instanceof Error) {
            logger.error(e.message)
            done(e, false, e.message)
          }
        }
      }
    )
  )

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL,
      },
      async function (_token, _tokenSecret, profile, cb) {
        if (!profile) {
          logger.error('Profile object is not found from twitter login')
          cb(
            new Error('Profile object is not found from twitter login'),
            'An error occured while login with twitter'
          )
        }

        try {
          const email = profile.emails
            ? profile.emails[0].value
            : profile._json.email
          const existingUser = await UserEntity.findOne({
            email,
          })
          if (existingUser) {
            return cb('', existingUser)
          }
          const newUser = new UserEntity({
            active: true,
            method: 'twitter',
            email,
            twitter: {
              email: profile._json.email,
            },
          })
          await newUser.save()
          cb('', newUser)
        } catch (e) {
          logger.error('An error occured from twitter login')
          if (e instanceof Error) {
            logger.error(e.message)
            cb(e, e.message)
          }
        }
      }
    )
  )

  passport.serializeUser(function (user, done) {
    done(null, user)
  })

  passport.deserializeUser(function (user, done) {
    if (user) {
      done(null, user)
    }
  })
}
