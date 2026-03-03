'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Variants', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING
      },
      sku: {
        type: Sequelize.STRING
      },
      regular_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      sale_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      manage_stock: {
        type: Sequelize.BOOLEAN
      },
      stock_quantity: {
        type: Sequelize.INTEGER
      },
      stock_status: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING
      },
      attributes: {
        type: Sequelize.JSON
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Variants');
  }
};
