{
  const section = document.querySelector('section#purchase-register')
  new MutationObserver(purchaseRegister).observe(section, {
    attributeFilter: ['class'],
  })

  const flatpickr = require('flatpickr')
  const { ipcRenderer } = require('electron')
  const $ = require('jquery')
  require('datatables.net')()
  const { updatePurchase } = require('../../../transactions/accounting-vouchers/purchase')
  const moment = require('moment')
  const MouseTrap = require('mousetrap')

  // Get Elements
  const firstDate = section.querySelector('#first-date')
  const secondDate = section.querySelector('#second-date')

  const ledgersObj = {}

  /*---------------------------------------
      Flatepickr - Custom Date Picker
    ----------------------------------------*/
  flatpickr('section#purchase-register #second-date', {
    altInput: true,
    dateFormat: 'Y-m-d',
    altFormat: 'd.m.Y',
    defaultDate: new Date(),
  })

  flatpickr('section#purchase-register #first-date', {
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

  const dataTable = $('#purchase_register_data_table').DataTable({
    drawCallback() {
      const api = this.api()
      const total1 = api.column(3).data().sum().toFixed(2)
      const total2 = api.column(4).data().sum().toFixed(2)
      $(api.table().footer()).html(`
              <tr> 
                  <th colspan="3" style="text-align: right">Total:</th>
                  <th>${total1 > 0 ? `₹ ${total1}` : ''}</th>
                  <th>${total2 > 0 ? `₹ ${total2}` : ''}</th>
                  <th></th>
              </tr>
            `)
    },

    columns: [
      {
        data: 'date',
      },
      {
        data: 'party',
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

  // Nested Rows
  section
    .querySelector('#purchase_register_data_table tbody')
    .addEventListener('click', async (event) => {
      const tr = event.target.closest('tr')
      if (!tr?.classList.contains('even') && !tr?.classList.contains('odd')) return
      const row = dataTable.row(tr)

      if (row.child.isShown()) {
        row.child.hide()
        tr.classList.remove('shown')
      } else {
        row.child(await createNestedTable(tr)).show()
        tr.classList.add('shown')
      }
    })

  /*------------------------------------------
    Fetch all Purchases
  ------------------------------------------*/
  firstDate.addEventListener('input', fetchPurchasesAndPayments)
  secondDate.addEventListener('input', fetchPurchasesAndPayments)

  async function fetchPurchasesAndPayments() {
    const payments = {}

    const purchases = await ipcRenderer.invoke('fetch-all-purchases', {
      firstDate: firstDate.value,
      secondDate: secondDate.value,
    })

    await ipcRenderer
      .invoke('fetch-payment-voucher-refs', {
        firstDate: firstDate.value,
        secondDate: secondDate.value,
      })
      .then((data) => {
        if (data === 0) return
        data.forEach((paymentRef) => {
          if (!(paymentRef.name in payments)) payments[paymentRef.name] = paymentRef.amount
          else payments[paymentRef.name] += paymentRef.amount
        })
      })

    dataTable.clear().draw()
    if (purchases.length === 0) return
    const rows = []

    purchases.forEach((purchase) => {
      rows.push({
        date: new Date(purchase.date).toLocaleDateString(),
        party: ledgersObj[purchase.ledgerId].name,
        voucherNo: purchase.supplierInvNo,
        debit: `₹ ${payments[purchase.id]?.toFixed(2) || '0.00'}`,
        credit: `₹ ${Number(purchase.tAmount).toFixed(2)}`,
        actions: `<button data-id="${purchase.id}" class="button">Display</button> <button data-id="${purchase.id}" class="button">Delete</button>`,
      })
    })

    dataTable.rows.add(rows).draw()

    section.querySelectorAll('button').forEach((el) => {
      el.addEventListener('click', tabelActions)
    })
  }

  /*------------------------------------------
        Table Actions
    ------------------------------------------*/
  async function tabelActions() {
    if (this.textContent === 'Delete') {
      ipcRenderer
        .invoke('delete-single-purchase', this.getAttribute('data-id'))
        .then(() => purchaseRegister())
    } else {
      updatePurchase(this.getAttribute('data-id'))
      section.classList.remove('show')
    }
  }

  /*------------------------------------------
        Display nested rows
    ------------------------------------------*/
  async function createNestedTable(selectedRow) {
    const gst = { cgst: {}, sgst: {}, cess: {} }
    let tTaxableAmt = 0

    const voucherId = selectedRow.querySelector('button').getAttribute('data-id')

    await ipcRenderer.invoke('fetch-purchase-items-by-purchaseId', voucherId).then((data) => {
      data.forEach((el) => {
        if (!(el.stockItem.stockGroup.cgstPer in gst.cgst))
          gst.cgst[el.stockItem.stockGroup.cgstPer] = Number(el.cgstAmt)
        else gst.cgst[el.stockItem.stockGroup.cgstPer] += Number(el.cgstAmt)

        if (!(el.stockItem.stockGroup.sgstPer in gst.sgst))
          gst.sgst[el.stockItem.stockGroup.sgstPer] = Number(el.sgstAmt)
        else gst.sgst[el.stockItem.stockGroup.sgstPer] += Number(el.sgstAmt)

        if (!(el.stockItem.stockGroup.cessPer in gst.cess))
          gst.cess[el.stockItem.stockGroup.cessPer] = Number(el.cessAmt)
        else gst.cess[el.stockItem.stockGroup.cessPer] += Number(el.cessAmt)

        tTaxableAmt += Number(el.taxableAmt)
      })
    })

    let rows = `<tr><td>Total Taxable Amt.</td><td>₹ ${tTaxableAmt.toFixed(2)}</td></tr>`
    for (const key in gst) {
      if (Object.entries(gst[key]).length === 0) continue

      for (const k in gst[key]) {
        if (key === 'cgst')
          rows += `<tr><td>CGST @ ${k} %</td><td>₹ ${gst[key][k].toFixed(2)}</td></tr>`
        else if (key === 'sgst')
          rows += `<tr><td>SGST @ ${k} %</td><td>₹ ${gst[key][k].toFixed(2)}</td></tr>`
        else if (key === 'cess')
          rows += `<tr><td>CESS @ ${k} %</td><td>₹ ${gst[key][k].toFixed(2)}</td></tr>`
      }
    }

    return `<table cellpadding="0" cellspacing="0"><tbody>${rows}</tbody></table>`
  }

  /*= ===================================================================================== */
  async function purchaseRegister() {
    if (!section.classList.contains('show')) return

    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      data.forEach((el) => {
        ledgersObj[el.id] = el
      })
    })

    fetchPurchasesAndPayments()

    /*------------------------------------------
            Mousetrap
        ------------------------------------------*/
    // Unbind shortcuts
    MouseTrap.unbind(['alt+f1'])

    // Toggle all nested rows at once
    Mousetrap.bind('alt+f1', () => {
      section.querySelectorAll('#purchase_register_data_table tbody tr').forEach(async (el) => {
        el.click()
      })
    })
  }
}
