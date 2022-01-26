const { Model, DataTypes } = require('sequelize')
const bcrypt = require('bcrypt')
const db = require('../config/db')

const User = db.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,

    set(value) {
      const hash = bcrypt.hashSync(value, 10)
      return this.setDataValue('password', hash)
    },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

module.exports = User

// User.create({
//   name: 'Praveen',
//   email: 'pk@gmail.com',
//   username: 'admin',
//   password: 'admin',
//   role: 'admin'
// });
