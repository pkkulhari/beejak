const { DataTypes } = require('sequelize')
const db = require('../../../config/db')

const Group = db.define('groups', {
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
})

module.exports = Group
