const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')
const PaymentVoucherRef = require('./PaymentVoucherRef')
const BankAllocation = require('../BankAllocation')
const Ledger = require('../../../masters/accounts-info/Ledger')

const PaymentVoucher = db.define('paymentVouchers', {
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

PaymentVoucher.hasMany(PaymentVoucherRef, { onDelete: 'CASCADE' })
PaymentVoucherRef.belongsTo(PaymentVoucher, { onDelete: 'CASCADE' })
PaymentVoucher.belongsTo(Ledger, { foreignKey: 'dLedgerId', onDelete: 'CASCADE' })
PaymentVoucher.belongsTo(Ledger, { foreignKey: 'cLedgerId', onDelete: 'CASCADE' })
PaymentVoucher.belongsTo(BankAllocation, { onDelete: 'CASCADE' })

module.exports = PaymentVoucher
