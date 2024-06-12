const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const cors = require('cors'); 
const { createProxyMiddleware } = require('http-proxy-middleware');	
const app = express();
const port = 3000;

const crypto = require('crypto'); 

// Use the cors middleware
 app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Origin, Content-Type, Authorization, X-Planmill-Auth,Accept,X-Requested-With, UserId, Nonce, Timestamp, Signature',
    //credentials: true
}));

// API endpoint with CORS enabled
app.get('/api/1.5/products', async (req, res) => {
    // Get X-Planmill-Auth header
     const authHeader = req.header('X-Planmill-Auth');

    //Parse the header (Validate custom headers)
    const headers = authHeader.split(';');
    let userId, nonce, timestamp, signature;

    for (let i = 0; i < headers.length; i++) {
    const [key, value] = headers[i].split(':');
    if (key === 'user') userId = value;
    else if (key === 'nonce') nonce = value;
    else if (key === 'timestamp') timestamp = value;
    else if (key === 'signature') signature = value;
    }
   
    // Check if headers are present
    if (!userId || !nonce || !timestamp || !signature) {
      return res.status(400).json({ error: 'Missing authentication headers.' });
    }
   
    //use a secure authentication mechanism (Verify signature (dummy validation)
    if (signature !== 'LhasLMKx+XoCGAQbwuRTXv7uGwMneuOtsNsDscgH2Lk=') {
      return res.status(401).json({ error: 'Invalid signature.' });
    }
   
    try {
        const response = await fetch('https://online.planmill.com/demo/api/1.5/products');
        const data = await response.json();
        res.json(data);
    } catch (error){
        console.error('Error fetching data', error);
        res.status(500).json({error : 'Failed to fetch data'})
    }
   
   });

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
        <body style="text-align:center; margin-top:100px; padding:70px;padding: 0 0 70px 100px;">
        <div class="card">
        <h1 style="background-color:#1976D2 !important; color:#fff !important; margin:20px 0 40px 0px; height:76px; text-align:center; padding-top:30px; font-size:3rem;"">Enter PlanMill's OAuth2.0 Credentials</h1>
            <form  action="/set-credentials" method="post" style="height: 500px;" id="oauthForm">
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
 res.send(`
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>jQuery AJAX API request form</title>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<style>
    #method {
        font-size: medium;
    }
    .method-get {
        color: #06780b;
    }
    .method-post {
        color: #b5733f;
    }
    .method-put {
        color: #065da2;
    }
    .method-delete {
        color: #9e160c;
    }
    .card {
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
        width: 100%;       
        height: 80vh;
        margin: 0 200px 0 -50px;
    }
    .card:hover {
      box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
    }
</style>
<script>
    $(document).ready(function() {
     $('#oauthForm').on('submit', function(event) {
        event.preventDefault(); 

        const clientId = $('#clientId').val();
        const clientSecret = $('#clientSecret').val();
        const credentials = clientId + ':' + clientSecret;
        const encodedCredentials = btoa(credentials);
        const tokenURL = $('#tokenURL').val();

        //Generate authentication headers
        const userId = '50';
        const nonce = Math.random().toString(36).substr(2, 10); // Random nonce
        const timestamp = Date.now(); // Current timestamp
        const signature = 'LhasLMKx+XoCGAQbwuRTXv7uGwMneuOtsNsDscgH2Lk='; 
        const authHeader = "user:" + userId + ";nonce:" + nonce + ";timestamp:" + timestamp + ";signature:" + signature
               
        
        const name = document.getElementById('apiUrl').value;
        const apiUrl = $('#apiUrl').val();
        const method = $('#method').val();
        const  headers = {            
                       'Authorization': 'Bearer ' + encodedCredentials, 
                      /* 'Authorization': 'Basic ' + encodedCredentials, */
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'X-Planmill-Auth' : authHeader
                };
        const data = 'grant_type = client_credentials';

        if(!apiUrl) {
            alert('Please enter the API URL.')
        }
        

        // Make AJAX request with custom headers
        $.ajax({
            url: apiUrl,
            method: method,
            /* data: data, */
           dataType: 'json',
            headers: headers,
            success: function(response) {
                alert('Request successful')
                console.log('response',response)
              $('#jsonOutput').text(JSON.stringify(response, null, 2));
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.error('AJAX error:', textStatus, errorThrown);
            }
        });
      });
        const $method = $('#method');
        function updateMethodStyle() {
            const method = $method.val().toLowerCase();
            $method.attr('class','method-' + method);
        }

        //Initialize style on page load
        updateMethodStyle();

        $method.change(updateMethodStyle);
    });
</script>
</head>
<body style="text-align:center; margin-top:100px; padding:70px;padding: 0 0 70px 100px;">
    <div class="card">
        <h1 style="padding-top: 10px;">PlanMill API TESTING TOOL</h1>
        <p>Welcome! You are authenticated.</p>
        <br> <br> <p>This tool help you to test and modify APIs</p>
        <form  style="display: flex; padding-left:120px;" id="oauthForm">
            <select id="method" name="method" required> 
                 <option value="GET" class="method-get">GET</option>
                 <option value="POST" class="method-post">POST</option>
                 <option value="PUT" class="method-put">PUT</option>
                 <option value="DELETE" class="method-delete">DELETE</option>
            </select><br>
           
            <!-- <label for="apiUrl">PM API endpoint:</label> -->
            <input type="text" id="apiUrl" name="apiUrl" style="width: 60%; height: 24px;" required>
            <!-- <input type="text" id="name" name="name" style="width: 80%; height: 24px;" required> -->
            &nbsp;
            <button type="submit" style="background-color:#1976D2 !important; color:#fff !important; width:8%; border-color:#1976D2; font-size:medium;">Send</button>
        </form>
        <h2 style="text-align: left !important;padding-left: 120px;">JSON Response:</h2>
        <pre id="jsonOutput" style="border:1px solid hashtag#ccc; padding:10px;"></pre>
        <br>
        <div style="text-align:right !important;margin-top: -400px !important;font-size: 20px;">
            <a href="/logout">Logout</a>
        </div>       
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
    target: 'http://localhost:3000/',
    changeOrigin: true,
    pathRewrite: {
     '^/api/1.5': '/api/1.5'
    },
    onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000/');
    },
    onProxyRes: (proxyRes, req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000/');
    }
}));
	

app.listen(port, () => {
 console.log(`Server is running on http://localhost:${port}`);
});