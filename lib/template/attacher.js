const forEach = Array.prototype.forEach
const csses = [<% cssSources.forEach((cssSource) => { %>
  {
    ns: '<%= cssSource.ns %>',
    locales: require('<%= cssSource.path %>'),
  },<% }) %>
]

csses.forEach((css) => {
  const ns = css.ns
  const locals = css.locales
  Object.keys(locals).forEach((name) => {
    const selector = '.' + ns + '\\.' + name
    const elements = document.querySelectorAll(selector)
    const oldName = ns + '.' + name
    const newName = locals[name]
    forEach.call(elements, (element) => {
      const cls = element.getAttribute('class').replace(oldName, newName)
      element.setAttribute('class', cls)
    })
  })
})
