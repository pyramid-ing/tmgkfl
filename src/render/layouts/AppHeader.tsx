import { Layout } from 'antd'
import React from 'react'
import styled from 'styled-components'
import Logo from '../components/shared/Logo'
import { LOGO_TEXT } from '../utils/title'

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
  return (
    <StyledHeader>
      <Logo>{LOGO_TEXT}</Logo>
    </StyledHeader>
  )
}

export default AppHeader
