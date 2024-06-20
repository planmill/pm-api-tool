const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;


const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(session({ secret: 'secret_key', resave: false, saveUninitialized: true }));


app.use(passport.initialize());
app.use(passport.session());

// Serializing user into the session
passport.serializeUser((user, cb) => {
 cb(null, user);
});

// Deserializing user from the session
passport.deserializeUser((obj, cb) => {
 cb(null, obj);
});

// Serve the HTML form where users can input OAuth2.0 credentials
app.get('/', (req, res) => {
 res.send(`
 <!DOCTYPE html>
 <html lang="en">
 <head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    .textFieldStyle {
        width:500px;
        height: 24px;
    }
</style>
 </head>
 <body style="text-align:center; margin-top:100px; padding:70px;padding: 0 0 70px 100px;">
    <div class="card">
    <h1 style="background-color:#1976D2 !important; color:#fff !important; margin:20px 0 40px 0px; height:76px; text-align:center; padding-top:30px; font-size:3rem;"">Enter PlanMill's OAuth2.0 Credentials</h1>
    <form action="/auth/login" method="post" style="height: 500px;">
        <label for="client_id">Client ID:</label>
        <input type="text" id="client_id" name="client_id" class="textFieldStyle" required><br><br>
        <label for="client_secret">Client Secret:</label>
        <input type="password" id="client_secret" name="client_secret" class="textFieldStyle" required><br><br>
        <label for="authorization_url">Authorization URL:</label>
        <input type="text" id="authorization_url" name="authorization_url" class="textFieldStyle" required><br><br>
        <label for="token_url">Token URL:</label>
        <input type="text" id="token_url" name="token_url" class="textFieldStyle" required><br><br>
        <label for="callback_url">Callback URL:</label>
        <input type="text" id="callback_url" name="callback_url" class="textFieldStyle" required><br><br>
        <button type="submit" style="background-color:green;width: 100px;height: 30px;border-color: green;color: white;">Login</button>
    </form>
    </div>
  </body>
 </html>
 `);
});

app.post('/auth/login', (req, res) => {
 const { client_id, client_secret, authorization_url, token_url, callback_url } = req.body;

 req.session.oauth2 = { authorization_url,client_id, client_secret, authorization_url, token_url, callback_url };

 const authorizationRedirectUrl = `${authorization_url}?client_id=${client_id}&redirect_uri=${callback_url}&response_type=code`;
 res.redirect(authorizationRedirectUrl);
});

// Handle OAuth2.0 callback
app.get('/auth/callback', (req, res, next) => {
    const { authorization_url,client_id, client_secret, token_url, callback_url } = req.session.oauth2;

    passport.use(new OAuth2Strategy({
        authorizationURL: authorization_url, 
        tokenURL: token_url,
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: callback_url,
        },
        (accessToken, refreshToken, profile, cb) => {
            profile.accessToken = accessToken;
            return cb(null, profile);
    })
    );

    const { code } = req.query;
    const strategy = passport._strategy('oauth2');

    strategy._oauth2.getOAuthAccessToken(code, {
      grant_type: 'authorization_code',
      redirect_uri: callback_url,
    }, (err, accessToken) => {
    if (err) {
      return res.redirect('/');
    }
    req.session.accessToken = accessToken;
    res.redirect('/form');
    });
});

// Serve after successful authentication
app.get('/form', (req, res) => {
 if (!req.session.accessToken) {
 return res.redirect('/');
 }
 res.send(`
 <!DOCTYPE html>
 <html lang="en">
 <head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Form Page</title>
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
        height: 100%;
        margin: 0 200px 0 -50px;
    }
    .card:hover {
      box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
    }
</style>
</head>
<body style="text-align:center; margin-top:100px; padding:70px;padding: 0 0 70px 100px;">
 <div class="card">
    <h1 style="padding-top: 10px;">PlanMill API TESTING TOOL</h1>
    <p>Welcome! You are authenticated.</p>
    <br> <br> <p>This tool help you to test and modify APIs</p>
    <form style="display: flex; padding-left:120px;" id="api-form">
        <select id="method" name="method">
            <option value="GET" >GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
        </select><br>
        <input  type="text" id="api_endpoint" name="api_endpoint" style="width: 60%; height: 24px;" required> 
        &nbsp;
        <button type="submit" style="background-color:#1976D2 !important; color:#fff !important; width:8%; border-color:#1976D2; font-size:medium;">Send</button>
        </form>
    <h2 style="text-align: left !important;padding-left: 120px;">JSON Response:</h2>

    <div style="text-align:right !important;margin-top: -350px !important;font-size: 20px;">
        <a href="/logout">Logout</a>
    </div>       
 <div id="profile"></div>
 <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
 <script>
 $(document).ready(function() {
    $('#api-form').on('submit', function(e) {
        e.preventDefault();
        const apiEndpoint = $('#api_endpoint').val();
        const method = $('#method').val();
        $.ajax({
        url: '/api/1.5',
        method: 'GET',
        data: { url: apiEndpoint, method: method },
        success: function(data) {
        console.log('API Data:', data);
            $('#profile').html('<pre style="padding-top: 300px;text-align: left;padding-left: 150px;">' + JSON.stringify(data, null, 2) + '</pre>');
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Error fetching API data:', textStatus, errorThrown);
            $('#profile').html('<p>Error fetching data. Please check the endpoint and try again.</p>');
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
 </div>
 </body>
 </html>
 `);
});

// Handle API requests
app.get('/api/1.5', (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'You are unauthorized' });
  }

 const apiUrl = req.query.url;
 const method = req.query.method || 'GET';
 const accessToken = req.session.accessToken;

 const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
 };

 if (method === 'POST' || method === 'DELETE') {
    options.body = JSON.stringify({});
    options.headers['Content-Type'] = 'application/json';
 }

    fetch(apiUrl, options)
    .then(response => {
        if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        res.json(data);
    })
    .catch(err => {
        console.error('Error fetching API data:', err);
        res.status(500).json({ error: 'Error fetching API data' });
    });
});

// Route to logout
app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy();
        res.redirect('/');
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
 console.log(`Server is running on port ${port}`);
});