'use client'

import CameraView from '../../pages/CameraView'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const { language } = useAppContext()
  return <CameraView language={language} />
}
