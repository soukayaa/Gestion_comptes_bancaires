const express = require("express");
const {
  signup,
  login,
  logout,
  getAccounts,
  getTransactions,
  addAccount,
  addTransaction,
  getTransactionHistory,
  getTotalBalance,
  updateThreshold,
  downloadTransactionHistory,
  getUserProfile,
  updateUserProfile,
  deleteBankAccount,
} = require("../controllers/userController");

const sessionMiddleware = require("../middlewares/sessionMiddleware");

const router = express.Router();

// Appliquer le middleware de session à toutes les routes
router.use(sessionMiddleware);

// Routes d'authentification
router.post("/signup", signup); // Inscription
router.post("/login", login); // Connexion
router.post("/logout", logout); // Déconnexion

// Routes pour les comptes bancaires
router.get("/accounts", getAccounts); // Obtenir les comptes de l'utilisateur
router.post("/accounts", addAccount); // Ajouter un compte bancaire
router.delete("/accounts/:accountId", deleteBankAccount); // Supprimer un compte bancaire

// Routes pour les transactions
router.get("/accounts/:accountId/transactions", getTransactions); // Obtenir les transactions d'un compte
router.post("/accounts/:accountId/transactions", addTransaction); // Ajouter une transaction
router.get("/accounts/:accountId/transactions/history", getTransactionHistory); // Filtrer l'historique des transactions
router.get("/accounts/:accountId/transactions/download", downloadTransactionHistory); // Télécharger l'historique des transactions en CSV

// Route pour le solde total
router.get("/total-balance", getTotalBalance); // Obtenir le solde total

// Route pour la gestion du seuil de solde bas
router.post("/accounts/:accountId/threshold", updateThreshold); // Définir le seuil de solde bas pour un compte

// Routes pour le profil utilisateur
router.get("/profile", getUserProfile); // Consulter le profil utilisateur
router.put("/profile", updateUserProfile); // Mettre à jour le profil utilisateur

module.exports = router;
