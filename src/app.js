const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
 done(null, user);
});

passport.deserializeUser((obj, done) => {
 done(null, obj);
});

let oauth2ClientId, oauth2ClientSecret, oauth2AuthorizationURL, oauth2TokenURL, oauth2CallbackURL;

app.post('/.netlify/functions/auth-login', (req, res) => {
 oauth2ClientId = req.body.client_id;
 oauth2ClientSecret = req.body.client_secret;
 oauth2AuthorizationURL = req.body.authorization_url;
 oauth2TokenURL = req.body.token_url;
 oauth2CallbackURL = req.body.callback_url;

 passport.use(new OAuth2Strategy({
 authorizationURL: oauth2AuthorizationURL,
 tokenURL: oauth2TokenURL,
 clientID: oauth2ClientId,
 clientSecret: oauth2ClientSecret,
 callbackURL: oauth2CallbackURL
 },
 (accessToken, refreshToken, profile, done) => {
 return done(null, { accessToken });
 }));

 res.json({ redirect: '/auth/oauth2' });
});

app.get('/auth/oauth2', passport.authenticate('oauth2'));

app.get('/auth/oauth2/callback', 
 passport.authenticate('oauth2', { failureRedirect: '/' }),
 (req, res) => {
 res.cookie('access_token', req.user.accessToken, { httpOnly: true });
 res.redirect('/form.html');
 }
);



app.use(express.static(path.join(__dirname, 'src/html')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
 console.log(`Server is running on port ${port}`);
});
