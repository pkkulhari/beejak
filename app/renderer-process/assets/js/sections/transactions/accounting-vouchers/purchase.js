{
  const section = document.querySelector('section#purchase')
  new MutationObserver(purchase).observe(section, { attributeFilter: ['class'] })

  const { ipcRenderer } = require('electron')
  const flatpickr = require('flatpickr')
  const alertify = require('alertifyjs')
  const { setInputFilter } = require('../../../vendor/validate')
  const moment = require('moment')

  // Get Elements
  const voucherNo = section.querySelector('#voucher-no')
  const supplierInvNo = section.querySelector('#supplier-inv-no')
  const date = section.querySelector('#date')
  const vahicleNo = section.querySelector('#vahicle-no')

  const ledgerCode = section.querySelector('#ledger-code')
  const ledgerName = section.querySelector('#ledger-name')
  const ledgerGSTIN = section.querySelector('#ledger-gstin')
  const ledgerMobile = section.querySelector('#ledger-mobile')
  const ledgerAddress1 = section.querySelector('#ledger-address-1')
  const ledgerAddress2 = section.querySelector('#ledger-address-2')

  const stockItem = section.querySelector('.stock-item')
  const mrp = section.querySelector('.mrp')
  const quantity = section.querySelector('.quantity')
  const hsnCode = section.querySelector('.hsn-code')
  const packSize = section.querySelector('.pack-size')
  const rate = section.querySelector('.rate')
  const discount = section.querySelector('.discount')
  const cgstPer = section.querySelector('.cgst-per')
  const sgstPer = section.querySelector('.sgst-per')
  const cessPer = section.querySelector('.cess-per')

  const tQty = section.querySelector('#total-qty')
  const tTradePrice = section.querySelector('#total-trade-price')
  const tDiscount = section.querySelector('#total-discount')
  const tTaxableAmt = section.querySelector('#total-taxable-amt')
  const tCgstAmt = section.querySelector('#total-cgst-amt')
  const tSgstAmt = section.querySelector('#total-sgst-amt')
  const tCessAmt = section.querySelector('#total-cess-amt')
  const tcsPer = section.querySelector('#tcs-per')
  const tcsAmt = section.querySelector('#tcs-amt')
  const tAmt = section.querySelector('#total-amount')

  const stockItemsDetail = section.querySelector('.stock-items-detail')
  const row = section.querySelector('.row')
  const addRowBtn = section.querySelector('.add-row-btn')
  const removeRowBtn = section.querySelector('.remove-row-btn')
  const form = section.querySelector('#purchase-form')

  resetInputs(section)
  section.querySelectorAll('.remove-row-btn').forEach((el) => {
    el.click()
  })

  /*-----------------------------------------------------
        Flatepickr - Custom Date Picker
    ------------------------------------------------------*/
  const datePicker = flatpickr('section#purchase #date', {
    enableTime: true,
    enableSeconds: true,
    altInput: true,
    dateFormat: 'Y-m-d H:i:S',
    altFormat: 'd.m.Y',
  })

  /*--------------------------------------------------------
      Validate Input Fields
    ---------------------------------------------------------*/
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

  /*--------------------------------------------------------
      Add or Remove Rows
    ---------------------------------------------------------*/
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
    node.querySelectorAll('input, select, textarea').forEach((input) => {
      input.value = ''
    })
  }

  function resetRowEventListeners(node) {
    node.querySelector('.add-row-btn').addEventListener('click', addRow)
    node.querySelector('.remove-row-btn').addEventListener('click', removeRow)
    const stockItem = node.querySelector('.stock-item')
    stockItem.addEventListener('change', fetchSingleItem)
    stockItem.addEventListener('change', voucherCalc)
    node.querySelector('.quantity').addEventListener('input', voucherCalc)
    node.querySelector('.rate').addEventListener('input', voucherCalc)
    node.querySelector('.discount').addEventListener('input', voucherCalc)
    node.querySelector('.remove-row-btn').addEventListener('click', totalCalc)
  }

  /*----------------------------------------------------------
      Fetch - All Legers and Stock Items
    -----------------------------------------------------------*/
  async function fetchAllNecessaryData() {
    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      ledgerName.innerHTML = '<option value="" selected hidden disabled>Select Ledger</option>'
      data.forEach((el) => {
        if (el.group.name.toLowerCase().trim() !== 'sundry creditors') return
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

  /*----------------------------------------------------------
      Fetch - Selected Customer's Data and Selected Item's Data
    -----------------------------------------------------------*/
  // Events
  ledgerName.addEventListener('change', () => {
    ipcRenderer.invoke('fetch-single-ledger', ledgerName.value).then((data) => {
      ledgerCode.value = data.id
      ledgerGSTIN.value = data.gstin
      ledgerMobile.value = data.mobile
      ledgerAddress1.value = data.address1
      ledgerAddress2.value = data.address2
    })
  })

  stockItem.addEventListener('change', fetchSingleItem)

  // Function
  function fetchSingleItem() {
    const stockItems = section.querySelectorAll('.stock-item')

    // Check for duplicate stockItem
    let stockItemCount = 0
    for (const i in stockItems) {
      if (stockItems[i].value === this.value) stockItemCount++
    }
    if (stockItemCount > 1) {
      alertify.alert(
        '',
        `The selected stock item "${this.selectedOptions[0].label}" already exists in this voucher.`
      )
      this.value = ''
      return
    }

    ipcRenderer.invoke('fetch-single-stock-item', this.value).then((data) => {
      let focusedRow
      for (const el of stockItemsDetail.querySelectorAll('.stock-item')) {
        if (el.value == data.id) focusedRow = el.closest('.row')
      }

      const mrp = focusedRow.querySelector('.mrp')
      const rate = focusedRow.querySelector('.rate')
      const packSize = focusedRow.querySelector('.pack-size')
      const hsnCode = focusedRow.querySelector('.hsn-code')
      const cgstPer = focusedRow.querySelector('.cgst-per')
      const sgstPer = focusedRow.querySelector('.sgst-per')
      const cessPer = focusedRow.querySelector('.cess-per')

      mrp.value = data.mrp
      packSize.value = data.packSize

      hsnCode.value = data.stockGroup.hsnCode
      cgstPer.value = data.stockGroup.cgstPer
      sgstPer.value = data.stockGroup.sgstPer
      cessPer.value = data.stockGroup.cessPer

      voucherCalc(focusedRow)
    })
  }

  /* ------------------------------------------------------
      Voucher Calculations
    ------------------------------------------------------*/
  // Events
  stockItem.addEventListener('input', voucherCalc)
  quantity.addEventListener('input', voucherCalc)
  rate.addEventListener('input', voucherCalc)
  discount.addEventListener('input', voucherCalc)
  tcsPer.addEventListener('input', totalCalc)
  removeRowBtn.addEventListener('click', totalCalc)

  // Functions
  function voucherCalc(focusedRow) {
    if (typeof this.closest === 'function') focusedRow = this.closest('.row')

    // Get Elements
    const inp_quantity = focusedRow.querySelector('.quantity')
    const inp_rate = focusedRow.querySelector('.rate')
    const inp_tradePrice = focusedRow.querySelector('.trade-price')
    const inp_discount = focusedRow.querySelector('.discount')
    const inp_taxableAmt = focusedRow.querySelector('.taxable-amt')
    const inp_cgstPer = focusedRow.querySelector('.cgst-per')
    const inp_cgstAmt = focusedRow.querySelector('.cgst-amt')
    const inp_sgstPer = focusedRow.querySelector('.sgst-per')
    const inp_sgstAmt = focusedRow.querySelector('.sgst-amt')
    const inp_cessPer = focusedRow.querySelector('.cess-per')
    const inp_cessAmt = focusedRow.querySelector('.cess-amt')
    const inp_totalAmt = focusedRow.querySelector('.total-amount')
    // Get Values
    const quantity = Number(inp_quantity.value) || 0
    const discount = Number(inp_discount.value) || 0
    const rate = Number(inp_rate.value)
    const cgstPer = Number(inp_cgstPer.value)
    const sgstPer = Number(inp_sgstPer.value)
    const cessPer = Number(inp_cessPer.value)
    // Calculations
    let taxableAmt = quantity * rate // Item's real price without any tax
    taxableAmt -= discount
    const cgstAmt = (cgstPer * taxableAmt) / 100
    const sgstAmt = (sgstPer * taxableAmt) / 100
    const cessAmt = (cessPer * taxableAmt) / 100
    const totalAmount = taxableAmt + cgstAmt + sgstAmt + cessAmt
    const tradePrice = totalAmount
    // Assign Values
    inp_tradePrice.value = tradePrice.toFixed(2)
    inp_taxableAmt.value = taxableAmt.toFixed(2)
    inp_cgstAmt.value = cgstAmt.toFixed(2)
    inp_sgstAmt.value = sgstAmt.toFixed(2)
    inp_cessAmt.value = cessAmt.toFixed(2)
    inp_totalAmt.value = totalAmount.toFixed(2)
    totalCalc()
  }

  function totalCalc() {
    const totalValues = []

    const qty = section.querySelectorAll('.quantity')
    const tradePrice = section.querySelectorAll('.trade-price')
    const discount = section.querySelectorAll('.discount')
    const taxableAmt = section.querySelectorAll('.taxable-amt')
    const cgstAmt = section.querySelectorAll('.cgst-amt')
    const sgstAmt = section.querySelectorAll('.sgst-amt')
    const cessAmt = section.querySelectorAll('.cess-amt')
    const totalAmount = section.querySelectorAll('.total-amount')
    const inputFieldsArray = [
      qty,
      discount,
      taxableAmt,
      cgstAmt,
      sgstAmt,
      cessAmt,
      tradePrice,
      totalAmount,
    ]
    inputFieldsArray.forEach((inputFields) => {
      let totalValue = 0
      inputFields.forEach((inputField) => {
        totalValue += Number(inputField.value)
      })
      totalValues.push(totalValue)
    })
    const _tcsAmt = (Number(tcsPer.value || 0) * totalValues[7]) / 100
    totalValues[7] += _tcsAmt

    tQty.value = totalValues[0].toFixed(2)
    tDiscount.value = totalValues[1].toFixed(2)
    tTaxableAmt.value = totalValues[2].toFixed(2)
    tCgstAmt.value = totalValues[3].toFixed(2)

    tSgstAmt.value = totalValues[4].toFixed(2)
    tCessAmt.value = totalValues[5].toFixed(2)
    tcsAmt.value = _tcsAmt.toFixed(2)
    tTradePrice.value = totalValues[6].toFixed(2)
    tAmt.value = totalValues[7].toFixed(2)
  }

  /*-------------------------------------------------------
      Save Voucher Data
    --------------------------------------------------------*/
  // Events
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const allInputFields = section.querySelectorAll('input[required], select[required]')

    // Validation
    for (const inputField of allInputFields) {
      if (inputField.value === '') {
        alertify.alert('', 'Fill all mandatory fields.')
        return false
      }
    }
    // Get Elements
    const stockItem = section.querySelectorAll('.stock-item')
    const quantity = section.querySelectorAll('.quantity')
    const rate = section.querySelectorAll('.rate')
    const tradePrice = section.querySelectorAll('.trade-price')
    const discount = section.querySelectorAll('.discount')
    const taxableAmt = section.querySelectorAll('.taxable-amt')
    const cgstAmt = section.querySelectorAll('.cgst-amt')
    const sgstAmt = section.querySelectorAll('.sgst-amt')
    const cessAmt = section.querySelectorAll('.cess-amt')
    const totalAmt = section.querySelectorAll('.total-amount')
    const rowInputFields = [
      stockItem,
      quantity,
      rate,
      tradePrice,
      discount,
      taxableAmt,
      cgstAmt,
      sgstAmt,
      cessAmt,
      totalAmt,
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
        quantity: el[1],
        rate: el[2],
        tradePrice: el[3],
        discount: el[4] || null,
        taxableAmt: el[5],
        cgstAmt: el[6],
        sgstAmt: el[7],
        cessAmt: el[8],
        totalAmt: el[9],
        purchaseId: voucherNo.value,
        createdAt: date.value,
      }
      rowsArray.push(rowArray)
    })
    const data = {
      voucher: {
        id: voucherNo.value,
        supplierInvNo: supplierInvNo.value,
        date: date.value,
        vahicleNo: vahicleNo.value,
        ledgerId: ledgerCode.value,
        tQuantity: tQty.value,
        tTradePrice: tTradePrice.value,
        tDiscount: tDiscount.value,
        tTaxableAmt: tTaxableAmt.value,
        tCgstAmt: tCgstAmt.value,
        tSgstAmt: tSgstAmt.value,
        tCessAmt: tCessAmt.value,
        tcsPer: tcsPer.value || 0,
        tcsAmt: tcsAmt.value,
        tAmount: tAmt.value,
      },
      stockItems: rowsArray,
    }
    ipcRenderer.invoke('save-purchase', data).then((data) => {
      if (data === true) {
        alertify.notify('Saved!', 'success', 3)
        return
      }
      alertify.notify('Something went wrong!', 'error', 3)
    })
  })

  /*-------------------------------------------------------
      Update Voucher
    --------------------------------------------------------*/
  async function updatePurchase(purchaseId) {
    ipcRenderer.invoke('fetch-single-purchase', purchaseId).then(async (data) => {
      stockItemsDetail.querySelectorAll('.row').forEach((el, index) => {
        if (index === 0) return
        el.remove()
      })
      await fetchAllNecessaryData()
      resetInputs(section)

      voucherNo.value = data.id
      supplierInvNo.value = data.supplierInvNo
      datePicker.setDate(data.date)
      vahicleNo.value = data.vahicleNo
      ledgerCode.value = data.ledger.id
      ledgerName.value = data.ledger.id
      ledgerGSTIN.value = data.ledger.gstin
      ledgerMobile.value = data.ledger.mobile
      ledgerAddress1.value = data.ledger.address1
      ledgerAddress2.value = data.ledger.address2
      tcsPer.value = data.tcsPer

      data.purchaseItems.forEach((el, index) => {
        if (index === 0) {
          stockItem.value = el.stockItemId
          quantity.value = el.quantity
          rate.value = el.rate
          discount.value = el.discount

          stockItem.dispatchEvent(new Event('change'))
          return
        }
        const clone = row.cloneNode(true)
        clone.querySelector('.stock-item').value = el.stockItemId
        clone.querySelector('.quantity').value = el.quantity
        clone.querySelector('.rate').value = el.rate
        clone.querySelector('.discount').value = el.discount

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

  /*= ======================================================================================= */
  function purchase() {
    if (!section.classList.contains('show') || section.getAttribute('data-action') === 'update')
      return
    resetInputs(section)
    section.querySelectorAll('.remove-row-btn').forEach((el) => {
      el.click()
    })
    datePicker.setDate(new Date())

    /*------------------------------------------------------
            Fetch - Last Purchase Id, Ledgers, and Stock Items
        -------------------------------------------------------*/
    // Raise IPC Events
    ipcRenderer
      .invoke('fetch-last-purchase')
      .then((data) => (voucherNo.value = data[0]?.id + 1 || 1))
    fetchAllNecessaryData()
  }

  module.exports = { updatePurchase }
}
