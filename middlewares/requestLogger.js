export const requestLogger = (req, res, next) => {
  // Désactiver les logs de requêtes en production
  if (process.env.NODE_ENV === "production") {
    // Ajouter des en-têtes pour empêcher le logging
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");

    // Désactiver le cache pour les requêtes API
    if (req.path.includes("/api/") || req.path.includes("/emprunts/")) {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  }
  next();
};
