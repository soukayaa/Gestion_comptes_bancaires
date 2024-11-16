const express = require("express");
const path = require("path");
const app = express();

// Import middleware
const sessionMiddleware = require("./back/src/middlewares/sessionMiddleware");
const { authenticateMiddleware } = require("./back/src/middlewares/authMiddleware");
const userRoutes = require("./back/src/routes/userRoutes");

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Static file configuration
app.use("/front", express.static(path.join(__dirname, "front")));

// Setting the view path
app.set("views", path.join(__dirname, "front/pages"));

// Apply authentication middleware to all routes except public ones
app.use(authenticateMiddleware);

// Page Routing
app.get("/", (req, res) => {
    res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
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

// Error handling
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