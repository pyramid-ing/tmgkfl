import { Alert, Button, Form, Input, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { apiClient, getErrorMessage } from '../../api'

const { Text } = Typography

interface GlobalSettingsResponse {
  success: boolean
  data: {
    licenseKey?: string
    licenseCache?: {
      isValid: boolean
      permissions: string[]
      expiresAt?: number
    } | null
  }
}

interface RegisterLicenseResponse {
  success: boolean
  message?: string
}

const LicenseForm: React.FC = () => {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [licenseStatus, setLicenseStatus] = useState<{
    isValid: boolean
    expiresAt?: number
  } | null>(null)

  const fetchMachineId = async () => {
    try {
      setErrorMessage(null)
      const res = await apiClient.get<{ machineId: string }>('/auth/machine-id')
      // 폼에만 세팅 (UI에는 표시하지 않음)
      form.setFieldsValue({ node_machine_id: res.data.machineId })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  useEffect(() => {
    // 페이지 진입 시 자동으로 머신 ID 및 기존 라이센스 정보 조회
    const init = async () => {
      await fetchMachineId()
      try {
        const res = await apiClient.get<GlobalSettingsResponse>('/settings/global')
        if (res.data?.data) {
          const { licenseKey, licenseCache } = res.data.data

          if (licenseKey) {
            form.setFieldsValue({ license_key: licenseKey })
          }

          if (licenseCache) {
            setLicenseStatus({
              isValid: licenseCache.isValid,
              expiresAt: licenseCache.expiresAt,
            })
          }
        }
      } catch (error) {
        // 라이센스가 아직 없을 수 있으므로 조용히 무시
        console.warn('Failed to load global settings for license:', error)
      }
    }

    init()
  }, [])

  const handleSubmit = async (values: { license_key: string; node_machine_id: string }) => {
    setSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const res = await apiClient.post<RegisterLicenseResponse>('/auth/register-license', values)
      if (res.data.success) {
        setSuccessMessage(res.data.message || '라이센스가 성공적으로 등록되었습니다.')
        // 저장된 라이센스처럼 보이도록 상태 업데이트
        setLicenseStatus({
          isValid: true,
        })
      } else {
        setErrorMessage('라이센스 등록에 실패했습니다.')
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Text type="secondary">
          프로그램 사용을 위해 발급받은 라이센스 키를 입력해주세요. 이 PC의 고유 머신 ID와 함께 서버에 등록됩니다.
        </Text>
        {licenseStatus && licenseStatus.isValid && (
          <div style={{ marginTop: 8 }}>
            <Text type="success">현재 이 PC에는 유효한 라이센스가 등록되어 있습니다.</Text>
          </div>
        )}
      </div>

      {successMessage && <Alert type="success" message={successMessage} showIcon />}
      {errorMessage && <Alert type="error" message={errorMessage} showIcon />}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          license_key: '',
          node_machine_id: '',
        }}
      >
        <Form.Item
          label="라이센스 키"
          name="license_key"
          rules={[
            { required: true, message: '라이센스 키를 입력해주세요.' },
            { min: 10, message: '라이센스 키 형식을 다시 확인해주세요.' },
          ]}
        >
          <Input placeholder="예: XXXXX-XXXXX-XXXXX-XXXXX" autoFocus />
        </Form.Item>

        {/* 머신 ID는 화면에 노출하지 않고 hidden 필드로만 유지 */}
        <Form.Item name="node_machine_id" hidden rules={[{ required: true, message: '머신 ID를 확인할 수 없습니다.' }]}>
          <Input type="hidden" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              라이센스 등록
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Space>
  )
}

export default LicenseForm
