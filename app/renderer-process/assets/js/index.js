const path = require('path')
const glob = require('glob')
const fs = require('fs')
const each = require('async/each')

const files = glob.sync(path.join(__dirname, '../../sections/**/*.html'))

each(
  files,
  (file, callback) => {
    fs.readFile(file, (err, data) => {
      if (err) return callback(err)
      const html = new DOMParser().parseFromString(data, 'text/html')
      if (html.querySelector('template') === null) return callback()
      document.querySelector('#content').innerHTML += html.querySelector('template').innerHTML
      callback()
    })
  },
  (err) => {
    if (err) console.error(err)
    loadScripts()
  }
)

async function loadScripts() {
  const scripts = glob.sync(
    path.join(__dirname, '../../assets/js/**/!(invoice-print-template|index|validate|login)*.js')
  )
  scripts.forEach((script) => {
    require(script)
  })
}
