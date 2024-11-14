// controllers/userController.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { createObjectCsvStringifier } = require("csv-writer");

const prisma = new PrismaClient();


async function signup(req, res) {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
}

// Login function
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Store user information in session
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during login" });
  }
}

// Logout function
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "An error occurred during logout" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
}
// Fonction pour obtenir les comptes de l'utilisateur connecté
async function getAccounts(req, res) {
  const userId = req.session.userId; // Vérifier si l'utilisateur est connecté

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour voir les comptes" });
  }

  try {
    // Récupérer les comptes de l'utilisateur connecté
    const accounts = await prisma.account.findMany({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        balance: true,
      },
    });

    res.status(200).json({ accounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des comptes",
    });
  }
}
// Fonction pour obtenir les transactions d'un compte spécifique
async function getTransactions(req, res) {
  const userId = req.session.userId;
  const accountId = req.params.accountId;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour voir les transactions" });
  }

  try {
    const accountIdInt = parseInt(accountId, 10);

    // Récupérer le compte de l'utilisateur
    const account = await prisma.account.findFirst({
      where: { id: accountIdInt, userId: userId },
      select: { id: true, balance: true }, // Inclure le solde actuel du compte
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    // Récupérer les transactions avec le champ `balanceAfterTransaction`
    const transactions = await prisma.transaction.findMany({
      where: { accountId: accountIdInt },
      orderBy: { date: 'asc' }, // Tri par date croissante
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        balanceAfterTransaction: true, // Inclure le champ balanceAfterTransaction
      },
    });

    // Répondre avec le solde actuel et les transactions
    res.status(200).json({
      balance: account.balance, // Solde initial du compte
      transactions,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des transactions",
    });
  }
}


// Fonction pour ajouter un compte bancaire
async function addAccount(req, res) {
  const userId = req.session.userId; // Vérifier que l'utilisateur est connecté
  const { name, type } = req.body; // Récupérer les données du formulaire

  if (!userId) {
    return res.status(401).json({
      error: "Veuillez vous connecter pour ajouter un compte bancaire",
    });
  }

  try {
    // Créer un nouveau compte dans la base de données pour l'utilisateur connecté
    const newAccount = await prisma.account.create({
      data: {
        userId: userId,
        name: name,
        type: type,
        balance: 0, // Le solde initial est 0
      },
    });

    res.status(201).json({
      message: "Compte créé avec succès",
      account: newAccount,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Une erreur est survenue lors de la création du compte" });
  }
}

// Fonction pour ajouter une transaction
async function addTransaction(req, res) {
  const userId = req.session.userId;
  const accountId = parseInt(req.params.accountId, 10);
  const { type, amount, date } = req.body;

  // Vérification de l'authentification de l'utilisateur
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour ajouter une transaction" });
  }

  // Validation de la présence des données nécessaires et du montant positif
  if (!accountId || !type || amount === undefined || amount <= 0) {
    return res.status(400).json({
      error: "Type de transaction, montant positif et compte requis",
    });
  }

  try {
    // Récupérer le compte de l'utilisateur et son solde actuel
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: userId },
      select: { id: true, balance: true, lowBalanceThreshold: true },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    // Normaliser le type pour accepter "dépôt" et "depot"
    const normalizedType = type.toLowerCase() === "depot" ? "dépôt" : type;

    // Vérifier que le solde est suffisant pour un retrait
    if (normalizedType === "retrait" && account.balance < amount) {
      return res.status(400).json({
        error: "Solde insuffisant pour effectuer ce retrait",
      });
    }

    // Calculer le nouveau solde en fonction du type de transaction
    const newBalance =
      normalizedType === "dépôt" ? account.balance + amount : account.balance - amount;

    // Créer la transaction avec balanceAfterTransaction
    const transaction = await prisma.transaction.create({
      data: {
        accountId: accountId,
        type: normalizedType,
        amount: amount,
        date: date || new Date(), // Utiliser la date fournie ou la date actuelle
        balanceAfterTransaction: newBalance, // Inclure le solde après transaction
      },
    });

    // Mettre à jour le solde du compte
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    // Créer une notification si le solde est en dessous du seuil
    let notificationMessage = null;
    if (
      account.lowBalanceThreshold !== null &&
      newBalance < account.lowBalanceThreshold
    ) {
      notificationMessage = `Attention: le solde de votre compte est en dessous du seuil de ${account.lowBalanceThreshold}`;
    }

    // Répondre avec la transaction ajoutée, le nouveau solde et une notification éventuelle
    res.status(201).json({
      message: "Transaction ajoutée avec succès",
      transaction: transaction,
      newBalance: newBalance,
      notification: notificationMessage,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la transaction:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de l'ajout de la transaction",
    });
  }
}



async function getTransactionHistory(req, res) {
  const userId = req.session.userId;
  const accountId = parseInt(req.params.accountId, 10);
  const { type, startDate, endDate, period } = req.query;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour voir les transactions" });
  }

  try {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    let transactionFilters = { accountId: accountId };

    if (type) {
      transactionFilters.type = type;
    }

    // Gestion du filtrage par date
    transactionFilters.date = {};

    // Priorité au filtrage par période si "period" est spécifié
    if (period) {
      const days = parseInt(period, 10);
      if (!isNaN(days) && days > 0) {
        const startPeriodDate = new Date();
        startPeriodDate.setDate(startPeriodDate.getDate() - days);
        transactionFilters.date.gte = startPeriodDate;
      }
    } else {
      // Sinon, appliquer les filtres "startDate" et "endDate" si présents
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start)) {
          transactionFilters.date.gte = start;
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end)) {
          transactionFilters.date.lte = end;
        }
      }
    }

    // Récupérer les transactions avec les filtres appliqués
    const transactions = await prisma.transaction.findMany({
      where: transactionFilters,
      select: {
        id: true,
        date: true,
        type: true,
        amount: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: "Aucune transaction trouvée pour les critères spécifiés",
      });
    }

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération des transactions",
    });
  }
}

async function getTotalBalance(req, res) {
  const userId = req.session.userId;

  // Vérification de l'utilisateur connecté
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour voir le solde total" });
  }

  try {
    // Récupérer tous les comptes de l'utilisateur
    const accounts = await prisma.account.findMany({
      where: { userId: userId },
      select: {
        balance: true,
      },
    });

    // Calculer le solde total
    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );

    res.status(200).json({ totalBalance });
  } catch (error) {
    console.error("Erreur lors de la récupération du solde total:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la récupération du solde total",
    });
  }
}
async function updateThreshold(req, res) {
  const userId = req.session.userId;
  const accountId = parseInt(req.params.accountId, 10); // Récupère l'ID du compte depuis les paramètres de l'URL
  const { lowBalanceThreshold } = req.body;

  if (!userId) {
    return res.status(401).json({
      error: "Veuillez vous connecter pour définir un seuil de solde bas",
    });
  }

  try {
    // Vérifier que le compte appartient à l'utilisateur
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    // Mettre à jour le seuil de solde bas pour ce compte
    await prisma.account.update({
      where: { id: accountId },
      data: { lowBalanceThreshold },
    });

    res
      .status(200)
      .json({ message: "Seuil de solde bas mis à jour avec succès" });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du seuil de solde bas:",
      error
    );
    res.status(500).json({
      error: "Une erreur est survenue lors de la mise à jour du seuil",
    });
  }
}
async function downloadTransactionHistory(req, res) {
  const userId = req.session.userId;
  const accountId = parseInt(req.params.accountId, 10);

  if (!userId) {
    return res.status(401).json({
      error:
        "Veuillez vous connecter pour télécharger l'historique des transactions",
    });
  }

  try {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId: accountId },
      select: {
        date: true,
        type: true,
        amount: true,
        balanceAfterTransaction: true,
        // Account: { select: { balance: true } },
      },
      orderBy: {
        date: "desc",
      },
    });

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucune transaction trouvée pour ce compte" });
    }

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "date", title: "Date" },
        { id: "type", title: "Type" },
        { id: "amount", title: "Montant" },
        { id: "balanceAfterTransaction", title: "Solde" },
      ],
    });

    const records = transactions.map((transaction) => ({
      date: transaction.date.toISOString(),
      type: transaction.type,
      amount: transaction.amount,
      balanceAfterTransaction: transaction.balanceAfterTransaction,
      // balance: transaction.Account.balance,
    }));

    const csv =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transactions_account_${accountId}.csv"`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error(
      "Erreur lors du téléchargement de l'historique des transactions:",
      error
    );
    res.status(500).json({
      error: "Une erreur est survenue lors du téléchargement du fichier CSV",
    });
  }
}

async function getUserProfile(req, res) {
  const userId = req.session.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour accéder au profil" });
  }

  try {
    // Récupérer l'utilisateur par ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la récupération du profil utilisateur",
    });
  }
}

async function updateUserProfile(req, res) {
  const userId = req.session.userId;
  const { name, email } = req.body;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour modifier votre profil" });
  }

  try {
    // Vérifier si l'utilisateur existe dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Mettre à jour les informations de l'utilisateur avec les nouvelles données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || user.name, // Garde l'ancien nom si aucun nouveau nom n'est fourni
        email: email || user.email, // Garde l'ancien email si aucun nouvel email n'est fourni
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.status(200).json({
      message: "Profil mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la mise à jour du profil utilisateur",
    });
  }
}
async function deleteBankAccount(req, res) {
  const userId = req.session.userId;
  const accountId = parseInt(req.params.accountId, 10); // Récupérer l'ID du compte à supprimer

  // Vérification que l'utilisateur est authentifié
  if (!userId) {
    return res.status(401).json({
      error: "Veuillez vous connecter pour supprimer un compte bancaire",
    });
  }

  try {
    // Vérifier que le compte appartient à l'utilisateur
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return res.status(404).json({
        error: "Compte bancaire non trouvé ou vous n'y avez pas accès",
      });
    }

    // Supprimer toutes les transactions associées à ce compte
    await prisma.transaction.deleteMany({
      where: { accountId: accountId },
    });

    // Supprimer le compte bancaire
    await prisma.account.delete({
      where: { id: accountId },
    });

    // Calculer le nouveau solde total de l'utilisateur
    const totalBalance = await prisma.account.aggregate({
      where: { userId: userId },
      _sum: { balance: true },
    });

    // Répondre avec un message de succès et le solde mis à jour
    res.status(200).json({
      message:
        "Compte bancaire supprimé avec succès. L'historique des transactions a été effacé.",
      totalBalance: totalBalance._sum.balance || 0,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du compte bancaire:", error);
    res.status(500).json({
      error:
        "Une erreur est survenue lors de la suppression du compte bancaire",
    });
  }
}

module.exports = {
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
};
