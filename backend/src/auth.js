const passport = require('passport');
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;
const { userOps } = require('./database');

// Configure OpenID Connect strategy
function configureAuth(app) {
  // Check if OIDC is configured
  const isOIDCConfigured = process.env.OIDC_ISSUER && 
                          process.env.OIDC_CLIENT_ID && 
                          process.env.OIDC_CLIENT_SECRET &&
                          process.env.OIDC_AUTH_URL &&
                          process.env.OIDC_TOKEN_URL &&
                          process.env.OIDC_USERINFO_URL;

  if (!isOIDCConfigured) {
    console.log('OpenID Connect not configured. Authentication features disabled.');
    console.log('To enable authentication, set the following environment variables:');
    console.log('- OIDC_ISSUER');
    console.log('- OIDC_CLIENT_ID');
    console.log('- OIDC_CLIENT_SECRET');
    console.log('- OIDC_AUTH_URL');
    console.log('- OIDC_TOKEN_URL');
    console.log('- OIDC_USERINFO_URL');
    console.log('- OIDC_CALLBACK_URL (optional, defaults to /auth/callback)');
    
    // Add disabled auth routes
    app.get('/auth/login', (req, res) => {
      res.status(501).json({ error: 'Authentication not configured' });
    });
    
    app.get('/auth/user', (req, res) => {
      res.status(401).json({ error: 'Authentication not configured' });
    });
    
    app.post('/auth/logout', (req, res) => {
      res.status(501).json({ error: 'Authentication not configured' });
    });
    
    return;
  }

  // Session configuration
  const session = require('express-session');
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for development/HTTP
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Log OIDC configuration for debugging
  console.log('OIDC Configuration:');
  console.log('Issuer:', process.env.OIDC_ISSUER);
  console.log('Auth URL:', process.env.OIDC_AUTH_URL);
  console.log('Token URL:', process.env.OIDC_TOKEN_URL);
  console.log('UserInfo URL:', process.env.OIDC_USERINFO_URL);
  console.log('Client ID:', process.env.OIDC_CLIENT_ID);
  console.log('Callback URL:', process.env.OIDC_CALLBACK_URL || '/auth/callback');

  // Configure OpenID Connect strategy
  passport.use('oidc', new OpenIDConnectStrategy({
    issuer: process.env.OIDC_ISSUER,
    authorizationURL: process.env.OIDC_AUTH_URL,
    tokenURL: process.env.OIDC_TOKEN_URL,
    userInfoURL: process.env.OIDC_USERINFO_URL,
    clientID: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    callbackURL: process.env.OIDC_CALLBACK_URL || '/auth/callback',
    scope: 'openid email profile',
    skipUserProfile: false
  }, (issuer, sub, profile, accessToken, refreshToken, done) => {
    console.log('OIDC Strategy callback:');
    console.log('Issuer:', issuer);
    console.log('Subject:', sub);
    console.log('Profile:', profile);
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    
    // Extract user info from profile
    console.log('Raw profile object:', JSON.stringify(profile, null, 2));
    
    const userProfile = {
      sub: sub, // Use the sub parameter directly
      email: profile.emails?.[0]?.value,
      name: profile.displayName || profile.name?.givenName || profile.username
    };

    console.log('Extracted user profile:', userProfile);

    userOps.findOrCreateUser(userProfile, (err, user) => {
      if (err) {
        console.error('Database error in findOrCreateUser:', err);
        return done(err);
      }
      console.log('User from database:', user);
      return done(null, user);
    });
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser((id, done) => {
    userOps.findById(id, (err, user) => {
      done(err, user);
    });
  });

  // Auth routes
  app.get('/auth/login', passport.authenticate('oidc'));

  app.get('/auth/callback', (req, res, next) => {
    console.log('Auth callback received');
    console.log('Query params:', req.query);
    console.log('Body:', req.body);
    
    passport.authenticate('oidc', (err, user, info) => {
      console.log('Passport authenticate callback:');
      console.log('Error:', err);
      console.log('User:', user);
      console.log('Info:', info);
      
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect('/?error=auth_failed');
      }
      
      if (!user) {
        console.error('No user returned from authentication');
        return res.redirect('/?error=no_user');
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.redirect('/?error=login_failed');
        }
        
        console.log('User successfully logged in:', user);
        res.redirect('/');
      });
    })(req, res, next);
  });

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session destruction failed' });
        }
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Get current user
  app.get('/auth/user', (req, res) => {
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - Is authenticated:', req.isAuthenticated());
    console.log('Auth check - User:', req.user);
    console.log('Auth check - Session:', req.session);
    
    if (req.isAuthenticated()) {
      res.json({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name
        }
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to optionally include user info
function optionalAuth(req, res, next) {
  // Always proceed, but user info will be available if authenticated
  next();
}

module.exports = {
  configureAuth,
  requireAuth,
  optionalAuth
};
