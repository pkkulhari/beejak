{
  const section = document.querySelector('section#purchase-discounts')
  new MutationObserver(purchaseDiscounts).observe(section, {
    attributeFilter: ['class'],
  })

  const { ipcRenderer } = require('electron')
  const $ = require('jquery')
  const moment = require('moment')
  const MouseTrap = require('mousetrap')
  const flatpickr = require('flatpickr')

  // Get Elements
  const firstDate = section.querySelector('#first-date')
  const secondDate = section.querySelector('#second-date')

  const ledgersObj = {}

  /*---------------------------------------
      Flatepickr - Custom Date Picker
    ----------------------------------------*/
  flatpickr('section#purchase-discounts #second-date', {
    altInput: true,
    dateFormat: 'Y-m-d',
    altFormat: 'd.m.Y',
    defaultDate: new Date(),
  })

  flatpickr('section#purchase-discounts #first-date', {
    altInput: true,
    dateFormat: 'Y-m-d',
    altFormat: 'd.m.Y',
    defaultDate: moment().format('YYYY-MM-01'),
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

  const dataTable = $('#purchase_discounts_data_table').DataTable({
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, 'All'],
    ],

    columns: [
      {
        data: 'item',
      },
      {
        data: 'party',
      },
      {
        data: 'voucherNo',
      },
      {
        data: 'date',
      },
      {
        data: 'actualRate',
      },
      {
        data: 'purchasedRate',
      },
      {
        data: 'discount',
      },
    ],
    autoWidth: false,
  })

  /*------------------------------------------
        Fetch all Purchases
    ------------------------------------------*/
  firstDate.addEventListener('input', fetchPurchases)
  secondDate.addEventListener('input', fetchPurchases)

  async function fetchPurchases() {
    const actualRates = {}
    await ipcRenderer.invoke('fetch-purchase-items-latest-price').then((data) => {
      if (data === 0) return

      data.forEach((el) => {
        actualRates[el.stockItemId] = el.rate
      })
    })

    ipcRenderer
      .invoke('fetch-all-purchase-items', {
        firstDate: firstDate.value,
        secondDate: secondDate.value,
      })
      .then((data) => {
        dataTable.clear().draw()
        if (data.length === 0) return

        const rows = []
        data.forEach((el) => {
          const row = {
            item: el.stockItem.name,
            party: ledgersObj[el.purchase.ledgerId].name,
            voucherNo: el.purchase.supplierInvNo,
            date: moment(el.createdAt).format('DD.MM.YYYY'),
            actualRate: `₹ ${actualRates[el.stockItemId]}` || '',
            purchasedRate: `₹ ${el.rate}`,
            discount: `₹ ${Number(el.rate) - actualRates[el.stockItemId] || ''}`,
          }

          rows.push(row)
        })

        dataTable.rows.add(rows).draw()
      })
  }

  /*= ===================================================================================== */
  async function purchaseDiscounts() {
    if (!section.classList.contains('show')) return

    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      data.forEach((el) => {
        ledgersObj[el.id] = el
      })
    })

    fetchPurchases()
  }
}
