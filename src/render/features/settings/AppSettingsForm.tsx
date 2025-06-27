import { Button, Form, message, Space, Switch } from 'antd'
import React, { useEffect, useState } from 'react'
import { getAppSettingsFromServer, saveAppSettingsToServer } from '../../api'
import type { AppSettings } from '../../types/settings'

const AppSettingsForm: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const settings = await getAppSettingsFromServer()
      form.setFieldsValue(settings)
    } catch (error) {
      console.error('앱 설정 로드 실패:', error)
      message.error('설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: AppSettings) => {
    try {
      setSaving(true)
      const result = await saveAppSettingsToServer(values)

      if (result.success) {
        message.success('설정이 저장되었습니다.')
      } else {
        message.error(result.error || '설정 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('앱 설정 저장 실패:', error)
      message.error('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>앱 설정</h3>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          showBrowserWindow: true,
        }}
      >
        <Form.Item
          label="브라우저 창 표시 - 봇 탐지 방지를 위해 창 보임을 추천합니다"
          name="showBrowserWindow"
          valuePropName="checked"
          extra="포스팅 시 브라우저 창을 보여줄지 설정합니다. 끄면 백그라운드에서 실행됩니다."
        >
          <Switch checkedChildren="창 보임" unCheckedChildren="창 숨김" loading={loading} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              저장
            </Button>
            <Button onClick={loadSettings} disabled={saving || loading}>
              초기화
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AppSettingsForm
