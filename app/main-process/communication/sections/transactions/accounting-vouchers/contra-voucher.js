'user strict'

const { ipcMain } = require('electron')
const { Op, where } = require('sequelize')
const ContraVoucher = require('../../../../../database/models/transactions/accounting-vouchers/ContraVoucher')
const BankAllocation = require('../../../../../database/models/transactions/accounting-vouchers/BankAllocation')

// Handle IPC Events
ipcMain.handle('fetch-last-contra-voucher', () => {
  return ContraVoucher.findAll({
    limit: 1,
    order: [['createdAt', 'DESC']],
  }).then((resp) => JSON.parse(JSON.stringify(resp)))
})

ipcMain.handle('fetch-contra-vouchers-by-ledger', (event, ledgerID) => {
  return ContraVoucher.findAll({
    where: { [Op.or]: [{ cLedgerId: ledgerID }, { dLedgerId: ledgerID }] },
  }).then((resp) =>
    JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
  )
})

ipcMain.handle('fetch-contra-vouchers', () => {
  return ContraVoucher.findAll().then((resp) =>
    JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
  )
})

ipcMain.handle('save-contra-voucher', async (event, data) => {
  let isUpdate = false

  await ContraVoucher.findOne({ where: { id: data.contraVoucher.id } }).then((resp) => {
    if (JSON.parse(JSON.stringify(resp)) !== null) isUpdate = true
  })

  if (isUpdate === false) {
    if ('cBankAllocation' in data) {
      await BankAllocation.create(data.cBankAllocation).then((resp) => {
        data.contraVoucher['cBankAllocationId'] = resp.getDataValue('id')
      })
    }
    if ('dBankAllocation' in data) {
      await BankAllocation.create(data.dBankAllocation).then((resp) => {
        data.contraVoucher['dBankAllocationId'] = resp.getDataValue('id')
      })
    }
    await ContraVoucher.create(data.contraVoucher)

    return true
  }

  // Update bankAllocation
  await ContraVoucher.findOne({
    where: { id: data.contraVoucher.id },
    include: [
      { model: BankAllocation, as: 'dBankAllocation' },
      { model: BankAllocation, as: 'cBankAllocation' },
    ],
  }).then(async (resp) => {
    const cBankAllocation = JSON.parse(JSON.stringify(resp)).cBankAllocation
    const dBankAllocation = JSON.parse(JSON.stringify(resp)).dBankAllocation

    // cBankAllocation
    if (cBankAllocation === null) {
      if ('cBankAllocation' in data) {
        await BankAllocation.create(data.cBankAllocation).then((resp) => {
          data.contraVoucher['cBankAllocationId'] = resp.getDataValue('id')
        })
      }
    } else {
      if ('cBankAllocation' in data) {
        await BankAllocation.update(data.cBankAllocation, {
          where: { id: cBankAllocation.id },
        })
      } else await BankAllocation.destroy({ where: { id: cBankAllocation.id } })
    }

    // dBankAllocation
    if (dBankAllocation === null) {
      if ('dBankAllocation' in data) {
        await BankAllocation.create(data.dBankAllocation).then((resp) => {
          data.contraVoucher['dBankAllocationId'] = resp.getDataValue('id')
        })
      }
    } else {
      if ('dBankAllocation' in data) {
        await BankAllocation.update(data.dBankAllocation, {
          where: { id: dBankAllocation.id },
        })
      } else await BankAllocation.destroy({ where: { id: dBankAllocation.id } })
    }
  })

  await ContraVoucher.update(data.contraVoucher, { where: { id: data.contraVoucher.id } })

  return true
})
