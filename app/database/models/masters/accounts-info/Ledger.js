const { DataTypes } = require('sequelize')
const db = require('../../../config/db')
const Group = require('./Group')

const Ledger = db.define('ledgers', {
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
  gstin: DataTypes.CHAR,
  mobile: DataTypes.CHAR,
  address1: DataTypes.CHAR,
  address2: DataTypes.CHAR,
  openingBalance: DataTypes.INTEGER(10, 2),
})

Ledger.belongsTo(Group, { onDelete: 'CASCADE' })
Group.hasMany(Ledger, { onDelete: 'CASCADE' })

module.exports = Ledger
