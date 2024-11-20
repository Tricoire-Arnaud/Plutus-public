import syncDatabase from "../utils/syncDatabase.js";

async function main() {
  try {
    await syncDatabase();

    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    process.exit(1);
  }
}

main();
