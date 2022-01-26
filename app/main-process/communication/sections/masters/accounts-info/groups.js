const { ipcMain } = require('electron')
const Group = require('../../../../../database/models/masters/accounts-info/Group')
const Ledger = require('../../../../../database/models/masters/accounts-info/Ledger')

// IPC Events Register
ipcMain.handle('fetch-all-groups', () =>
  Group.findAll({ include: { model: Ledger } })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('insert-group', (event, data) =>
  Group.create(data).catch((err) => console.error(err))
)

ipcMain.handle('fetch-single-group', (event, groupID) =>
  Group.findOne({
    where: {
      id: groupID,
    },
  })
    .then((resp) => JSON.parse(JSON.stringify(resp)))
    .catch((err) => console.error(err))
)

ipcMain.handle('delete-group', (event, groupID) =>
  Group.destroy({
    where: {
      id: groupID,
    },
  }).catch((err) => console.error(err))
)

ipcMain.handle('update-group', (event, data) =>
  Group.update(data, {
    where: {
      id: data.id,
    },
  }).catch((err) => console.error(err))
)
