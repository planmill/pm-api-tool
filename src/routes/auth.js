const express = require('express');
const passport = require('passport');
const { setupOAuth2Strategy } = require('../config/passportConfig'); 
const router = express.Router();


//Handles Both Authorization Code & Client Credentials Flows
router.post("/login", async (req, res) => {
    const { client_id, client_secret, callback_url, auth_type } = req.body;
  
    req.session.clientID = client_id;
    req.session.clientSecret = client_secret;
    req.session.callbackURL = callback_url;
  
    if (auth_type === "authorization_code") {
      setupOAuth2Strategy({ client_id, client_secret, callback_url });
      return passport.authenticate("oauth2")(req, res);
    } else if (auth_type === "client_credentials") {
      const tokenUrl = "https://online.planmill.com/demo/api/oauth2/token";
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id,
        client_secret,
      });
  
      try {
        const response = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
  
        const data = await response.json();
  
        if (data.error) {
          console.error("Error getting access token:", data.error);
          return res.redirect("/");
        }
  
        req.session.accessToken = data.access_token;
        return res.redirect("/apiTool");
      } catch (error) {
        console.error("Client Credentials Flow Error:", error);
        return res.redirect("/");
      }
    } else {
      return res.redirect("/");
    }
  });
  
  // OAuth2 Callback Route (Authorization Code Flow)
  router.get("/callback", (req, res, next) => {
    const { code } = req.query;
  
    if (!code) {
      console.error("Authorization code missing");
      return res.redirect("/");
    }
  
    passport.authenticate("oauth2", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect("/");
      }
      if (!user) {
        console.error("User authentication failed");
        return res.redirect("/");
      }
  
      req.session.accessToken = user.accessToken;
      res.redirect("/apiTool");
    })(req, res, next);
  });
  
  module.exports = router;