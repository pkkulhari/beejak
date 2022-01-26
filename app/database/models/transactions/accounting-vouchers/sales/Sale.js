const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')
const Ledger = require('../../../masters/accounts-info/Ledger')
const SaleItem = require('./SaleItem')
const SaleShipingAddress = require('./SaleShipingAddress')

const Sale = db.define('sales', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  tSchemeQty1: DataTypes.DECIMAL(10, 2),
  tSchemeQty2: DataTypes.DECIMAL(10, 2),
  tOutwardQty: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tTradePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  tDiscount1: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.0,
  },
  tDiscount2: {
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
  tAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
})

Sale.belongsTo(Ledger, { onDelete: 'CASCADE' })
Sale.hasMany(SaleItem)
SaleItem.belongsTo(Sale)
Sale.hasOne(SaleShipingAddress, { onDelete: 'CASCADE' })

module.exports = Sale
