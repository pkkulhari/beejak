const { ipcMain } = require('electron')
const StockGroup = require('../../../../../database/models/masters/inventory-info/StockGroup')

// IPC Events Register
ipcMain.handle('fetch-all-stock-groups', (event, data) => StockGroup.findAll()
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('insert-stock-group', (event, data) => StockGroup.create(data).catch((err) => console.error(err)))

ipcMain.handle('fetch-single-stock-group', (event, stockGroupID) => StockGroup.findOne({
  where: {
    id: stockGroupID,
  },
})
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('delete-stock-group', (event, stockGroupID) => StockGroup.destroy({
  where: {
    id: stockGroupID,
  },
}).catch((err) => console.error(err)))

ipcMain.handle('update-stock-group', (event, data) => StockGroup.update(data, {
  where: {
    id: data.id,
  },
}).catch((err) => console.error(err)))
