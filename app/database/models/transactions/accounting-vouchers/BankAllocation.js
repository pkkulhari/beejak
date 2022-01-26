const { DataTypes } = require('sequelize')
const db = require('../../../config/db')

const BankAllocation = db.define('bankAllocations', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  favouringName: DataTypes.CHAR,
  transactionType: DataTypes.CHAR,
  instDate: {
    type: DataTypes.DATE,
    default: new Date(),
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
})

module.exports = BankAllocation
