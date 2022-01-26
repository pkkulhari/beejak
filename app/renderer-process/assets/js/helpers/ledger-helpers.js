'use scrict'

{
  const { ipcRenderer } = require('electron')

  // Get closing bal. of ledger
  const getLegerClosingBal = async (ledger) => {
    let openingBal = Number(ledger.openingBalance)
    let groupName = ledger.group.name.trim().toLowerCase().replaceAll(' ', '-')
    let totalDebitBal = 0
    let totalCreditBal = 0

    await ipcRenderer.invoke('fetch-sales-by-ledger', ledger.id).then((data) => {
      if (data === 0) return
      data.forEach((voucher) => (totalDebitBal += voucher.tAmount))
    })

    await ipcRenderer.invoke('fetch-purchases-by-ledger', ledger.id).then((data) => {
      if (data === 0) return
      data.forEach((voucher) => (totalCreditBal += voucher.tAmount))
    })

    await ipcRenderer.invoke('fetch-payment-vouchers-by-ledger', ledger.id).then((data) => {
      if (data === 0) return

      data.forEach((voucher) => {
        if (groupName !== 'sundry-debtors') {
          if (voucher.cLedgerId === Number(ledger.id)) totalCreditBal += voucher.credit
          else if (voucher.dLedgerId === Number(ledger.id)) totalDebitBal += voucher.debit
        }
      })
    })

    await ipcRenderer.invoke('fetch-receipt-vouchers-by-ledger', ledger.id).then((data) => {
      if (data === 0) return

      data.forEach((voucher) => {
        if (groupName !== 'sundry-creditors') {
          if (voucher.cLedgerId === Number(ledger.id)) totalCreditBal += voucher.credit
          else if (voucher.dLedgerId === Number(ledger.id)) totalDebitBal += voucher.debit
        }
      })
    })

    await ipcRenderer.invoke('fetch-contra-vouchers-by-ledger', ledger.id).then((data) => {
      if (data === 0) return
      data.forEach((voucher) => {
        if (Number(ledger.id) === voucher.cLedgerId) totalCreditBal += voucher.credit
        if (Number(ledger.id) === voucher.dLedgerId) totalDebitBal += voucher.debit
      })
    })

    if (groupName === 'sundry-debtors') return openingBal + (totalDebitBal - totalCreditBal)
    if (groupName === 'sundry-creditors') return openingBal + (totalCreditBal - totalDebitBal)
    if (groupName === 'bank-accounts' || groupName === 'cash-in-hand') {
      return openingBal + (totalDebitBal - totalCreditBal)
    }
  }

  // Get pending bills
  const getPendingBills = async (ledger) => {
    const pendingBills = {},
      paidBills = {}

    if (ledger.group.name.toLowerCase().trim().replaceAll(' ', '-') === 'sundry-creditors') {
      await ipcRenderer.invoke('fetch-payment-vouchers-by-ledger', ledger.id).then((data) => {
        if (data === 0) return

        data.forEach((voucher) => {
          voucher.paymentVoucherRefs.forEach((paymentVoucherRef) => {
            if (paymentVoucherRef.name in paidBills)
              paidBills[paymentVoucherRef.name] += paymentVoucherRef.amount
            else paidBills[paymentVoucherRef.name] = paymentVoucherRef.amount
          })
        })
      })

      await ipcRenderer.invoke('fetch-purchases-by-ledger', ledger.id).then((data) => {
        if (data === 0) return

        data.forEach((voucher) => {
          if (voucher.id in paidBills) voucher.tAmount -= paidBills[voucher.id]
          pendingBills[voucher.id] = voucher
          if (voucher.tAmount === 0) return
        })
      })
    } else if (ledger.group.name.toLowerCase().trim().replaceAll(' ', '-') === 'sundry-debtors') {
      await ipcRenderer.invoke('fetch-receipt-vouchers-by-ledger', ledger.id).then((data) => {
        if (data === 0) return

        data.forEach((voucher) => {
          voucher.receiptVoucherRefs.forEach((receiptVoucherRef) => {
            if (receiptVoucherRef.name in paidBills)
              paidBills[receiptVoucherRef.name] += receiptVoucherRef.amount
            else paidBills[receiptVoucherRef.name] = receiptVoucherRef.amount
          })
        })
      })

      await ipcRenderer.invoke('fetch-sales-by-ledger', ledger.id).then((data) => {
        if (data === 0) return

        data.forEach((voucher) => {
          if (voucher.id in paidBills) {
            voucher.tAmount -= paidBills[voucher.id]
            if (voucher.tAmount === 0) return
          }
          pendingBills[voucher.id] = voucher
        })
      })
    }

    return pendingBills
  }

  module.exports = { getLegerClosingBal, getPendingBills }
}
