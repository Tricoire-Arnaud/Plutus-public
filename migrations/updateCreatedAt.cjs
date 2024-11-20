module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.sequelize.query(`
        UPDATE "Users"
        SET "createdAt" = NOW()
        WHERE "createdAt" IS NULL;

        UPDATE "Emprunts"
        SET "createdAt" = NOW()
        WHERE "createdAt" IS NULL;

        UPDATE "Remboursements"
        SET "createdAt" = NOW()
        WHERE "createdAt" IS NULL;

        UPDATE "Revenus"
        SET "createdAt" = NOW()
        WHERE "createdAt" IS NULL;

        UPDATE "Expenses"
        SET "createdAt" = NOW()
        WHERE "createdAt" IS NULL;
      `);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de createdAt:', error);
    }
  },
};
