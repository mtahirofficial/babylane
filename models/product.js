'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      if (models.User && Product.rawAttributes.userId) {
        this.belongsTo(models.User, { foreignKey: "userId" });
      }
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
      },
      title: DataTypes.STRING,
      slug: DataTypes.STRING,
      sku: DataTypes.STRING,
      description: DataTypes.TEXT('long'),
      short_description: DataTypes.TEXT,
      status: DataTypes.STRING,
      published: DataTypes.BOOLEAN,
      visibility: DataTypes.STRING,
      manage_stock: DataTypes.BOOLEAN,
      stock_quantity: DataTypes.INTEGER,
      stock_status: DataTypes.STRING,
      featured_image: DataTypes.STRING,
      gallery_images: DataTypes.JSON,
      attributes: DataTypes.JSON
    },
    {
      sequelize,
      modelName: 'Product'
    }
  );

  return Product;
};
