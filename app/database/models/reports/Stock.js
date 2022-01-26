const { DataTypes } = require('sequelize')
const db = require('../../config/db')
const StockItem = require('../masters/inventory-info/StockItem')

const Stock = db.define(
  'stocks',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    event: DataTypes.CHAR,
    eventId: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
  },
  {
    timestamps: false,
  }
)

module.exports = Stock
