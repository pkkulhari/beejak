const { DataTypes, Op } = require('sequelize')
const db = require('../../../../config/db')
const StockItem = require('../../../masters/inventory-info/StockItem')
const triggers = require('../../../helpers/triggers')

const SaleItem = db.define(
  'saleItems',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    schemeQty1: DataTypes.DECIMAL(10, 2),
    schemeQty2: DataTypes.DECIMAL(10, 2),
    totalOutwardQty: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    tradePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount1: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    discount2: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
    },
    taxableAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cgstAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sgstAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cessAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    schemeDesc: DataTypes.CHAR,
    createdAt: DataTypes.DATE,
  },
  {
    hooks: {
      afterCreate: (model) => triggers.afterInsert(model, 'sale'),
      afterUpdate: (model) => triggers.afterUpdate(model, 'sale'),
      beforeDestroy: (model) => triggers.beforeDelete(model, 'sale'),
    },
    timestamps: false,
  }
)

SaleItem.belongsTo(StockItem)

module.exports = SaleItem
