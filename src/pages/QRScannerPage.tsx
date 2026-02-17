'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, QrCode, Flashlight, FlashlightOff, SwitchCamera } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import { getUiCopy, type LanguageCode } from '../i18n/uiCopy'

type QRScannerPageProps = {
  language?: LanguageCode
  onClose?: () => void
}

export default function QRScannerPage({ language = 'ja', onClose }: QRScannerPageProps) {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const copy = getUiCopy(language)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop()
        }
      } catch (err) {
        // ignore stop errors
      }
    }
  }, [])

  const handleQRCodeSuccess = useCallback(async (decodedText: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setScanResult(decodedText)
    
    await stopScanner()
    
    // Clean up the decoded text - remove any whitespace or newlines
    const cleanText = decodedText.trim()
    
    // Parse the URL to extract restaurant parameter
    try {
      // Try to parse as a full URL
      let url: URL
      try {
        url = new URL(cleanText)
      } catch (urlError) {
        // If it's not a full URL, try adding the base URL
        if (cleanText.startsWith('/')) {
          url = new URL(`https://app.ngraph.jp${cleanText}`)
        } else if (cleanText.includes('restaurant=')) {
          url = new URL(`https://app.ngraph.jp/${cleanText}`)
        } else {
          throw urlError
        }
      }
      
      const restaurantSlug = url.searchParams.get('restaurant')
      
      if (restaurantSlug) {
        // Redirect to Go page (home) with restaurant parameter, then user clicks Go to chat
        setTimeout(() => {
          router.push(`/?restaurant=${restaurantSlug}&source=qr`)
        }, 500)
      } else {
        setError(copy.qrScanner?.invalidQR || 'Invalid QR code. No restaurant found.')
        setIsProcessing(false)
        setScanResult(null)
      }
    } catch (err) {
      // If URL parsing fails, check if it contains restaurant info in a different format
      if (cleanText.includes('restaurant=')) {
        const match = cleanText.match(/restaurant=([^&\s]+)/)
        if (match && match[1]) {
          setTimeout(() => {
            router.push(`/?restaurant=${match[1]}&source=qr`)
          }, 500)
          return
        }
      }
      setError(copy.qrScanner?.invalidQR || 'Invalid QR code format.')
      setIsProcessing(false)
      setScanResult(null)
    }
  }, [isProcessing, router, stopScanner, copy.qrScanner])

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return
    
    setError(null)
    setIsScanning(false)
    
    try {
      // Clean up existing scanner
      if (scannerRef.current) {
        await stopScanner()
        scannerRef.current = null
      }

      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        { facingMode },
        config,
        handleQRCodeSuccess,
        () => {}
      )
      
      setIsScanning(true)
    } catch (err) {
      setError(copy.qrScanner?.cameraError || 'Unable to access camera. Please check permissions.')
      setIsScanning(false)
    }
  }, [facingMode, handleQRCodeSuccess, stopScanner, copy.qrScanner])

  const toggleTorch = async () => {
    if (!scannerRef.current) return
    
    try {
      const newTorchState = !torchOn
      // Note: torch control may not be available on all devices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const track = scannerRef.current.getRunningTrackCameraCapabilities?.() as any
      if (track?.torchFeature?.isSupported?.()) {
        await track.torchFeature.apply(newTorchState)
        setTorchOn(newTorchState)
      }
    } catch (err) {
      // torch not supported
    }
  }

  const switchCamera = async () => {
    await stopScanner()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const handleClose = () => {
    stopScanner()
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner()
    }, 100)

    return () => {
      clearTimeout(timer)
      stopScanner()
    }
  }, [facingMode])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanner()
      }
    }
  }, [stopScanner])

  return (
    <div className="qr-scanner-page">
      {/* Header */}
      <div className="qr-scanner-header">
        <button
          className="qr-scanner-close"
          onClick={handleClose}
          aria-label={copy.qrScanner?.close || 'Close'}
        >
          <X size={24} />
        </button>
        <h1 className="qr-scanner-title">{copy.qrScanner?.title || 'Scan QR Code'}</h1>
        <div className="qr-scanner-header-spacer" />
      </div>

      {/* Scanner Area */}
      <div className="qr-scanner-body">
        <div className="qr-scanner-container" ref={containerRef}>
          <div id="qr-reader" className="qr-reader" />
          
          {/* Scanning Frame Overlay */}
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-frame">
              <div className="qr-frame-corner qr-frame-corner-tl" />
              <div className="qr-frame-corner qr-frame-corner-tr" />
              <div className="qr-frame-corner qr-frame-corner-bl" />
              <div className="qr-frame-corner qr-frame-corner-br" />
              {isScanning && <div className="qr-scanner-line" />}
            </div>
          </div>

          {/* Loading State */}
          {!isScanning && !error && (
            <div className="qr-scanner-loading">
              <div className="qr-scanner-spinner" />
              <p>{copy.qrScanner?.loading || 'Starting camera...'}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="qr-scanner-error">
              <QrCode size={48} />
              <p>{error}</p>
              <button className="qr-scanner-retry" onClick={startScanner}>
                {copy.qrScanner?.retry || 'Retry'}
              </button>
            </div>
          )}

          {/* Success State */}
          {scanResult && (
            <div className="qr-scanner-success">
              <div className="qr-scanner-success-icon">✓</div>
              <p className="qr-scanner-success-title">Congratulations!</p>
              <p className="qr-scanner-success-message">Restaurant found successfully</p>
              <p className="qr-scanner-redirecting">{copy.qrScanner?.redirecting || 'Redirecting to restaurant...'}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="qr-scanner-instructions">
          <QrCode size={20} />
          <p>{copy.qrScanner?.instructions || 'Point your camera at the restaurant QR code'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="qr-scanner-controls">
        <button
          className="qr-scanner-control-btn"
          onClick={toggleTorch}
          aria-label={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
        >
          {torchOn ? <FlashlightOff size={24} /> : <Flashlight size={24} />}
          <span>{torchOn ? (copy.qrScanner?.torchOff || 'Light Off') : (copy.qrScanner?.torchOn || 'Light On')}</span>
        </button>
        <button
          className="qr-scanner-control-btn"
          onClick={switchCamera}
          aria-label="Switch camera"
        >
          <SwitchCamera size={24} />
          <span>{copy.qrScanner?.switchCamera || 'Switch'}</span>
        </button>
      </div>
    </div>
  )
}
