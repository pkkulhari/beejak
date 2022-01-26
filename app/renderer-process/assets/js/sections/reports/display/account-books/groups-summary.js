{
  const section = document.querySelector('section#groups-summary')
  new MutationObserver(groupsSummary).observe(section, {
    attributeFilter: ['class'],
  })

  const flatpickr = require('flatpickr')
  const { ipcRenderer } = require('electron')
  const $ = require('jquery')
  const Mousetrap = require('mousetrap')

  // Get Elements
  const groupName = section.querySelector('#group-name')
  const firstDate = section.querySelector('#first-date')
  const secondDate = section.querySelector('#second-date')

  const ledgersObj = {},
    groupsObj = {}

  /*---------------------------------------
    Flatepickr - Custom Date Picker
  ----------------------------------------*/
  const dd = new Date().getDate()
  const mm = new Date().getMonth() + 1
  const yyyy = new Date().getFullYear()
  const date2 = `${dd}.${mm}.${yyyy}`
  const date1 = `${'01' + '.'}${mm}.${yyyy}`

  flatpickr('section#groups-summary #second-date', {
    dateFormat: 'd.m.Y',
    defaultDate: date2,
  })

  flatpickr('section#groups-summary #first-date', {
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

  const dataTable = $('#groups_summary_data_table').DataTable({
    drawCallback() {
      const api = this.api()
      const openingBalance = api.column(1).data().sum().toFixed(2)
      const debitTotal = api.column(2).data().sum().toFixed(2)
      const creditTotal = api.column(3).data().sum().toFixed(2)
      const closingBalance = api.column(4).data().sum().toFixed(2)

      $(api.table().footer()).html(`
              <tr> 
                  <th style="text-align: right;">Grand Total:</th>
                  <th>${openingBalance > 0 ? `₹ ${openingBalance}` : ''}</th>
                  <th>${debitTotal > 0 ? `₹ ${debitTotal}` : ''}</th>
                  <th>${creditTotal > 0 ? `₹ ${creditTotal}` : ''}</th>    
                  <th>${closingBalance > 0 ? `₹ ${closingBalance}` : ''}</th>                  
              </tr>           
            `)
    },

    columns: [
      {
        data: 'perticular',
      },
      {
        data: 'openingBalance',
      },
      {
        data: 'debit',
      },
      {
        data: 'credit',
      },
      {
        data: 'closingBalance',
      },
    ],
    autoWidth: false,
  })

  /*------------------------------------------
     Fetch all Vouchers
  ------------------------------------------*/
  firstDate.addEventListener('input', fetchVouchers)
  secondDate.addEventListener('input', fetchVouchers)

  async function fetchVouchers() {
    Object.values(groupsObj).forEach((group) => {
      group['credit'] = 0
      group['debit'] = 0
      group['openingBalance'] = 0
      group['closingBalance'] = 0
    })

    await ipcRenderer.invoke('fetch-all-purchases', getDates()).then((data) => {
      data.forEach((el) => {
        groupsObj[ledgersObj[el.ledgerId].group.id].credit += Number(el.tAmount)
      })
    })

    await ipcRenderer.invoke('fetch-all-sales', getDates()).then((data) => {
      data.forEach((el) => {
        groupsObj[ledgersObj[el.ledgerId].group.id].debit += Number(el.tAmount)
      })
    })

    await ipcRenderer.invoke('fetch-receipt-voucher-refs', getDates()).then((data) => {
      if (data === 0) return

      data.forEach((receiptRef) => {
        const groupName = groupsObj[ledgersObj[receiptRef.receiptVoucher.dLedgerId].group.id].name
          .trim()
          .toLowerCase()
          .replaceAll(' ', '-')

        if (groupName === 'cash-in-hand' || groupName === 'bank-accounts') {
          groupsObj[ledgersObj[receiptRef.receiptVoucher.dLedgerId].group.id].debit +=
            receiptRef.amount
          return
        }
        groupsObj[ledgersObj[receiptRef.name].group.id].debit += receiptRef.amount
      })
    })

    await ipcRenderer.invoke('fetch-payment-voucher-refs', getDates()).then((data) => {
      if (data === 0) return

      data.forEach((paymentRef) => {
        const groupName = groupsObj[ledgersObj[paymentRef.paymentVoucher.cLedgerId].group.id].name
          .trim()
          .toLowerCase()
          .replaceAll(' ', '-')

        if (groupName === 'cash-in-hand' || groupName === 'bank-accounts') {
          groupsObj[ledgersObj[paymentRef.paymentVoucher.cLedgerId].group.id].credit +=
            paymentRef.amount
          return
        }
        groupsObj[ledgersObj[paymentRef.name].group.id].credit += paymentRef.amount
      })
    })

    await ipcRenderer.invoke('fetch-contra-vouchers').then((data) => {
      if (data === 0) return
      data.forEach((voucher) => {
        groupsObj[ledgersObj[voucher.cLedgerId].group.id].credit += voucher.credit
        groupsObj[ledgersObj[voucher.dLedgerId].group.id].debit += voucher.debit
      })
    })

    displayTableData()
  }

  /*------------------------------------------
    Display Table Data
  ------------------------------------------*/
  groupName.addEventListener('change', displayTableData)

  function displayTableData() {
    if (groupName.value === '') return

    // Compute opening and closing balance
    Object.values(groupsObj[groupName.value].ledgers).forEach((ledger) => {
      groupsObj[groupName.value].openingBalance = Number(ledger.openingBalance)
    })

    groupsObj[groupName.value].closingBalance =
      groupsObj[groupName.value].openingBalance +
      (groupsObj[groupName.value].debit - groupsObj[groupName.value].credit)

    dataTable.clear().draw()

    const row = {
      perticular: groupName.selectedOptions[0].label,
      openingBalance: '₹ ' + groupsObj[groupName.value].openingBalance.toFixed(2),
      debit: '₹ ' + groupsObj[groupName.value].debit.toFixed(2),
      credit: '₹ ' + groupsObj[groupName.value].credit.toFixed(2),
      closingBalance: '₹ ' + groupsObj[groupName.value].closingBalance.toFixed(2),
    }

    dataTable.row.add(row).draw()
    section.querySelector('.table-wrapper').style.display = 'block'
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
  async function groupsSummary() {
    if (!section.classList.contains('show')) return
    section.querySelector('.table-wrapper').style.display = 'none'

    /*------------------------------------------
      Fetch all Ledgers and Groups
    ------------------------------------------*/
    await ipcRenderer.invoke('fetch-all-groups').then((data) => {
      groupName.innerHTML = '<option value="" selected hidden disabled>Select Group</option>'

      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name

        groupName.appendChild(option)
        groupsObj[el.id] = el
      })
    })

    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      data.forEach((el) => {
        ledgersObj[el.id] = el
      })
    })

    fetchVouchers()
  }
}
