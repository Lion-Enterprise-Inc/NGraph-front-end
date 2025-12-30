import '../index.css'
import '../App.css'
import { AppProvider } from '../components/AppProvider'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div id="root">
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </div>
  )
}