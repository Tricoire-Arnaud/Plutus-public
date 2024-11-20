import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importer la configuration depuis le fichier .cjs
const config = (await import(path.join(__dirname, '../config/database.cjs'))).default;

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Créer l'instance Sequelize avec la configuration complète
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Tester la connexion avant d'initialiser les modèles
await sequelize.authenticate();

// Importer les modèles de manière synchrone
const User = (await import("./User.js")).default;
const Category = (await import("./Category.js")).default;
const Transaction = (await import("./Transaction.js")).default;
const Budget = (await import("./Budget.js")).default;
const Revenu = (await import("./Revenu.js")).default;
const Expense = (await import("./Expense.js")).default;
const Charge = (await import("./Charge.js")).default;
const Emprunt = (await import("./Emprunt.js")).default;
const Remboursement = (await import("./Remboursement.js")).default;

// Initialiser les modèles
const models = {
  User: User(sequelize),
  Category: Category(sequelize),
  Transaction: Transaction(sequelize),
  Budget: Budget(sequelize),
  Revenu: Revenu(sequelize),
  Expense: Expense(sequelize),
  Charge: Charge(sequelize),
  Emprunt: Emprunt(sequelize),
  Remboursement: Remboursement(sequelize),
  sequelize,
  Sequelize
};

// Définir les associations
for (const model of Object.values(models)) {
  if (model.associate) {
    model.associate(models);
  }
}

export default models;
