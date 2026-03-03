'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "userId" });
      this.hasMany(models.OrderItem, { foreignKey: "orderId", as: "items" });
      this.belongsTo(models.Customer, {
        foreignKey: "customerId",
        as: "customer"
      });
    }

  }
  Order.init({
    orderNumber: DataTypes.STRING,
    customerId: DataTypes.INTEGER,
    subtotal: DataTypes.FLOAT,
    discount: DataTypes.FLOAT,
    shipping: DataTypes.FLOAT,
    tax: DataTypes.FLOAT,
    total: DataTypes.FLOAT,
    status: DataTypes.STRING,
    notes: DataTypes.TEXT,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};