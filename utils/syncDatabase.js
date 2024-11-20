import models from "../models/index.js";

async function syncDatabase() {
  try {
    const sequelize = models.sequelize;

    // 1. Nettoyer les données incohérentes

    await sequelize.query(`
      DELETE FROM "Revenus" 
      WHERE user_id NOT IN (SELECT id FROM "Users");
    `);

    await sequelize.query(`
      DELETE FROM "Emprunts" 
      WHERE user_id NOT IN (SELECT id FROM "Users");
    `);

    await sequelize.query(`
      DELETE FROM "Expenses" 
      WHERE user_id NOT IN (SELECT id FROM "Users");
    `);

    await sequelize.query(`
      DELETE FROM "Charges" 
      WHERE user_id NOT IN (SELECT id FROM "Users");
    `);

    await sequelize.query(`
      DELETE FROM "Budgets" 
      WHERE user_id NOT IN (SELECT id FROM "Users");
    `);

    // 2. Supprimer les contraintes existantes

    const tables = ["Revenus", "Emprunts", "Expenses", "Charges", "Budgets"];

    for (const table of tables) {
      await sequelize.query(`
        DO $$ 
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = '${table}' 
            AND constraint_type = 'FOREIGN KEY'
          ) LOOP
            EXECUTE 'ALTER TABLE "' || '${table}' || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '" CASCADE';
          END LOOP;
        END $$;
      `);
    }

    // 3. Synchroniser les modèles

    await sequelize.sync({ force: false, alter: true });
  } catch (error) {
    console.error("Erreur lors de la synchronisation:", error);
    throw error;
  }
}

export default syncDatabase;
