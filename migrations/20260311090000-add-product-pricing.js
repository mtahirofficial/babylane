'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'purchase_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
    await queryInterface.addColumn('Products', 'regular_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'regular_price');
    await queryInterface.removeColumn('Products', 'purchase_price');
  }
};
