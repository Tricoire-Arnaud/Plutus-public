/**
 * Analyse le budget en comparant les budgets et les dépenses.
 * @param {Array} budgets - Liste des budgets
 * @param {Array} expenses - Liste des dépenses
 * @returns {Object} Résultat de l'analyse
 */
export function analyzeBudget(budgets = [], expenses = []) {
    // Calcule le total des budgets
    const totalBudget = budgets.reduce((sum, budget) => sum + Number.parseFloat(budget.amount || 0), 0);
    
    // Calcule le total des dépenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount || 0), 0);
    
    // Calcule la différence entre le budget total et les dépenses totales
    const balance = totalBudget - totalExpenses;

    // Détermine le conseil à donner en fonction du solde
    let advice;
    if (balance > 0) {
        // Si le solde est positif
        advice = "Vous êtes dans les limites de votre budget. Bon travail !";
    } else if (balance === 0) {
        // Si le solde est exactement zéro
        advice = "Vous avez exactement dépensé votre budget. Restez vigilant !";
    } else {
        // Si le solde est négatif
        advice = "Attention, vous dépassez votre budget. Essayez de réduire vos dépenses.";
    }

    // Retourne un objet contenant les résultats de l'analyse
    return {
        totalBudget,    // Budget total
        totalExpenses,  // Dépenses totales
        balance,        // Solde (différence entre budget et dépenses)
        advice          // Conseil basé sur le solde
    };
}