import { Tabs } from 'antd'
import React, { useState } from 'react'
import AppSettingsForm from './AppSettingsForm'

const SettingsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('app')

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      type="card"
      size="large"
      items={[
        {
          key: 'app',
          label: '앱 설정',
          children: <AppSettingsForm />,
        },
      ]}
    />
  )
}

export default SettingsTabs
