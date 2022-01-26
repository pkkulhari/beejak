{
  const section = document.querySelector('section#payment-voucher')
  new MutationObserver(paymentVouchers).observe(section, { attributeFilter: ['class'] })

  const { ipcRenderer } = require('electron')
  const flatpickr = require('flatpickr')
  const alertify = require('alertifyjs')
  const moment = require('moment')
  const { getLegerClosingBal, getPendingBills } = require('../../../helpers/ledger-helpers')

  // Get Elements
  const form = section.querySelector('#payment-voucher-form')

  const rowsWrapper = section.querySelector('.rows-wrapper')
  const row = section.querySelector('.row')
  const addRowBtn = section.querySelector('.add-row-btn')
  const removeRowBtn = section.querySelector('.remove-row-btn')

  const ledgersObj = {}

  /*-----------------------------------------------------
    Flatepickr - Custom Date Picker
  ------------------------------------------------------*/
  const datePicker1 = flatpickr('section#payment-voucher input[name="date"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  const datePicker2 = flatpickr('section#payment-voucher input[name="instDate"]', {
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

    flatpickr('section#payment-voucher input[name="wef"]', {
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
  form.ledgerCredit.addEventListener('change', function () {
    if (this.selectedOptions[0].label === 'Bank') {
      form.favouringName.value = form.ledgerDebit.selectedOptions[0].label
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

    if (this.closest('.debit')) {
      rowsWrapper.querySelectorAll('.remove-row-btn').forEach((el) => el.click())
      form.refType.value = ''
      form.ledgerCredit.value = ''
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

      if (form.ledgerDebit.value !== '') {
        const pendingBills = await getPendingBills(ledgersObj[form.ledgerDebit.value])
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
  form.credit.addEventListener('input', function () {
    form.amountBank.value = this.value
  })

  /*--------------------------------------------------------
    Save Voucher
  ---------------------------------------------------------*/
  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const paymentVoucherRefs = []
    section.querySelectorAll('.debit .rows-wrapper .row').forEach((row) => {
      paymentVoucherRefs.push({
        refType: row.querySelector('select[name="refType"]').value,
        name: row.querySelector('select[name="name"], input[name="name"]').value,
        wef: row.querySelector('input[name="wef"]').value,
        amount: row.querySelector('input[name="amount"]').value,
        paymentVoucherId: form.paymentVoucherNo.value,
      })
    })

    const data = {
      paymentVoucher: {
        id: form.paymentVoucherNo.value,
        date: form.date.value,
        debit: form.debit.value,
        credit: form.credit.value,
        dLedgerId: form.ledgerDebit.value,
        cLedgerId: form.ledgerCredit.value,
        narration: form.narration.value,
      },
      paymentVoucherRefs,
    }

    if (section.querySelector('.bank-allocations').style.display !== 'none') {
      data['bankAllocation'] = {
        favouringName: form.favouringName.value,
        transactionType: form.transactionType.value,
        instDate: form.instDate.value,
        amount: form.amountBank.value,
      }
    }

    ipcRenderer.invoke('save-payment-voucher', data).then((data) => {
      if (data === true) {
        alertify.notify('Saved!', 'success', 3)
        return
      }
      alertify.notify('Something went wrong!', 'error', 3)
    })

    return true
  })

  /* <======================================================================================> */
  async function paymentVouchers() {
    if (!section.classList.contains('show')) return
    form.reset()
    rowsWrapper.querySelectorAll('.remove-row-btn').forEach((el) => el.click())
    form.name.innerHTML = ''
    section.querySelector('.bank-allocations').style.display = 'none'

    datePicker1.setDate(new Date())
    datePicker2.setDate(new Date())
    flatpickr('section#payment-voucher input[name="wef"]', {
      enableTime: true,
      enableSeconds: true,
      altInput: true,
      dateFormat: 'Y-m-d H:i:S',
      altFormat: 'd.m.Y',
      defaultDate: new Date(),
    })

    /*------------------------------------------------------
      Fetch - Last Payment Voucher Id, Ledgers
    -------------------------------------------------------*/
    // Raise IPC Events
    ipcRenderer
      .invoke('fetch-last-payment-voucher')
      .then((data) => (form.paymentVoucherNo.value = data[0]?.id + 1 || 1))

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
