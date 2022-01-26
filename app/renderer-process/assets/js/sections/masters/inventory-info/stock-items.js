'use scrict'

const $ = require('jquery')
require('datatables.net')()
const { ipcRenderer } = require('electron')
const alertify = require('alertifyjs')
const moment = require('moment')
const { setInputFilter } = require('../../../vendor/validate')

{
  const section = document.querySelector('section#stock-items')
  new MutationObserver(stockItems).observe(section, {
    attributeFilter: ['class'],
  })

  // Initialize Data Table
  const dataTable = $('#stockItem_data_table').DataTable({
    columns: [
      {
        data: 'name',
      },
      {
        data: 'unit',
      },
      {
        data: 'under',
      },
      {
        data: 'mrp',
      },

      {
        data: 'packSize',
      },
      {
        data: 'openingStock',
      },
      {
        data: 'date',
      },
      {
        data: 'actions',
      },
    ],
  })

  // Get Elements
  const createStockItemBtn = section.querySelector('#create-stock-item-btn')
  const table = section.querySelector('#stockItem_data_table')
  const model = section.querySelector('.model')
  const saveBtn = model.querySelector('.save')

  const stockItemName = section.querySelector('#name')
  const unit = section.querySelector('#unit')
  const under = section.querySelector('#under')
  const mrp = section.querySelector('#mrp')
  const packSize = section.querySelector('#pack-size')
  const openingStock = section.querySelector('#opening-stock')
  const date = section.querySelector('#date')

  const stockItemsObj = {}
  let datePicker = null

  /*-------------------------------------------
        POP-UP Model Close
    ---------------------------------------------*/
  model.querySelector('.close').addEventListener('click', (event) => {
    const model = event.target.closest('.model')
    model.style.display = 'none'
  })

  /*------------------------------------------------
        Validate Input Fields Data
    -------------------------------------------------*/
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
      for (const key in stockItemsObj) {
        if (stockItemName.value.toLowerCase() === stockItemsObj[key].name.toLowerCase()) {
          alertify.alert('', `The stock item "${stockItemsObj[key].name}" already exists.`)
          return false
        }
      }
    }

    return true
  }

  /*--------------------------------------------------
        Save Event
    ----------------------------------------------------*/
  saveBtn.addEventListener('click', () => {
    if (model.getAttribute('data-action') === 'alter') updateStockItem()
    else insertStockItem()
  })

  /*---------------------------------------------------
        Create StockItem
    -----------------------------------------------------*/
  // Events
  createStockItemBtn.onclick = () => {
    model.setAttribute('data-action', 'create')
    model.querySelectorAll('input, select, textarea').forEach((el) => {
      el.value = ''
    })
    datePicker.setDate(new Date())
    model.style.display = 'flex'
  }

  function insertStockItem() {
    if (validateInputs() === false) return
    const data = {
      name: stockItemName.value,
      unitsOfMeasureId: unit.value,
      stockGroupId: under.value,
      mrp: mrp.value,
      packSize: packSize.value,
      openingStock: openingStock.value || 0,
      createdAt: date.value,
    }

    ipcRenderer.invoke('insert-stock-item', data).then(() => {
      model.style.display = 'none'
      stockItems()
    })
  }

  /*----------------------------------------------------
        Table Actions - Alter and Delete
    -----------------------------------------------------*/
  // Functions
  function tableActions() {
    const stockItemID = this.getAttribute('data-id')
    const action = this.textContent

    if (action === 'Delete') {
      delete stockItemsObj[stockItemID]
      ipcRenderer.invoke('delete-stock-item', stockItemID).then(() => stockItems())
    } else if (action === 'Alter') {
      ipcRenderer.invoke('fetch-single-stock-item', stockItemID).then(async (data) => {
        model.setAttribute('data-action', 'alter')

        stockItemName.setAttribute('data-id', data.id)
        stockItemName.value = data.name
        unit.value = data.unitsOfMeasureId
        under.value = data.stockGroupId
        mrp.value = data.mrp
        packSize.value = data.packSize
        openingStock.value = data.openingStock
        datePicker.setDate(data.createdAt)

        model.style.display = 'flex'
      })
    }
  }

  function updateStockItem() {
    if (!validateInputs()) return
    const data = {
      id: stockItemName.getAttribute('data-id'),
      name: stockItemName.value,
      unitsOfMeasureId: unit.value,
      stockGroupId: under.value,
      mrp: mrp.value,
      packSize: packSize.value,
      openingStock: openingStock.value,
      createdAt: date.value,
    }
    ipcRenderer.invoke('update-stock-item', data).then(() => {
      model.style.display = 'none'
      stockItems()
    })
  }

  /*= ============================================================================== */
  function stockItems() {
    if (!section.classList.contains('show')) return

    /*-------------------------------------------------------
            Flatepickr - Custom Date Picker
        ---------------------------------------------------------*/
    datePicker = flatpickr('section#stock-items #date', {
      enableTime: true,
      enableSeconds: true,
      altInput: true,
      dateFormat: 'Y-m-d H:i:S',
      altFormat: 'd.m.Y',
      defaultDate: new Date(),
    })

    /*--------------------------------------------
            Display Table
        ---------------------------------------------*/
    ipcRenderer.invoke('fetch-all-stock-items').then((data) => {
      dataTable.clear().draw()
      if (Object.keys(data).length === 0) return
      data.forEach((el) => {
        const row = {
          name: el.name,
          unit: el.unitsOfMeasure.symbol,
          under: el.stockGroup.name,
          mrp: `₹ ${Number(el.mrp).toFixed(2)}`,
          packSize: el.packSize,
          openingStock: el.openingStock,
          date: moment(el.createdAt).format('DD.MM.YYYY'),
          actions: `<button class="button" data-id="${el.id}">Alter</button>
                        <button class="button" data-id="${el.id}">Delete</button>`,
        }

        stockItemsObj[el.id] = el
        dataTable.row.add(row).draw()
      })

      table.querySelectorAll('button').forEach((el) => {
        el.addEventListener('click', tableActions)
      })
    })

    /*--------------------------------------------
            Fetch all Stock Groups and Units
        ---------------------------------------------*/
    ipcRenderer.invoke('fetch-all-stock-groups').then((data) => {
      under.innerHTML = '<option value="" selected disabled hidden>Select Group</option>'
      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name
        under.appendChild(option)
      })
    })

    ipcRenderer.invoke('fetch-all-units-of-measure').then((data) => {
      unit.innerHTML = '<option value="" selected disabled hidden>Select Group</option>'
      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.symbol
        unit.appendChild(option)
      })
    })
  }
}
