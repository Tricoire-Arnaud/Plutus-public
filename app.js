import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "node:path";
import expressLayouts from "express-ejs-layouts";
import router from "./router.js";
import { setUserLocals } from "./middlewares/auth.js";
import methodOverride from "method-override";
import flash from "connect-flash";
import numeral from "numeral";
import "numeral/locales/fr.js";
import logger from "./utils/logger.js";
import helmet from "helmet";
import { requestLogger } from "./middlewares/requestLogger.js";

// Configuration
dotenv.config();

// Configuration de Numeral.js
numeral.locale("fr");

// Création de l'application Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    },
    name: "sessionId",
  })
);
app.use(flash());

// Configuration de la vue
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));
app.set("layout", "layout");

// Middleware personnalisé
app.use(setUserLocals);
app.use(methodOverride("_method"));

// Make Numeral.js available to all views
app.locals.numeral = numeral;

// Configuration de Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "'unsafe-hashes'",
          "data:",
          "cdn.jsdelivr.net",
          "cdnjs.cloudflare.com"
        ],
        scriptSrcElem: [
          "'self'",
          "'unsafe-inline'",
          "cdn.jsdelivr.net",
          "cdnjs.cloudflare.com",
          "data:"
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "fonts.googleapis.com",
          "cdn.jsdelivr.net",
          "cdnjs.cloudflare.com"
        ],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: [
          "'self'",
          "fonts.gstatic.com",
          "cdnjs.cloudflare.com"
        ],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        reportTo: "none",
        reportUri: "none"
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hidePoweredBy: true,
    noSniff: true,
    referrerPolicy: { policy: "no-referrer" }
  })
);

// Ajouter avant les routes
app.use(requestLogger);

// Désactiver les logs de requêtes en production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });
}

// Routeur principal
app.use("/", router);

// Middleware 404 - doit être après toutes les routes
app.use((req, res, next) => {
  const err = new Error("Page non trouvée");
  err.status = 404;
  next(err);
});

// Middleware de gestion d'erreur globale
app.use((err, req, res, next) => {
  // Log l'erreur
  logger.error("Error:", err.message, "\nStack:", err.stack);

  // Définir le statut
  const status = err.status || 500;

  // Message personnalisé selon le type d'erreur
  let message;
  if (status === 404) {
    message = "La page que vous recherchez semble avoir été dérobée par Hermès...";
  } else {
    message = process.env.NODE_ENV === "production"
      ? "Une erreur divine est survenue"
      : err.message;
  }

  // S'assurer que le layout est disponible
  res.locals.user = req.session?.user || null;

  // Rendre la page d'erreur
  res.status(status).render("error", {
    message,
    error: process.env.NODE_ENV === "production" ? {} : err,
    layout: 'layout'
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
});

export default app;
