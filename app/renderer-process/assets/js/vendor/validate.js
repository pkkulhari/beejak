function setInputFilter(textbox, inputFilter) {
  ['input', 'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup'].forEach((event) => {
    textbox.addEventListener(event, function () {
      if (inputFilter(this.value)) {
        this.oldValue = this.value
        this.oldSelectionStart = this.selectionStart
        this.oldSelectionEnd = this.selectionEnd
      } else if (this.hasOwnProperty('oldValue')) {
        this.value = this.oldValue
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd)
      } else {
        this.value = ''
      }
    })
  })
}

function checksum(str, regexPattern) {
  const regTest = regexPattern.test(str)
  if (regTest) {
    const a = 65
    const b = 55
    let c = 36
    return Array.from(str).reduce((i, j, k, g) => {
      let p
      p = (p = (j.charCodeAt(0) < a ? parseInt(j) : j.charCodeAt(0) - b) * ((k % 2) + 1)) > c
        ? 1 + (p - c)
        : p
      return k < 14 ? i + p : j == ((c -= i % c) < 10 ? c : String.fromCharCode(c + b))
    }, 0)
  }
  return regTest
}

module.exports = { setInputFilter, checksum }
