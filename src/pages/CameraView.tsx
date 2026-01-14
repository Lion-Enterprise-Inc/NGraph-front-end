'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TranslateIcon from '../components/icons/TranslateIcon'
import ChatGalleryIcon from '../components/icons/ChatGalleryIcon'
import RefreshIcon from '../components/icons/RefreshIcon'
import { useAppContext } from '../components/AppProvider'
import { getUiCopy } from '../i18n/uiCopy'

type CameraViewProps = {
  language?: string
}

function CloseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export default function CameraView({ language = 'ja' }: CameraViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantSlug = searchParams?.get('restaurant')
  const { language: contextLanguage, setPendingAttachment } = useAppContext()
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const activeLanguage = contextLanguage ?? language ?? 'ja'
  const copy = getUiCopy(activeLanguage)

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
  }

  const handleGallerySelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPendingAttachment({ file, source: 'library' })
      const captureUrl = restaurantSlug 
        ? `/capture?restaurant=${restaurantSlug}` 
        : '/capture?from=explore'
      router.push(captureUrl)
    }
    event.target.value = ''
  }

  const handleCapture = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height) return

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, width, height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setPendingAttachment({ file, source: 'camera' })
      const captureUrl = restaurantSlug 
        ? `/capture?restaurant=${restaurantSlug}` 
        : '/capture?from=explore'
      router.push(captureUrl)
    }, 'image/jpeg', 0.92)
  }

  const startCamera = async () => {
    console.log('startCamera called, facingMode:', facingMode)
    setIsLoading(true)
    setCameraError(false)
    
    // Check if we're in a secure context
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.log('Not in secure context, camera may not work')
      console.log('Protocol:', window.location.protocol)
      console.log('Hostname:', window.location.hostname)
      
      // For development/testing, allow http on localhost
      if (window.location.protocol === 'http:' && 
          (window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('.local'))) {
        console.log('Allowing camera on localhost http for development')
      } else {
        console.log('Camera requires HTTPS. Current protocol:', window.location.protocol)
        setCameraError(true)
        setIsLoading(false)
        return null
      }
    }
    
    // Check if MediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('MediaDevices API not available')
      setCameraError(true)
      setIsLoading(false)
      return null
    }
    
    // Check camera permissions if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log('Camera permission status:', permissionStatus.state)
        if (permissionStatus.state === 'denied') {
          console.log('Camera permission denied')
          setCameraError(true)
          setIsLoading(false)
          return null
        }
      } catch (permError) {
        console.log('Permission query failed:', permError)
      }
    }
    
    // Add a small delay to prevent showing error too quickly
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Camera loading timeout reached')
        setIsLoading(false)
        setCameraError(true)
      }
    }, 8000) // 8 second timeout
    
    try {
      // Stop any existing stream
      if (streamRef.current) {
        console.log('Stopping existing stream')
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Try with preferred facing mode first
      let constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      }

      console.log('Requesting camera with constraints:', constraints)
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('Camera access granted with preferred constraints')
      } catch (firstError) {
        console.log('Preferred camera failed, trying any camera:', firstError)
        // If preferred facing mode fails, try with any camera
        constraints = {
          video: true,
          audio: false,
        }
        console.log('Requesting camera with fallback constraints:', constraints)
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('Camera access granted with fallback constraints')
      }
      
      clearTimeout(timeoutId)
      streamRef.current = stream
      
      if (videoRef.current) {
        console.log('Setting video srcObject')
        videoRef.current.srcObject = stream
        console.log('Video element:', videoRef.current)
        console.log('Stream tracks:', stream.getTracks())
        await videoRef.current.play()
        console.log('Video playing successfully, video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight)
      }
      setCameraError(false)
      setIsLoading(false)
      return stream
    } catch (error) {
      clearTimeout(timeoutId)
      console.log('camera_error:', error)
      setCameraError(true)
      setIsLoading(false)
      return null
    }
  }

  const flipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  useEffect(() => {
    const initCamera = async () => {
      await startCamera()
    }

    initCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [facingMode])

  return (
    <div className="camera-view">
      <div className="camera-preview">
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          autoPlay
        />
        {isLoading && (
          <div className="camera-fallback">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #ffffff', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Loading camera...
            </div>
          </div>
        )}
        {cameraError && !isLoading && (
          <div className="camera-fallback" onClick={() => startCamera()}>
            <div style={{ textAlign: 'center' }}>
              <div>{copy.camera.unavailable}</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                {!window.isSecureContext && window.location.protocol !== 'https:' 
                  ? 'Camera requires HTTPS. Please use a secure connection.'
                  : 'Tap to retry'
                }
              </div>
              <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.6 }}>
                Protocol: {window.location.protocol}, Secure: {window.isSecureContext ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}
        <div className="camera-overlay">
          <button
            className="icon-button light"
            type="button"
            aria-label={copy.camera.close}
            onClick={() => router.back()}
          >
            <CloseIcon />
          </button>
          <div className="camera-title"></div>
          <button className="icon-button light" type="button" aria-label={copy.camera.translate}>
            <TranslateIcon />
          </button>
        </div>
      </div>

      <div className="camera-bottom">
        <button
          className="icon-button light"
          type="button"
          aria-label={copy.camera.openGallery}
          onClick={handleGalleryClick}
        >
          <ChatGalleryIcon />
        </button>
        <button
          className="shutter-button"
          type="button"
          aria-label={copy.camera.capturePhoto}
          onClick={handleCapture}
        >
          <span className="shutter-inner" />
        </button>
        <button className="icon-button light" type="button" aria-label={copy.camera.flipCamera} onClick={flipCamera}>
          <RefreshIcon />
        </button>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleGallerySelect}
      />
    </div>
  )
}
