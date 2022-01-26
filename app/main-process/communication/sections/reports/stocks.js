const { ipcMain } = require('electron')
const { Op } = require('sequelize')
const Stock = require('../../../../database/models/reports/Stock')

// Register IPC Events
ipcMain.handle('fetch-stocks', (event, data) => {
  if (Object.entries(data).length === 2) {
    return Stock.findAll({
      where: { createdAt: { [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`] } },
    })
      .then((resp) => JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value))))
      .catch((err) => console.error(err))
  }
  return Stock.findAll({ where: { createdAt: { [Op.lte]: `${data} 23:59:59` } } })
    .then((resp) => JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value))))
    .catch((err) => console.error(err))
})

ipcMain.handle('fetch-single-item-stock', (event, data) => Stock.findAll({
  where: { stockItemId: data.stockItemId, createdAt: { [Op.lte]: `${data.date} 23:59:59` } },
  limit: 1,
  order: [['createdAt', 'DESC']],
})
  .then((resp) => JSON.parse(JSON.stringify(resp))[0])
  .catch((err) => console.error(err)))

ipcMain.handle('fetch-stocks-by-items', (event, data) => Stock.findAll({ where: { event: 'item-creation', stockItemId: data } })
  .then((resp) => JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value))))
  .catch((err) => console.error(err)))
