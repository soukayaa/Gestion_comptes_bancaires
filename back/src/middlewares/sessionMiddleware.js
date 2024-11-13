// middlewares/sessionMiddleware.js
const session = require("express-session");

const sessionMiddleware = session({
  secret: "your_session_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Use true in production with HTTPS
});

module.exports = sessionMiddleware;
