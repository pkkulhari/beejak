const { ipcRenderer } = require('electron')
const bcrypt = require('bcrypt')

// Get Elements
const loginFrom = document.forms.login_form
const error = document.querySelector('#error')

// Events
loginFrom.addEventListener('submit', (el) => {
  el.preventDefault()
  ipcRenderer.invoke('fetch-single-user', loginFrom.username.value).then((data) => {
    if (data === null) {
      error.textContent = 'Username or password incorrect.'
      return
    }

    bcrypt.compare(loginFrom.password.value, data.password).then((isValidUser) => {
      if (!isValidUser) error.textContent = 'Username or password incorrect.'
      else ipcRenderer.invoke('user-authorized')
    })
  })
})
