import { Model, DataTypes, Op } from "sequelize";

export default (sequelize) => {
  class Revenu extends Model {
    static associate(models) {
      Revenu.belongsTo(models.User, {
        foreignKey: {
          name: "user_id",
          allowNull: false
        },
        onDelete: "CASCADE"
      });
    }

    static getByUserIdAndDateRange(userId, dateFilter) {
      return Revenu.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [dateFilter.startDate, dateFilter.endDate],
          },
        },
      });
    }

    static resetForUser(userId) {
      return Revenu.destroy({ where: { user_id: userId } });
    }

    static getByUserId(userId) {
      return Revenu.findAll({ where: { user_id: userId } });
    }

    static validateRevenuData(revenuData) {
      const { montant, description, date } = revenuData;

      if (!montant || Number.isNaN(montant) || montant <= 0) {
        throw new Error("Le montant doit être un nombre positif");
      }

      if (!description || description.trim().length === 0) {
        throw new Error("La description est requise");
      }

      if (!date || Number.isNaN(new Date(date).getTime())) {
        throw new Error("La date est invalide");
      }

      return true;
    }

    static async createForUser(userId, revenuData) {
      this.validateRevenuData(revenuData);
      return Revenu.create({ ...revenuData, user_id: userId });
    }

    static async updateForUser(id, userId, revenuData) {
      this.validateRevenuData(revenuData);
      const result = await Revenu.update(revenuData, {
        where: {
          id: id,
          user_id: userId,
        },
      });

      if (result[0] === 0) {
        throw new Error("Revenu non trouvé ou non autorisé");
      }

      return result;
    }

    static deleteForUser(id, userId) {
      return Revenu.destroy({ where: { id, user_id: userId } });
    }
  }

  Revenu.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
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
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
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
      modelName: "Revenu",
      tableName: "Revenus"
    }
  );

  return Revenu;
};
