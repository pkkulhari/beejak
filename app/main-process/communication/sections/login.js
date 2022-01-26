const { ipcMain } = require('electron')
const User = require('../../../database/models/User')

ipcMain.handle('fetch-single-user', (event, username) => User.findOne({ where: { username } })
  .then((resp) => JSON.parse(JSON.stringify(resp)))
  .catch((err) => console.error(err)))

// User.create({
//     name: 'Devid',
//     email: 'devid08@gmail.com',
//     username: 'beejak',
//     password: '12345',
//     role: 'admin'
// })
