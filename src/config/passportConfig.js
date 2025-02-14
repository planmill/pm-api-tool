const passport = require("passport");
const OAuth2Strategy = require('passport-oauth2').Strategy;


function setupOAuth2Strategy({ client_id, client_secret, callback_url }) {
  if (!client_id || !client_secret || !callback_url) {
    throw new Error('Missing OAuth2 credentials');
  }
    passport.use(
        "oauth2",
        new OAuth2Strategy(
            {
                authorizationURL: 'https://online.planmill.com/demo/api/oauth2/authorize',
                tokenURL: 'https://online.planmill.com/demo/api/oauth2/token',
                clientID: client_id,
                clientSecret: client_secret,
                callbackURL: callback_url
            },
            (accessToken, refreshToken, profile, done) => {
              return done(null, { accessToken });
              }));
            }

module.exports = { setupOAuth2Strategy };