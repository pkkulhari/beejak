const flatpickr = require('flatpickr')
const { ipcRenderer } = require('electron')
const $ = require('jquery')
const MouseTrap = require('mousetrap')
const moment = require('moment')
const Excel = require('exceljs')

{
  const section = document.querySelector('section#stock-summary')
  new MutationObserver(stockSummary).observe(section, {
    attributeFilter: ['class'],
  })

  // Get Elements
  const inventory = section.querySelector('#inventory')
  const firstDate = section.querySelector('#first-date')
  const secondDate = section.querySelector('#second-date')

  const stockItemsObj = {}
  const stockGroupsObj = {}
  const ledgersObj = {}

  /*---------------------------------------
      Flatepickr - Custom Date Picker
    ----------------------------------------*/
  flatpickr('section#stock-summary #second-date', {
    altInput: true,
    dateFormat: 'Y-m-d',
    altFormat: 'd.m.Y',
    defaultDate: new Date(),
  })

  flatpickr('section#stock-summary #first-date', {
    altInput: true,
    dateFormat: 'Y-m-d',
    altFormat: 'd.m.Y',
    defaultDate: moment().format('YYYY-MM-01'),
  })

  /*------------------------------------------
      Initialize Data Table
    ------------------------------------------*/

  const dataTable = $('#stock_summary_data_table').DataTable({
    lengthMenu: [
      [10, 25, 50, -1],
      [10, 25, 50, 'All'],
    ],
    columns: [
      { data: 'name' },
      {
        data: 'openingQuantity',
      },
      {
        data: 'openingValue',
      },
      {
        data: 'inwardQuantity',
      },
      {
        data: 'inwardValue',
      },
      {
        data: 'billingOutwardQuantity',
      },
      {
        data: 'billingOutwardValue',
      },
      {
        data: 'schemeOutwardQuantity',
      },
      {
        data: 'schemeOutwardValue',
      },
      {
        data: 'totalOutwardQuantity',
      },
      {
        data: 'totalOutwardValue',
      },
      {
        data: 'closingQuantity',
      },
      {
        data: 'closingValue',
      },
      {
        data: 'actions',
      },
    ],
    autoWidth: false,
  })

  // Export Table Data to Excel
  section.querySelector('.export-to-excel').addEventListener('click', async () => {
    const workbook = new Excel.Workbook()

    if (section.querySelectorAll('#stock_summary_data_table tbody tr.shown').length > 0) {
      section.querySelectorAll('#stock_summary_data_table tbody tr td table').forEach((table) => {
        const ws = workbook.addWorksheet()
        const rows = []

        table.querySelectorAll('tr').forEach((tr, trNo) => {
          const trData = [null, null, null, null, null, null, null, null, null, null, null]

          let isSchemeRow = false
          if (tr.classList.contains('scheme-row')) isSchemeRow = true

          tr.querySelectorAll('td, th').forEach((td, i) => {
            let value = td.textContent.replace('₹', '')
            if (value === '') return
            value = !Number.isNaN(+value) ? Number(value) : value

            if (trNo === 1 && i > 6) trData[i + 2] = value
            else if (trNo === 1 && i > 8) trData[i + 3] = value
            else if (trNo === 2 && i <= 2) trData[i + 6] = value
            else if (trNo === 2 && i > 2) trData[i + 7] = value
            else if (isSchemeRow && i >= 1) trData[i + 9] = value
            else trData[i] = value
          })
          rows.push(trData)
          isSchemeRow = false
        })

        ws.addRows(rows)
        const ranges = [
          'A2:A3',
          'B2:B3',
          'C2:C3',
          'D2:D3',
          'E2:E3',
          'F2:F3',
          'G2:I2',
          'J2:J3',
          'K2:L2',
        ]
        ranges.forEach((range) => ws.mergeCells(range))
        ws.getRows(2, 2).forEach((row) => {
          row.font = { bold: true }
          row.alignment = { vertical: 'middle', horizontal: 'center' }
        })
        ws.name = table.closest('tr').previousElementSibling.querySelector('td').textContent
      })
    } else {
      const ws = workbook.addWorksheet('Sheet 1')
      const rows = [
        [
          'Name',
          'Opening Balance',
          '',
          'Inward',
          '',
          'Outward',
          '',
          '',
          '',
          '',
          '',
          'Closing Balance',
          '',
        ],
        ['', '', '', '', '', 'Billing', '', 'Scheme', '', 'Total', '', '', ''],
        [
          '',
          'Quantity',
          'Value',
          'Quantity',
          'Value',
          'Quantity',
          'Value',
          'Quantity',
          'Value',
          'Quantity',
          'Value',
          'Quantity',
          'Value',
        ],
      ]

      section.querySelectorAll('#stock_summary_data_table tbody tr').forEach((tr) => {
        const trData = []
        tr.querySelectorAll('td').forEach(async (td) => {
          const value = td.textContent.replace('₹', '')
          if (value === 0) return
          trData.push(!Number.isNaN(+value) ? Number(value) : value)
        })
        trData.pop()
        rows.push(trData)
      })

      ws.addRows(rows)
      const ranges = ['A1:A3', 'B1:C2', 'D1:E2', 'F1:K1', 'L1:M2', 'F2:G2', 'H2:I2', 'J2:K2']
      ranges.forEach((range) => ws.mergeCells(range))
      ws.getRows(1, 3).forEach((row) => {
        row.font = { bold: true }
        row.alignment = { vertical: 'middle', horizontal: 'center' }
      })
    }

    workbook.worksheets.forEach((ws) => {
      for (let i = 0; i < ws.columns.length; i++) {
        let dataMax = 0
        const column = ws.columns[i]

        for (let j = 1; j < column.values.length; j++) {
          const columnLength = column.values[j]?.length
          if (columnLength > dataMax) dataMax = columnLength
        }

        column.width = dataMax < 10 ? 10 : dataMax
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    )
    document.body.appendChild(a)
    a.download = 'stock-summary.xlsx'
    a.click()
    a.remove()
  })

  // Nested Rows
  section.querySelector('#stock_summary_data_table tbody').addEventListener('click', (event) => {
    const tr = event.target.closest('tr')
    if (!tr?.classList.contains('even') && !tr?.classList.contains('odd')) return
    const row = dataTable.row(tr)

    if (row.child.isShown()) {
      row.child.hide()
      tr.classList.remove('shown')
    } else {
      row.child(createNestedTable(tr)).show()
      tr.classList.add('shown')
    }
  })

  /*------------------------------------------
        Hide or Undo Table Rows
    ------------------------------------------*/
  let hiddenRows = []
  inventory.addEventListener('change', () => {
    hiddenRows = []
  })

  function hideRows() {
    section.querySelectorAll('#stock_summary_data_table tbody button').forEach((el) => {
      el.addEventListener('click', (event) => {
        hiddenRows.push(event.target.getAttribute('data-id'))

        displayTableData()
      })
    })
  }

  /*------------------------------------------
        Fetch Stocks, inwards, and outwards
    ------------------------------------------*/
  firstDate.addEventListener('input', fetchStocks)
  secondDate.addEventListener('input', fetchStocks)

  let vouchers = {}
  let inwards
  let outwards
  let closingStocks
  let openingStocks
  let groupInwards
  let groupOutwards
  let groupClosingStocks
  let groupOpeningStocks

  async function fetchStocks() {
    /*
     * If quantity === schemeQty2, It means it is a scheme item.
     * And scheme item doesn't have a billing qty
     * Logic -> billingQuantity = Number(el.quantity) === Number(el.schemeQty2) ? 0 : Number(el.quantity),
     */

    inwards = {}
    outwards = {}
    closingStocks = {}
    openingStocks = {}
    groupInwards = {}
    groupOutwards = {}
    groupClosingStocks = {}
    groupOpeningStocks = {}
    vouchers = {}

    // Inwards
    await ipcRenderer
      .invoke('fetch-all-purchase-items', {
        firstDate: firstDate.value,
        secondDate: secondDate.value,
      })
      .then((data) => {
        data.forEach((el) => {
          el.voucherType = 'Purchase'
          if (!(el.stockItemId in vouchers)) vouchers[el.stockItemId] = [el]
          else vouchers[el.stockItemId].push(el)

          if (!(el.stockItemId in inwards)) {
            inwards[el.stockItemId] = {
              quantity: Number(el.quantity),
              value: Number(el.quantity) * Number(el.rate),
            }
          } else {
            inwards[el.stockItemId].quantity += Number(el.quantity)
            inwards[el.stockItemId].value += Number(el.quantity) * Number(el.rate)
          }
        })
      })

    // Outwards
    await ipcRenderer
      .invoke('fetch-all-sale-items', { firstDate: firstDate.value, secondDate: secondDate.value })
      .then((data) => {
        data.forEach((el) => {
          el.voucherType = 'Sales'
          if (!(el.stockItemId in vouchers)) vouchers[el.stockItemId] = [el]
          else vouchers[el.stockItemId].push(el)

          const billingQuantity =
              Number(el.quantity) === Number(el.schemeQty2) ? 0 : Number(el.quantity),
            schemeQuantity = Number(el.schemeQty1) + Number(el.schemeQty2),
            totalQuantity = billingQuantity + schemeQuantity

          if (!(el.stockItemId in outwards)) {
            outwards[el.stockItemId] = {
              billingQuantity,
              billingValue: billingQuantity * Number(el.rate),
              schemeQuantity,
              schemeValue: schemeQuantity * Number(el.rate),
              totalQuantity,
              totalValue: totalQuantity * Number(el.rate),
            }
          } else {
            outwards[el.stockItemId].billingQuantity += billingQuantity
            outwards[el.stockItemId].billingValue += billingQuantity * Number(el.rate)
            outwards[el.stockItemId].schemeQuantity += schemeQuantity
            outwards[el.stockItemId].schemeValue += schemeQuantity * Number(el.rate)
            outwards[el.stockItemId].totalQuantity += totalQuantity
            outwards[el.stockItemId].totalValue += totalQuantity * Number(el.rate)
          }
        })
      })

    // Fetch latest stocks of all items
    const latestRates = {}
    await ipcRenderer.invoke('fetch-purchase-items-latest-price').then((data) => {
      if (data === 0) return

      data.forEach((el) => {
        latestRates[el.stockItemId] = el.rate
      })
    })

    // Closing Stocks
    await ipcRenderer
      .invoke('fetch-stocks', { firstDate: firstDate.value, secondDate: secondDate.value })
      .then((data) => {
        data.forEach((el) => {
          if (!(el.stockItemId in closingStocks)) {
            closingStocks[el.stockItemId] = {
              quantity: Number(el.quantity),
              createdAt: el.createdAt,
            }
          } else if (new Date(closingStocks[el.stockItemId].createdAt) < new Date(el.createdAt)) {
            closingStocks[el.stockItemId] = {
              quantity: Number(el.quantity),
              createdAt: el.createdAt,
            }
          }
        })

        // Compute values
        for (const key in closingStocks) {
          if (!(key in latestRates)) continue
          closingStocks[key].value = closingStocks[key].quantity * latestRates[key]
        }
      })

    // Opening Stocks
    await ipcRenderer
      .invoke('fetch-stocks', moment(firstDate.value).subtract(1, 'day').format('YYYY-MM-DD'))
      .then(async (data) => {
        if (data === 0) data = []
        let items = Object.keys(stockItemsObj)

        for (const el of data) {
          items = items.filter((el) => el !== el.stockItemId)
        }

        if (items.length > 0) {
          await ipcRenderer
            .invoke('fetch-stocks-by-items', items)
            .then((fetchedData) => (data = data.concat(fetchedData)))
        }

        data.forEach((el) => {
          if (!(el.stockItemId in openingStocks)) {
            openingStocks[el.stockItemId] = {
              quantity: Number(el.quantity),
              createdAt: el.createdAt,
            }
          } else if (new Date(openingStocks[el.stockItemId].createdAt) < new Date(el.createdAt)) {
            openingStocks[el.stockItemId] = {
              quantity: Number(el.quantity),
              createdAt: el.createdAt,
            }
          }
        })

        // Compute values
        for (const key in openingStocks) {
          if (!(key in latestRates)) continue
          openingStocks[key].value = openingStocks[key].quantity * latestRates[key]
        }
      })

    /* --- Compute stocks by Groups ---*/
    for (const key in stockItemsObj) {
      const groupId = stockItemsObj[key].stockGroup.id
      // Inwards
      if (!(groupId in groupInwards)) {
        groupInwards[groupId] = {
          quantity: inwards[key]?.quantity || 0,
          value: inwards[key]?.value || 0,
        }
      } else {
        groupInwards[groupId].quantity += inwards[key]?.quantity || 0
        groupInwards[groupId].value += inwards[key]?.value || 0
      }

      // Outwards
      if (!(groupId in groupOutwards)) {
        groupOutwards[groupId] = {
          billingQuantity: outwards[key]?.billingQuantity || 0,
          billingValue: outwards[key]?.billingValue || 0,
          schemeQuantity: outwards[key]?.schemeQuantity || 0,
          schemeValue: outwards[key]?.schemeValue || 0,
          totalQuantity: outwards[key]?.totalQuantity || 0,
          totalValue: outwards[key]?.totalValue || 0,
        }
      } else {
        groupOutwards[groupId].billingQuantity += outwards[key]?.billingQuantity || 0
        groupOutwards[groupId].billingValue += outwards[key]?.billingValue || 0
        groupOutwards[groupId].schemeQuantity += outwards[key]?.schemeQuantity || 0
        groupOutwards[groupId].schemeValue += outwards[key]?.schemeValue || 0
        groupOutwards[groupId].totalQuantity += outwards[key]?.totalQuantity || 0
        groupOutwards[groupId].totalValue += outwards[key]?.totalValue || 0
      }

      // Opening stocks
      if (!(groupId in groupOpeningStocks)) {
        groupOpeningStocks[groupId] = {
          quantity: openingStocks[key]?.quantity || 0,
          value: openingStocks[key]?.value || 0,
        }
      } else {
        groupOpeningStocks[groupId].quantity += openingStocks[key]?.quantity || 0
        groupOpeningStocks[groupId].value += openingStocks[key]?.value || 0
      }

      // Closing stocks
      if (!(groupId in groupClosingStocks)) {
        groupClosingStocks[groupId] = {
          quantity: closingStocks[key]?.quantity || 0,
          value: closingStocks[key]?.value || 0,
        }
      } else {
        groupClosingStocks[groupId].quantity += closingStocks[key]?.quantity || 0
        groupClosingStocks[groupId].value += closingStocks[key]?.value || 0
      }
    }

    displayTableData()
  }

  /*------------------------------------------
        Display Table Data
    ------------------------------------------*/
  inventory.addEventListener('change', displayTableData)

  async function displayTableData() {
    const rows = []

    if (inventory.value === 'stock-items') {
      outerLoop: for (const key in stockItemsObj) {
        for (const row of hiddenRows) {
          if (row == key) continue outerLoop
        }

        const row = {
          name: stockItemsObj[key].name,
          openingQuantity: openingStocks[key]?.quantity?.toFixed(2) || 0,
          openingValue: openingStocks[key]?.value ? `${openingStocks[key].value.toFixed(2)} ₹` : '',
          inwardQuantity: inwards[key]?.quantity?.toFixed(2) || 0,
          inwardValue: `${inwards[key]?.value?.toFixed(2) || '0.00'} ₹`,
          billingOutwardQuantity: outwards[key]?.billingQuantity?.toFixed(2) || 0,
          billingOutwardValue: `${outwards[key]?.billingValue?.toFixed(2) || '0.00'} ₹`,
          schemeOutwardQuantity: outwards[key]?.schemeQuantity?.toFixed(2) || 0,
          schemeOutwardValue: `${outwards[key]?.schemeValue?.toFixed(2) || '0.00'} ₹`,
          totalOutwardQuantity: outwards[key]?.totalQuantity?.toFixed(2) || 0,
          totalOutwardValue: `${outwards[key]?.totalValue?.toFixed(2) || '0.00'} ₹`,
          closingQuantity: closingStocks[key]?.quantity?.toFixed(2) || 0,
          closingValue: closingStocks[key]?.value ? `${closingStocks[key].value.toFixed(2)} ₹` : '',
          actions: `<button class="button" data-id="${key}">Hide</button>`,
        }
        rows.push(row)
      }
    } else {
      outerLoop: for (const key in stockGroupsObj) {
        for (const row of hiddenRows) {
          if (row == key) continue outerLoop
        }

        const row = {
          name: stockGroupsObj[key].name,
          openingQuantity: groupOpeningStocks[key]?.quantity?.toFixed(2) || 0,
          openingValue: groupOpeningStocks[key]?.value
            ? `${groupOpeningStocks[key].value.toFixed(2)} ₹`
            : '',
          inwardQuantity: groupInwards[key]?.quantity?.toFixed(2) || 0,
          inwardValue: `${groupInwards[key]?.value?.toFixed(2) || '0.00'} ₹`,
          billingOutwardQuantity: groupOutwards[key]?.billingQuantity?.toFixed(2) || 0,
          billingOutwardValue: `${groupOutwards[key]?.billingValue?.toFixed(2) || '0.00'} ₹`,
          schemeOutwardQuantity: groupOutwards[key]?.schemeQuantity?.toFixed(2) || 0,
          schemeOutwardValue: `${groupOutwards[key]?.schemeValue?.toFixed(2) || '0.00'} ₹`,
          totalOutwardQuantity: groupOutwards[key]?.totalQuantity?.toFixed(2) || 0,
          totalOutwardValue: `${groupOutwards[key]?.totalValue?.toFixed(2) || '0.00'} ₹`,
          closingQuantity: groupClosingStocks[key]?.quantity?.toFixed(2) || 0,
          closingValue: groupClosingStocks[key]?.value
            ? `${groupClosingStocks[key].value.toFixed(2)} ₹`
            : '',
          actions: `<button class="button" data-id="${key}">Hide</button>`,
        }
        rows.push(row)
      }
    }

    dataTable.clear().draw()
    dataTable.rows.add(rows).draw()
    hideRows()
  }

  function createNestedTable(selectedRow) {
    /*
     * If quantity === schemeQty2, It means it is a scheme item.
     * And scheme item doesn't have a billing qty
     * Logic -> billingQuantity = Number(el.quantity) === Number(el.schemeQty2) ? 0 : Number(el.quantity),
     */

    let rows = ''
    const stockItemId = selectedRow.querySelector('button').getAttribute('data-id')
    const openingStock = Number(selectedRow.querySelector('td:nth-child(2)').textContent)
    const item = selectedRow.querySelector('td:nth-child(1)').textContent

    const OpeningStockRow = `<td>${moment(firstDate.value).format('DD.MM.YYYY')}</td>
            <td colspan="10" style="text-align: right">Opening Stock:</td>
            <td>${openingStock}</td>`

    for (const key in vouchers) {
      let closingStock = openingStock

      vouchers[key].forEach((el) => {
        if (el.stockItemId == stockItemId) {
          let voucherId
          let ledgerId
          let inwardQty = ''
          let billingOutwardQty = ''
          let schemeOutwardQty = ''
          let totalOutwardQty = ''
          let schemeItems = []

          if (el.voucherType === 'Sales') {
            voucherId = el.sale.id
            ledgerId = el.sale.ledgerId
            billingOutwardQty =
              Number(el.quantity) === Number(el.schemeQty2) ? 0 : Number(el.quantity)
            schemeOutwardQty = Number(el.schemeQty1) + Number(el.schemeQty2)
            totalOutwardQty = billingOutwardQty + schemeOutwardQty
            closingStock -= Number(el.totalOutwardQty)
            schemeItems = el.schemeDesc.split(',')

            schemeItems.forEach((el, i) => {
              schemeItems[i] = {
                itemName: el.split('/')[0],
                qty: el.split('/')[1]?.replace(/\D/g, ''),
              }
            })
          }
          if (el.voucherType === 'Purchase') {
            voucherId = el.purchase.supplierInvNo
            ledgerId = el.purchase.ledgerId
            inwardQty = Number(el.quantity)
            closingStock += Number(el.quantity)
          }

          closingStock = Number(closingStock.toFixed(2))
          rows += `<tr>
                        <td>${item}</td>
                        <td>${moment(el.createdAt).format('DD.MM.YYYY')}</td>               
                        <td>${voucherId}</td>               
                        <td style="text-align: left">${
                          ledgersObj[ledgerId].name
                        }</td>               
                        <td>${el.voucherType}</td>               
                        <td>${inwardQty}</td>               
                        <td>${billingOutwardQty > 0 ? billingOutwardQty : ''}</td>               
                        <td>${schemeOutwardQty}</td>               
                        <td>${totalOutwardQty}</td>                                  
                        <td>${closingStock}</td>               
                        <td>${schemeItems[0]?.itemName || ''}</td>               
                        <td>${schemeItems[0]?.qty || ''}</td>               
                    </tr>`

          if (schemeItems.length > 1) {
            for (let i = 1; i < schemeItems.length; i++) {
              rows += `<tr class="scheme-row">                                                        
                            <td colspan="10"></td>               
                            <td>${schemeItems[i]?.itemName || ''}</td>               
                            <td>${schemeItems[i]?.qty || ''}</td>               
                        </tr>`
            }
          }
        }
      })
    }

    return `<table cellpadding="0" cellspacing="0">
            <thead>
                <tr>${OpeningStockRow}</tr>                
                <tr>
                    <th rowspan="2">Item</th>
                    <th rowspan="2">Date</th>
                    <th rowspan="2">Voucher No.</th>
                    <th rowspan="2">Perticular</th>
                    <th rowspan="2" >Voucher Type</th>
                    <th rowspan="2">Inward Qty.</th>
                    <th colspan="3">Outwards Qty.</th>
                    <th rowspan="2">Closing Qty.</th>
                    <th colspan="2">Scheme Desc.</th>
                </tr>
                <tr>
                    <th>Billing</th>
                    <th>Scheme</th>
                    <th>Total</th>
                    <th>Item</th>
                    <th>Qty</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`
  }

  /*= ===================================================================================== */
  async function stockSummary() {
    if (!section.classList.contains('show')) return

    /*------------------------------------------
      Fetch all Items, ledgers
    ------------------------------------------*/
    await ipcRenderer.invoke('fetch-all-stock-items').then((data) => {
      data.forEach((el) => {
        stockItemsObj[el.id] = el
        if (!(el.stockGroup.id in stockGroupsObj)) stockGroupsObj[el.stockGroup.id] = el.stockGroup
      })
    })

    await ipcRenderer.invoke('fetch-all-ledgers').then((data) => {
      data.forEach((el) => {
        ledgersObj[el.id] = el
      })
    })

    fetchStocks()

    /*------------------------------------------
      Mousetrap
    ------------------------------------------*/
    // Unbind shortcuts
    MouseTrap.unbind(['alt+u', 'alt+f1'])

    // Toggle nested row
    Mousetrap.bind('alt+u', () => {
      hiddenRows.pop()
      displayTableData()
    })

    // Toggle all nested rows at once
    Mousetrap.bind('alt+f1', () => {
      section.querySelectorAll('#stock_summary_data_table tbody tr').forEach(async (el) => {
        el.click()
      })
    })
  }
}
