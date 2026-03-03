'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'customerId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    await queryInterface.removeColumn('Orders', 'customerName');
    await queryInterface.removeColumn('Orders', 'customerEmail');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'customerName', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Orders', 'customerEmail', {
      type: Sequelize.STRING
    });

    await queryInterface.removeColumn('Orders', 'customerId');
  }
};
