{
  const section = document.querySelector('section#ledgers-summary')
  new MutationObserver(ledgersSummary).observe(section, {
    attributeFilter: ['class'],
  })

  const flatpickr = require('flatpickr')
  const { ipcRenderer } = require('electron')
  const $ = require('jquery')
  const Mousetrap = require('mousetrap')
  const moment = require('moment')

  // Get Elements
  const ledgerName = section.querySelector('#ledger-name')
  const firstDate = section.querySelector('#first-date')
  const secondDate = section.querySelector('#second-date')
  const table = section.querySelector('#ledgers_summary_data_table')

  const ledgersObj = {}

  /*---------------------------------------
      Flatepickr - Custom Date Picker
    ----------------------------------------*/
  const dd = new Date().getDate()
  const mm = new Date().getMonth() + 1
  const yyyy = new Date().getFullYear()
  const date2 = `${dd}.${mm}.${yyyy}`
  const date1 = `${'01' + '.'}${mm}.${yyyy}`

  flatpickr('section#ledgers-summary #second-date', {
    dateFormat: 'd.m.Y',
    defaultDate: date2,
  })

  flatpickr('section#ledgers-summary #first-date', {
    dateFormat: 'd.m.Y',
    defaultDate: date1,
  })

  /*------------------------------------------
      Initialize Data Table
    ------------------------------------------*/
  $.fn.dataTable.Api.register('sum()', function () {
    return this.flatten().reduce((a, b) => {
      if (typeof a === 'string') {
        a = a.replace(/[^\d.-]/g, '') * 1
      }
      if (typeof b === 'string') {
        b = b.replace(/[^\d.-]/g, '') * 1
      }

      return a + b
    }, 0)
  })

  const dataTable = $('#ledgers_summary_data_table').DataTable({
    drawCallback() {
      const api = this.api()
      const debitTotal = api.column(4).data().sum().toFixed(2)
      const creditTotal = api.column(5).data().sum().toFixed(2)

      $(api.table().footer()).html(`
              <tr> 
                  <th colspan="4" style="text-align: right;">Current Total:</th>
                  <th id="total-debit">${debitTotal > 0 ? `₹ ${debitTotal}` : ''}</th>
                  <th id="total-credit">${creditTotal > 0 ? `₹ ${creditTotal}` : ''}</th>    
                  <th></th>                                
              </tr>
              <tr> 
                  <th colspan="4" style="text-align: right; border-top: 0px">Closing Balance: </th>
                  <th colspan="2" style="border-top: 0px" id="closing-balance"></th>
                  <th style="border-top: 0px"></th>
              </tr>
            `)
    },

    columns: [
      {
        data: 'date',
      },
      {
        data: 'perticular',
      },
      {
        data: 'voucherType',
      },
      {
        data: 'voucherNo',
      },
      {
        data: 'debit',
      },
      {
        data: 'credit',
      },
      {
        data: 'actions',
      },
    ],
    autoWidth: false,
  })

  /*------------------------------------------
        Hide or Undo Table Rows
    ------------------------------------------*/
  let hiddenRows = []
  ledgerName.addEventListener('change', () => (hiddenRows = []))

  function hideRows() {
    table.querySelectorAll('tbody button').forEach((el) => {
      el.addEventListener('click', (event) => {
        hiddenRows.push(event.target.getAttribute('data-id'))

        displayTableData()
      })
    })
  }

  /*------------------------------------------
    Fetch all vouchers
  ------------------------------------------*/
  firstDate.addEventListener('input', fetchVouchers)
  secondDate.addEventListener('input', fetchVouchers)

  let sales, purchases, adjustments
  async function fetchVouchers() {
    adjustments = []
    sales = {}
    purchases = {}

    await ipcRenderer.invoke('fetch-all-purchases', getDates()).then((data) => {
      data.forEach((el) => {
        el['voucherType'] = 'Purchase'
        el['adjustmentAmt'] = 0

        purchases[el.id] = el
      })
    })

    await ipcRenderer.invoke('fetch-all-sales', getDates()).then((data) => {
      data.forEach((el) => {
        el['voucherType'] = 'Sale'
        el['adjustmentAmt'] = 0

        sales[el.id] = el
      })
    })

    await ipcRenderer.invoke('fetch-receipt-voucher-refs', getDates()).then((data) => {
      if (data === 0) return
      data.forEach((receiptRef) => {
        sales[receiptRef.name].adjustmentAmt += receiptRef.amount
        receiptRef['voucherType'] = 'Receipt'
        adjustments.push(receiptRef)
      })
    })

    await ipcRenderer.invoke('fetch-payment-voucher-refs', getDates()).then((data) => {
      if (data === 0) return
      data.forEach((paymentRef) => {
        purchases[paymentRef.name].adjustmentAmt += paymentRef.amount
        paymentRef['voucherType'] = 'Payment'
        adjustments.push(paymentRef)
      })
    })

    await ipcRenderer.invoke('fetch-contra-vouchers').then((data) => {
      if (data === 0) return
      data.forEach((voucher) => {
        voucher['voucherType'] = 'Contra'
        adjustments.push(voucher)
      })
    })

    displayTableData()
  }

  /*------------------------------------------
    Display Table Data
  ------------------------------------------*/
  ledgerName.addEventListener('change', displayTableData)

  function displayTableData() {
    if (ledgerName.value === '') return

    table.querySelector('#opening-balance').textContent =
      ledgersObj[ledgerName.value].openingBalance !== null
        ? `₹ ${ledgersObj[ledgerName.value].openingBalance}`
        : ''

    dataTable.clear().draw()

    const rows = []
    const selectedLedgersGroupName = ledgersObj[ledgerName.value].group.name
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')

    if (selectedLedgersGroupName === 'sundry-creditors') {
      Object.values(purchases).forEach((purchase) => {
        for (const row of hiddenRows) {
          if (row == purchase.id) return
        }

        rows.push({
          date: moment(purchase.date).format('DD.MM.YYYY'),
          perticular: ledgersObj[purchase.ledgerId].name,
          voucherType: purchase.voucherType,
          voucherNo: purchase.id,
          debit: `₹ ${purchase.adjustmentAmt?.toFixed(2)}`,
          credit: `₹ ${Number(purchase.tAmount).toFixed(2)}`,
          actions: `<button class="button" data-id="${purchase.id}">Hide</button>`,
        })
      })
    } else if (selectedLedgersGroupName === 'sundry-debtors') {
      Object.values(sales).forEach((sale) => {
        for (const row of hiddenRows) {
          if (row == sale.id) return
        }

        rows.push({
          date: moment(purchase.date).format('DD.MM.YYYY'),
          perticular: ledgersObj[sale.ledgerId].name,
          voucherType: sale.voucherType,
          voucherNo: sale.id,
          credit: `₹ ${sale.adjustmentAmt?.toFixed(2)}`,
          debit: `₹ ${Number(sale.tAmount).toFixed(2)}`,
          actions: `<button class="button" data-id="${sale.id}">Hide</button>`,
        })
      })
    } else if (
      selectedLedgersGroupName === 'bank-accounts' ||
      selectedLedgersGroupName === 'cash-in-hand'
    ) {
      adjustments.forEach((adjustment) => {
        for (const row of hiddenRows) {
          if (row == adjustment.voucherType + adjustment.id) return
        }

        let date,
          voucherNo,
          perticular,
          credit = '',
          debit = ''
        if (adjustment.voucherType === 'Payment') {
          if (adjustment.paymentVoucher.cLedgerId !== Number(ledgerName.value)) return
          date = adjustment.paymentVoucher.date
          credit = adjustment.amount
          voucherNo = adjustment.paymentVoucher.id
          perticular = adjustment.paymentVoucher.dLedgerId
        } else if (adjustment.voucherType === 'Receipt') {
          if (adjustment.receiptVoucher.dLedgerId !== Number(ledgerName.value)) return
          date = adjustment.receiptVoucher.date
          debit = adjustment.amount
          voucherNo = adjustment.receiptVoucher.id
          perticular = adjustment.receiptVoucher.cLedgerId
        } else if (adjustment.voucherType === 'Contra') {
          if (adjustment.dLedgerId === Number(ledgerName.value)) debit = adjustment.debit
          if (adjustment.cLedgerId === Number(ledgerName.value)) credit = adjustment.credit
          date = adjustment.date
          voucherNo = adjustment.id
          perticular = ledgerName.value
        }

        rows.push({
          date: moment(date).format('DD.MM.YYYY'),
          perticular: ledgersObj[perticular].name,
          voucherType: adjustment.voucherType,
          voucherNo,
          credit,
          debit,
          actions: `<button class="button" data-id="${
            adjustment.voucherType + adjustment.id
          }">Hide</button>`,
        })
      })
    }

    dataTable.rows.add(rows).draw()
    section.querySelector('.table-wrapper').style.display = 'block'
    hideRows()

    const totalCredit = table.querySelector('tfoot #total-credit').textContent.replace('₹', '')
    const totalDebit = table.querySelector('tfoot #total-debit').textContent.replace('₹', '')

    let closingBalance = Number(ledgersObj[ledgerName.value].openingBalance) || 0

    if (selectedLedgersGroupName === 'sundry-creditors') {
      closingBalance += Number(totalCredit - totalDebit)
    } else if (
      selectedLedgersGroupName === 'sundry-debtors' ||
      selectedLedgersGroupName === 'bank-accounts' ||
      selectedLedgersGroupName === 'cash-in-hand'
    ) {
      closingBalance += Number(totalDebit - totalCredit)
    }

    table.querySelector('tfoot #closing-balance').textContent = `₹ ${closingBalance.toFixed(2)}`
  }

  // Helper Functions
  function getDates() {
    let v_firstDate = firstDate.value
    let v_secondDate = secondDate.value

    v_firstDate = v_firstDate.split('.')
    v_secondDate = v_secondDate.split('.')

    return {
      firstDate: `${v_firstDate[2]}-${v_firstDate[1]}-${v_firstDate[0]}`,
      secondDate: `${v_secondDate[2]}-${v_secondDate[1]}-${v_secondDate[0]}`,
    }
  }

  /* ====================================================================================== */
  async function ledgersSummary() {
    if (!section.classList.contains('show')) return
    section.querySelector('.table-wrapper').style.display = 'none'

    /*------------------------------------------
      Fetch all Ledgers and Groups
    ------------------------------------------*/
    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      ledgerName.innerHTML = '<option value="" selected hidden disabled>Select Ledger</option>'

      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name

        ledgerName.appendChild(option)
        ledgersObj[el.id] = el
      })
    })

    fetchVouchers()

    /*------------------------------------------
      Mousetrap
    ------------------------------------------*/
    Mousetrap.unbind('alt+u')
    Mousetrap.bind('alt+u', () => {
      hiddenRows.pop()
      displayTableData()
    })
  }
}
