import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      // Association avec User
      Transaction.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // Association avec Category
      Transaction.belongsTo(models.Category, {
        foreignKey: "category_id",
        as: "category",
      });

      // Si vous avez un modèle Budget, vous pouvez aussi ajouter cette association
      Transaction.belongsTo(models.Budget, {
        foreignKey: "budget_id",
        as: "budget",
      });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("expense", "income", "transfer"),
        allowNull: false,
      },
      // Ajoutez d'autres champs selon vos besoins
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions", // assurez-vous que c'est le bon nom de table
      timestamps: true, // si vous voulez createdAt et updatedAt
    }
  );

  return Transaction;
};
