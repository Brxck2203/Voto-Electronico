import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { RuntimeErrorBoundary } from './components/RuntimeErrorBoundary.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><RuntimeErrorBoundary><App /></RuntimeErrorBoundary></React.StrictMode>
)
