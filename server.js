const express = require('express');
const session = require('express-session');
const request = require('request');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');

require('dotenv').config();

const authRoutes = require("./src/routes/auth"); 
const apiRoutes = require("./src/routes/api"); 

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));

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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use("/auth", authRoutes); 
app.use("/api", apiRoutes);

//Root route to display the form for user input (client_id, client_secret, callback_url)
app.get("/", (req, res) => {
    res.render("home");
  });

//user reaches this page after successful authentication
app.get("/apiTool", (req, res) => {
    if (!req.session.accessToken) {
      return res.redirect("/");
    }
    //Render the API tool page with the access token
    res.render("apiTool", { accessToken: req.session.accessToken });  
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