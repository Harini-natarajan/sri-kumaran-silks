import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ShopProvider } from './context/ShopContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { SocketProvider } from './context/SocketContext.jsx'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ThemeProvider>
        <SocketProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </SocketProvider>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>,


)

