import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout/Layout'
import ToastContainer from './components/UI/ToastContainer'
import './styles/style_base.css'
import './styles/style_color.css'
import './styles/style_groups.css'
import './styles/style_roles.css'
import './styles/style.css'
import './styles/canvas-controls.css'
import './App.css'

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Layout />
        <ToastContainer />
      </ToastProvider>
    </AppProvider>
  )
}

export default App
