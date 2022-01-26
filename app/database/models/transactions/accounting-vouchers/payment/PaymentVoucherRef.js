const { DataTypes } = require('sequelize')
const db = require('../../../../config/db')

const PaymentVoucherRef = db.define('paymentVoucherRefs', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  refType: DataTypes.CHAR,
  name: DataTypes.CHAR,
  wef: {
    type: DataTypes.DATE,
    defaultValue: new Date(),
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
})

module.exports = PaymentVoucherRef
