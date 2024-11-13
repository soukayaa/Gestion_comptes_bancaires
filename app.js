// app.js
const express = require("express");
const path = require("path");
const app = express();
const userRoutes = require("./back/src/routes/userRoutes");

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file configuration
app.use("/front", express.static(path.join(__dirname, "front")));

// Setting the view path
app.set("views", path.join(__dirname, "front/pages"));

// Page Routing
app.get("/", (req, res) => {
    res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "front/pages/login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "front/pages/register.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "front/pages/dashboard.html"));
});

app.get("/account/:id", (req, res) => {
    res.sendFile(path.join(__dirname, "front/pages/account.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "front/pages/profile.html"));
});

// API Routing
app.use("/api", userRoutes);

app.get("/api/accounts", (req, res) => {
    // Logic to handle getting the list of accounts
});

// error handling
app.use((req, res, next) => {
    res.status(404).send("Page not found");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
