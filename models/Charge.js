import { Model, DataTypes, Op } from 'sequelize';

export default (sequelize) => {
  class Charge extends Model {
    static associate(models) {
      Charge.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  Charge.init({
    user_id: DataTypes.INTEGER,
    montant: DataTypes.DECIMAL(10, 2),
    description: DataTypes.STRING,
    date: DataTypes.DATE,
    type: DataTypes.ENUM('fixe', 'variable')
  }, {
    sequelize,
    modelName: 'Charge',
  });

  Charge.getFixesByUserId = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        type: 'fixe'
      }
    });
  };

  Charge.getVariablesByUserIdAndDateRange = function(userId, dateFilter) {
    return this.findAll({
      where: {
        user_id: userId,
        type: 'variable',
        date: {
          [Op.between]: [dateFilter.startDate, dateFilter.endDate]
        }
      }
    });
  };

  Charge.getVariablesByUserId = function(userId) {
    return this.findAll({
      where: {
        user_id: userId,
        type: 'variable'
      }
    });
  };

  // Ajout de la nouvelle méthode
  Charge.getByUserIdAndDateRange = function(userId, dateFilter) {
    return this.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [dateFilter.startDate, dateFilter.endDate]
        }
      }
    });
  };

  return Charge;
};