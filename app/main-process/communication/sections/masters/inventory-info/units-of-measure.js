const { ipcMain } = require('electron')
const UnitOfMeasure = require('../../../../../database/models/masters/inventory-info/UnitOfMeasure')

// IPC Events Register
ipcMain.handle('fetch-all-units-of-measure', (event, data) => UnitOfMeasure.findAll()
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('insert-unit-of-measure', (event, data) => UnitOfMeasure.create(data).catch((err) => console.error(err)))

ipcMain.handle('fetch-single-unit-of-measure', (event, UnitOfMeasureID) => UnitOfMeasure.findOne({
  where: {
    id: UnitOfMeasureID,
  },
})
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('delete-unit-of-measure', (event, UnitOfMeasureID) => UnitOfMeasure.destroy({
  where: {
    id: UnitOfMeasureID,
  },
}).catch((err) => console.error(err)))

ipcMain.handle('update-unit-of-measure', (event, data) => UnitOfMeasure.update(data, {
  where: {
    id: data.id,
  },
}).catch((err) => console.error(err)))
