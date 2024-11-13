// controllers/userController.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// Signup function
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

    res
      .status(200)
      .json({
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
    res
      .status(500)
      .json({
        error: "Une erreur est survenue lors de la récupération des comptes",
      });
  }
}
// Fonction pour obtenir les transactions d'un compte spécifique
async function getTransactions(req, res) {
  const userId = req.session.userId;
  const accountId = req.params.accountId;

  if (!userId) {
    return res.status(401).json({ error: "Veuillez vous connecter pour voir les transactions" });
  }

  try {
    // Convertir accountId en entier
    const accountIdInt = parseInt(accountId, 10);

    // Vérifier que le compte appartient à l'utilisateur
    const account = await prisma.account.findFirst({
      where: { id: accountIdInt, userId: userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    // Récupérer les transactions du compte spécifié
    const transactions = await prisma.transaction.findMany({
      where: { accountId: accountIdInt },
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
      },
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des transactions" });
  }
}


// Fonction pour ajouter un compte bancaire
async function addAccount(req, res) {
  const userId = req.session.userId; // Vérifier que l'utilisateur est connecté
  const { name, type } = req.body; // Récupérer les données du formulaire

  if (!userId) {
    return res
      .status(401)
      .json({
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
  const { type, amount, date } = req.body;
  const accountId = parseInt(req.params.accountId, 10); // Récupérer accountId depuis l'URL

  if (!userId) {
    return res
      .status(401)
      .json({ error: "Veuillez vous connecter pour ajouter une transaction" });
  }

  if (!accountId || !type || amount === undefined || amount <= 0) {
    return res
      .status(400)
      .json({ error: "Type de transaction, montant positif et compte requis" });
  }

  try {
    // Récupérer le compte pour vérifier son solde et le propriétaire
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    // Vérifier si le retrait est possible sans solde négatif
    if (type === "retrait" && account.balance < amount) {
      return res
        .status(400)
        .json({ error: "Solde insuffisant pour effectuer ce retrait" });
    }

    const newBalance =
      type === "dépôt" ? account.balance + amount : account.balance - amount;

    const transaction = await prisma.transaction.create({
      data: {
        accountId: accountId,
        type: type,
        amount: amount,
        date: date || new Date(),
      },
    });

    await prisma.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });

    res.status(201).json({
      message: "Transaction ajoutée avec succès",
      transaction: transaction,
      newBalance: newBalance,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Une erreur est survenue lors de l'ajout de la transaction",
      });
  }
}

async function getTransactionHistory(req, res) {
  const userId = req.session.userId;
  const accountId = parseInt(req.params.accountId, 10);
  const { type, startDate, endDate } = req.query; // Récupération des filtres de la requête

  // Vérification de l'utilisateur connecté
  if (!userId) {
    return res.status(401).json({ error: "Veuillez vous connecter pour voir les transactions" });
  }

  try {
    // Vérification de l'existence du compte et du propriétaire
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: userId },
    });

    if (!account) {
      return res.status(404).json({ error: "Compte non trouvé" });
    }

    // Préparation des filtres pour les transactions
    let transactionFilters = { accountId: accountId };

    if (type) {
      transactionFilters.type = type;
    }

    if (startDate && endDate) {
      transactionFilters.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
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
        date: 'desc', // Trie les transactions par date (les plus récentes en premier)
      },
    });

    if (transactions.length === 0) {
      return res.status(404).json({ message: "Aucune transaction trouvée pour les critères spécifiés" });
    }

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des transactions" });
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
};
