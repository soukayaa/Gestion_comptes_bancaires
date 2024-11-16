const express = require("express");
const router = express.Router();
const { apiAuthMiddleware } = require("../middlewares/authMiddleware");
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
  getLoginHistory,
  detectSuspiciousLogin,
} = require("../controllers/userController");

// Public routing - no authentication required
router.post("/signup", signup);
router.post("/login", login);

// Authentication is required for all of the following routes
router.use(apiAuthMiddleware);

// User Authentication
router.post("/logout", logout);

// Account Management Routing
router.route("/accounts")
  .get(getAccounts)
  .post(addAccount);

router.delete("/accounts/:accountId", deleteBankAccount);

// Transaction-related routing
router.route("/accounts/:accountId/transactions")
  .get(getTransactions)
  .post(addTransaction);

router.get("/accounts/:accountId/transactions/history", getTransactionHistory);
router.get("/accounts/:accountId/transactions/download", downloadTransactionHistory);


router.get("/total-balance", getTotalBalance);
router.post("/accounts/:accountId/threshold", updateThreshold);


router.route("/profile")
  .get(getUserProfile)
  .put(updateUserProfile);


router.get("/login-history", getLoginHistory);
router.post("/detect-suspicious-login", async (req, res) => {
  const { userId, ipAddress, location } = req.body;

  if (!userId || !ipAddress || !location) {
    return res.status(400).json({
      error: "userId, ipAddress et location sont requis."
    });
  }

  try {
    const isSuspicious = await detectSuspiciousLogin(userId, ipAddress, location);

    return res.status(200).json({
      message: isSuspicious
        ? "Connexion suspecte détectée."
        : "Aucune connexion suspecte détectée."
    });
  } catch (error) {
    console.error("Erreur lors de la détection d'une connexion suspecte :", error);
    res.status(500).json({
      error: "Une erreur est survenue."
    });
  }
});

module.exports = router;