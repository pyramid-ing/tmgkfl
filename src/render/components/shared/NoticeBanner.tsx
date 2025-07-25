import { CloseOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { Alert, Button, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const { Text, Paragraph } = Typography

const StyledAlert = styled(Alert)`
  margin: 16px;
  border-radius: 8px;

  .ant-alert-message {
    font-weight: 500;
  }
`

const NoticeBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 로컬 스토리지에서 "오늘하루 보지않기" 상태 확인
    const hideUntil = localStorage.getItem('noticeHideUntil')
    const today = new Date().toDateString()

    if (hideUntil !== today) {
      setIsVisible(true)
    }
  }, [])

  const handleHideToday = () => {
    const today = new Date().toDateString()
    localStorage.setItem('noticeHideUntil', today)
    setIsVisible(false)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <StyledAlert
      message="라이센스 기능이 적용되었습니다"
      description={
        <div>
          <Paragraph style={{ marginBottom: 12 }}>
            PC 1대만 사용가능합니다. 위에 나오는 컴퓨터 키를 복사해서 메일 <Text code>busidev22@gmail.com</Text>로
            보내주시면 등록해드리겠습니다.
          </Paragraph>
        </div>
      }
      type="info"
      showIcon
      closable={false}
      action={
        <Space>
          <Button size="small" icon={<EyeInvisibleOutlined />} onClick={handleHideToday}>
            오늘하루 보지않기
          </Button>
          <Button size="small" icon={<CloseOutlined />} onClick={handleClose}>
            닫기
          </Button>
        </Space>
      }
    />
  )
}

export default NoticeBanner
