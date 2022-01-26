const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')

const SaleShipingAddress = db.define('saleShipingAddresses', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  code: DataTypes.CHAR,
  name: DataTypes.CHAR,
  gstin: DataTypes.CHAR,
  mobile: DataTypes.CHAR,
  address1: DataTypes.CHAR,
  address2: DataTypes.CHAR,
})

module.exports = SaleShipingAddress
