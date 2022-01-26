const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')
const StockItem = require('../../../masters/inventory-info/StockItem')
const Purchase = require('./Purchase')
const triggers = require('../../../helpers/triggers')

const PurchaseItem = db.define(
  'purchaseItems',
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
    tradePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount: {
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
    createdAt: DataTypes.DATE,
  },
  {
    hooks: {
      afterCreate: (model) => triggers.afterInsert(model, 'purchase'),
      afterUpdate: (model) => triggers.afterUpdate(model, 'purchase'),
      beforeDestroy: (model) => triggers.beforeDelete(model, 'purchase'),
    },
    timestamps: false,
  }
)

PurchaseItem.belongsTo(Purchase, { onDelete: 'CASCADE' })
Purchase.hasMany(PurchaseItem, { onDelete: 'CASCADE' })
PurchaseItem.belongsTo(StockItem, { onDelete: 'CASCADE' })

module.exports = PurchaseItem
