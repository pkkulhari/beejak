'use scrict'

{
  const section = document.querySelector('section#units-of-measure')
  new MutationObserver(unitsOfMeasure).observe(section, {
    attributeFilter: ['class'],
  })

  const $ = require('jquery')
  require('datatables.net')()
  const { ipcRenderer } = require('electron')
  const alertify = require('alertifyjs')

  // Initialize Data Table
  const dataTable = $('#unitsOfMeasure_data_table').DataTable({
    columns: [
      {
        data: 'symbol',
      },
      {
        data: 'formalName',
      },
      {
        data: 'actions',
      },
    ],
  })

  // Get Elements
  const createUnitOfMeasureBtn = section.querySelector('#create-unit-of-measure-btn')
  const table = section.querySelector('#unitsOfMeasure_data_table')
  const model = section.querySelector('.model')
  const saveBtn = model.querySelector('.save')

  const symbol = section.querySelector('#symbol')
  const formalName = section.querySelector('#formal-name')

  const unitsOfMeasureObj = {}

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

    if (model.getAttribute('data-action') === 'create') {
      for (const key in unitsOfMeasureObj) {
        if (symbol.value.toLowerCase() === unitsOfMeasureObj[key].symbol.toLowerCase()) {
          alertify.alert(
            '',
            `The unit of measure "${unitsOfMeasureObj[key].symbol}" already exists.`
          )
          return false
        }
      }
    }
  }

  /*----------------------------------------------
    Save Event
    ------------------------------------------------*/
  saveBtn.addEventListener('click', () => {
    if (model.getAttribute('data-action') === 'alter') updateUnitOfMeasure()
    else insertUnitOfMeasure()
  })

  /*-----------------------------------------------
        Create UnitOfMeasure
    ------------------------------------------------*/
  // Events
  createUnitOfMeasureBtn.onclick = () => {
    model.setAttribute('data-action', 'create')
    model.querySelectorAll('input, select, textarea').forEach((el) => {
      el.value = ''
    })
    model.style.display = 'flex'
  }

  function insertUnitOfMeasure() {
    if (validateInputs() === false) return
    const data = {
      symbol: symbol.value,
      formalName: formalName.value,
    }
    ipcRenderer.invoke('insert-unit-of-measure', data).then(() => {
      model.style.display = 'none'
      unitsOfMeasure()
    })
  }
  /*----------------------------------------------
        Table Actions - Alter and Delete
    ------------------------------------------------*/
  // Functions
  function tableActions() {
    const unitOfMeasureID = this.getAttribute('data-id')
    const action = this.textContent

    if (action === 'Delete') {
      delete unitsOfMeasureObj[unitOfMeasureID]
      ipcRenderer.invoke('delete-unit-of-measure', unitOfMeasureID).then(() => unitsOfMeasure())
    } else if (action === 'Alter') {
      ipcRenderer.invoke('fetch-single-unit-of-measure', unitOfMeasureID).then((data) => {
        model.setAttribute('data-action', 'alter')

        symbol.setAttribute('data-id', data.id)
        symbol.value = data.symbol
        formalName.value = data.formalName
        model.style.display = 'flex'
      })
    }
  }

  function updateUnitOfMeasure() {
    if (validateInputs() === false) return
    const data = {
      id: symbol.getAttribute('data-id'),
      symbol: symbol.value,
      formalName: formalName.value,
    }
    ipcRenderer.invoke('update-unit-of-measure', data).then(() => {
      model.style.display = 'none'
      unitsOfMeasure()
    })
  }

  /*= ================================================================================== */
  function unitsOfMeasure() {
    if (!section.classList.contains('show')) return

    /*------------------------------------------------
            Display Table
        -------------------------------------------------*/
    // IPC Events
    ipcRenderer.invoke('fetch-all-units-of-measure').then((data) => {
      dataTable.clear().draw()
      if (Object.keys(data).length === 0) return

      data.forEach((el) => {
        const row = {
          symbol: el.symbol,
          formalName: el.formalName,
          actions: `<button class="button" data-id="${el.id}">Alter</button>
                    <button class="button" data-id="${el.id}">Delete</button>`,
        }

        dataTable.row.add(row).draw()
        unitsOfMeasureObj[el.id] = el
      })

      table.querySelectorAll('button').forEach((el) => {
        el.addEventListener('click', tableActions)
      })
    })
  }
}
