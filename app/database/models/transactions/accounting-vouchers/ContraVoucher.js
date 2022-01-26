const { DataTypes } = require('sequelize')
const db = require('../../../config/db')
const BankAllocation = require('./BankAllocation')
const Ledger = require('../../masters/accounts-info/Ledger')

const ContraVoucher = db.define('contraVouchers', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
  },
  debit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  credit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  narration: DataTypes.CHAR,
})

ContraVoucher.belongsTo(Ledger, { foreignKey: 'dLedgerId', onDelete: 'CASCADE' })
ContraVoucher.belongsTo(Ledger, { foreignKey: 'cLedgerId', onDelete: 'CASCADE' })
ContraVoucher.belongsTo(BankAllocation, { as: 'dBankAllocation' })
ContraVoucher.belongsTo(BankAllocation, { as: 'cBankAllocation' })

module.exports = ContraVoucher
