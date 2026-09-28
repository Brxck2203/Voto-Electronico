import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { VotingProvider } from './state/VotingContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VotingProvider>
      <App />
    </VotingProvider>
  </React.StrictMode>,
)
