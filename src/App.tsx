import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout/Layout'
import ToastContainer from './components/UI/ToastContainer'

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
