import models from "../models/index.js";
import bcrypt from "bcryptjs";
import {
  format,
  addDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";

const {
  User,
  Category,
  Revenu,
  Expense,
  Charge,
  Budget,
  Emprunt,
  Remboursement,
  sequelize,
} = models;

async function seedDatabase() {
  try {
    await sequelize.sync({ force: true });

    // Créer un utilisateur
    const hashedPassword = await bcrypt.hash("toto", 10);
    const user = await User.create({
      username: "toto",
      email: "toto@toto.com",
      password: hashedPassword,
      role: "admin",
    });

    // Créer des catégories
    const categories = await Category.bulkCreate([
      { name: "Alimentation" },
      { name: "Transport" },
      { name: "Loisirs" },
      { name: "Sante" },
      { name: "Education" },
      { name: "Divers" },
    ]);

    // Générer des données pour les 12 derniers mois
    const today = new Date();
    const startDate = subMonths(startOfMonth(today), 11); // Commencer il y a 11 mois

    // Configuration des revenus avec variations saisonnières
    const revenuBase = 2800;
    const variationsRevenus = {
      5: 1.1, // Prime en juin
      11: 1.2, // Prime en décembre
    };

    // Configuration des charges fixes avec variations saisonnières
    const chargesFixesBase = [
      {
        nom: "Loyer",
        montant: 850,
        type: "fixe",
        variations: {}, // Le loyer ne varie pas
      },
      {
        nom: "Internet",
        montant: 40,
        type: "fixe",
        variations: {}, // Internet non plus
      },
      {
        nom: "Assurance habitation",
        montant: 25,
        type: "fixe",
        variations: {}, // L'assurance non plus
      },
      {
        nom: "Électricité",
        montant: 75,
        type: "variable",
        variations: {
          0: 1.3,
          1: 1.3,
          2: 1.2, // Plus en hiver
          6: 0.8,
          7: 0.8,
          8: 0.8, // Moins en été
        },
      },
      {
        nom: "Transport",
        montant: 75,
        type: "variable",
        variations: {
          6: 0.7,
          7: 0.6, // Moins en été
          8: 1.2,
          9: 1.1, // Plus à la rentrée
        },
      },
    ];

    // Configuration des dépenses par catégorie avec variations saisonnières
    const depensesConfig = {
      Alimentation: {
        base: { min: 300, max: 500 },
        variations: {
          11: 1.3, // Plus en décembre
          6: 1.1,
          7: 1.1, // Plus en été
        },
      },
      Transport: {
        base: { min: 100, max: 200 },
        variations: {
          6: 1.2,
          7: 1.3, // Plus en été
          8: 1.2, // Rentrée
        },
      },
      Loisirs: {
        base: { min: 100, max: 300 },
        variations: {
          6: 1.5,
          7: 1.5, // Vacances d'été
          11: 1.3,
          12: 1.4, // Fêtes
        },
      },
      Sante: {
        base: { min: 30, max: 100 },
        variations: {
          0: 1.2,
          1: 1.2,
          2: 1.2, // Plus en hiver
        },
      },
      Education: {
        base: { min: 20, max: 80 },
        variations: {
          8: 2.0,
          9: 1.5, // Rentrée scolaire
        },
      },
      Divers: {
        base: { min: 50, max: 150 },
        variations: {
          11: 1.5, // Achats de Noël
        },
      },
    };

    // Générer les données mois par mois
    for (let i = 0; i < 12; i++) {
      const currentMonth = addMonths(startDate, i);
      const monthIndex = currentMonth.getMonth();

      // Créer le revenu du mois
      const revenuMois = revenuBase * (variationsRevenus[monthIndex] || 1);
      await Revenu.create({
        user_id: user.id,
        montant: Math.round(revenuMois),
        description: "Salaire",
        date: format(currentMonth, "yyyy-MM-dd"),
      });

      // Créer les charges du mois
      for (const charge of chargesFixesBase) {
        // Pour les charges fixes, on ne les crée qu'une seule fois
        if (charge.type === "fixe" && i > 0) continue;

        const montantCharge =
          charge.montant * (charge.variations[monthIndex] || 1);
        await Charge.create({
          user_id: user.id,
          montant: Math.round(montantCharge),
          description: charge.nom,
          date: format(currentMonth, "yyyy-MM-dd"),
          type: charge.type,
        });
      }

      // Créer les dépenses du mois pour chaque catégorie
      for (const [categorieName, config] of Object.entries(depensesConfig)) {
        const variation = config.variations[monthIndex] || 1;
        const baseAmount =
          config.base.min + Math.random() * (config.base.max - config.base.min);
        const montantFinal = baseAmount * variation;

        // Diviser le montant en plusieurs dépenses
        const nbTransactions = 3 + Math.floor(Math.random() * 5); // 3 à 7 transactions
        const montantMoyen = montantFinal / nbTransactions;

        for (let j = 0; j < nbTransactions; j++) {
          // Variation aléatoire autour du montant moyen
          const montantTransaction = montantMoyen * (0.7 + Math.random() * 0.6);

          await Expense.create({
            user_id: user.id,
            category_id: categories.find((c) => c.name === categorieName).id,
            amount: Math.round(montantTransaction),
            description: `Dépense ${categorieName.toLowerCase()}`,
            date: format(
              addDays(currentMonth, Math.floor(Math.random() * 28)),
              "yyyy-MM-dd"
            ),
          });
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors du remplissage de la base de données:", error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
