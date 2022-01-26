const { DataTypes } = require('sequelize')
const db = require('../../../config/db')
const UnitOfMeasure = require('./UnitOfMeasure')
const StockGroup = require('./StockGroup')
const Stock = require('../../reports/Stock')

const StockItem = db.define(
  'stockItems',
  {
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
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    openingStock: DataTypes.DECIMAL(10, 2),
    packSize: DataTypes.DECIMAL(10, 2),
    createdAt: DataTypes.DATE,
  },
  {
    hooks: {
      afterCreate: (stockItem) => {
        Stock.create({
          quantity: stockItem.openingStock,
          event: 'item-creation',
          stockItemId: stockItem.id,
          createdAt: stockItem.createdAt,
        }).catch((err) => console.error(err))
      },
      afterUpdate: async (stockItem) => {
        const stocks = await Stock.findAll({
          where: {
            stockItemId: stockItem.id,
          },
        })
          .then((resp) => JSON.parse(JSON.stringify(resp)))
          .catch((err) => console.error(err))

        stocks.forEach(async (stock) => {
          const quantity =
            Number(stock.quantity) +
            (Number(stockItem.openingStock) - Number(stockItem._previousDataValues.openingStock))

          if (stock.event === 'item-creation') {
            await Stock.update(
              { quantity, createdAt: stockItem.createdAt },
              { where: { id: stock.id } }
            ).catch((err) => console.error(err))

            return
          }

          await Stock.update({ quantity }, { where: { id: stock.id } }).catch((err) =>
            console.error(err)
          )
        })
      },
      afterDestroy: (stockItem) => {
        Stock.destroy({ where: { stockItemId: stockItem.id } }).catch((err) => console.error(err))
      },
    },

    timestamps: false,
  }
)

UnitOfMeasure.hasOne(StockItem)
StockItem.belongsTo(UnitOfMeasure)
StockItem.belongsTo(StockGroup, { onDelete: 'CASCADE' })
StockItem.hasOne(Stock, { onDelete: 'CASCADE' })

module.exports = StockItem
