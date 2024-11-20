import models from "../models/index.js";
const { User } = models;

export function isAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }

  User.findByPk(req.session.userId)
    .then((user) => {
      if (!user) {
        req.session.destroy();
        return res.redirect("/login");
      }
      req.user = user;
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.username
      };
      next();
    })
    .catch((err) => {
      console.error("Auth middleware error:", err);
      res.redirect("/login");
    });
}

export function isAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }

  User.findByPk(req.session.userId)
    .then((user) => {
      if (!user || user.role !== "admin") {
        return res.status(403).render("error", {
          message: "Accès non autorisé"
        });
      }
      req.user = user;
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.username
      };
      next();
    })
    .catch((err) => {
      console.error("Admin middleware error:", err);
      res.status(500).render("error", {
        message: "Une erreur est survenue"
      });
    });
}

export const setUserLocals = (req, res, next) => {
  if (req.session?.userId && !req.session?.user) {
    User.findByPk(req.session.userId)
      .then((user) => {
        if (user) {
          req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.username
          };
          setLocals();
        } else {
          req.session.destroy();
          res.redirect("/login");
        }
      })
      .catch(() => {
        setLocals();
      });
  } else {
    setLocals();
  }

  function setLocals() {
    res.locals.isAuthenticated = !!req.session?.userId;
    res.locals.user = req.session?.user || null;
    res.locals.userId = req.session?.userId;
    next();
  }
};
