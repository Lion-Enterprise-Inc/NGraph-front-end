'use client'

import { useRouter } from 'next/navigation'
import MenuSimpleIcon from '../components/icons/MenuSimpleIcon'
import RefreshIcon from '../components/icons/RefreshIcon'
import TranslateIcon from '../components/icons/TranslateIcon'
import ChatCameraIcon from '../components/icons/ChatCameraIcon'
import ChatGalleryIcon from '../components/icons/ChatGalleryIcon'
import SendIcon from '../components/icons/SendIcon'
import CameraBlueIcon from '../components/icons/CameraBlueIcon'
import { useAppContext } from '../components/AppProvider'
import { getUiCopy } from '../i18n/uiCopy'

export default function ExplorePage() {
  const router = useRouter()
  const { language } = useAppContext()
  const copy = getUiCopy(language)

  return (
    <div className="page explore-page">
      <div className="browser-shell">
        <button
          className="icon-button ghost"
          type="button"
          aria-label={copy.common.back}
          onClick={() => router.push('/home')}
        >
          <MenuSimpleIcon />
        </button>
        <div className="browser-pill">
          <span className="browser-dot" />
          <span className="browser-address">ngraph.me</span>
        </div>
        <button className="icon-button ghost" type="button" aria-label={copy.common.reload}>
          <RefreshIcon />
        </button>
      </div>

      <header className="site-bar">
        <div className="site-title">{copy.explore.title}</div>
        <button className="icon-button ghost" type="button" aria-label={copy.common.translate}>
          <TranslateIcon />
        </button>
      </header>

      <main className="explore-hero">
        <h1 className="explore-title">{copy.explore.title}</h1>
        <p className="explore-sub">{copy.explore.subtitle}</p>

        <button
          className="hero-camera"
          type="button"
          aria-label={copy.common.openCamera}
          onClick={() => router.push('/capture?from=explore')}
        >
          <CameraBlueIcon />
        </button>
      </main>

      <div className="chat-composer">
        <div className="chat-icon-group">
          <button className="chat-icon" type="button" aria-label={copy.chat.camera}>
            <ChatCameraIcon />
          </button>
          <button className="chat-icon" type="button" aria-label={copy.chat.gallery}>
            <ChatGalleryIcon />
          </button>
        </div>
        <input
          className="chat-input"
          placeholder={copy.explore.placeholder}
          aria-label={copy.chat.messageInput}
        />
        <button className="chat-send primary" type="button" aria-label={copy.chat.sendMessage}>
          <SendIcon />
        </button>
      </div>
    </div>
  )
}
