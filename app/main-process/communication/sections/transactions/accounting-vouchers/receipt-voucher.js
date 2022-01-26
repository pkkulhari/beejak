'user strict'

const { ipcMain } = require('electron')
const { Op } = require('sequelize')
const ReceiptVoucher = require('../../../../../database/models/transactions/accounting-vouchers/receipt/ReceiptVoucher')
const ReceiptVoucherRef = require('../../../../../database/models/transactions/accounting-vouchers/receipt/ReceiptVoucherRef')
const BankAllocation = require('../../../../../database/models/transactions/accounting-vouchers/BankAllocation')

// Handle IPC Events
ipcMain.handle('fetch-last-receipt-voucher', (event) => {
  return ReceiptVoucher.findAll({
    limit: 1,
    order: [['createdAt', 'DESC']],
  }).then((resp) => JSON.parse(JSON.stringify(resp)))
})

ipcMain.handle('fetch-receipt-vouchers-by-ledger', (event, ledgerID) => {
  return ReceiptVoucher.findAll({
    where: { [Op.or]: [{ cLedgerId: ledgerID }, { dLedgerId: ledgerID }] },
    include: { model: ReceiptVoucherRef },
  }).then((resp) =>
    JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
  )
})

ipcMain.handle('save-receipt-voucher', async (event, data) => {
  let isUpdate = false

  await ReceiptVoucher.findOne({ where: { id: data.receiptVoucher.id } }).then((resp) => {
    if (JSON.parse(JSON.stringify(resp)) !== null) isUpdate = true
  })

  if (isUpdate === false) {
    if ('bankAllocation' in data) {
      await BankAllocation.create(data.bankAllocation).then((resp) => {
        data.receiptVoucher['bankAllocationId'] = resp.getDataValue('id')
      })
    }
    await ReceiptVoucher.create(data.receiptVoucher)
    data.receiptVoucherRefs.forEach(async (receiptVoucherRef) => {
      await ReceiptVoucherRef.create(receiptVoucherRef)
    })

    return true
  }

  // Update bankAllocation
  await ReceiptVoucher.findOne({
    where: { id: data.receiptVoucher.id },
    include: { model: BankAllocation },
  }).then(async (resp) => {
    const bankAllocation = JSON.parse(JSON.stringify(resp)).bankAllocation

    if (bankAllocation === null) {
      if ('bankAllocation' in data) {
        await BankAllocation.create(data.bankAllocation).then((resp) => {
          data.receiptVoucher['bankAllocationId'] = resp.getDataValue('id')
        })
      }
    } else {
      if ('bankAllocation' in data) {
        await BankAllocation.update(data.bankAllocation, {
          where: { id: bankAllocation.id },
        })
      } else await BankAllocation.destroy({ where: { id: bankAllocation.id } })
    }
  })

  // Update receiptVoucher
  await ReceiptVoucher.update(data.receiptVoucher, { where: { id: data.receiptVoucher.id } })

  // ReceiptVoucherRef - Update, delete, create
  let receiptVoucherRefNames = []
  await ReceiptVoucherRef.findAll({ where: { receiptVoucherId: data.receiptVoucher.id } }).then(
    (resp) => {
      JSON.parse(JSON.stringify(resp)).forEach((receiptVoucherRef) => {
        receiptVoucherRefNames.push(receiptVoucherRef.name)
      })
    }
  )
  for (const receiptVoucherRef of Object.values(data.receiptVoucherRefs)) {
    if (receiptVoucherRefNames.includes(receiptVoucherRef.name)) {
      await ReceiptVoucherRef.update(receiptVoucherRef, {
        where: { receiptVoucherId: data.receiptVoucher.id, name: receiptVoucherRef.name },
      })
      receiptVoucherRefNames = receiptVoucherRefNames.filter(
        (name) => name !== receiptVoucherRef.name
      )
    }
  }

  await ReceiptVoucherRef.destroy({
    where: { receiptVoucherId: data.receiptVoucher.id, name: receiptVoucherRefNames },
  })
  data.receiptVoucherRefs.forEach(async (receiptVoucherRef) => {
    await ReceiptVoucherRef.findOrCreate({
      where: { receiptVoucherId: data.receiptVoucher.id, name: receiptVoucherRef.name },
      defaults: receiptVoucherRef,
    })
  })

  return true
})

ipcMain.handle('fetch-receipt-voucher-refs', (event, data) => {
  return ReceiptVoucherRef.findAll({
    include: {
      model: ReceiptVoucher,
      where: { date: { [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`] } },
    },
  }).then((resp) =>
    JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
  )
})
