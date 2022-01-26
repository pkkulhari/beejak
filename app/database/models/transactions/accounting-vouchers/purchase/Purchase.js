const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')
const Ledger = require('../../../masters/accounts-info/Ledger')

const Purchase = db.define('purchases', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  supplierInvNo: {
    type: DataTypes.CHAR,
    allowNull: false,
    unique: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  vahicleNo: DataTypes.CHAR,
  tQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tTradePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  tTaxableAmt: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tCgstAmt: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tSgstAmt: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tCessAmt: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tcsPer: DataTypes.DECIMAL(10, 2),
  tcsAmt: DataTypes.DECIMAL(10, 2),
  tAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
})

Purchase.belongsTo(Ledger, { onDelete: 'CASCADE' })

module.exports = Purchase

// Purchase.sync({ force: true })
