/* eslint-disable no-shadow */
const { ipcRenderer } = require('electron')
const flatpickr = require('flatpickr')
const alertify = require('alertifyjs')
const moment = require('moment')
const { setInputFilter } = require('../../../../vendor/validate')

{
  const section = document.querySelector('section#sales')

  new MutationObserver(sales).observe(section, { attributeFilter: ['class'] })

  // Get Elements
  const voucherNo = section.querySelector('#voucher-no')
  const date = section.querySelector('#date')
  const vahicleNo = section.querySelector('#vahicle-no')

  const ledgerCode = section.querySelector('#ledger-code')
  const ledgerName = section.querySelector('#ledger-name')
  const ledgerGSTIN = section.querySelector('#ledger-gstin')
  const ledgerMobile = section.querySelector('#ledger-mobile')
  const ledgerAddress1 = section.querySelector('#ledger-address-1')
  const ledgerAddress2 = section.querySelector('#ledger-address-2')

  const shipCode = section.querySelector('#ship-code')
  const shipName = section.querySelector('#ship-name')
  const shipGSTIN = section.querySelector('#ship-gstin')
  const shipMobile = section.querySelector('#ship-mobile')
  const shipAddress1 = section.querySelector('#ship-address-1')
  const shipAddress2 = section.querySelector('#ship-address-2')

  const stockItem = section.querySelector('.stock-item')
  const quantity = section.querySelector('.quantity')
  const rate = section.querySelector('.rate')
  const schemeQty1 = section.querySelector('.scheme-qty-1')
  const schemeQty2 = section.querySelector('.scheme-qty-2')
  const discount2 = section.querySelector('.discount-2')
  const schemeDesc = section.querySelector('.scheme-desc')

  const tQty = section.querySelector('#total-qty')
  const tSchemeQty1 = section.querySelector('#total-scheme-qty-1')
  const tSchemeQty2 = section.querySelector('#total-scheme-qty-2')
  const tOutwardQty = section.querySelector('#total-outward-qty')
  const tTradePrice = section.querySelector('#total-trade-price')
  const tDiscount1 = section.querySelector('#total-discount-1')
  const tDiscount2 = section.querySelector('#total-discount-2')
  const tTaxableAmt = section.querySelector('#total-taxable-amt')
  const tCgstAmt = section.querySelector('#total-cgst-amt')
  const tSgstAmt = section.querySelector('#total-sgst-amt')
  const tCessAmt = section.querySelector('#total-cess-amt')
  const tAmt = section.querySelector('#total-amount')

  const stockItemsDetail = section.querySelector('.stock-items-detail')
  const row = section.querySelector('.row')
  const addRowBtn = section.querySelector('.add-row-btn')
  const removeRowBtn = section.querySelector('.remove-row-btn')
  const form = section.querySelector('#sales-form')

  /*-----------------------------------------------------
        Flatepickr - Custom Date Picker
    ------------------------------------------------------*/
  const datePicker = flatpickr('section#sales #date', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  /*--------------------------------------------------------
      Validate Input Fields
    ----------------------------------------------------------*/
  validateInputs()

  function validateInputs() {
    section.querySelectorAll('input.only_numeric').forEach((input) => {
      setInputFilter(input, (value) => {
        if (input.classList.contains('not_decimal')) {
          return /^\d*$/.test(value) // Allow digits and '.' only, using a RegExp
        }
        return /^\d*\.?\d*$/.test(value) // Allow digits and '.' only, using a RegExp
      })
    })
  }

  /*---------------------------------------------------------
        Add or Remove Rows
    ----------------------------------------------------------*/
  // Event listener
  addRowBtn.addEventListener('click', addRow)
  removeRowBtn.addEventListener('click', removeRow)

  // Functions
  function addRow() {
    const rowClone = row.cloneNode(true)
    resetInputs(rowClone)
    resetRowEventListeners(rowClone)
    stockItemsDetail.appendChild(rowClone)
    validateInputs()
  }

  function removeRow() {
    if (section.querySelectorAll('.row').length !== 1) this.closest('.row').remove()
    totalCalc()
  }

  // Helper function
  function resetInputs(node) {
    node.querySelectorAll('input, textarea, select, .stock').forEach((el) => {
      if (el.className === 'stock') el.style.display = 'none'
      el.value = ''
    })
  }

  function resetRowEventListeners(node) {
    node.querySelector('.add-row-btn').addEventListener('click', addRow)
    node.querySelector('.remove-row-btn').addEventListener('click', removeRow)
    const item = node.querySelector('.stock-item')
    item.addEventListener('change', fetchSingleItemDetail)
    node.querySelector('.quantity').addEventListener('input', voucherCalc)
    node.querySelector('.rate').addEventListener('change', voucherCalc)
    node.querySelector('.scheme-qty-1').addEventListener('input', voucherCalc)
    node.querySelector('.scheme-qty-2').addEventListener('input', voucherCalc)
    node.querySelector('.discount-2').addEventListener('input', voucherCalc)
    node.querySelector('.remove-row-btn').addEventListener('click', totalCalc)
  }

  /*----------------------------------------------------------
      Fetch - All Legers, Stock Items, stocks
    -----------------------------------------------------------*/
  async function fetchAllNecessaryData() {
    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      ledgerName.innerHTML = '<option value="" selected hidden disabled>Select Ledger</option>'

      data.forEach((el) => {
        if (el.group.name.toLowerCase().trim() !== 'sundry debtors') return
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name

        ledgerName.appendChild(option)
      })
    })

    await ipcRenderer.invoke('fetch-all-stock-items').then((data) => {
      stockItem.innerHTML = '<option value="" selected hidden disabled>Select Item</option>'

      data.forEach((el) => {
        const option = document.createElement('option')
        option.value = el.id
        option.textContent = el.name

        stockItem.appendChild(option)
      })
    })
  }

  /*---------------------------------------------------------
        Fetch - Selected Ledger's Data and Selected Item's Data
    ----------------------------------------------------------*/
  // Events
  ledgerName.addEventListener('change', () => {
    ipcRenderer.invoke('fetch-single-ledger', ledgerName.value).then((data) => {
      ledgerCode.value = data.id
      ledgerGSTIN.value = data.gstin
      ledgerMobile.value = data.mobile
      ledgerAddress1.value = data.address1
      ledgerAddress2.value = data.address2

      shipCode.value = data.id
      shipName.value = data.name
      shipGSTIN.value = data.gstin
      shipMobile.value = data.mobile
      shipAddress1.value = data.address1
      shipAddress2.value = data.address2
    })
  })

  stockItem.addEventListener('change', fetchSingleItemDetail)

  // Function
  async function fetchSingleItemDetail() {
    const stockItems = section.querySelectorAll('.stock-item')

    // Check for duplicate item
    let itemCount = 0
    Object.values(stockItems).forEach((item) => {
      if (item.value === this.value) itemCount += 1
    })

    if (itemCount > 1) {
      alertify.alert(
        '',
        `The selected item "${this.selectedOptions[0].label}" already exists in the invoice.`
      )
      this.value = ''
      return
    }

    let focusedRow
    await ipcRenderer.invoke('fetch-single-stock-item', this.value).then(async (data) => {
      stockItemsDetail.querySelectorAll('.stock-item').forEach((el) => {
        if (Number(el.value) === Number(data.id)) focusedRow = el.closest('.row')
      })

      const frMrp = focusedRow.querySelector('.mrp')
      const frRate = focusedRow.querySelector('.rate')
      const frPackSize = focusedRow.querySelector('.pack-size')
      const frHsnCode = focusedRow.querySelector('.hsn-code')
      const frCgstPer = focusedRow.querySelector('.cgst-per')
      const frSgstPer = focusedRow.querySelector('.sgst-per')
      const frCessPer = focusedRow.querySelector('.cess-per')
      const frTotalOutwardQuantity = focusedRow.querySelector('.total-outward-qty')

      frMrp.value = data.mrp
      frRate.value = data.rate
      frPackSize.value = data.packSize

      frHsnCode.value = data.stockGroup.hsnCode
      frCgstPer.value = data.stockGroup.cgstPer
      frSgstPer.value = data.stockGroup.sgstPer
      frCessPer.value = data.stockGroup.cessPer

      frTotalOutwardQuantity.setAttribute('data-unit', data.unitsOfMeasure.symbol)
    })

    await ipcRenderer
      .invoke('fetch-single-item-stock', {
        date: moment(date.value).format('YYYY-MM-DD'),
        stockItemId: this.value,
      })
      .then((data) => {
        const stockDiv = focusedRow.querySelector('.stock')
        const unit = focusedRow.querySelector('.total-outward-qty').getAttribute('data-unit')
        stockDiv.textContent = `Available: ${data?.quantity || 0} ${unit}`
        stockDiv.style.display = 'block'
      })

    await ipcRenderer
      .invoke('fetch-rates-by-type', { type: 'sale', stockItemId: this.value })
      .then((data) => {
        const rate = focusedRow.querySelector('.rate')
        rate.innerHTML = ''

        const latestRate = {}
        data.forEach((el, index) => {
          if (index === 0) {
            latestRate.rate = el.rate
            latestRate.date = el.date
          } else if (new Date(el.date) > new Date(latestRate.date)) {
            latestRate.date = el.date
            latestRate.rate = el.rate
          }

          const option = document.createElement('option')
          option.value = el.rate
          option.textContent = `${el.rate} ₹, D.: ${moment(el.date).format('DD.MM.YYYY')}`

          rate.appendChild(option)
        })

        rate.value = latestRate.rate
      })

    voucherCalc(focusedRow)
  }

  /*-------------------------------------------------
        Invoice Calculations
    ---------------------------------------------------*/
  // Events
  stockItem.addEventListener('input', voucherCalc)
  quantity.addEventListener('input', voucherCalc)
  rate.addEventListener('change', voucherCalc)
  schemeQty1.addEventListener('input', voucherCalc)
  schemeQty2.addEventListener('input', voucherCalc)
  discount2.addEventListener('input', voucherCalc)
  removeRowBtn.addEventListener('click', totalCalc)

  // Functions
  function voucherCalc(focusedRow) {
    if (typeof this.closest === 'function') focusedRow = this.closest('.row')

    // Get Elements
    const inpQuantity = focusedRow.querySelector('.quantity')
    const inpRate = focusedRow.querySelector('.rate')
    const inpSchemeQty1 = focusedRow.querySelector('.scheme-qty-1')
    const inpSchemeQty2 = focusedRow.querySelector('.scheme-qty-2')
    const inpTotalOutwardQty = focusedRow.querySelector('.total-outward-qty')
    const inpTradePrice = focusedRow.querySelector('.trade-price')
    const inpDiscount1 = focusedRow.querySelector('.discount-1')
    const inpTaxableAmt = focusedRow.querySelector('.taxable-amt')
    const inpCgstPer = focusedRow.querySelector('.cgst-per')
    const inpCgstAmt = focusedRow.querySelector('.cgst-amt')
    const inpSgstPer = focusedRow.querySelector('.sgst-per')
    const inpSgstAmt = focusedRow.querySelector('.sgst-amt')
    const inpCessPer = focusedRow.querySelector('.cess-per')
    const inpCessAmt = focusedRow.querySelector('.cess-amt')
    const inpTotalAmt = focusedRow.querySelector('.total-amount')

    // Get Values
    const quantity = Number(inpQuantity.value) || 0
    const rate = Number(inpRate.value)
    const schemeQty1 = Number(inpSchemeQty1.value) || 0
    const schemeQty2 = Number(inpSchemeQty2.value) || 0
    const cgstPer = Number(inpCgstPer.value)
    const sgstPer = Number(inpSgstPer.value)
    const cessPer = Number(inpCessPer.value)

    // Calculations
    const totalOutwardQty = quantity + schemeQty1
    const discount1Amt = rate * schemeQty1
    const tradePrice = quantity * rate
    const totalTax = cgstPer + sgstPer + cessPer
    // Item's real price without any tax
    const tradePriceWithDis = tradePrice
    const taxableAmt = (tradePriceWithDis * 100) / (totalTax + 100)
    const cgstAmt = (cgstPer * taxableAmt) / 100
    const sgstAmt = (sgstPer * taxableAmt) / 100
    const cessAmt = (cessPer * taxableAmt) / 100
    const totalAmount = taxableAmt + cgstAmt + sgstAmt + cessAmt

    // Assign Values
    inpTotalOutwardQty.value = totalOutwardQty.toFixed(2)
    inpTradePrice.value = tradePrice.toFixed(2)
    inpDiscount1.value = discount1Amt.toFixed(2)
    inpTaxableAmt.value = taxableAmt.toFixed(2)
    inpCgstAmt.value = cgstAmt.toFixed(2)
    inpSgstAmt.value = sgstAmt.toFixed(2)
    inpCessAmt.value = cessAmt.toFixed(2)
    inpTotalAmt.value = totalAmount.toFixed(2)

    totalCalc()
  }

  function totalCalc() {
    const totalValues = []

    const qty = document.querySelectorAll('.quantity')
    const schemeQty1 = document.querySelectorAll('.scheme-qty-1')
    const schemeQty2 = document.querySelectorAll('.scheme-qty-2')
    const totalOutwardQty = document.querySelectorAll('.total-outward-qty')
    const tradePrice = document.querySelectorAll('.trade-price')
    const discount1 = document.querySelectorAll('.discount-1')
    const discount2 = document.querySelectorAll('.discount-2')
    const taxableAmt = document.querySelectorAll('.taxable-amt')
    const cgstAmt = document.querySelectorAll('.cgst-amt')
    const sgstAmt = document.querySelectorAll('.sgst-amt')
    const cessAmt = document.querySelectorAll('.cess-amt')
    const totalAmount = document.querySelectorAll('.total-amount')

    const inputFieldsArray = [
      qty,
      schemeQty1,
      schemeQty2,
      totalOutwardQty,
      tradePrice,
      discount1,
      discount2,
      taxableAmt,
      cgstAmt,
      sgstAmt,
      cessAmt,
      totalAmount,
    ]

    inputFieldsArray.forEach((inputFields) => {
      let totalValue = 0
      inputFields.forEach((inputField) => {
        totalValue += Number(inputField.value)
      })
      totalValues.push(totalValue)
    })

    tQty.value = totalValues[0].toFixed(2)
    tSchemeQty1.value = totalValues[1].toFixed(2)
    tSchemeQty2.value = totalValues[2].toFixed(2)
    tOutwardQty.value = totalValues[3].toFixed(2)
    tTradePrice.value = totalValues[4].toFixed(2)
    tDiscount1.value = totalValues[5].toFixed(2)
    tDiscount2.value = totalValues[6].toFixed(2)
    tTaxableAmt.value = totalValues[7].toFixed(2)
    tCgstAmt.value = totalValues[8].toFixed(2)
    tSgstAmt.value = totalValues[9].toFixed(2)
    tCessAmt.value = totalValues[10].toFixed(2)
    tAmt.value = totalValues[11].toFixed(2)
  }

  /*---------------------------------------------------
        Save Invoice Data
    ----------------------------------------------------*/
  // Events
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const allInputFields = section.querySelectorAll('input[required], select[required]')

    // Validation
    allInputFields.forEach((inputField) => {
      if (inputField.value === '') {
        alertify.alert('', 'Fill all mandatory fields.')
        return false
      }

      return true
    })

    // Get Elements
    const stockItem = section.querySelectorAll('.stock-item')
    const rate = section.querySelectorAll('.rate')
    const quantity = section.querySelectorAll('.quantity')
    const schemeQty1 = section.querySelectorAll('.scheme-qty-1')
    const schemeQty2 = section.querySelectorAll('.scheme-qty-2')
    const totalOutwardQty = section.querySelectorAll('.total-outward-qty')
    const tradePrice = section.querySelectorAll('.trade-price')
    const discount1 = section.querySelectorAll('.discount-1')
    const discount2 = section.querySelectorAll('.discount-2')
    const taxableAmt = section.querySelectorAll('.taxable-amt')
    const cgstAmt = section.querySelectorAll('.cgst-amt')
    const sgstAmt = section.querySelectorAll('.sgst-amt')
    const cessAmt = section.querySelectorAll('.cess-amt')
    const totalAmt = section.querySelectorAll('.total-amount')
    const schemeDesc = section.querySelectorAll('.scheme-desc')

    const rowInputFields = [
      stockItem,
      rate,
      quantity,
      schemeQty1,
      schemeQty2,
      totalOutwardQty,
      tradePrice,
      discount1,
      discount2,
      taxableAmt,
      cgstAmt,
      sgstAmt,
      cessAmt,
      totalAmt,
      schemeDesc,
    ]

    const rowsDataArray = []
    const rowsCount = stockItem.length
    for (let i = 0; i < rowsCount; i++) {
      const rowDataArray = []
      rowInputFields.forEach((rowInputField) => {
        rowDataArray.push(rowInputField[i].value)
      })
      rowsDataArray.push(rowDataArray)
    }

    const rowsArray = []
    rowsDataArray.forEach((el) => {
      const rowArray = {
        stockItemId: el[0],
        rate: el[1],
        quantity: el[2],
        schemeQty1: el[3] || null,
        schemeQty2: el[4] || null,
        totalOutwardQty: el[5],
        tradePrice: el[6],
        discount1: el[7],
        discount2: el[8] || null,
        taxableAmt: el[9],
        cgstAmt: el[10],
        sgstAmt: el[11],
        cessAmt: el[12],
        totalAmt: el[13],
        schemeDesc: el[14],
        saleId: voucherNo.value,
        createdAt: date.value,
      }

      rowsArray.push(rowArray)
    })

    const data = {
      voucher: {
        id: voucherNo.value,
        date: date.value,
        vahicleNo: vahicleNo.value,
        ledgerId: ledgerCode.value,
        tQuantity: tQty.value,
        tSchemeQty1: tSchemeQty1.value,
        tSchemeQty2: tSchemeQty2.value,
        tOutwardQty: tOutwardQty.value,
        tTradePrice: tTradePrice.value,
        tDiscount1: tDiscount1.value,
        tDiscount2: tDiscount2.value,
        tTaxableAmt: tTaxableAmt.value,
        tCgstAmt: tCgstAmt.value,
        tSgstAmt: tSgstAmt.value,
        tCessAmt: tCessAmt.value,
        tAmount: tAmt.value,
      },

      shipingAddress: {
        code: shipCode.value,
        name: shipName.value,
        gstin: shipGSTIN.value,
        mobile: shipMobile.value,
        address1: shipAddress1.value,
        address2: shipAddress2.value,
        saleId: voucherNo.value,
      },

      stockItems: rowsArray,
    }

    ipcRenderer.invoke('save-sale', data).then((data) => {
      if (data === true) {
        alertify.notify('Saved!', 'success', 3)
        return
      }
      alertify.notify('Something went wrong!', 'error', 3)
    })

    return true
  })

  /*-------------------------------------------------------
      Update Voucher
    --------------------------------------------------------*/
  async function updateSale(saleId) {
    ipcRenderer.invoke('fetch-single-sale', saleId).then(async (data) => {
      stockItemsDetail.querySelectorAll('.row').forEach((el, index) => {
        if (index === 0) return
        el.remove()
      })

      await fetchAllNecessaryData()
      resetInputs(section)

      voucherNo.value = data.id
      datePicker.setDate(data.date)
      vahicleNo.value = data.vahicleNo

      ledgerCode.value = data.ledger.id
      ledgerName.value = data.ledger.id
      ledgerGSTIN.value = data.ledger.gstin
      ledgerMobile.value = data.ledger.mobile
      ledgerAddress1.value = data.ledger.address1
      ledgerAddress2.value = data.ledger.address2

      shipCode.value = data.saleShipingAddress.code
      shipName.value = data.saleShipingAddress.name
      shipGSTIN.value = data.saleShipingAddress.gstin
      shipMobile.value = data.saleShipingAddress.mobile
      shipAddress1.value = data.saleShipingAddress.address1
      shipAddress2.value = data.saleShipingAddress.address2

      data.saleItems.forEach((el, index) => {
        if (index === 0) {
          stockItem.value = el.stockItemId
          quantity.value = el.quantity
          schemeQty1.value = el.schemeQty1
          schemeQty2.value = el.schemeQty2
          discount2.value = el.discount2
          schemeDesc.value = el.schemeDesc

          stockItem.dispatchEvent(new Event('change'))
          return
        }

        const clone = row.cloneNode(true)
        clone.querySelector('.stock-item').value = el.stockItemId
        clone.querySelector('.quantity').value = el.quantity
        clone.querySelector('.scheme-qty-1').value = el.schemeQty1
        clone.querySelector('.scheme-qty-2').value = el.schemeQty2
        clone.querySelector('.discount-2').value = el.discount2
        clone.querySelector('.scheme-desc').value = el.schemeDesc

        resetRowEventListeners(clone)
        stockItemsDetail.appendChild(clone)
        clone.querySelector('.stock-item').dispatchEvent(new Event('change'))
        validateInputs()
      })

      section.setAttribute('data-action', 'update')
      await section.classList.add('show')
      section.removeAttribute('data-action')
    })
  }

  /* ======================================================================================= */
  function sales() {
    if (!section.classList.contains('show') || section.getAttribute('data-action') === 'update') {
      return
    }

    resetInputs(section)
    section.querySelectorAll('.remove-row-btn').forEach((el) => {
      el.click()
    })

    datePicker.setDate(new Date())

    /*----------------------------------------------------------
            Fetch - Last Invoice ID, Supplier Names, and Item Names
        -----------------------------------------------------------*/
    // Raise IPC Events
    ipcRenderer.invoke('fetch-last-sale').then((data) => {
      voucherNo.value = data[0]?.id + 1 || 1
    })

    fetchAllNecessaryData()
  }

  module.exports = { updateSale }
}
