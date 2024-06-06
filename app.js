const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const cors = require('cors'); 
const { createProxyMiddleware } = require('http-proxy-middleware');																   
const app = express();
const port = 3000;

// Use the cors middleware
app.use(cors({
    origin: 'https://pm-dev01.planmill.com',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//Middleware to hanlde OPTIONS requests
app.options('*', cors());

//Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 'API-Key', resave: false, saveUninitialized: false }));
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
    res.redirect('/login');
 } else {
 res.send(`
 <!DOCTYPE html>
 <html>
 <head>
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <style>
    .card {
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
        width: 80%;
        align-content: center;
        padding: 70px;
    }
    .card:hover {
    box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
    }
</style>
 </head>
 <body style="text-align:center; margin-top:100px; padding 70px;padding: 0 0 70px 100px;">
 <div class="card">
  <h1 style="background-color:#1976D2 !important; color:#fff !important; margin:20px 0 40px 0px; height:76px; text-align:center; padding-top:30px; font-size:3rem;"">Enter PlanMill's OAuth2.0 Credentials</h1>
    <form action="/set-credentials" method="post" style="height: 500px;">
        <label for="clientID">Client ID:</label>
        <input type="text" id="clientID" name="clientID" style="width:500px;height: 24px;" required>
        <br><br>
        <label for="clientSecret">Client Secret:</label>
        <input type="text" id="clientSecret" name="clientSecret" style="width:500px;height: 24px;" required>
        <br><br>
        <label for="authorizationURL">Authorization URL:</label>
        <input type="text" id="authorizationURL" name="authorizationURL" style="width:500px;height: 24px;" required>
        <br><br>
        <label for="tokenURL">Token URL:</label>
        <input type="text" id="tokenURL" name="tokenURL" style="width:500px;height: 24px;" required>
        <br><br>
        <label for="callbackURL">CallbackURL:</label>
        <input type="text" id="callbackURL" name="callbackURL" style="width:500px;height: 24px;" required>
        <br> <br>
        <button type="submit" style="background-color:green;width: 100px;height: 30px;border-color: green;color: white;">Submit</button>
    </form>
    </div>
    </body>
 </html>
 `);
 }
});

// Handle form submission to set OAuth credentials
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
 res.send(`
  <!DOCTYPE html>
    <html>
        <head>
        <style>
        .card {
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
            transition: 0.3s;
            width: 80%;
            align-content: center;
            padding: 70px;
        }
        .card:hover {
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
        }
       </style>
        <script>
            async function submitForm(event) {
            event.preventDefault();
            const name = document.getElementById('name').value;

            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://pm-dev01.planmill.com/1094120_APIclient_OpenSource_New_Authorization/api/1.5/' + encodeURIComponent(name), true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const jsonResponse = JSON.parse(xhr.responseText);
                        document.getElementById('jsonOutput').textContent = JSON.stringify(jsonResponse, null, 2);
                    } else {
                        document.getElementById('jsonOutput').textContent = 'Error: ' + xhr.status;
                    }
                }
            };

            xhr.send();
            }
        </script>
        </head>
        <body style="text-align:center; margin-top:100px; padding 70px;padding: 0 0 70px 100px;">
        <div class="card">
            <h1>PlanMill API testing platform</h1>
            <p>Welcome! You are authenticated.</p>
            <br> <br> <p>This tool help you to test and modify APIs</p>
            <form onsubmit="submitForm(event)" style="display: flex;">
                <label for="name">PM API endpoint:</label>
                <input type="text" id="name" name="name" style="width: 80%; height: 24px;" required>
                &nbsp;
                <button type="submit" style="background-color:#1976D2 !important; color:#fff !important; width:8%;">Send</button>
            </form>
            <h2>JSON Output:</h2>
            <pre id="jsonOutput" style="border:1px solid hashtag#ccc; padding:10px;"></pre>
            <br>
            <a href="/logout">Logout</a>
            </div>
        </body>
    </html>
 `);
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
    target: 'https://pm-dev01.planmill.com/1094120_APIclient_OpenSource_New_Authorization',
    changeOrigin: true,
    pathRewrite: {
     '^/api/1.5': '/api/1.5'
    },
    onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Access-Control-Allow-Origin', 'https://pm-dev01.planmill.com');
    },
    onProxyRes: (proxyRes, req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://pm-dev01.planmill.com');
    }
}));
	

app.listen(port, () => {
 console.log(`Server is running on http://localhost:${port}`);
});