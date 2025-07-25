import { Layout } from 'antd'
import React, { useCallback, useEffect } from 'react'
import styled from 'styled-components'
import Card from 'antd/es/card/Card'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { apiClient } from '@render/api'

const { Content } = Layout

const StyledLayout = styled(Layout)`
  width: 100%;
  min-height: 100vh;
  height: 100vh;
`

const StyledContent = styled(Content)`
  margin: 0;
  padding: 0;
  background: #f5f5f5;
  min-height: 100vh;
  height: 100vh;
  overflow: auto;
`

interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <StyledLayout>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <StyledContent>{children}</StyledContent>
      </Layout>
    </StyledLayout>
  )
}

export default AppLayout
