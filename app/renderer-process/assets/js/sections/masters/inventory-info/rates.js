'use scrict'

{
  const section = document.querySelector('section#rates')
  new MutationObserver(rates).observe(section, {
    attributeFilter: ['class'],
  })

  const $ = require('jquery')
  const { ipcRenderer } = require('electron')
  const alertify = require('alertifyjs')
  const moment = require('moment')
  const MouseTrap = require('mousetrap')

  // Get Elements
  const newRateBtn = section.querySelector('#new-rate-btn')
  const model = section.querySelector('.model')
  const saveBtn = model.querySelector('.save')
  const form = section.querySelector('form')

  const stockItemsObj = {}

  /*------------------------------------------------
        Initialize Data Tables
    -------------------------------------------------*/
  const saleRatesDataTable = $('#saleItemsPrice_data_table').DataTable({
    rowId: 'id',
    columns: [{ data: 'date' }, { data: 'item_name' }, { data: 'rate' }],
  })

  const purchaseRatesDataTable = $('#purchaseItemsPrice_data_table').DataTable({
    rowId: 'id',
    columns: [{ data: 'date' }, { data: 'item_name' }, { data: 'rate' }],
  })

  /*------------------------------------------------
        Flatpicker
    -------------------------------------------------*/
  const datePicker = flatpickr('section#rates input[name="date"]', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  /*-------------------------------------------------
        POP-UP Model Close
    ---------------------------------------------------*/
  model.querySelector('.close').addEventListener('click', (event) => {
    const model = event.target.closest('.model')
    model.style.display = 'none'
  })

  /*----------------------------------------------
        Validate Input Fields Data
    -------------------------------------------------*/
  function validateInputs() {
    const allInputFields = model.querySelectorAll('input[required], select[required]')

    for (const inputField of allInputFields) {
      if (inputField.value === '') {
        alertify.alert('', 'Fill all mandatory fields.')
        return false
      }
    }
  }

  /*----------------------------------------------
        Save Event
    ------------------------------------------------*/
  saveBtn.addEventListener('click', () => {
    if (model.getAttribute('data-action') === 'alter') updateRate()
    else insertRate()
  })

  /*-----------------------------------------------
        New Rate
    ------------------------------------------------*/
  // Events
  newRateBtn.onclick = () => {
    model.setAttribute('data-action', 'create')
    model.querySelectorAll('input, select, textarea').forEach((el) => {
      el.value = ''
    })

    datePicker.setDate(new Date())
    model.style.display = 'flex'
  }

  function insertRate() {
    if (validateInputs() === false) return

    const data = {
      stockItemId: form.item.value,
      type: form.type.value,
      rate: form.rate.value,
      date: form.date.value,
    }
    ipcRenderer.invoke('insert-rate', data).then(() => {
      model.style.display = 'none'
      rates()
    })
  }

  /*----------------------------------------------
        Rates - Alter and Delete
    ------------------------------------------------*/
  section.querySelectorAll('table tbody').forEach((el) => el.addEventListener('click', (el) => {
    const tr = el.target.closest('tr')
    if (tr.classList.contains('selected')) tr.classList.remove('selected')
    else tr.classList.add('selected')
  }))

  async function tableActions(event) {
    const selectedRows = []
    for (const el of section.querySelectorAll('table tbody tr.selected')) {
      if (el.getAttribute('id') === null) continue
      await selectedRows.push(el.getAttribute('id'))
    }

    if (selectedRows.length === 0) return

    if (event.code === 'Delete') ipcRenderer.invoke('delete-rate', selectedRows).then(rates)
    else if (event.code === 'Enter') {
      if (selectedRows.length > 1) {
        alertify.alert(
          '',
          'You have selected multiple items, Select a single item to display or alter.'
        )
        return
      }

      ipcRenderer.invoke('fetch-single-rate', selectedRows[0]).then((data) => {
        form.item.value = data.stockItemId
        form.item.setAttribute('data-id', data.id)
        form.type.value = data.type
        form.rate.value = data.rate
        datePicker.setDate(data.date)

        model.setAttribute('data-action', 'alter')
        model.style.display = 'flex'
      })
    }
  }

  function updateRate() {
    if (validateInputs() === false) return

    const data = {
      id: form.item.getAttribute('data-id'),
      stockItemId: form.item.value,
      type: form.type.value,
      rate: form.rate.value,
      date: form.date.value,
    }
    ipcRenderer.invoke('update-rate', data).then(() => {
      model.style.display = 'none'
      rates()
    })
  }

  /*= ================================================================================== */
  async function rates() {
    if (!section.classList.contains('show')) return

    /*------------------------------------------------
            Fetch all stock items
        -------------------------------------------------*/
    await ipcRenderer.invoke('fetch-all-stock-items').then((data) => {
      if (data.length === 0) return
      form.item.innerHTML = '<option value="" selected hidden disabled>Select Item</option>'

      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name
        form.item.appendChild(option)

        stockItemsObj[el.id] = el
      })
    })

    /*------------------------------------------------
            Fetch all rates and display
        -------------------------------------------------*/
    ipcRenderer.invoke('fetch-rates').then((data) => {
      const saleRateRows = []
      const purchaseRateRows = []

      data.forEach((el) => {
        const row = {
          id: el.id,
          date: moment(el.date).format('DD.MM.YYYY'),
          item_name: stockItemsObj[el.stockItemId].name,
          rate: el.rate,
        }

        if (el.type === 'sale') saleRateRows.push(row)
        else if (el.type === 'purchase') purchaseRateRows.push(row)
      })

      saleRatesDataTable.clear().draw()
      purchaseRatesDataTable.clear().draw()
      saleRatesDataTable.rows.add(saleRateRows).draw()
      purchaseRatesDataTable.rows.add(purchaseRateRows).draw()
    })

    /*------------------------------------------------
            MouseTrap
        -------------------------------------------------*/
    // Unbind Shortcuts
    MouseTrap.unbind(['enter', 'del'])

    // Bind Shortcuts
    MouseTrap.bind(['enter', 'del'], tableActions)
  }
}
