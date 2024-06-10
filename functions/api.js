
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const cors = require('cors'); 
const { createProxyMiddleware } = require('http-proxy-middleware');	
const app = express();
const port = 3000;

exports.handler = async (req, res) => {
// Use the cors middleware
 app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Origin, Content-Type, Authorization, X-Planmill-Auth,Accept,X-Requested-With, UserId, Nonce, Timestamp, Signature',
    //credentials: true
}));  

app.options('*', (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, X-Planmill-Auth,Accept,X-Requested-With,UserId, Nonce, Timestamp, Signature');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
});

//Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'API-ACCESS-KEY', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
 done(null, user);
});

passport.deserializeUser((obj, done) => {
 done(null, obj);
});

//Checking if the user is authenticated
function ensureAuthenticated(req, res, next) {
 if (req.isAuthenticated()) {
    return next();
 }
 res.redirect('/');
}

//Serving form for OAuth2.0 credentials
app.get('/', (req, res) => {
 if (req.session.clientID && req.session.clientSecret && req.session.authorizationURL && req.session.tokenURL && req.session.callbackURL) {
    res.redirect('/form.html');
 }
});

// Handle form submission to set OAuth2.0 credentials
app.post('/set-credentials', (req, res) => {
    req.session.clientID = req.body.clientID;
    req.session.clientSecret = req.body.clientSecret;
    req.session.authorizationURL = req.body.authorizationURL;
    req.session.tokenURL = req.body.tokenURL;
    req.session.callbackURL = req.body.callbackURL;
    res.redirect('/login');
});

// Serve the form HTML
app.get('/login', (req, res, next) => {
 if (!req.session.clientID || !req.session.clientSecret || !req.session.authorizationURL || !req.session.tokenURL || !req.session.callbackURL) {
 return res.redirect('/');
 }

 passport.use(new OAuth2Strategy({
    authorizationURL: req.session.authorizationURL,
    tokenURL: req.session.tokenURL,
    clientID: req.session.clientID,
    clientSecret: req.session.clientSecret,
    callbackURL: req.session.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
     done(null, { accessToken });
    }
 ));

    passport.authenticate('oauth2')(req, res, next);
});

// OAuth2.0 callback route
app.get('/auth/callback', 
 passport.authenticate('oauth2', { failureRedirect: '/' }),
 (req, res) => {
    res.redirect('/form');
 }
);

//Serve the main api demonstation page after authentication
app.get('/form', ensureAuthenticated, (req, res) => {
/*  res.send(``); */
});

// Route to logout
app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy();
        res.redirect('/');
    });
});

// API endpoint to handle GET request
app.use('/api/1.5', createProxyMiddleware({
    target: 'http://localhost:8888/',
    changeOrigin: true,
    pathRewrite: {
     '^/api/1.5': '/api/1.5'
    },
    onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888/');
    },
    onProxyRes: (proxyRes, req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8888/');
    }
}));
	

app.listen(port, () => {
 console.log(`Server is running on http://localhost:${port}`);
});

}