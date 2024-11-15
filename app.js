// app.js
const express = require("express");
const path = require("path");
const session = require("express-session");
const app = express();
const userRoutes = require("./back/src/routes/userRoutes");

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const generateSecret = () => {
    return require('crypto').randomBytes(64).toString('hex');
};

app.use(session({
    secret: generateSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 60 * 1000
    }
}));

// Static file configuration
app.use("/front", express.static(path.join(__dirname, "front")));

// Setting the view path
app.set("views", path.join(__dirname, "front/pages"));

const authenticateMiddleware = (req, res, next) => {

    const publicRoutes = ['/login', '/register', '/api/login', '/api/signup'];

    console.log('Current path:', req.path);
    console.log('Session:', req.session);

    if (publicRoutes.includes(req.path)) {
        return next();
    }

    // check session
    if (!req.session || !req.session.userId) {
        // The API request returns a 401 status code.
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                message: 'Session expirée, veuillez vous reconnecter'
            });
        }
        // Page request redirected to login page
        return res.redirect('/login');
    }

    next();
};

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
