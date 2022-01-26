const { ipcMain } = require('electron')
const Rate = require('../../../../../database/models/masters/inventory-info/Rate')
const db = require('../../../../../database/config/db')

// IPC Events Register
ipcMain.handle('fetch-rates', (event, data) => Rate.findAll()
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('insert-rate', (event, data) => Rate.create(data).catch((err) => console.error(err)))

ipcMain.handle('fetch-single-rate', (event, rateID) => Rate.findOne({ where: { id: rateID } })
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('delete-rate', (event, rateID) => Rate.destroy({ where: { id: rateID } }).catch((err) => console.error(err)))

ipcMain.handle('update-rate', (event, data) => Rate.update(data, { where: { id: data.id } }).catch((err) => console.error(err)))

ipcMain.handle('fetch-rates-by-type', (event, data) => Rate.findAll({
  where: data,
})
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('fetch-purchase-items-latest-price', () => Rate.findAll({
  attributes: [[db.fn('MAX', db.col('date')), 'date'], 'stockItemId', 'rate'],
  where: { type: 'purchase' },
  group: ['stockItemId'],
})
  .then((resp) => JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value))))
  .catch((err) => console.error(err)))
