{
  const { ipcRenderer, remote } = require('electron')
  const { BrowserWindow } = remote
  const { session } = remote
  const path = require('path')
  const moment = require('moment')

  // Get Elements
  const section = document.querySelector('section#sales')

  const voucherNo = section.querySelector('#voucher-no')
  const date = section.querySelector('#date')
  const vahicleNo = section.querySelector('#vahicle-no')

  const ledgerCode = section.querySelector('#ledger-code')
  const ledgerName = section.querySelector('#ledger-name')
  const ledgerGSTIN = section.querySelector('#ledger-gstin')
  const ledgerMobile = section.querySelector('#ledger-mobile')
  const ledgerAddress1 = section.querySelector('#ledger-address-1')

  const shipCode = section.querySelector('#ship-code')
  const shipName = section.querySelector('#ship-name')
  const shipGSTIN = section.querySelector('#ship-gstin')
  const shipMobile = section.querySelector('#ship-mobile')
  const shipAddress1 = section.querySelector('#ship-address-1')

  const totalOutwardQty = section.querySelector('#total-outward-qty')
  const totalTradePrice = section.querySelector('#total-trade-price')
  const totalDiscount1 = section.querySelector('#total-discount-1')
  const totalDiscount2 = section.querySelector('#total-discount-2')
  const totalTaxableAmt = section.querySelector('#total-taxable-amt')
  const totalCgstAmt = section.querySelector('#total-cgst-amt')
  const totalSgstAmt = section.querySelector('#total-sgst-amt')
  const totalCessAmt = section.querySelector('#total-cess-amt')
  const totalAmt = section.querySelector('#total-amount')

  const printBtn = section.querySelector('#print-btn')

  // Event
  printBtn.addEventListener('click', () => {
    // Get Elements
    const stockItems = section.querySelectorAll('.stock-item')
    const mrps = section.querySelectorAll('.mrp')
    const totalOutwardQuantities = section.querySelectorAll('.total-outward-qty')
    const hsnCodes = section.querySelectorAll('.hsn-code')
    const packSizes = section.querySelectorAll('.pack-size')
    const rates = section.querySelectorAll('.rate')
    const tradePrices = section.querySelectorAll('.trade-price')
    const discount1s = section.querySelectorAll('.discount-1')
    const discount2s = section.querySelectorAll('.discount-2')
    const taxableAmts = section.querySelectorAll('.taxable-amt')
    const cgstPers = section.querySelectorAll('.cgst-per')
    const cgstAmts = section.querySelectorAll('.cgst-amt')
    const sgstPers = section.querySelectorAll('.sgst-per')
    const sgstAmts = section.querySelectorAll('.sgst-amt')
    const cessPers = section.querySelectorAll('.cess-per')
    const cessAmts = section.querySelectorAll('.cess-amt')
    const totalAmounts = section.querySelectorAll('.total-amount')
    const schemeDescs = section.querySelectorAll('.scheme-desc')

    // Invoice Data
    const invoiceData = {
      invNo: voucherNo.value,
      invDate: moment(date.value).format('DD.MM.YYYY'),
      vahicleNo: vahicleNo.value,
      billCustCode: ledgerCode.value,
      billCustName: ledgerName.selectedOptions[0].label,
      billCustGSTIN: ledgerGSTIN.value,
      billCustMobile: ledgerMobile.value,
      billCustAddress: ledgerAddress1.value,
      shipCustCode: shipCode.value,
      shipCustName: shipName.value,
      shipCustGSTIN: shipGSTIN.value,
      shipCustMobile: shipMobile.value,
      shipCustAddress: shipAddress1.value,
      totalOutwardQty: totalOutwardQty.value,
      totalTradePrice: totalTradePrice.value,
      totalDiscount: (Number(totalDiscount1.value) + Number(totalDiscount2.value)).toFixed(2),
      totalTaxableAmt: totalTaxableAmt.value,
      totalCgstAmt: totalCgstAmt.value,
      totalSgstAmt: totalSgstAmt.value,
      totalCessAmt: totalCessAmt.value,
      totalAmt: totalAmt.value,

      rows: [],
      summary: {
        totalCgst: 0,
        totalSgst: 0,
        totalCess: 0,
      },
      summaryRows: [],
    }

    // Invoice Items Data
    let rowInputFields = [
      stockItems,
      hsnCodes,
      mrps,
      packSizes,
      rates,
      totalOutwardQuantities,

      tradePrices,
      discount1s,
      discount2s,
      taxableAmts,
      cgstPers,
      cgstAmts,
      sgstPers,
      sgstAmts,
      cessPers,
      cessAmts,
      totalAmounts,
      schemeDescs,
    ]

    const rowsDataArray = []
    for (let i = 0; i < stockItems.length; i++) {
      const rowDataArray = []
      rowInputFields.forEach((rowInputField) => {
        if (rowInputField[i].classList.contains('stock-item')) {
          rowDataArray.push(rowInputField[i].selectedOptions[0].label)
          return
        }

        if (rowInputField[i].classList.contains('total-outward-qty')) {
          rowDataArray.push(rowInputField[i].value)
          rowDataArray.push(rowInputField[i].getAttribute('data-unit'))
          return
        }

        rowDataArray.push(rowInputField[i].value)
      })
      rowsDataArray.push(rowDataArray)
    }

    rowsDataArray.forEach((el) => {
      const rowArray = [
        el[0],
        el[1],
        el[2],
        el[3],
        el[4],
        el[5],
        el[6],
        el[7],
        Number(el[8]) + Number(el[9]),
        el[10],
        el[11],
        el[12],
        el[13],
        el[14],
        el[15],
        el[16],
        el[17],
        el[18],
      ]

      invoiceData.rows.push(rowArray)
    })

    // Invoice Summary Data
    rowInputFields = [hsnCodes, cgstPers, cgstAmts, sgstPers, sgstAmts, cessPers, cessAmts]
    for (let i = 0; i < hsnCodes.length; i++) {
      const summaryRow = []
      rowInputFields.forEach((inputField) => {
        summaryRow.push(Number(inputField[i].value))
      })
      invoiceData.summaryRows.push(summaryRow)
    }
    invoiceData.summaryRows = duplicateRows_sum(invoiceData.summaryRows)

    invoiceData.summaryRows.forEach((inputFieldData) => {
      for (let i = 0; i < inputFieldData.length; i++) {
        switch (i) {
          case 2:
            invoiceData.summary.totalCgst += inputFieldData[i]
            break
          case 4:
            invoiceData.summary.totalSgst += inputFieldData[i]
            break
          case 6:
            invoiceData.summary.totalCess += inputFieldData[i]
            break
        }
      }
    })

    // Set Session
    const cookie = {
      url: 'http://localhost',
      name: 'invoiceData',
      value: JSON.stringify(invoiceData),
    }
    session.defaultSession.cookies.set(cookie).catch((err) => {
      if (err) console.error(err)
    })

    // Print Invoice
    const URL = path.join(
      __dirname,
      '../../../../../../sections/transactions/accounting-vouchers/sales/invoice-print-template.html'
    )
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    })
    printWin.loadURL(URL)

    const options = {
      margin: {
        marginType: 'printableArea',
      },
      pagePerSheet: 1,
      collate: true,
      landscape: true,
    }
    printWin.webContents.on('did-finish-load', () => {
      printWin.webContents.print(options, () => {
        printWin.close()
      })
    })
  })

  // Helper Functions
  function duplicateRows_sum(arr) {
    const m = {}
    arr.forEach((ls) => {
      const firstElement = ls[0]
      if (!m[firstElement]) {
        m[firstElement] = []
      }
      m[firstElement] = mergeLists(ls, m[firstElement])
    })
    const finalLs = []
    Object.keys(m).forEach((key) => {
      finalLs.push(m[key])
    })

    function mergeLists(a, b) {
      if (a.length == 0) return b
      if (b.length == 0) return a
      const finalList = [a[0]]
      for (let i = 1; i < a.length; i++) {
        if (i % 2 === 0) finalList.push(a[i] + b[i])
        else finalList.push(a[i])
      }
      return finalList
    }

    return finalLs
  }
}
