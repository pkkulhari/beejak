{
  const section = document.querySelector('section#contra-voucher')
  new MutationObserver(contraVouchers).observe(section, { attributeFilter: ['class'] })

  const { ipcRenderer } = require('electron')
  const flatpickr = require('flatpickr')
  const alertify = require('alertifyjs')
  const moment = require('moment')
  const { getLegerClosingBal } = require('../../../helpers/ledger-helpers')

  // Get Elements
  const form = section.querySelector('#contra-voucher-form')

  const ledgersObj = {}

  /*-----------------------------------------------------
        Flatepickr - Custom Date Picker
    ------------------------------------------------------*/
  const datePicker1 = flatpickr('section#contra-voucher input[name="date"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  const datePicker2 = flatpickr('section#contra-voucher input[name="instDateCredit"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  const datePicker3 = flatpickr('section#contra-voucher input[name="instDateDebit"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  /*--------------------------------------------------------
      Toggle Bank allocations sections
    ---------------------------------------------------------*/
  form.ledgerCredit.addEventListener('change', function () {
    if (this.selectedOptions[0].label === 'Bank') {
      section.querySelector('.credit .bank-allocations').style.display = 'flex'
    } else section.querySelector('.credit .bank-allocations').style.display = 'none'
  })

  form.ledgerDebit.addEventListener('change', function () {
    if (this.selectedOptions[0].label === 'Bank') {
      section.querySelector('.debit .bank-allocations').style.display = 'flex'
    } else section.querySelector('.debit .bank-allocations').style.display = 'none'
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
  }

  /*--------------------------------------------------------
      Set amount of Bank allocations
    ---------------------------------------------------------*/
  form.debit.addEventListener('input', function () {
    form.amountDebit.value = this.value
  })

  form.credit.addEventListener('input', function () {
    form.amountCredit.value = this.value
  })

  /*--------------------------------------------------------
      Save Voucher
    ---------------------------------------------------------*/
  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const data = {
      contraVoucher: {
        id: form.contraVoucherNo.value,
        date: form.date.value,
        debit: form.debit.value,
        credit: form.credit.value,
        dLedgerId: form.ledgerDebit.value,
        cLedgerId: form.ledgerCredit.value,
        narration: form.narration.value,
      },
    }

    if (section.querySelector('.credit .bank-allocations').style.display !== 'none') {
      data['cBankAllocation'] = {
        favouringName: form.favouringNameCredit.value,
        transactionType: form.transactionTypeCredit.value,
        instDate: form.instDateCredit.value,
        amount: form.amountCredit.value,
      }
    }

    if (section.querySelector('.debit .bank-allocations').style.display !== 'none') {
      data['dBankAllocation'] = {
        favouringName: form.favouringNameDebit.value,
        transactionType: form.transactionTypeDebit.value,
        instDate: form.instDateDebit.value,
        amount: form.amountDebit.value,
      }
    }

    ipcRenderer.invoke('save-contra-voucher', data).then((data) => {
      if (data === true) {
        alertify.notify('Saved!', 'success', 3)
        return
      }
      alertify.notify('Something went wrong!', 'error', 3)
    })

    return true
  })

  /* <======================================================================================> */
  async function contraVouchers() {
    if (!section.classList.contains('show')) return
    form.reset()
    section.querySelector('.credit .bank-allocations').style.display = 'none'
    section.querySelector('.debit .bank-allocations').style.display = 'none'

    datePicker1.setDate(new Date())
    datePicker2.setDate(new Date())
    datePicker3.setDate(new Date())

    /*------------------------------------------------------
        Fetch - Last Contra Voucher Id, Ledgers
    -------------------------------------------------------*/
    // Raise IPC Events
    ipcRenderer
      .invoke('fetch-last-contra-voucher', 'contra')
      .then((data) => (form.contraVoucherNo.value = data[0]?.id + 1 || 1))

    ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      form.ledgerDebit.innerHTML = '<option selected disabled hidden></option>'
      form.ledgerCredit.innerHTML = '<option selected disabled hidden></option>'

      data.forEach((ledger) => {
        const groupName = ledger.group.name.trim().toLowerCase().replaceAll(' ', '-')
        if (groupName !== 'cash-in-hand' && groupName !== 'bank-accounts') return
        form.ledgerDebit.innerHTML += `<option value="${ledger.id}">${ledger.name}</option>`
        form.ledgerCredit.innerHTML += `<option value="${ledger.id}">${ledger.name}</option>`

        ledgersObj[ledger.id] = ledger
      })
    })
  }
}
