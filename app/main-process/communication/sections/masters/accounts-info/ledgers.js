const { ipcMain } = require('electron')
const Ledger = require('../../../../../database/models/masters/accounts-info/Ledger')
const Group = require('../../../../../database/models/masters/accounts-info/Group')

// IPC Events Register
ipcMain.handle('fetch-all-ledgers', (event, data) => Ledger.findAll({
  include: {
    model: Group,
  },
})
  .then((resp) => ('all-ledgers-fetched', JSON.parse(JSON.stringify(resp))))
  .catch((err) => console.error(err)))

ipcMain.handle('insert-ledger', (event, data) => Ledger.create(data).catch((err) => console.error(err)))

ipcMain.handle('fetch-single-ledger', (event, ledgerID) => Ledger.findOne({
  where: {
    id: ledgerID,
  },

  include: {
    model: Group,
  },
})
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

ipcMain.handle('delete-ledger', (event, ledgerID) => Ledger.destroy({
  where: {
    id: ledgerID,
  },
}).catch((err) => console.error(err)))

ipcMain.handle('update-ledger', (event, data) => Ledger.update(data, {
  where: {
    id: data.id,
  },
}).catch((err) => console.error(err)))
