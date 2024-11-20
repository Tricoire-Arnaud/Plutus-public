import csrf from "csurf";

// Configuration de base CSRF
const csrfConfig = {
  cookie: {
    key: "_csrf",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    signed: false,
  },
};

// Routes exclues de la protection CSRF
const excludedPaths = ["/login", "/register", "/forgot-password"];

// Middleware CSRF principal
const csrfProtection = csrf(csrfConfig);

// Middleware conditionnel qui vérifie si la route doit être protégée
const csrfMiddleware = (req, res, next) => {
  // Ajouter le token à toutes les vues
  res.locals.csrfToken = null;

  if (excludedPaths.includes(req.path)) {
    next();
  } else {
    csrfProtection(req, res, (err) => {
      if (err) {
        return handleCSRFError(err, req, res, next);
      }
      // Définir le token pour les routes protégées
      res.locals.csrfToken = req.csrfToken();
      next();
    });
  }
};

// Gestionnaire d'erreurs CSRF
const handleCSRFError = (err, req, res, next) => {
  if (err.code !== "EBADCSRFTOKEN") return next(err);

  if (req.xhr || req.headers.accept?.includes("application/json")) {
    res.status(403).json({
      error: "Session expirée ou invalide. Veuillez rafraîchir la page.",
    });
  } else {
    req.flash("error", "Session expirée ou invalide. Veuillez réessayer.");
    res.redirect("/login");
  }
};

export { csrfMiddleware, handleCSRFError };
