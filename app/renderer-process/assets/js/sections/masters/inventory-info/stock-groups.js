'use scrict'

{
  const section = document.querySelector('section#stock-groups')
  new MutationObserver(stockGroups).observe(section, {
    attributeFilter: ['class'],
  })

  const $ = require('jquery')
  require('datatables.net')()
  const { ipcRenderer } = require('electron')
  const alertify = require('alertifyjs')
  const { setInputFilter } = require('../../../vendor/validate')

  // Initialize Data Table
  const dataTable = $('#stockGroup_data_table').DataTable({
    columns: [
      {
        data: 'name',
      },
      {
        data: 'hsnCode',
      },
      {
        data: 'cgstPer',
      },
      {
        data: 'sgstPer',
      },
      {
        data: 'cessPer',
      },
      {
        data: 'actions',
      },
    ],
  })

  // Get Elements
  const createStockGroupBtn = section.querySelector('#create-stock-group-btn')
  const table = section.querySelector('#stockGroup_data_table')
  const model = section.querySelector('.model')
  const saveBtn = model.querySelector('.save')

  const stockGroupName = section.querySelector('#name')
  const hsnCode = section.querySelector('#hsn-code')
  const cgstPer = section.querySelector('#cgst-per')
  const sgstPer = section.querySelector('#sgst-per')
  const cessPer = section.querySelector('#cess-per')

  const stockGroupsObj = {}

  /*----------------------------------------------
        POP-UP Model Close
    ------------------------------------------------*/
  model.querySelector('.close').addEventListener('click', (event) => {
    const model = event.target.closest('.model')
    model.style.display = 'none'
  })

  /*------------------------------------------------
        Validate Input Fields Data
    --------------------------------------------------*/
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
      for (const key in stockGroupsObj) {
        if (stockGroupName.value.toLowerCase() === stockGroupsObj[key].name.toLowerCase()) {
          alertify.alert('', `The stock group "${stockGroupsObj[key].name}" already exists.`)
          return false
        }
      }
    }
  }

  /*----------------------------------------------
    Save Event
    ------------------------------------------------*/
  saveBtn.addEventListener('click', () => {
    if (model.getAttribute('data-action') === 'alter') updateStockGroup()
    else insertStockGroup()
  })

  /*------------------------------------------------
        Create StockGroup
    --------------------------------------------------*/
  // Events
  createStockGroupBtn.onclick = () => {
    model.setAttribute('data-action', 'create')
    model.querySelectorAll('input, select, textarea').forEach((el) => {
      el.value = ''
    })
    model.style.display = 'flex'
  }

  function insertStockGroup() {
    if (validateInputs() === false) return
    const data = {
      name: stockGroupName.value,
      hsnCode: hsnCode.value,
      cgstPer: cgstPer.value,
      sgstPer: sgstPer.value,
      cessPer: cessPer.value,
    }
    ipcRenderer.invoke('insert-stock-group', data).then(() => {
      model.style.display = 'none'
      stockGroups()
    })
  }

  /*--------------------------------------------------
        Table Actions - Alter and Delete
    ---------------------------------------------------*/
  // Functions
  function tableActions() {
    const stockGroupID = this.getAttribute('data-id')
    const action = this.textContent

    if (action === 'Delete') {
      delete stockGroupsObj[stockGroupID]
      ipcRenderer.invoke('delete-stock-group', stockGroupID).then(() => stockGroups())
    } else if (action === 'Alter') {
      ipcRenderer.invoke('fetch-single-stock-group', stockGroupID).then((data) => {
        model.setAttribute('data-action', 'alter')

        stockGroupName.setAttribute('data-id', data.id)
        stockGroupName.value = data.name
        hsnCode.value = data.hsnCode
        cgstPer.value = data.cgstPer
        sgstPer.value = data.sgstPer
        cessPer.value = data.cessPer

        model.style.display = 'flex'
      })
    }
  }

  function updateStockGroup() {
    if (validateInputs() === false) return
    const data = {
      id: stockGroupName.getAttribute('data-id'),
      name: stockGroupName.value,
      hsnCode: hsnCode.value,
      cgstPer: cgstPer.value,
      sgstPer: sgstPer.value,
      cessPer: cessPer.value,
    }
    ipcRenderer.invoke('update-stock-group', data).then(() => {
      model.style.display = 'none'
      stockGroups()
    })
  }

  /*= ================================================================= */
  function stockGroups() {
    if (!section.classList.contains('show')) return

    /*---------------------------------------------
            Display Table
        -----------------------------------------------*/
    // IPC Events
    ipcRenderer.invoke('fetch-all-stock-groups').then((data) => {
      dataTable.clear().draw()
      if (Object.keys(data).length === 0) return
      data.forEach((el) => {
        const row = {
          name: el.name,
          hsnCode: el.hsnCode,
          cgstPer: el.cgstPer,
          sgstPer: el.sgstPer,
          cessPer: el.cessPer,
          actions: `<button class="button" data-id="${el.id}">Alter</button>
                    <button class="button" data-id="${el.id}">Delete</button>`,
        }

        dataTable.row.add(row).draw()
        stockGroupsObj[el.id] = el
      })

      table.querySelectorAll('button').forEach((el) => {
        el.addEventListener('click', tableActions)
      })
    })
  }
}
