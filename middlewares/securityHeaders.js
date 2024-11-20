export const securityHeaders = (req, res, next) => {
  // Désactiver mod_pagespeed_beacon
  res.setHeader("PageSpeed", "off");

  // Masquer les informations serveur
  res.removeHeader("X-Powered-By");
  res.setHeader("Server", "");

  // Désactiver le cache pour les routes sensibles
  if (req.path.includes("/api/") || req.path.includes("/emprunts/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
};
