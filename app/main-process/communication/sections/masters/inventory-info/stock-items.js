const { ipcMain } = require('electron')
const StockItem = require('../../../../../database/models/masters/inventory-info/StockItem')
const StockGroup = require('../../../../../database/models/masters/inventory-info/StockGroup')
const UnitOfMeasure = require('../../../../../database/models/masters/inventory-info/UnitOfMeasure')

// IPC Events Register
ipcMain.handle('fetch-all-stock-items', () => StockItem.findAll({
  include: [
    {
      model: UnitOfMeasure,
    },
    {
      model: StockGroup,
    },
  ],
}).then((resp) => JSON.parse(JSON.stringify(resp))))

ipcMain.handle('insert-stock-item', (event, data) => StockItem.create(data))

ipcMain.handle('delete-stock-item', (event, stockItemID) => StockItem.destroy({
  where: {
    id: stockItemID,
  },
  individualHooks: true,
}))

ipcMain.handle('update-stock-item', (event, data) => StockItem.update(data, {
  where: {
    id: data.id,
  },
  individualHooks: true,
}))

ipcMain.handle('fetch-single-stock-item', (event, stockItemID) => StockItem.findOne({
  where: {
    id: stockItemID,
  },
  include: [
    {
      model: StockGroup,
    },
    {
      model: UnitOfMeasure,
    },
  ],
}).then((resp) => JSON.parse(JSON.stringify(resp))))
