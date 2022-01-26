{
  const section = document.querySelector('section#receipt-voucher')
  new MutationObserver(receiptVouchers).observe(section, { attributeFilter: ['class'] })

  const { ipcRenderer } = require('electron')
  const flatpickr = require('flatpickr')
  const alertify = require('alertifyjs')
  const moment = require('moment')
  const { getLegerClosingBal, getPendingBills } = require('../../../helpers/ledger-helpers')

  // Get Elements
  const form = section.querySelector('#receipt-voucher-form')

  const rowsWrapper = section.querySelector('.rows-wrapper')
  const row = section.querySelector('.row')
  const addRowBtn = section.querySelector('.add-row-btn')
  const removeRowBtn = section.querySelector('.remove-row-btn')

  const ledgersObj = {}

  /*-----------------------------------------------------
        Flatepickr - Custom Date Picker
    ------------------------------------------------------*/
  const datePicker1 = flatpickr('section#receipt-voucher input[name="date"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  const datePicker2 = flatpickr('section#receipt-voucher input[name="instDate"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  /*--------------------------------------------------------
      Add or Remove Rows
    ---------------------------------------------------------*/
  // Event listener
  addRowBtn.addEventListener('click', addRow)
  removeRowBtn.addEventListener('click', removeRow)

  // Functions
  function addRow() {
    const rowClone = row.cloneNode(true)
    rowClone.querySelectorAll('input, select').forEach((input) => {
      input.value = ''
    })
    rowClone.querySelector('.add-row-btn').addEventListener('click', addRow)
    rowClone.querySelector('.remove-row-btn').addEventListener('click', removeRow)
    rowClone.querySelector('.form-control').remove()
    rowClone.querySelector('select[name="refType"]').addEventListener('change', fetchPendingBills)
    rowsWrapper.appendChild(rowClone)

    flatpickr('section#receipt-voucher input[name="wef"]', {
      enableTime: true,
      enableSeconds: true,
      altInput: true,
      dateFormat: 'Y-m-d H:i:S',
      altFormat: 'd.m.Y',
      defaultDate: new Date(),
    })
  }

  function removeRow() {
    if (section.querySelectorAll('.row').length !== 1) this.closest('.row').remove()
  }

  /*--------------------------------------------------------
    Toggle Bank allocations sections
  ---------------------------------------------------------*/
  form.ledgerDebit.addEventListener('change', function () {
    if (this.selectedOptions[0].label === 'Bank') {
      form.favouringName.value = form.ledgerCredit.selectedOptions[0].label
      section.querySelector('.bank-allocations').style.display = 'flex'
    } else section.querySelector('.bank-allocations').style.display = 'none'
  })

  /*--------------------------------------------------------
      Fetch Ledger closing bal.
    ---------------------------------------------------------*/
  form.ledgerDebit.addEventListener('change', displayLedgerClosingBal)
  form.ledgerCredit.addEventListener('change', displayLedgerClosingBal)

  // Functions
  async function displayLedgerClosingBal() {
    this.closest('div:not(.input)').querySelector('input[name="openingBal"]').value = `₹ ${(
      await getLegerClosingBal(ledgersObj[this.value])
    ).toFixed(2)}`

    if (this.closest('.credit')) {
      rowsWrapper.querySelectorAll('.remove-row-btn').forEach((el) => el.click())
      form.refType.value = ''
      form.ledgerDebit.value = ''
    }
  }

  /*--------------------------------------------------------
    Fetch pending bills
  ---------------------------------------------------------*/
  form.refType.addEventListener('change', fetchPendingBills)

  async function fetchPendingBills() {
    if (this.value === 'advance') {
      const input = document.createElement('input')
      input.name = 'name'
      input.setAttribute('required', true)
      this.closest('.row')
        .querySelector('select[name="name"], input[name="name"]')
        .replaceWith(input)
    } else if (this.value === 'against-ref') {
      const select = document.createElement('select')
      select.name = 'name'
      select.setAttribute('required', true)

      if (form.ledgerCredit.value !== '') {
        const pendingBills = await getPendingBills(ledgersObj[form.ledgerCredit.value])
        Object.values(pendingBills).forEach((pendingBill) => {
          select.innerHTML += `<option value="${pendingBill.id}">${pendingBill.id}, ${moment(
            pendingBill.date
          ).format('DD.MM.YYYY')}, ₹ ${pendingBill.tAmount.toFixed(2)}</option>`
        })
      }

      this.closest('.row')
        .querySelector('select[name="name"], input[name="name"]')
        .replaceWith(select)
    }
  }

  /*--------------------------------------------------------
    Set amount of Bank allocations
  ---------------------------------------------------------*/
  form.debit.addEventListener('input', function () {
    form.amountBank.value = this.value
  })

  /*--------------------------------------------------------
    Save Voucher
  ---------------------------------------------------------*/
  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const receiptVoucherRefs = []
    section.querySelectorAll('.credit .rows-wrapper .row').forEach((row) => {
      receiptVoucherRefs.push({
        refType: row.querySelector('select[name="refType"]').value,
        name: row.querySelector('select[name="name"], input[name="name"]').value,
        wef: row.querySelector('input[name="wef"]').value,
        amount: row.querySelector('input[name="amount"]').value,
        receiptVoucherId: form.receiptVoucherNo.value,
      })
    })

    const data = {
      receiptVoucher: {
        id: form.receiptVoucherNo.value,
        date: form.date.value,
        debit: form.debit.value,
        credit: form.credit.value,
        dLedgerId: form.ledgerDebit.value,
        cLedgerId: form.ledgerCredit.value,
        narration: form.narration.value,
      },
      receiptVoucherRefs,
    }

    if (section.querySelector('.bank-allocations').style.display !== 'none') {
      data['bankAllocation'] = {
        favouringName: form.favouringName.value,
        transactionType: form.transactionType.value,
        instDate: form.instDate.value,
        amount: form.amountBank.value,
      }
    }

    ipcRenderer.invoke('save-receipt-voucher', data).then((data) => {
      if (data === true) {
        alertify.notify('Saved!', 'success', 3)
        return
      }
      alertify.notify('Something went wrong!', 'error', 3)
    })

    return true
  })

  /* <======================================================================================> */
  async function receiptVouchers() {
    if (!section.classList.contains('show')) return
    form.reset()
    rowsWrapper.querySelectorAll('.remove-row-btn').forEach((el) => el.click())
    form.name.innerHTML = ''
    section.querySelector('.bank-allocations').style.display = 'none'

    datePicker1.setDate(new Date())
    datePicker2.setDate(new Date())
    flatpickr('section#receipt-voucher input[name="wef"]', {
      enableTime: true,
      enableSeconds: true,
      altInput: true,
      dateFormat: 'Y-m-d H:i:S',
      altFormat: 'd.m.Y',
      defaultDate: new Date(),
    })

    /*------------------------------------------------------
      Fetch - Last Receipt Voucher Id, Ledgers
    -------------------------------------------------------*/
    // Raise IPC Events
    ipcRenderer
      .invoke('fetch-last-receipt-voucher', 'receipt')
      .then((data) => (form.receiptVoucherNo.value = data[0]?.id + 1 || 1))

    ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      form.ledgerDebit.innerHTML = '<option selected disabled hidden></option>'
      form.ledgerCredit.innerHTML = '<option selected disabled hidden></option>'

      data.forEach((ledger) => {
        form.ledgerDebit.innerHTML += `<option value="${ledger.id}">${ledger.name}</option>`
        form.ledgerCredit.innerHTML += `<option value="${ledger.id}">${ledger.name}</option>`

        ledgersObj[ledger.id] = ledger
      })
    })
  }
}
