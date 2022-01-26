const Chart = require('chart.js')
const flatpicker = require('flatpickr')
const MonthSelectPlugin = require('flatpickr/dist/plugins/monthSelect/index')
const moment = require('moment')
const { ipcRenderer } = require('electron')

const section = document.querySelector('section#home')
new MutationObserver(home).observe(section, { attributeFilter: ['class'] })

// Get Elements
const SPLineChartCanvas = section.querySelector('#sale-purchase-line-chart')
const date = section.querySelector('input[name="month"]')

/*--------------------------------------------
  Monthly Sale Purchase
---------------------------------------------*/
// Init Flatpicker
flatpicker('section#home input[name="month"]', {
  altInput: true,
  defaultDate: new Date(),
  plugins: [new MonthSelectPlugin({ shorthand: true, dateFormat: 'Y-m', altFormat: 'F Y' })],
})

// Init SP Line Chart
let SPLineChart
;(async () => {
  const { daysRange, purchase, sales } = await fetchSalePurchase()

  SPLineChart = new Chart(SPLineChartCanvas, {
    type: 'line',
    data: {
      labels: daysRange,
      datasets: [
        {
          data: purchase,
          label: 'Purchase',
          borderColor: '#FF6F8E',
          backgroundColor: '#FFB1C1',
        },
        {
          data: sales,
          label: 'Sales',
          borderColor: '#36A2EB',
          backgroundColor: '#9AD0F5',
        },
      ],
    },
    options: {
      scales: {
        y: {
          ticks: {
            callback(value) {
              return `₹ ${value}`
            },
          },
        },
      },

      plugins: {
        tooltip: {
          cornerRadius: 0,
          backgroundColor: '#e4fbff',
          borderWidth: 1,
          borderColor: '#b9b9ac',
          bodyColor: '#000',
          titleColor: '#000',
        },
      },
    },
  })
})()

// Update SP Line Chart
date.addEventListener('input', updateSPLineChart)

async function updateSPLineChart() {
  const { daysRange, purchase, sales } = await fetchSalePurchase()
  SPLineChart.data.labels = daysRange
  SPLineChart.data.datasets[0].data = purchase
  SPLineChart.data.datasets[1].data = sales
  SPLineChart.update()
}

// Helper function
async function fetchSalePurchase() {
  // Create days range
  const daysRange = []
  const noOfDays = moment(date.value, 'YYYY-MM').daysInMonth()
  for (let i = 0; i < noOfDays; i++) {
    daysRange.push(`${moment(date.value, 'YYYY-MM').format('MMM')} ${i + 1}`)
  }

  // Fetch sales and purchases
  const purchase = []
  const sales = []

  for (let i = 0; i < noOfDays; i++) {
    purchase.push(0)
    sales.push(0)
  }

  await ipcRenderer
    .invoke('fetch-all-purchases', {
      firstDate: `${date.value}-01`,
      secondDate: `${date.value}-${noOfDays}`,
    })
    .then((data) => {
      data.forEach((el) => {
        purchase[new Date(el.date).getDate()] = el.tAmount
      })
    })

  await ipcRenderer
    .invoke('fetch-all-sales', {
      firstDate: `${date.value}-01`,
      secondDate: `${date.value}-${noOfDays}`,
    })
    .then((data) => {
      data.forEach((el) => {
        sales[new Date(el.date).getDate()] = el.tAmount
      })
    })

  return { daysRange, purchase, sales }
}

/* <================================================================================> */
function home() {
  updateSPLineChart()
}
