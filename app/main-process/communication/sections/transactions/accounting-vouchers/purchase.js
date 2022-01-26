const { ipcMain } = require('electron')
const { Op } = require('sequelize')
const Purchase = require('../../../../../database/models/transactions/accounting-vouchers/purchase/Purchase')
const PurchaseItem = require('../../../../../database/models/transactions/accounting-vouchers/purchase/PurchaseItem')
const StockItem = require('../../../../../database/models/masters/inventory-info/StockItem')
const StockGroup = require('../../../../../database/models/masters/inventory-info/StockGroup')
const Ledger = require('../../../../../database/models/masters/accounts-info/Ledger')
const UnitsOfMeasure = require('../../../../../database/models/masters/inventory-info/UnitOfMeasure')

// IPC Events Register
ipcMain.handle('fetch-last-purchase', (event, data) =>
  Purchase.findAll({
    limit: 1,
    order: [['createdAt', 'DESC']],
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((r) => console.error(r))
)

ipcMain.handle('save-purchase', (event, data) => savePurchase(data).then((resp) => resp))

ipcMain.handle('fetch-all-purchase-items', (event, data) =>
  PurchaseItem.findAll({
    where: {
      createdAt: {
        [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`],
      },
    },

    include: [
      {
        model: Purchase,
      },
      {
        model: StockItem,
      },
    ],
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('fetch-all-purchases', (event, data) =>
  Purchase.findAll({
    where: {
      date: {
        [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`],
      },
    },
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('fetch-single-purchase', (event, purchaseId) =>
  Purchase.findOne({
    where: { id: purchaseId },
    include: [
      {
        model: PurchaseItem,

        include: {
          model: StockItem,

          include: {
            model: StockGroup,
          },
        },
      },
      {
        model: Ledger,
      },
    ],
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('delete-single-purchase', async (event, purchaseId) => {
  await PurchaseItem.destroy({ where: { purchaseId }, individualHooks: true }).catch((err) =>
    console.error(err)
  )
  await Purchase.destroy({ where: { id: purchaseId } }).catch((err) => console.error(err))
})

ipcMain.handle('fetch-purchase-items-by-purchaseId', (event, purchaseId) =>
  PurchaseItem.findAll({
    where: { purchaseId },

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

ipcMain.handle('fetch-purchases-by-ledger', (event, ledgerID) =>
  Purchase.findAll({ where: { ledgerId: ledgerID } })
    .then((resp) =>
      JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
    )
    .catch((err) => console.error(err))
)

// Functions
async function savePurchase(data) {
  let isUpdate = false

  await Purchase.findOne({ where: { id: data.voucher.id } })
    .then((resp) => {
      if (JSON.parse(JSON.stringify(resp)) !== null) isUpdate = true
    })
    .catch((err) => console.error(err))

  if (isUpdate === false) {
    return await Purchase.create(data.voucher)
      .then(async () => {
        for (const stockItem of data.stockItems) {
          await PurchaseItem.create(stockItem).catch((err) => console.error(err))
        }
        return true
      })
      .catch((err) => console.error(err))
  }

  return await Purchase.update(data.voucher, {
    where: { id: data.voucher.id },
  })
    .then(async () => {
      const stockItemIDs = []
      data.stockItems.forEach((el) => {
        if (!stockItemIDs.includes(el.stockItemId)) stockItemIDs.push(el.stockItemId)
      })

      await PurchaseItem.destroy({
        where: {
          purchaseId: data.voucher.id,
          [Op.not]: [{ stockItemId: stockItemIDs }],
        },
        individualHooks: true,
      }).catch((err) => console.error(err))

      for (const el of data.stockItems) {
        await PurchaseItem.findOrCreate({
          where: {
            purchaseId: data.voucher.id,
            stockItemId: el.stockItemId,
          },
          defaults: el,
        }).catch((err) => console.error(err))
      }

      for (const el of data.stockItems) {
        await PurchaseItem.update(el, {
          where: {
            purchaseId: data.voucher.id,
            stockItemId: el.stockItemId,
          },
          individualHooks: true,
        }).catch((err) => console.error(err))
      }

      return true
    })
    .catch((err) => console.error(err))
}
