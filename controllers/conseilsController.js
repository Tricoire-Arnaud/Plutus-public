import models from "../models/index.js";
import { startOfMonth, endOfMonth } from "date-fns";
import numeral from "numeral";
import logger from "../utils/logger.js";
import IAPredictor from "../models/IAPredictor.js";
import { Op } from "sequelize";

const { Expense, Revenu, Charge, Category } = models;

// Initialiser l'IA une seule fois au démarrage
let iaInitialized = false;
async function initializeIA() {
  if (!iaInitialized) {
    try {
      global.iaPredictor = new IAPredictor();
      const modeleExistant = await global.iaPredictor.chargerModele();
      if (!modeleExistant) {
        await global.iaPredictor.createModel();
      }
      iaInitialized = true;
    } catch (error) {
      logger.error("Erreur lors de l'initialisation de l'IA:", error);
    }
  }
}

initializeIA();

// Fonctions utilitaires extraites
const mapperCategorie = (categorie) => {
  const mapping = {
    alimentation: ["alimentation", "courses", "nourriture", "restaurant"],
    transport: [
      "transport",
      "voiture",
      "essence",
      "carburant",
      "avion",
      "train",
      "bus",
      "moto",
      "velo",
    ],
    loisirs: [
      "loisirs",
      "sorties",
      "sport",
      "culture",
      "cinema",
      "theatre",
      "concert",
      "festival",
      "voyage",
      "vacances",
      "jeux",
    ],
    sante: ["sante", "medical", "pharmacie"],
    education: ["education", "formation", "etudes", "cours", "formation"],
    divers: ["divers", "autre"],
  };

  for (const [cat, aliases] of Object.entries(mapping)) {
    if (aliases.includes(categorie.toLowerCase())) return cat;
  }
  return "divers";
};

const getIconeCategorie = (categorie) => {
  const icones = {
    alimentation: "utensils",
    transport: "car",
    loisirs: "gamepad",
    sante: "heartbeat",
    education: "graduation-cap",
    divers: "box",
  };
  return icones[categorie] || "circle";
};

const capitalizeFirstLetter = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

const conseilsController = {
  async getConseilsPage(req, res) {
    try {
      const userId = req.session.userId;
      const today = new Date();
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(today);

      // Récupération des données avec les catégories
      const [revenus, expenses, chargesFixes, chargesVariables, categories] =
        await Promise.all([
          Revenu.findAll({
            where: {
              user_id: userId,
              date: { [Op.between]: [startDate, endDate] },
            },
          }),
          Expense.findAll({
            where: {
              user_id: userId,
              date: { [Op.between]: [startDate, endDate] },
            },
            include: [{ model: Category }],
          }),
          Charge.findAll({
            where: {
              user_id: userId,
              type: "fixe",
            },
          }),
          Charge.findAll({
            where: {
              user_id: userId,
              type: "variable",
              date: { [Op.between]: [startDate, endDate] },
            },
          }),
          Category.findAll(),
        ]);

      // Calculs financiers exacts comme dans le dashboard
      const totalRevenus = revenus.reduce(
        (sum, rev) => sum + Number(rev.montant),
        0
      );

      const totalChargesFixes = chargesFixes.reduce(
        (sum, charge) => sum + Number(charge.montant),
        0
      );
      const totalChargesVariables = chargesVariables.reduce(
        (sum, charge) => sum + Number(charge.montant),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, exp) => sum + Number(exp.amount),
        0
      );

      // Calcul exact du montant disponible
      const montantDisponible =
        totalRevenus -
        totalChargesFixes -
        totalChargesVariables -
        totalExpenses;

      // Taux d'épargne basé sur le montant disponible
      const tauxEpargne = (montantDisponible / totalRevenus) * 100;

      // Analyse détaillée des dépenses par catégorie
      const depensesParCategorie = {};
      const categoriesMap = new Map(
        categories.map((cat) => [cat.id, cat.name.toLowerCase()])
      );

      // Initialiser toutes les catégories à 0
      const categoriesBase = [
        "alimentation",
        "transport",
        "loisirs",
        "sante",
        "education",
        "divers",
      ];
      for (const cat of categoriesBase) {
        depensesParCategorie[cat] = 0;
      }

      // Répartir les dépenses dans les catégories
      for (const expense of expenses) {
        const categorieName =
          categoriesMap.get(expense.category_id) || "divers";
        const categorieStandard = mapperCategorie(categorieName);
        depensesParCategorie[categorieStandard] =
          (depensesParCategorie[categorieStandard] || 0) +
          Number(expense.amount);
      }

      // Récupérer l'historique des 6 derniers mois
      const historiqueFinancier = await getHistoriqueFinancier(userId, 6);

      // Analyse des tendances avec l'IA
      const tendances = await global.iaPredictor.analyserTendances(
        historiqueFinancier
      );

      // Prédiction standard
      const donneesIA = {
        revenus: totalRevenus,
        depenses: totalExpenses,
        charges: totalChargesFixes + totalChargesVariables,
        tauxEpargne,
        depensesParCategorie,
        patterns: {
          epargneReguliere: montantDisponible > 0,
          depensesImpulsives:
            totalExpenses >
            (totalRevenus - totalChargesFixes - totalChargesVariables) * 0.8,
          risqueEndettement:
            totalChargesFixes + totalChargesVariables > totalRevenus * 0.4,
        },
        profil: {
          stabiliteEmploi: true,
          risquePerte: false,
          age: 30,
        },
        sante_financiere: {
          ratio_endettement:
            (totalChargesFixes + totalChargesVariables) / totalRevenus,
          couverture_charges:
            totalRevenus / ((totalChargesFixes + totalChargesVariables) * 12),
          diversification_revenus: 0.5,
        },
        comportement: {
          regularite_depenses: 0.8,
          adaptation_saisonniere: 1,
        },
      };

      // Obtenir les prédictions enrichies
      const [risque, prochaineDepenses] = await Promise.all([
        global.iaPredictor.predireRisque(donneesIA),
        global.iaPredictor.predireDepensesFutures(donneesIA),
      ]);

      // Enrichir les conseils avec les tendances
      const conseilsBase = await genererConseilsIA({
        totalRevenus,
        totalChargesFixes,
        totalChargesVariables,
        totalExpenses,
        tauxEpargne,
        depensesParCategorie,
        montantDisponible,
        moisActuel: new Date().getMonth() + 1,
      });

      const conseilsEnrichis = conseilsBase.map((conseil) => {
        // Extraire la catégorie du conseil
        const categorieConseil = conseil.titre
          .toLowerCase()
          .split(" ")
          .slice(1)
          .join(" ");

        return {
          ...conseil,
          contexte: {
            tendanceRisque: tendances?.tendanceRisque || {
              direction: "stable",
              variation: 0,
            },
            tendancesDepenses: tendances?.tendanceDepenses?.[
              categorieConseil
            ] || { direction: "stable", variation: 0 },
          },
          urgence: determinerUrgenceConseil(conseil, tendances),
        };
      });

      // Trier les conseils par urgence
      conseilsEnrichis.sort((a, b) => b.urgence - a.urgence);

      // Rendu de la vue avec données enrichies
      res.render("conseils", {
        predictions: {
          prochaineDepenses,
          risque,
          conseils: conseilsEnrichis,
          tendances,
        },
        historiqueFinancier: await getHistoriqueFinancier(userId, 6),
        numeral,
        startDate,
        endDate,
        totalRevenus,
        totalExpenses,
        totalChargesFixes,
        totalChargesVariables,
        montantDisponible,
        tauxEpargne,
        depensesParCategorie,
        capitalizeFirstLetter,
        getIconeCategorie,
        getExplicationSaisonniere,
      });
    } catch (error) {
      console.error("Erreur dans getConseilsPage:", error);
      res.status(500).render("error", {
        message: "Les oracles sont temporairement indisponibles",
      });
    }
  },
};

// Fonction utilitaire pour récupérer l'historique
async function getHistoriqueFinancier(userId, nombreMois) {
  const dateDebut = new Date();
  dateDebut.setMonth(dateDebut.getMonth() - nombreMois);

  const [revenus, expensesList, chargesList] = await Promise.all([
    Revenu.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: dateDebut },
      },
      order: [["date", "ASC"]],
    }),
    Expense.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: dateDebut },
      },
      order: [["date", "ASC"]],
    }),
    Charge.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: dateDebut },
      },
      order: [["date", "ASC"]],
    }),
  ]);

  // Agréger les données par mois
  const historiqueParMois = new Map();

  // Traiter les revenus
  for (const revenu of revenus) {
    const moisCle = revenu.date.toISOString().slice(0, 7);
    if (!historiqueParMois.has(moisCle)) {
      historiqueParMois.set(moisCle, {
        revenus: 0,
        depenses: 0,
        charges: 0,
        tauxEpargne: 0,
        patterns: {
          epargneReguliere: true,
          depensesImpulsives: false,
          risqueEndettement: false,
        },
      });
    }
    historiqueParMois.get(moisCle).revenus += Number(revenu.montant);
  }

  // Traiter les dépenses
  for (const expense of expensesList) {
    const moisCle = expense.date.toISOString().slice(0, 7);
    if (historiqueParMois.has(moisCle)) {
      historiqueParMois.get(moisCle).depenses += Number(expense.amount);
    }
  }

  // Traiter les charges
  for (const charge of chargesList) {
    const moisCle = charge.date.toISOString().slice(0, 7);
    if (historiqueParMois.has(moisCle)) {
      historiqueParMois.get(moisCle).charges += Number(charge.montant);
    }
  }

  // Calculer les métriques pour chaque mois
  for (const donnees of historiqueParMois.values()) {
    const montantDisponible =
      donnees.revenus - donnees.depenses - donnees.charges;
    donnees.tauxEpargne = (montantDisponible / donnees.revenus) * 100;
    donnees.patterns.epargneReguliere = montantDisponible > 0;
    donnees.patterns.depensesImpulsives =
      donnees.depenses > (donnees.revenus - donnees.charges) * 0.8;
    donnees.patterns.risqueEndettement =
      donnees.charges / donnees.revenus > 0.4;
  }

  return Array.from(historiqueParMois.values());
}

function determinerUrgenceConseil(conseil, tendances) {
  let score = 0;

  // Score basé sur le type de conseil
  switch (conseil.priorite) {
  case "urgente":
    score += 100;
    break;
  case "haute":
    score += 75;
    break;
  case "moyenne":
    score += 50;
    break;
  case "info":
    score += 25;
    break;
  }

  // Vérifier que tendances existe avant d'accéder à ses propriétés
  if (tendances?.tendanceRisque?.direction === "hausse") {
    score += 50;
  }

  // Extraire la catégorie du titre du conseil
  const categorieConseil = conseil.titre
    .toLowerCase()
    .split(" ")
    .slice(1)
    .join(" ");
  const tendanceCategorie = tendances?.tendanceDepenses?.[categorieConseil];

  if (tendanceCategorie?.direction === "hausse") {
    score += 25;
  }

  return score;
}

// Fonction utilitaire pour générer les conseils
const genererConseilsIA = async ({
  totalRevenus,
  totalChargesFixes,
  totalChargesVariables,
  totalExpenses,
  tauxEpargne,
  depensesParCategorie,
  montantDisponible,
  moisActuel,
}) => {
  const conseils = [];

  // Analyse plus fine du profil financier
  const profilFinancier = {
    type:
      tauxEpargne > 30
        ? "aise"
        : tauxEpargne > 10
          ? "equilibre"
          : tauxEpargne > 0
            ? "serre"
            : "difficulte",
    ratioCharges: (totalChargesFixes + totalChargesVariables) / totalRevenus,
    ratioDepenses:
      totalExpenses / (montantDisponible > 0 ? montantDisponible : 1),
    couvertureMensuelle:
      montantDisponible / (totalChargesFixes + totalChargesVariables),
  };

  // Conseils basés sur les événements à venir
  const evenementsAVenir = {
    11: {
      // Décembre
      nom: "Fêtes de fin d'année",
      conseils: [
        {
          titre: '<i class="fas fa-gifts"></i> Préparation des fêtes',
          description: `Budget fêtes conseillé : ${numeral(
            totalRevenus * 0.1
          ).format("0,0")}€`,
          action:
            "1. Établissez une liste précise des cadeaux\n2. Comparez les prix en ligne\n3. Profitez des promotions anticipées\n4. Prévoyez un budget repas séparé",
          priorite: "haute",
        },
      ],
    },
    7: {
      // Août
      nom: "Rentrée scolaire",
      conseils: [
        {
          titre: '<i class="fas fa-graduation-cap"></i> Préparation rentrée',
          description: `Budget rentrée suggéré : ${numeral(
            totalRevenus * 0.15
          ).format("0,0")}€`,
          action:
            "1. Listez les fournitures nécessaires\n2. Comparez les prix entre enseignes\n3. Privilégiez les achats groupés\n4. Vérifiez les aides disponibles",
          priorite: "haute",
        },
      ],
    },
    5: {
      // Juin
      nom: "Préparation vacances",
      conseils: [
        {
          titre: '<i class="fas fa-umbrella-beach"></i> Budget vacances',
          description: `Enveloppe suggérée : ${numeral(
            totalRevenus * 0.2
          ).format("0,0")}€`,
          action:
            "1. Réservez tôt pour les meilleurs tarifs\n2. Comparez les destinations\n3. Prévoyez un budget quotidien\n4. Gardez une marge pour les imprévus",
          priorite: "moyenne",
        },
      ],
    },
    1: {
      // Février
      nom: "Soldes d'hiver",
      conseils: [
        {
          titre: '<i class="fas fa-tags"></i> Optimisation soldes',
          description: "Période propice aux achats malins",
          action:
            "1. Listez vos besoins réels\n2. Comparez les prix avant/pendant\n3. Privilégiez les articles essentiels\n4. Fixez-vous un budget maximum",
          priorite: "info",
        },
      ],
    },
    6: {
      // Juillet
      nom: "Soldes d'été",
      conseils: [
        {
          titre: '<i class="fas fa-sun"></i> Préparation soldes',
          description: "Opportunité d'économies",
          action:
            "1. Établissez une liste de priorités\n2. Recherchez les meilleures offres\n3. Évitez les achats impulsifs\n4. Vérifiez les prix avant/après",
          priorite: "info",
        },
      ],
    },
  };

  // Ajouter les conseils saisonniers si pertinents
  const conseilsSaisonniers = evenementsAVenir[moisActuel];
  if (conseilsSaisonniers) {
    conseils.push(...conseilsSaisonniers.conseils);
  }

  // Conseils d'optimisation par catégorie
  for (const [categorie, montant] of Object.entries(depensesParCategorie)) {
    const ratioCategorie = montant / totalRevenus;

    if (ratioCategorie > 0.2) {
      const suggestions = {
        alimentation: [
          "Planifiez les menus à l'avance",
          "Privilégiez les achats en gros",
          "Utilisez une application anti-gaspi",
          "Comparez les prix entre enseignes",
          "Optez pour les marques distributeurs",
          "Profitez des promotions sur les produits non périssables",
        ],
        transport: [
          "Optimisez vos trajets",
          "Vérifiez les offres de covoiturage",
          "Comparez les prix des carburants",
          "Étudiez les abonnements transport",
          "Entretenez régulièrement votre véhicule",
          "Privilégiez les modes de transport doux",
        ],
        loisirs: [
          "Recherchez les offres promotionnelles",
          "Utilisez les cartes de fidélité",
          "Profitez des périodes creuses",
          "Comparez les abonnements",
          "Explorez les activités gratuites",
          "Privilégiez les pass multi-activités",
        ],
        sante: [
          "Vérifiez vos remboursements",
          "Comparez les mutuelles",
          "Privilégiez les génériques",
          "Anticipez les dépenses régulières",
          "Profitez des bilans gratuits",
          "Optimisez votre couverture santé",
        ],
        education: [
          "Explorez les aides disponibles",
          "Achetez les fournitures en avance",
          "Privilégiez l'occasion",
          "Comparez les formations",
          "Mutualisez les ressources",
          "Profitez des réductions étudiantes",
        ],
        divers: [
          "Analysez chaque dépense",
          "Identifiez les économies possibles",
          "Regroupez vos achats",
          "Négociez les tarifs",
          "Comparez les offres",
          "Évitez les achats impulsifs",
        ],
      };

      conseils.push({
        titre: '<i class="fas fa-chart-bar"></i> Optimisation ${categorie}',
        description: `Cette catégorie représente ${(
          ratioCategorie * 100
        ).toFixed(1)}% de vos revenus`,
        action:
          suggestions[categorie]?.join("\n") ||
          "Analysez en détail ces dépenses",
        priorite: ratioCategorie > 0.3 ? "haute" : "moyenne",
      });
    }
  }

  // Conseils spécifiques selon le profil
  switch (profilFinancier.type) {
  case "difficulte":
    conseils.push({
      titre: '<i class="fas fa-exclamation-circle"></i> Plan d\'urgence financier',
      description: "Situation nécessitant des actions immédiates",
      action: "1. Identifiez les dépenses non essentielles à supprimer\n2. Contactez vos créanciers pour négocier\n3. Recherchez des aides sociales disponibles\n4. Établissez un budget strict",
      priorite: "urgente",
    });
    conseils.push({
      titre: '<i class="fas fa-bolt"></i> Réduction des charges',
      description: "Optimisation urgente des dépenses fixes",
      action: "1. Renégociez vos contrats (téléphone, internet, assurances)\n2. Étudiez les possibilités de changement de logement\n3. Optimisez votre consommation d'énergie\n4. Révisez tous vos abonnements",
      priorite: "urgente",
    });
    break;

  case "serre":
    conseils.push({
      titre: '<i class="fas fa-exclamation-triangle"></i> Optimisation budgétaire',
      description: `Objectif : augmenter l'épargne de ${(10 - tauxEpargne).toFixed(1)}%`,
      action: "1. Révisez chaque poste de dépense\n2. Mettez en place des virements automatiques\n3. Utilisez une application de suivi budgétaire\n4. Fixez-vous des objectifs mensuels",
      priorite: "haute",
    });
    conseils.push({
      titre: '<i class="fas fa-chart-line"></i> Amélioration des revenus',
      description: "Exploration des sources de revenus complémentaires",
      action: "1. Évaluez les opportunités de revenus additionnels\n2. Développez vos compétences professionnelles\n3. Explorez le marché de l'emploi\n4. Valorisez vos actifs non utilisés",
      priorite: "moyenne",
    });
    break;

  case "equilibre":
    conseils.push({
      titre: '<i class="fas fa-star"></i> Optimisation patrimoniale',
      description: "Votre situation permet d'envisager des investissements",
      action: "1. Diversifiez votre épargne\n2. Étudiez les placements long terme\n3. Optimisez votre fiscalité\n4. Consultez un conseiller financier",
      priorite: "moyenne",
    });
    conseils.push({
      titre: '<i class="fas fa-bullseye"></i> Objectifs financiers',
      description: "Définition d'objectifs à moyen terme",
      action: "1. Établissez un plan d'épargne projet\n2. Évaluez les investissements possibles\n3. Préparez votre retraite\n4. Protégez votre patrimoine",
      priorite: "info",
    });
    break;

  case "aise":
    conseils.push({
      titre: '<i class="fas fa-gem"></i> Stratégie patrimoniale',
      description: "Optimisation et développement du patrimoine",
      action: "1. Diversifiez vos investissements\n2. Optimisez votre fiscalité\n3. Développez votre patrimoine immobilier\n4. Préparez la transmission",
      priorite: "info",
    });
    conseils.push({
      titre: '<i class="fas fa-crown"></i> Développement financier',
      description: "Opportunités de croissance patrimoniale",
      action: "1. Explorez les investissements innovants\n2. Étudiez les opportunités d'entreprise\n3. Optimisez votre structure patrimoniale\n4. Planifiez le long terme",
      priorite: "info",
    });
    break;
  }

  // Conseils d'épargne personnalisés
  if (montantDisponible > 0) {
    const objectifEpargne = Math.min(montantDisponible * 0.3, 1000);
    conseils.push({
      titre: '<i class="fas fa-piggy-bank"></i> Stratégie d\'épargne',
      description: `Potentiel d'épargne : ${numeral(objectifEpargne).format(
        "0,0"
      )}€/mois`,
      action: `1. Automatisez un virement épargne mensuel\n2. Visez ${numeral(
        objectifEpargne
      ).format(
        "0,0"
      )}€ d'économies ce mois\n3. Diversifiez vos placements\n4. Gardez une réserve de sécurité`,
      priorite: "moyenne",
    });

    // Conseil sur la réserve de sécurité
    const reserveIdeale = (totalChargesFixes + totalChargesVariables) * 3;
    if (montantDisponible < reserveIdeale) {
      conseils.push({
        titre: '<i class="fas fa-shield-alt"></i> Réserve de sécurité',
        description: `Objectif : ${numeral(reserveIdeale).format(
          "0,0"
        )}€ (3 mois de charges)`,
        action:
          "1. Constituez une épargne de précaution\n2. Privilégiez un compte épargne disponible\n3. Évitez les placements risqués\n4. Maintenez cette réserve intacte",
        priorite: "haute",
      });
    }
  }

  return conseils;
};

// Modifier la fonction getExplicationSaisonniere pour prendre en compte la variation réelle
function getExplicationSaisonniere(categorie, mois, variation) {
  // Si la variation est 0
  if (variation === 0) {
    const explicationsStables = {
      alimentation:
        "L'IA prévoit une stabilité des dépenses alimentaires basée sur vos habitudes d'achat régulières et les prix constants du marché",
      transport:
        "Prévision de dépenses transport stables : maintien de vos trajets habituels et pas de variation significative des prix du carburant",
      loisirs:
        "L'analyse de vos habitudes de loisirs indique une continuité dans vos activités, sans événement particulier ce mois-ci",
      sante:
        "Dépenses de santé prévisibles et stables, basées sur vos soins réguliers et traitements habituels",
      education:
        "Période standard pour les dépenses de formation, sans échéance particulière de paiement",
      divers:
        "L'IA n'anticipe pas de changement dans vos dépenses diverses ce mois-ci",
    };
    return (
      explicationsStables[categorie] ||
      "Dépenses stables selon l'analyse prédictive"
    );
  }

  const explications = {
    alimentation: {
      variations: {
        positive: {
          11: `Hausse prévue de ${variation.toFixed(
            1
          )}% : préparation des fêtes, augmentation saisonnière des prix alimentaires et tendance aux achats festifs`,
          12: `Pic anticipé (+${variation.toFixed(
            1
          )}%) : repas de fêtes, réceptions et produits premium pour les célébrations`,
          6: `Augmentation estivale de ${variation.toFixed(
            1
          )}% : produits frais plus chers, plus de repas hors domicile`,
          7: `Hausse vacances de ${variation.toFixed(
            1
          )}% : restauration extérieure et achats de confort`,
          default: `Augmentation prévue de ${variation.toFixed(
            1
          )}% basée sur l'analyse des prix et de vos habitudes`,
        },
        negative: {
          1: `Baisse post-fêtes de ${Math.abs(variation).toFixed(
            1
          )}% : retour aux achats habituels`,
          9: `Réduction de ${Math.abs(variation).toFixed(
            1
          )}% : fin des dépenses estivales, retour à la normale`,
          default: `Diminution prévue de ${Math.abs(variation).toFixed(
            1
          )}% selon l'analyse des tendances`,
        },
      },
    },
    transport: {
      variations: {
        positive: {
          6: `Hausse de ${variation.toFixed(
            1
          )}% : déplacements vacances (carburant, péages, billets)`,
          7: `Augmentation de ${variation.toFixed(
            1
          )}% : pics des voyages estivaux`,
          8: `Hausse de ${variation.toFixed(
            1
          )}% : renouvellement des abonnements et reprise`,
          9: `+${variation.toFixed(
            1
          )}% : intensification des déplacements quotidiens`,
          default: `Augmentation de ${variation.toFixed(
            1
          )}% prévue dans vos déplacements`,
        },
        negative: {
          1: `Baisse de ${Math.abs(variation).toFixed(
            1
          )}% : période calme post-fêtes`,
          2: `Réduction de ${Math.abs(variation).toFixed(
            1
          )}% : moins de déplacements en hiver`,
          default: `Diminution de ${Math.abs(variation).toFixed(
            1
          )}% prévue dans vos transports`,
        },
      },
    },
    loisirs: {
      variations: {
        positive: {
          11: `Hausse festive de ${variation.toFixed(
            1
          )}% : sorties et activités de fin d'année`,
          12: `Pic de ${variation.toFixed(
            1
          )}% : dépenses de loisirs liées aux fêtes`,
          6: `Augmentation estivale de ${variation.toFixed(
            1
          )}% : activités extérieures et vacances`,
          7: `+${variation.toFixed(1)}% : pic des activités de loisirs d'été`,
          default: `Hausse prévue de ${variation.toFixed(
            1
          )}% dans vos activités de loisirs`,
        },
        negative: {
          1: `Baisse de ${Math.abs(variation).toFixed(
            1
          )}% : retour au calme après les fêtes`,
          9: `Réduction de ${Math.abs(variation).toFixed(
            1
          )}% : fin de la période estivale`,
          default: `Diminution anticipée de ${Math.abs(variation).toFixed(
            1
          )}% des dépenses loisirs`,
        },
      },
    },
    sante: {
      variations: {
        positive: {
          1: `Hausse de ${variation.toFixed(
            1
          )}% : renouvellements et consultations annuelles`,
          9: `Augmentation de ${variation.toFixed(
            1
          )}% : visites médicales de rentrée`,
          default: `Hausse prévue de ${variation.toFixed(
            1
          )}% des dépenses de santé`,
        },
        negative: {
          7: `Baisse de ${Math.abs(variation).toFixed(
            1
          )}% : période calme habituelle`,
          default: `Réduction anticipée de ${Math.abs(variation).toFixed(
            1
          )}% des frais médicaux`,
        },
      },
    },
    education: {
      variations: {
        positive: {
          8: `Hausse de ${variation.toFixed(
            1
          )}% : dépenses de rentrée (inscriptions, fournitures)`,
          9: `Pic de ${variation.toFixed(
            1
          )}% : frais de scolarité et formations`,
          1: `Augmentation de ${variation.toFixed(1)}% : nouvelles formations`,
          default: `Hausse prévue de ${variation.toFixed(
            1
          )}% des frais d'éducation`,
        },
        negative: {
          5: `Baisse de ${Math.abs(variation).toFixed(
            1
          )}% : fin d'année scolaire`,
          6: `Réduction de ${Math.abs(variation).toFixed(
            1
          )}% : période pré-rentrée`,
          default: `Diminution prévue de ${Math.abs(variation).toFixed(
            1
          )}% des dépenses éducatives`,
        },
      },
    },
    divers: {
      variations: {
        positive: {
          11: `Hausse de ${variation.toFixed(
            1
          )}% : dépenses diverses de fin d'année`,
          8: `Augmentation de ${variation.toFixed(
            1
          )}% : préparation de rentrée`,
          default: `Hausse prévue de ${variation.toFixed(
            1
          )}% des dépenses diverses`,
        },
        negative: {
          1: `Baisse de ${Math.abs(variation).toFixed(
            1
          )}% : retour à la normale`,
          default: `Réduction anticipée de ${Math.abs(variation).toFixed(
            1
          )}% des dépenses diverses`,
        },
      },
    },
  };

  const direction = variation > 0 ? "positive" : "negative";
  const variationExplications = explications[categorie]?.variations[direction];

  if (!variationExplications) {
    return `L'IA prévoit une ${
      variation > 0 ? "augmentation" : "diminution"
    } de ${Math.abs(variation).toFixed(
      1
    )}% des dépenses ${categorie} basée sur l'analyse de vos habitudes`;
  }

  return variationExplications[mois] || variationExplications.default;
}

export { conseilsController as default, getExplicationSaisonniere };
