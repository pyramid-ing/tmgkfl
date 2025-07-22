import { SettingOutlined } from '@ant-design/icons'
import React from 'react'
import PageContainer from '../components/shared/PageContainer'
import SettingsTabs from '../features/settings/SettingsTabs'
import { PageTitle } from '../hooks/usePageTitle'

const Settings: React.FC = () => {
  return (
    <>
      <PageTitle titleKey="SETTINGS" />
      <PageContainer
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            설정
          </span>
        }
        maxWidth="1000px"
        centered
      >
        <SettingsTabs />
      </PageContainer>
    </>
  )
}

export default Settings
