import { Model, DataTypes, Op } from 'sequelize';

export default (sequelize) => {
  class Budget extends Model {
    static associate(models) {
      Budget.belongsTo(models.User, { foreignKey: 'user_id' });
      Budget.belongsTo(models.Category, { foreignKey: 'category_id' });
    }

    static getByUserIdAndDateRange(userId, dateFilter) {
      return this.findAll({
        where: {
          user_id: userId,
          start_date: { [Op.lte]: dateFilter.endDate },
          end_date: { [Op.gte]: dateFilter.startDate }
        }
      });
    }

    static resetForUser(userId) {
      return this.destroy({ where: { user_id: userId } });
    }

    static getByUserId(userId) {
      return this.findAll({ where: { user_id: userId } });
    }

    static updateBudget(id, userId, budgetData) {
      return this.update(budgetData, { where: { id, user_id: userId } });
    }

    static deleteBudget(id, userId) {
      return this.destroy({ where: { id, user_id: userId } });
    }
  }

  Budget.init({
    user_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    amount: DataTypes.DECIMAL(10, 2),
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Budget',
  });

  return Budget;
};