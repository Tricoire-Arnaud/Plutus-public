// server.cjs
(async () => {
  try {
    const { default: app } = await import("./app.js"); // Import dynamique de `app.js`
    const port = process.env.PORT || 4500;

    // Démarrage du serveur
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
})();
