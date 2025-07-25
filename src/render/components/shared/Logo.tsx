import React from 'react'

interface LogoProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const Logo: React.FC<LogoProps> = ({ children, className, style }) => {
  return (
    <div
      className={className}
      style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1890ff',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default Logo
