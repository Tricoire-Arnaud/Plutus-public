import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Budget, {
        foreignKey: "category_id",
        as: "budgets",
      });
      Category.hasMany(models.Expense, {
        foreignKey: "category_id",
        as: "expenses",
      });
    }

    static getAll() {
      return this.findAll();
    }
  }

  Category.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Category",
    }
  );

  return Category;
};
