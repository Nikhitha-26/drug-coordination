
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from 'react-oidc-context'
import App from './app/App'
import './styles.css'

const cognitoAuthConfig = {
  authority:
    'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_Goidh0NAC',
  client_id: '3n25jvuublb7tnf46844uqtbdi',
  redirect_uri: window.location.origin + '/',
  response_type: 'code',
  scope: 'openid email profile',
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
