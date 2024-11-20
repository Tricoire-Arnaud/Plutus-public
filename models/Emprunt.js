import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Emprunt extends Model {
    static associate(models) {
      Emprunt.belongsTo(models.User, {
        foreignKey: {
          name: "user_id",
          allowNull: false
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      });
      Emprunt.hasMany(models.Remboursement, {
        foreignKey: {
          name: "emprunt_id",
          allowNull: false
        },
        onDelete: "CASCADE"
      });
    }
  }

  Emprunt.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        }
      },
      nom: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Le nom ne peut pas être vide" },
          len: {
            args: [1, 255],
            msg: "Le nom doit faire entre 1 et 255 caractères"
          }
        }
      },
      montant_initial: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: "Le montant initial doit être un nombre décimal" },
          min: {
            args: [0.01],
            msg: "Le montant initial doit être supérieur à 0"
          }
        }
      },
      taux_interet: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: "Le taux d'intérêt doit être un nombre décimal" },
          min: {
            args: [0],
            msg: "Le taux d'intérêt ne peut pas être négatif"
          }
        }
      },
      duree_mois: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: "La durée doit être un nombre entier" },
          min: {
            args: [1],
            msg: "La durée doit être d'au moins 1 mois"
          }
        }
      },
      date_debut: {
        type: DataTypes.DATE,
        allowNull: false
      },
      montant_rembourse: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: "Emprunt",
      tableName: "Emprunts",
      timestamps: true
    }
  );

  return Emprunt;
};
