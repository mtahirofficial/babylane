'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING
      },
      slug: {
        type: Sequelize.STRING
      },
      sku: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT('long')
      },
      short_description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING
      },
      published: {
        type: Sequelize.BOOLEAN
      },
      visibility: {
        type: Sequelize.STRING
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
      featured_image: {
        type: Sequelize.STRING
      },
      gallery_images: {
        type: Sequelize.JSON
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
    await queryInterface.dropTable('Products');
  }
};
