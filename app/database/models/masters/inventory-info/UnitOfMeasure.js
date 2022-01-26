const { DataTypes } = require('sequelize')
const db = require('../../../config/db')

const UnitOfMeasure = db.define(
  'unitsOfMeasure',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    symbol: {
      type: DataTypes.CHAR,
      allowNull: false,
      unique: true,
    },
    formalName: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
  },
  { freezeTableName: true }
)

module.exports = UnitOfMeasure
