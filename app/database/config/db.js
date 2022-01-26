const { Sequelize } = require('sequelize')
const cls = require('cls-hooked')

const namespace = cls.createNamespace('P&C.Beejak')
Sequelize.useCLS(namespace)

const db = new Sequelize('beejak', 'pkkulhari', 'pkindian123', {
  host: 'localhost',
  dialect: 'mysql',
  timezone: '+05:30',
})

module.exports = db

// db.sync()
