import express from "express";
import mainController from "./controllers/mainController.js";
import budgetController from "./controllers/budgetController.js";
import dashboardController from "./controllers/dashboardController.js";
import expenseController from "./controllers/expenseController.js";
import authController from "./controllers/authController.js";
import { isAuthenticated, isAdmin } from "./middlewares/auth.js";
import revenuController from "./controllers/revenuController.js";
import chargeController from "./controllers/chargeController.js";
import conseilsController from "./controllers/conseilsController.js";
import adminController from "./controllers/adminController.js";
import userController from "./controllers/userController.js";
import empruntController from "./controllers/empruntController.js";

const router = express.Router();

router.get("/", mainController.index);
router.get("/about", mainController.about);
router.get("/contact", mainController.contact);

router.get("/admin", isAuthenticated, isAdmin, adminController.getAdminPage);
router.post("/admin/users", isAuthenticated, isAdmin, adminController.addUser);
router.put(
  "/admin/users/:id",
  isAuthenticated,
  isAdmin,
  adminController.editUser
);
router.delete(
  "/admin/users/:id",
  isAuthenticated,
  isAdmin,
  adminController.deleteUser
);
router.post(
  "/admin/system-settings",
  isAuthenticated,
  isAdmin,
  adminController.updateSystemSettings
);

// Routes du tableau de bord
router.get("/dashboard", isAuthenticated, dashboardController.getDashboard);

// Routes des budgets
router.get("/budgets", isAuthenticated, budgetController.getBudgetPage);
router.post("/budgets", isAuthenticated, budgetController.createBudget);
router.put("/budgets", isAuthenticated, budgetController.updateBudget);
router.delete("/budgets/:id", isAuthenticated, budgetController.deleteBudget);

// Routes des dépenses
router.get("/depenses", isAuthenticated, expenseController.getExpensesPage);
router.post("/depenses", isAuthenticated, expenseController.createExpense);
router.put("/depenses/:id", isAuthenticated, expenseController.updateExpense);
router.delete(
  "/depenses/:id",
  isAuthenticated,
  expenseController.deleteExpense
);

// Routes d'authentification
router.get("/login", authController.showLoginPage);
router.post("/login", authController.login);
router.get("/register", authController.showRegisterPage);
router.post("/register", authController.register);
router.get("/logout", authController.logout);

// Routes de réinitialisation
router.post("/reset-budget", isAuthenticated, dashboardController.resetBudget);
router.post(
  "/reset-charges",
  isAuthenticated,
  dashboardController.resetCharges
);
router.post(
  "/reset-revenus",
  isAuthenticated,
  dashboardController.resetRevenus
);
router.post(
  "/reset-depenses",
  isAuthenticated,
  dashboardController.resetDepenses
);

// Routes des revenus
router.get("/revenus", isAuthenticated, revenuController.getRevenusPage);
router.post("/revenus", isAuthenticated, revenuController.addRevenu);
router.put("/revenus", isAuthenticated, revenuController.updateRevenu);
router.delete("/revenus/:id", isAuthenticated, revenuController.deleteRevenu);

// Routes des charges
router.get("/charges", isAuthenticated, chargeController.getChargesPage);
router.post("/charges", isAuthenticated, chargeController.addCharge);
router.put("/charges", isAuthenticated, chargeController.updateCharge);
router.delete("/charges/:id", isAuthenticated, chargeController.deleteCharge);

// Routes des conseils
router.get("/conseils", isAuthenticated, conseilsController.getConseilsPage);


// Route pour la politique de confidentialité
router.get("/privacy-policy", mainController.privacyPolicy);

// Ajoutez cette ligne pour gérer les requêtes POST vers /dashboard/dates
router.post("/dashboard/dates", dashboardController.updateDateFilter);

router.get("/user", isAuthenticated, userController.getUserPage);
router.post(
  "/user/update-password",
  isAuthenticated,
  userController.updatePassword
);
router.post(
  "/user/delete-account",
  isAuthenticated,
  userController.deleteAccount
);

// Routes des emprunts
router.get("/emprunts", isAuthenticated, empruntController.getEmpruntsPage);
router.post("/emprunts", isAuthenticated, empruntController.addEmprunt);
router.post(
  "/emprunts/remboursement",
  isAuthenticated,
  empruntController.addRemboursement
);
router.delete(
  "/emprunts/:id",
  isAuthenticated,
  empruntController.deleteEmprunt
);
router.get(
  "/emprunts/:id/details",
  isAuthenticated,
  empruntController.getEmpruntDetails
);

// Ajouter ces routes dans la section des routes utilisateur
router.post(
  "/user/update-profile",
  isAuthenticated,
  userController.updateProfile
);
router.post(
  "/user/update-preferences",
  isAuthenticated,
  userController.updatePreferences
);

export default router;
