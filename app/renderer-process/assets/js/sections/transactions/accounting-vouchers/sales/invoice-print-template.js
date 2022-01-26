const { session } = require('electron').remote

// Get Elements
const invNo = document.querySelector('#inv_no')
const invDate = document.querySelector('#inv_date')
const vahicleNo = document.querySelector('#vahicle_no')

const billCustCode = document.querySelector('#bill_cust_code')
const billCustName = document.querySelector('#bill_cust_name')
const billCustGSTIN = document.querySelector('#bill_cust_gstin')
const billCustMobile = document.querySelector('#bill_cust_mobile')
const billCustAddress = document.querySelector('#bill_cust_address')

const shipCustCode = document.querySelector('#ship_cust_code')
const shipCustName = document.querySelector('#ship_cust_name')
const shipCustGSTIN = document.querySelector('#ship_cust_gstin')
const shipCustMobile = document.querySelector('#ship_cust_mobile')
const shipCustAddress = document.querySelector('#ship_cust_address')

const totalQty = document.querySelector('#total_qty')
const totalTradePrice = document.querySelector('#total_trade_price')
const totalDiscount = document.querySelector('#total_discount')
const totalTaxableAmt = document.querySelector('#total_taxable_amt')
const totalCgstAmt = document.querySelector('#total_cgst_amt')
const totalSgst_or_utgstAmt = document.querySelector('#total_sgst_or_utgst_amt')
const totalCessAmt = document.querySelector('#total_cess_amt')
const totalAmt = document.querySelector('#total_amt')

const itemDetailTableBody = document.querySelector('.items-detail table tbody')

const summary_totalCgstAmt = document.querySelector('#summary_total_cgst_amt')
const summary_totalSgstAmt = document.querySelector('#summary_total_sgst_amt')
const summary_totalCessAmt = document.querySelector('#summary_total_cess_amt')

const summaryDetailTableBody = document.querySelector('.summary table tbody')

session.defaultSession.cookies
  .get({ name: 'invoiceData' })
  .then((cookies) => {
    const data = JSON.parse(cookies[0].value)

    invNo.textContent = data.invNo
    invDate.textContent = data.invDate
    vahicleNo.textContent = data.vahicleNo

    billCustCode.textContent = data.billCustCode
    billCustName.textContent = data.billCustName
    billCustGSTIN.textContent = data.billCustGSTIN
    billCustMobile.textContent = data.billCustMobile
    billCustAddress.textContent = data.billCustAddress

    shipCustCode.textContent = data.shipCustCode
    shipCustName.textContent = data.shipCustName
    shipCustGSTIN.textContent = data.shipCustGSTIN
    shipCustMobile.textContent = data.shipCustMobile
    shipCustAddress.textContent = data.shipCustAddress

    totalQty.textContent = data.totalOutwardQty
    totalTradePrice.textContent = data.totalTradePrice
    totalDiscount.textContent = data.totalDiscount
    totalTaxableAmt.textContent = data.totalTaxableAmt
    totalCgstAmt.textContent = data.totalCgstAmt
    totalSgst_or_utgstAmt.textContent = data.totalSgstAmt
    totalCessAmt.textContent = data.totalCessAmt
    totalAmt.textContent = data.totalAmt

    summary_totalCgstAmt.textContent = data.summaryTotalCgstAmt
    summary_totalSgstAmt.textContent = data.summaryTotalSgstAmt
    summary_totalCessAmt.textContent = data.summaryTotalCessAmt

    let serialNo = 1
    data.rows.forEach((el) => {
      const tr = document.createElement('tr')

      for (let i = -1; i < el.length; i++) {
        const td = document.createElement('td')

        if (i === -1) {
          td.style.textAlign = 'center'
          td.textContent = serialNo
        } else {
          td.textContent = el[i]
          td.style.textAlign = 'right'

          if (i === 0 || i === 6) td.style.textAlign = 'left'
        }

        tr.appendChild(td)
      }

      itemDetailTableBody.appendChild(tr)
      serialNo++
    })

    data.summaryRows.forEach((el) => {
      const tr = document.createElement('tr')

      for (let i = 0; i < el.length; i++) {
        const td = document.createElement('td')
        if (i === 0) td.textContent = el[i]
        else td.textContent = Number(el[i]).toFixed(2)
        td.style.textAlign = 'right'

        tr.appendChild(td)
      }

      summaryDetailTableBody.appendChild(tr)
    })

    summary_totalCgstAmt.textContent = data.summary.totalCgst.toFixed(2)
    summary_totalSgstAmt.textContent = data.summary.totalSgst.toFixed(2)
    summary_totalCessAmt.textContent = data.summary.totalCess.toFixed(2)
  })
  .catch((error) => {
    console.error(error)
  })
