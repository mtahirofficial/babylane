'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      if (models.Product && models.Product.rawAttributes && models.Product.rawAttributes.userId) {
        this.hasMany(models.Product, { foreignKey: "userId" });
      }
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    username: DataTypes.STRING,
    role: DataTypes.STRING,
    refreshToken: DataTypes.TEXT,
    isVerified: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    freezeTableName: true
  });
  return User;
};
