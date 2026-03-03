'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Order, { foreignKey: "orderId" });
      if (models.Product) {
        this.belongsTo(models.Product, { foreignKey: "productId" });
      }
      if (models.Variant) {
        this.belongsTo(models.Variant, { foreignKey: "variantId" });
      }
    }

  }
  OrderItem.init({
    orderId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    variantId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    sku: DataTypes.STRING,
    price: DataTypes.FLOAT,
    quantity: DataTypes.INTEGER,
    total: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'OrderItem',
  });
  return OrderItem;
};
