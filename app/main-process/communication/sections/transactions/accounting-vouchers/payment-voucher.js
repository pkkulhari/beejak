'user strict'

const { ipcMain } = require('electron')
const { Op } = require('sequelize')
const PaymentVoucher = require('../../../../../database/models/transactions/accounting-vouchers/payment/PaymentVoucher')
const PaymentVoucherRef = require('../../../../../database/models/transactions/accounting-vouchers/payment/PaymentVoucherRef')
const BankAllocation = require('../../../../../database/models/transactions/accounting-vouchers/BankAllocation')

// Handle IPC Events
ipcMain.handle('fetch-last-payment-voucher', (event) => {
  return PaymentVoucher.findAll({
    limit: 1,
    order: [['createdAt', 'DESC']],
  }).then((resp) => JSON.parse(JSON.stringify(resp)))
})

ipcMain.handle('fetch-payment-vouchers-by-ledger', (event, ledgerID) => {
  return PaymentVoucher.findAll({
    where: { [Op.or]: [{ cLedgerId: ledgerID }, { dLedgerId: ledgerID }] },
    include: { model: PaymentVoucherRef },
  }).then((resp) =>
    JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
  )
})

ipcMain.handle('save-payment-voucher', async (event, data) => {
  let isUpdate = false

  await PaymentVoucher.findOne({ where: { id: data.paymentVoucher.id } }).then((resp) => {
    if (JSON.parse(JSON.stringify(resp)) !== null) isUpdate = true
  })

  if (isUpdate === false) {
    if ('bankAllocation' in data) {
      await BankAllocation.create(data.bankAllocation).then((resp) => {
        data.paymentVoucher['bankAllocationId'] = resp.getDataValue('id')
      })
    }
    await PaymentVoucher.create(data.paymentVoucher)
    data.paymentVoucherRefs.forEach(async (paymentVoucherRef) => {
      await PaymentVoucherRef.create(paymentVoucherRef)
    })

    return true
  }

  // Update bankAllocation
  await PaymentVoucher.findOne({
    where: { id: data.paymentVoucher.id },
    include: { model: BankAllocation },
  }).then(async (resp) => {
    const bankAllocation = JSON.parse(JSON.stringify(resp)).bankAllocation

    if (bankAllocation === null) {
      if ('bankAllocation' in data) {
        await BankAllocation.create(data.bankAllocation).then((resp) => {
          data.paymentVoucher['bankAllocationId'] = resp.getDataValue('id')
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

  // Update paymentVoucher
  await PaymentVoucher.update(data.paymentVoucher, { where: { id: data.paymentVoucher.id } })

  // PaymentVoucherRef - Update, delete, create
  let paymentVoucherRefNames = []
  await PaymentVoucherRef.findAll({ where: { paymentVoucherId: data.paymentVoucher.id } }).then(
    (resp) => {
      JSON.parse(JSON.stringify(resp)).forEach((paymentVoucherRef) => {
        paymentVoucherRefNames.push(paymentVoucherRef.name)
      })
    }
  )
  for (const paymentVoucherRef of Object.values(data.paymentVoucherRefs)) {
    if (paymentVoucherRefNames.includes(paymentVoucherRef.name)) {
      await PaymentVoucherRef.update(paymentVoucherRef, {
        where: { paymentVoucherId: data.paymentVoucher.id, name: paymentVoucherRef.name },
      })
      paymentVoucherRefNames = paymentVoucherRefNames.filter(
        (name) => name !== paymentVoucherRef.name
      )
    }
  }

  await PaymentVoucherRef.destroy({
    where: { paymentVoucherId: data.paymentVoucher.id, name: paymentVoucherRefNames },
  })
  data.paymentVoucherRefs.forEach(async (paymentVoucherRef) => {
    await PaymentVoucherRef.findOrCreate({
      where: { paymentVoucherId: data.paymentVoucher.id, name: paymentVoucherRef.name },
      defaults: paymentVoucherRef,
    })
  })

  return true
})

ipcMain.handle('fetch-payment-voucher-refs', (event, data) => {
  return PaymentVoucherRef.findAll({
    include: {
      model: PaymentVoucher,
      where: { date: { [Op.between]: [data.firstDate, `${data.secondDate} 23:59:59`] } },
    },
  }).then((resp) =>
    JSON.parse(JSON.stringify(resp, (key, value) => (!isNaN(+value) ? Number(value) : value)))
  )
})
