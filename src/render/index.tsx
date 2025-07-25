import { StyleProvider } from '@ant-design/cssinjs'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { HashRouter as Router } from 'react-router-dom'
import App from './pages/app'
import './styles/global.css'

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
root.render(
  <HelmetProvider>
    <StyleProvider hashPriority="high">
      <Router>
        <App />
      </Router>
    </StyleProvider>
  </HelmetProvider>,
)
