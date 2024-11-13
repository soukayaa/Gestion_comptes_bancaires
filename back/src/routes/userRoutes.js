// routes/userRoutes.js
const express = require("express");
const {
  signup,
  login,
  logout,
  getAccounts,
  addAccount,
  getTransactions,
  addTransaction,
  getTransactionHistory,
  getUserProfile,
  updateUserProfile,
  deleteBankAccount,
} = require("../controllers/userController");
const { signupValidation } = require("../middlewares/validation");
const sessionMiddleware = require("../middlewares/sessionMiddleware");

const router = express.Router();

// Apply the sessionMiddleware to all routes
router.use(sessionMiddleware);

// Define the signup route with both session and validation middlewares
router.post("/signup", signupValidation, signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/accounts", addAccount);
// Route pour obtenir les comptes de l'utilisateur connecté
router.get("/accounts", getAccounts);
// Route pour ajouter une transaction à un compte spécifique
router.post("/accounts/:accountId/transactions", addTransaction);
router.get("/accounts/:accountId/transactions", getTransactions);

// Route pour récupérer l'historique des transactions d'un compte avec filtres
router.get("/accounts/:accountId/transactions/history", getTransactionHistory);

router.get("/profile", getUserProfile);

// Route pour mettre à jour le profil utilisateur
router.put("/profile", updateUserProfile);

router.delete("/account/:accountId", deleteBankAccount);

module.exports = router;
