'use scrict'

{
  const section = document.querySelector('section#groups')
  new MutationObserver(groups).observe(section, {
    attributeFilter: ['class'],
  })

  const $ = require('jquery')
  require('datatables.net')()
  const { ipcRenderer } = require('electron')
  const alertify = require('alertifyjs')

  // Get Elements
  const createGroupBtn = section.querySelector('#create-group-btn')
  const table = section.querySelector('#group_data_table')
  const model = section.querySelector('.model')
  const saveBtn = model.querySelector('.save')

  const groupName = section.querySelector('#name')

  const groupsObj = {}

  // Initialize Data Table
  const dataTable = $('#group_data_table').DataTable({
    columns: [
      {
        data: 'name',
      },

      {
        data: 'actions',
      },
    ],
  })

  /*-------------------------------------------
        POP-UP Model Close
    --------------------------------------------*/
  model.querySelector('.close').addEventListener('click', (event) => {
    const model = event.target.closest('.model')
    model.style.display = 'none'
  })

  /*--------------------------------------------
        Save Event
    ----------------------------------------------*/
  saveBtn.addEventListener('click', () => {
    if (model.getAttribute('data-action') === 'alter') updateGroup()
    else insertGroup()
  })

  /*----------------------------------------------
        Create Group
    -----------------------------------------------*/
  // Events
  createGroupBtn.onclick = () => {
    model.setAttribute('data-action', 'create')
    model.querySelectorAll('input, select, textarea').forEach((el) => {
      el.value = ''
    })
    model.style.display = 'flex'
  }

  // Functions
  function insertGroup() {
    const allInputFields = model.querySelectorAll('input[required]')

    for (const inputField of allInputFields) {
      if (inputField.value === '') {
        alertify.alert('', 'Fill all mandatory fields.')
        return
      }
    }

    for (const key in groupsObj) {
      if (groupName.value.toLowerCase() === groupsObj[key].name.toLowerCase()) {
        alertify.alert('', `The group "${groupsObj[key].name}" already exists.`)
        return
      }
    }

    const data = {
      name: groupName.value,
    }

    ipcRenderer.invoke('insert-group', data).then(() => {
      model.style.display = 'none'
      groups()
    })
  }

  /*----------------------------------------------
        Table Actions - Alter and Delete
    ------------------------------------------------*/
  // Functions
  function tableActions() {
    const groupID = this.getAttribute('data-id')
    const action = this.textContent

    if (action === 'Delete') {
      delete groupsObj[groupID]
      ipcRenderer.invoke('delete-group', groupID).then(() => groups())
    } else if (action === 'Alter') {
      ipcRenderer.invoke('fetch-single-group', groupID).then((data) => {
        model.setAttribute('data-action', 'alter')
        groupName.setAttribute('data-id', data.id)
        groupName.value = data.name
        model.style.display = 'flex'
      })
    }
  }

  function updateGroup() {
    const allInputFields = model.querySelectorAll('input[required]')

    for (const inputField of allInputFields) {
      if (inputField.value === '') {
        alertify.alert('', 'Fill all mandatory fields.')
        return
      }
    }

    const data = {
      id: groupName.getAttribute('data-id'),
      name: groupName.value,
    }

    ipcRenderer.invoke('update-group', data).then(() => {
      model.style.display = 'none'
      groups()
    })
  }

  /*= ==================================================================================== */
  function groups() {
    if (!section.classList.contains('show')) return

    /*------------------------------------------
            Display Table
        -------------------------------------------*/
    // Raise IPC Event
    ipcRenderer.invoke('fetch-all-groups').then((data) => {
      dataTable.clear().draw()
      if (Object.keys(data).length === 0) return
      data.forEach((el) => {
        const row = {
          name: el.name,
          actions: `<button class="button" data-id="${el.id}">Alter</button>
                    <button class="button" data-id="${el.id}">Delete</button>`,
        }

        dataTable.row.add(row).draw()
        groupsObj[el.id] = el
      })

      table.querySelectorAll('button').forEach((el) => {
        el.addEventListener('click', tableActions)
      })
    })
  }
}
