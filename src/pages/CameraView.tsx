'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
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
  const { language: contextLanguage, setPendingAttachment } = useAppContext()
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const activeLanguage = contextLanguage ?? language ?? 'ja'
  const copy = getUiCopy(activeLanguage)

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
  }

  const handleGallerySelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPendingAttachment({ file, source: 'library' })
      router.push('/capture?from=explore')
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
      router.push('/capture?from=explore')
    }, 'image/jpeg', 0.92)
  }

  useEffect(() => {
    let stream: MediaStream | null = null
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (error) {
        console.log('camera_error', error)
        setCameraError(true)
      }
    }

    startCamera()

    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

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
        {cameraError && (
          <div className="camera-fallback">{copy.camera.unavailable}</div>
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
        <button className="icon-button light" type="button" aria-label={copy.camera.flipCamera}>
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
