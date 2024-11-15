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
  recordLogin,
  getLoginHistory,
  detectSuspiciousLogin,
} = require("../controllers/userController");

const sessionMiddleware = require("../middlewares/sessionMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Appliquer le middleware de session à toutes les routes
router.use(sessionMiddleware);

// Routes d'authentification
router.post("/signup", signup); // Inscription
router.post("/login", login); // Connexion
router.post("/logout", authMiddleware, logout); // Déconnexion (protégé)

// Routes pour les comptes bancaires
router.get("/accounts", authMiddleware, getAccounts); // Obtenir les comptes de l'utilisateur
router.post("/accounts", authMiddleware, addAccount); // Ajouter un compte bancaire
router.delete("/accounts/:accountId", authMiddleware, deleteBankAccount); // Supprimer un compte bancaire

// Routes pour les transactions
router.get("/accounts/:accountId/transactions", authMiddleware, getTransactions); // Obtenir les transactions d'un compte
router.post("/accounts/:accountId/transactions", authMiddleware, addTransaction); // Ajouter une transaction
router.get("/accounts/:accountId/transactions/history", authMiddleware, getTransactionHistory); // Filtrer l'historique des transactions
router.get("/accounts/:accountId/transactions/download", authMiddleware, downloadTransactionHistory); // Télécharger l'historique des transactions en CSV

// Route pour le solde total
router.get("/total-balance", authMiddleware, getTotalBalance); // Obtenir le solde total

// Route pour la gestion du seuil de solde bas
router.post("/accounts/:accountId/threshold", authMiddleware, updateThreshold); // Définir le seuil de solde bas pour un compte

// Routes pour le profil utilisateur
router.get("/profile", authMiddleware, getUserProfile); // Consulter le profil utilisateur
router.put("/profile", authMiddleware, updateUserProfile); // Mettre à jour le profil utilisateur

// Routes pour l'historique des connexions
router.get("/login-history", authMiddleware, getLoginHistory); // Consulter l'historique des connexions

// Route pour détecter les connexions suspectes
router.post("/detect-suspicious-login", authMiddleware, async (req, res) => {
  const { userId, ipAddress, location } = req.body;

  if (!userId || !ipAddress || !location) {
    return res.status(400).json({ error: "userId, ipAddress et location sont requis." });
  }

  try {
    const isSuspicious = await detectSuspiciousLogin(userId, ipAddress, location);

    if (isSuspicious) {
      return res.status(200).json({ message: "Connexion suspecte détectée." });
    } else {
      return res.status(200).json({ message: "Aucune connexion suspecte détectée." });
    }
  } catch (error) {
    console.error("Erreur lors de la détection d'une connexion suspecte :", error);
    res.status(500).json({ error: "Une erreur est survenue." });
  }
});

module.exports = router;
