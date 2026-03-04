'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Variant extends Model {
    static associate(models) { }
  }

  Variant.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
      },
      title: DataTypes.STRING,
      sku: DataTypes.STRING,
      regular_price: DataTypes.DECIMAL(10, 2),
      sale_price: DataTypes.DECIMAL(10, 2),
      price: DataTypes.DECIMAL(10, 2),
      manage_stock: DataTypes.BOOLEAN,
      stock_quantity: DataTypes.INTEGER,
      stock_status: DataTypes.STRING,
      image: DataTypes.STRING,
      attributes: DataTypes.JSON
    },
    {
      sequelize,
      modelName: 'Variant',
      tableName: 'Variants',
      freezeTableName: true
    }
  );

  return Variant;
};
