import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import PostJobPage from './PostJob'
import SettingsPage from './Settings'
import ThreadsPage from './Threads'

const App: React.FC = () => {
  useEffect(() => {
    // 백엔드 포트 확인
    window.electronAPI
      .getBackendPort()
      .then(port => {})
      .catch(error => {
        console.error('백엔드 포트 확인 실패:', error)
      })
  }, [])

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ThreadsPage />} />
        <Route path="/post-jobs" element={<PostJobPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  )
}

export default App
