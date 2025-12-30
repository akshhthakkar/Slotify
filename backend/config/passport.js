const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 * @param {Object} passport - Passport instance
 */
module.exports = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Check if email already exists (registered with local auth)
          const existingEmailUser = await User.findOne({ 
            email: profile.emails[0].value.toLowerCase() 
          });

          if (existingEmailUser) {
            // Link Google account to existing user
            existingEmailUser.googleId = profile.id;
            existingEmailUser.authProvider = 'google';
            existingEmailUser.emailVerified = true; // Google emails are pre-verified
            existingEmailUser.lastLogin = new Date();
            
            if (!existingEmailUser.profilePicture && profile.photos?.[0]?.value) {
              existingEmailUser.profilePicture = profile.photos[0].value;
            }
            
            await existingEmailUser.save();
            return done(null, existingEmailUser);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value.toLowerCase(),
            googleId: profile.id,
            authProvider: 'google',
            emailVerified: true, // Google emails are pre-verified
            profilePicture: profile.photos?.[0]?.value || '',
            lastLogin: new Date()
          });

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );

  // Serialize user for session storage
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};