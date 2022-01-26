const sidebarMenu = document.querySelector('#sidebar-menu')
const header = sidebarMenu.querySelector('.header')
const menuTitle = header.querySelector('.menu-title')
const LIs = sidebarMenu.querySelectorAll('li')
const ULs = sidebarMenu.querySelectorAll('ul')
const main = document.querySelector('#content')

ULs.forEach((ul, index) => {
  if (index === 0) return
  ul.className = 'hide'
})

LIs.forEach((li) => {
  if (li.querySelector('ul')) li.setAttribute('data-has-child-ul', true)

  li.addEventListener('click', (event) => {
    const ul = event.currentTarget.querySelector('ul')
    if (ul === null) return

    const title = event.currentTarget.querySelector('span').textContent
    ul.className = 'show'
    header.querySelector('.arrow-left').style.display = 'block'
    menuTitle.textContent = title

    event.stopPropagation()
  })
})

header.addEventListener('click', () => {
  LIs.forEach((li) => {
    if (
      li.querySelector('span') === null
      || li.querySelector('span').textContent !== menuTitle.textContent
    ) return

    li.querySelector('ul').className = 'hide'

    if (li.closest('ul').previousElementSibling.tagName !== 'SPAN') {
      header.querySelector('.arrow-left').style.display = 'none'
      menuTitle.textContent = 'Gateway of Beejak'
      return
    }

    menuTitle.textContent = li.closest('ul').previousElementSibling.textContent
  })
})

// Routes
LIs.forEach((li) => {
  if (li.querySelector('ul') !== null) return
  li.addEventListener('click', (event) => {
    const sectionID = event.currentTarget.getAttribute('data-id')
    main.querySelector('section.show')?.classList.remove('show')
    main.querySelector(`section#${sectionID}`)?.classList.add('show')

    sidebarMenu.querySelector('.active')?.classList.remove('active')
    event.currentTarget.className = 'active'
  })
})
