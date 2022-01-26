const { DataTypes } = require('sequelize')
const db = require('../../../config/db')
const StockItem = require('./StockItem')

const Rate = db.define(
  'rates',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: { type: DataTypes.CHAR, validate: { isIn: [['sale', 'purchase']] } },
    rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    date: { type: DataTypes.DATE, defaultValue: new Date() },
  },
  { timestamps: false }
)

StockItem.hasMany(Rate, { onDelete: 'CASCADE' })
Rate.belongsTo(StockItem, { onDelete: 'CASCADE' })

module.exports = Rate
