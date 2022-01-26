'use scrict'

{
  const section = document.querySelector('section#ledgers')
  new MutationObserver(ledgers).observe(document.querySelector('section#ledgers'), {
    attributeFilter: ['class'],
  })

  const $ = require('jquery')
  require('datatables.net')()
  const { ipcRenderer } = require('electron')
  const alertify = require('alertifyjs')
  const { setInputFilter, checksum } = require('../../../vendor/validate')

  // Initialize Data Table
  const dataTable = $('#ledger_data_table').DataTable({
    columns: [
      {
        data: 'name',
      },
      {
        data: 'under',
      },
      {
        data: 'gstin',
      },
      {
        data: 'mobile',
      },
      {
        data: 'address1',
      },
      {
        data: 'address2',
      },
      {
        data: 'openingBalance',
      },
      {
        data: 'actions',
      },
    ],
  })

  // Get Elements
  const createLedgerBtn = section.querySelector('#create-ledger-btn')
  const table = section.querySelector('#ledger_data_table')
  const model = section.querySelector('.model')
  const saveBtn = model.querySelector('.save')

  const ledgerName = section.querySelector('#name')
  const under = section.querySelector('#under')
  const gstin = section.querySelector('#gstin')
  const mobile = section.querySelector('#mobile')
  const address1 = section.querySelector('#address1')
  const address2 = section.querySelector('#address2')
  const openingBalance = section.querySelector('#opening-balance')

  const ledgersObj = {}

  /*---------------------------------------
        POP-UP Model Close
    -----------------------------------------*/
  model.querySelector('.close').addEventListener('click', (event) => {
    const model = event.target.closest('.model')
    model.style.display = 'none'
  })

  /*----------------------------------------
        Validate Input Fields Data
    -----------------------------------------*/
  model.querySelectorAll('input.only_numeric').forEach((input) => {
    setInputFilter(input, (value) => {
      if (input.classList.contains('not_decimal')) {
        return /^\d*$/.test(value) // Allow digits and '.' only, using a RegExp
      }
      return /^\d*\.?\d*$/.test(value) // Allow digits and '.' only, using a RegExp
    })
  })

  function validateInputs() {
    const allInputFields = model.querySelectorAll('input[required], select[required]')

    for (const inputField of allInputFields) {
      if (inputField.value === '') {
        alertify.alert('', 'Fill all mandatory fields.')
        return false
      }
    }

    if (model.getAttribute('data-action') === 'create') {
      for (const key in ledgersObj) {
        if (ledgerName.value.toLowerCase() === ledgersObj[key].name.toLowerCase()) {
          alertify.alert('', `The ledger "${ledgersObj[key].name}" already exists.`)
          return false
        }
      }
    }

    // GSTIN Validation
    if (gstin.value !== '') {
      if (!checksum(gstin.value, /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/)) {
        alertify.alert('', 'Invalid GSTIN.')
        return false
      }
    }
  }

  /*------------------------------------------
    Save Event
    ------------------------------------------*/
  saveBtn.addEventListener('click', () => {
    if (model.getAttribute('data-action') === 'alter') updateLedger()
    else insertLedger()
  })

  /*-----------------------------------------
        Create Ledger
    -------------------------------------------*/
  // Events
  createLedgerBtn.onclick = () => {
    model.setAttribute('data-action', 'create')
    model.querySelectorAll('input, select, textarea').forEach((el) => {
      el.value = ''
    })
    model.style.display = 'flex'
  }

  function insertLedger() {
    if (validateInputs() === false) return
    const data = {
      name: ledgerName.value,
      groupId: under.value,
      gstin: gstin.value,
      mobile: mobile.value,
      address1: address1.value,
      address2: address2.value,
      openingBalance: openingBalance.value || null,
    }
    ipcRenderer.invoke('insert-ledger', data).then(() => {
      model.style.display = 'none'
      ledgers()
    })
  }

  /*-------------------------------------------
        Table Actions - Alter and Delete
    --------------------------------------------*/
  // Functions
  function tableActions() {
    const ledgerID = this.getAttribute('data-id')
    const action = this.textContent

    if (action === 'Delete') {
      delete ledgersObj[ledgerID]
      ipcRenderer.invoke('delete-ledger', ledgerID).then(() => ledgers())
    } else if (action === 'Alter') {
      ipcRenderer.invoke('fetch-single-ledger', ledgerID).then((data) => {
        model.setAttribute('data-action', 'alter')

        ledgerName.setAttribute('data-id', data.id)
        ledgerName.value = data.name
        under.value = data.groupId
        gstin.value = data.gstin
        mobile.value = data.mobile
        address1.value = data.address1
        address2.value = data.address2
        openingBalance.value = data.openingBalance

        model.style.display = 'flex'
      })
    }
  }

  function updateLedger() {
    if (validateInputs() === false) return
    const data = {
      id: ledgerName.getAttribute('data-id'),
      name: ledgerName.value,
      groupId: under.value,
      gstin: gstin.value,
      mobile: mobile.value,
      address1: address1.value,
      address2: address2.value,
      openingBalance: openingBalance.value || null,
    }
    ipcRenderer.invoke('update-ledger', data).then(() => {
      model.style.display = 'none'
      ledgers()
    })
  }

  /*= ================================================================================ */
  function ledgers() {
    if (!section.classList.contains('show')) return

    /*--------------------------------------
            Display Table
        --------------------------------------*/
    ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      dataTable.clear().draw()
      if (Object.keys(data).length === 0) return
      data.forEach((el) => {
        const row = {
          name: el.name,
          gstin: el.gstin,
          under: el.group.name,
          mobile: el.mobile,
          address1: el.address1,
          address2: el.address2,
          openingBalance: el.openingBalance,
          actions: `<button class="button" data-id="${el.id}">Alter</button>
                        <button class="button" data-id="${el.id}">Delete</button>`,
        }

        dataTable.row.add(row).draw()
        ledgersObj[el.id] = el
      })

      table.querySelectorAll('button').forEach((el) => {
        el.addEventListener('click', tableActions)
      })
    })

    /*--------------------------------------
            Fetch all Groups
        --------------------------------------*/
    ipcRenderer.invoke('fetch-all-groups').then((data) => {
      under.innerHTML = '<option value="" selected disabled hidden>Select Group</option>'

      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name
        under.appendChild(option)
      })
    })
  }
}
