import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

import { HashRouter } from 'react-router-dom'
import Styl from 'react-styl'

import { StateProvider } from './state'
import App from './pages/App'

require('normalize.css/normalize.css')
require('@blueprintjs/core/lib/css/blueprint.css')
require('@blueprintjs/table/lib/css/table.css')
require('@blueprintjs/icons/lib/css/blueprint-icons.css')
require('@blueprintjs/datetime/lib/css/blueprint-datetime.css')

if (process.env.NODE_ENV === 'production') {
  try {
    require('../public/app.css')
  } catch (e) {
    console.warn('No built CSS found')
  }
}

const Providers = () => {
  return (
    <StateProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </StateProvider>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))

Styl.addStylesheet()
