const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')
const ReceiptVoucherRef = require('./ReceiptVoucherRef')
const BankAllocation = require('../BankAllocation')
const Ledger = require('../../../masters/accounts-info/Ledger')

const ReceiptVoucher = db.define('receiptVouchers', {
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

ReceiptVoucher.hasMany(ReceiptVoucherRef, { onDelete: 'CASCADE' })
ReceiptVoucherRef.belongsTo(ReceiptVoucher, { onDelete: 'CASCADE' })
ReceiptVoucher.belongsTo(Ledger, { foreignKey: 'dLedgerId', onDelete: 'CASCADE' })
ReceiptVoucher.belongsTo(Ledger, { foreignKey: 'cLedgerId', onDelete: 'CASCADE' })
ReceiptVoucher.belongsTo(BankAllocation, { onDelete: 'CASCADE' })

module.exports = ReceiptVoucher
