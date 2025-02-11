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

app.use(express.static('public'));

// Serve the HTML form where users can input OAuth2.0 credentials
app.get('/', (req, res) => {
 res.send(`
 <!DOCTYPE html>
 <html lang="en">
 <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlanMill OAuth2.0</title>
    <link rel="stylesheet" href="/styles/main.css">
 </head>
 <body>
    <div class="card">
        <div class="header">
            <h1>Enter PlanMill's OAuth2.0 Credentials</h1>
        </div>
        <div class="form-container">
            <form action="/auth/login" method="post">
                <div class="form-group">
                    <label class="form-label" for="client_id">Client ID</label>
                    <input class="form-input" type="text" id="client_id" name="client_id" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="client_secret">Client Secret</label>
                    <input class="form-input" type="password" id="client_secret" name="client_secret" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="authorization_url">Authorization URL</label>
                    <input class="form-input" type="text" id="authorization_url" name="authorization_url" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="token_url">Token URL</label>
                    <input class="form-input" type="text" id="token_url" name="token_url" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="callback_url">Callback URL</label>
                    <input class="form-input" type="text" id="callback_url" name="callback_url" required>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
        </div>
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
    <title>PlanMill API Testing Tool</title>
    <link rel="stylesheet" href="/styles/main.css">
 </head>
 <body>
    <div class="card">
        <div class="header">
            <h1>PlanMill API Testing Tool</h1>
        </div>
        <div class="text-right">
            <a href="/logout" class="btn">Logout</a>
        </div>
        <div class="form-container">
            <div class="welcome-message">
                <h2>Welcome to PlanMill API Testing Tool!</h2>
                <p>You are now authenticated and can begin testing API endpoints. Use the form below to make API requests.</p>
            </div>
            <form id="api-form" class="api-form">
                <select id="method" name="method" class="method-select method-get">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                </select>
                <input type="text" id="api_endpoint" name="api_endpoint" class="form-input" placeholder="Enter API endpoint" required>
                <button type="submit" class="btn">Send</button>
            </form>
            <div class="response-container">
                <h2>JSON Response:</h2>
                <div id="profile"></div>
            </div>
        </div>
    </div>
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
                    $('#profile').html('<pre style="padding-top: 20px;text-align: left;">' + JSON.stringify(data, null, 2) + '</pre>');
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
                $method.removeClass('method-get method-post method-put method-delete')
                      .addClass('method-' + method);
            }

            // Initialize style on page load
            updateMethodStyle();

            // Update style when method changes
            $method.on('change', updateMethodStyle);
        });
    </script>
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