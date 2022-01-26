const { DataTypes } = require('sequelize')
const db = require('../../../config/db')

const StockGroup = db.define('stockGroups', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.CHAR,
    allowNull: false,
    unique: true,
  },
  hsnCode: {
    type: DataTypes.CHAR,
    allowNull: false,
  },
  cgstPer: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  sgstPer: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cessPer: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
})

module.exports = StockGroup
