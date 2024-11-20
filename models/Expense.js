import { Model, DataTypes, Op } from "sequelize";

export default (sequelize) => {
  class Expense extends Model {
    static associate(models) {
      Expense.belongsTo(models.User, { foreignKey: "user_id" });
      Expense.belongsTo(models.Category, { foreignKey: "category_id" });
    }

    static getByUserId(userId) {
      return Expense.findAll({ where: { user_id: userId } });
    }

    static getByUserIdAndDateRange(userId, dateFilter) {
      return Expense.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [dateFilter.startDate, dateFilter.endDate],
          },
        },
      });
    }

    static resetForUser(userId) {
      return Expense.destroy({
        where: { user_id: userId }
      });
    }
  }

  Expense.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: "L'ID utilisateur est requis" },
        },
      },
      category_id: DataTypes.INTEGER,
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Expense",
      tableName: "Expenses"
    }
  );

  return Expense;
};
