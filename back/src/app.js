// back/app.js

const express = require("express");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Use the user routes
app.use("/users", userRoutes);

module.exports = app; // Export the app instance
