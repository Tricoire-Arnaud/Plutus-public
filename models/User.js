import { Model, DataTypes } from "sequelize";

export default function(sequelize) {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Emprunt, {
        foreignKey: "user_id",
        as: "emprunts"
      });
      // ... autres associations
    }

    static findByEmail(email) {
      return User.findOne({ where: { email } });
    }
  }

  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user"
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: "User",
    tableName: "Users"
  });

  return User;
}
