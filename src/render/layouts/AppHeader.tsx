import { Button, Layout, message } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { apiClient } from '@render/api'
import Card from 'antd/es/card/Card'
import { CopyOutlined, DesktopOutlined, SettingOutlined, ThunderboltOutlined, UploadOutlined } from '@ant-design/icons'

const { Header } = Layout

const StyledHeader = styled(Header)`
    padding: 0 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
`

const AppHeader: React.FC = () => {
    const [machineId, setMachineId] = useState<string>('')
    const fetchMachineId = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/auth/machine-id')
            setMachineId(data.machineId)
        } catch (error) {
            console.error('Error fetching machine id:', error)
        }
    }, [])

    useEffect(() => {
        fetchMachineId()
    }, [fetchMachineId])

    const handleCopyMachineId = useCallback(() => {
        navigator.clipboard.writeText(machineId)
        message.success('복사되었습니다')
    }, [machineId])


    return (
        <StyledHeader>
            <div style={{ color: '#fff' }}>
                <DesktopOutlined /> <span style={{ marginLeft: 4 }}> {machineId}</span>
                <Button size="small" style={{ marginLeft: 4 }} icon={<CopyOutlined />} onClick={handleCopyMachineId}>
                    Copy
                </Button>
            </div>
        </StyledHeader>
    )
}

export default AppHeader
