const { ipcMain } = require('electron')
const { Op } = require('sequelize')
const Sale = require('../../../../../database/models/transactions/accounting-vouchers/sales/Sale')
const SaleItem = require('../../../../../database/models/transactions/accounting-vouchers/sales/SaleItem')
const SaleShipingAddress = require('../../../../../database/models/transactions/accounting-vouchers/sales/SaleShipingAddress')
const StockItem = require('../../../../../database/models/masters/inventory-info/StockItem')
const StockGroup = require('../../../../../database/models/masters/inventory-info/StockGroup')
const Ledger = require('../../../../../database/models/masters/accounts-info/Ledger')
const UnitsOfMeasure = require('../../../../../database/models/masters/inventory-info/UnitOfMeasure')

// IPC Events Register
ipcMain.handle('fetch-last-sale', () =>
  Sale.findAll({
    attributes: ['id'],
    limit: 1,
    order: [['createdAt', 'DESC']],
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('save-sale', (event, data) => saveSale(data).then((resp) => resp))

ipcMain.handle('fetch-all-sale-items', (event, data) =>
  SaleItem.findAll({
    where: {
      createdAt: {
        [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`],
      },
    },

    include: {
      model: Sale,
    },
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('fetch-all-sales', (event, data) =>
  Sale.findAll({
    where: {
      date: {
        [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`],
      },
    },
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('fetch-single-sale', (event, saleId) =>
  Sale.findOne({
    where: { id: saleId },
    include: [
      {
        model: SaleItem,

        include: {
          model: StockItem,

          include: [
            {
              model: StockGroup,
            },
            {
              model: UnitsOfMeasure,
            },
          ],
        },
      },
      {
        model: Ledger,
      },
      {
        model: SaleShipingAddress,
      },
    ],
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('delete-single-sale', async (event, saleId) => {
  await SaleItem.destroy({ where: { saleId }, individualHooks: true }).catch((err) =>
    console.error(err)
  )
  await Sale.destroy({ where: { id: saleId } }).catch((err) => console.error(err))
})

ipcMain.handle('fetch-sale-items-by-saleId', (event, saleId) =>
  SaleItem.findAll({
    where: { saleId },

    include: {
      model: StockItem,

      include: [
        {
          model: StockGroup,
        },
        {
          model: UnitsOfMeasure,
        },
      ],
    },
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('fetch-sales-by-ledger', (event, ledgerID) =>
  Sale.findAll({ where: { ledgerId: ledgerID } })
    .then((resp) =>
      JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
    )
    .catch((err) => console.error(err))
)

// Functions
async function saveSale(data) {
  let isUpdate = false

  await Sale.findOne({ where: { id: data.voucher.id } })
    .then((resp) => {
      if (JSON.parse(JSON.stringify(resp)) !== null) isUpdate = true
    })
    .catch((err) => console.error(err))

  if (isUpdate === false) {
    return await Sale.create(data.voucher)
      .then(async () => {
        for (const stockItem of data.stockItems) {
          await SaleItem.create(stockItem).catch((err) => console.error(err))
        }
        await SaleShipingAddress.create(data.shipingAddress).catch((err) => console.error(err))
        return true
      })
      .catch((err) => console.error(err))
  }

  return await Sale.update(data.voucher, {
    where: { id: data.voucher.id },
  })
    .then(async () => {
      await SaleShipingAddress.update(data.shipingAddress, {
        where: {
          saleId: data.voucher.id,
        },
      }).catch((err) => console.error(err))

      const stockItemIDs = []
      data.stockItems.forEach((el) => {
        if (!stockItemIDs.includes(el.stockItemId)) stockItemIDs.push(el.stockItemId)
      })

      await SaleItem.destroy({
        where: {
          saleId: data.voucher.id,
          [Op.not]: [
            {
              stockItemId: stockItemIDs,
            },
          ],
        },
        individualHooks: true,
      }).catch((err) => console.error(err))

      for (const el of data.stockItems) {
        await SaleItem.findOrCreate({
          where: {
            saleId: data.voucher.id,
            stockItemId: el.stockItemId,
          },
          defaults: el,
        }).catch((err) => console.error(err))
      }

      for (const el of data.stockItems) {
        await SaleItem.update(el, {
          where: {
            saleId: data.voucher.id,
            stockItemId: el.stockItemId,
          },
          individualHooks: true,
        }).catch((err) => console.error(err))
      }

      return true
    })
    .catch((err) => console.error(err))
}
