import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Remboursement extends Model {
    static associate(models) {
      Remboursement.belongsTo(models.Emprunt, {
        foreignKey: {
          name: "emprunt_id",
          allowNull: false
        },
        onDelete: "CASCADE"
      });
    }
  }

  Remboursement.init(
    {
      emprunt_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Emprunts",
          key: "id"
        }
      },
      montant: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01
        }
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true
        }
      }
    },
    {
      sequelize,
      modelName: "Remboursement",
      tableName: "Remboursements"
    }
  );

  return Remboursement;
};
