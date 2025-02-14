const express = require("express");
const router = express.Router();

//Middleware to check authentication before accessing API
function ensureAuthenticated(req, res, next) {
    if (!req.session.accessToken) {
      return res.status(401).json({ error: "You are unauthorized" });
    }
    next();
  }
  
  const BASE_API_URL = "https://online.planmill.com/demo/api/1.5/";

//Handle API requests
router.get("/1.5", ensureAuthenticated, async (req, res) => {
  try {
    const endpoint = req.query.url;
    if (!endpoint) {
      return res.status(400).json({ error: "Missing API URL" });
    }

    const fullUrl = `${BASE_API_URL}${endpoint}`;
    const method = req.query.method || "GET";
    const accessToken = req.session.accessToken;

    const options = {
      method: method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    if (method === "POST" || method === "DELETE") {
      options.body = JSON.stringify({});
      options.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(fullUrl, options);  
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching API data:", err);
    res.status(500).json({ error: "Error fetching API data" });
  }
});
  
  module.exports = router;