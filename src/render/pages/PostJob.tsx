import { InboxOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { apiClient } from '@render/api'
import PageContainer from '@render/components/shared/PageContainer'
import type { UploadFile, UploadProps } from 'antd'
import { Button, Input, message, Space, Table, Tag, Typography, Upload } from 'antd'
import { format } from 'date-fns'
import React, { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

const { Dragger } = Upload
const { Title, Text } = Typography

interface PostData {
  key: React.Key
  subject?: string
  desc: string
  scheduledAt: string
}

interface PostJob {
  id: number
  title: string
  contentHtml: string
  status: 'pending' | 'completed' | 'failed'
  resultMsg: string
  scheduledAt: string
  createdAt: string
  postedAt: string
}

const PostJobPage: React.FC = () => {
  const [loginId, setLoginId] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [data, setData] = useState<PostData[]>([])
  const [postJobs, setPostJobs] = useState<PostJob[]>([])

  const fetchPostJobs = useCallback(async () => {
    setPostJobs([])
    try {
      const { data } = await apiClient.get('/post-jobs')
      setPostJobs(data.postJobs)
    } catch (error) {
      console.error('Error fetching post jobs:', error)
      message.error('작업 목록을 불러오는 중 오류가 발생했습니다.')
    }
  }, [])

  useEffect(() => {
    fetchPostJobs()
  }, [fetchPostJobs])

  const handleDownloadExample = () => {
    const now = new Date()
    const exampleData = [
      ['주제', '내용', '예약일시'],
      ['예시 주제 1', '예시 내용 1입니다. 여기에 글 내용을 입력하세요.', format(now, 'yyyy-MM-dd HH:mm:ss')],
      ['예시 주제 2', '예시 내용 2입니다. 여기에 글 내용을 입력하세요.', format(now, 'yyyy-MM-dd HH:mm:ss')],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(exampleData, {
      cellDates: false,
    })
    // 컬럼 너비 설정
    worksheet['!cols'] = [{ wch: 30 }, { wch: 80 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '게시글 목록')

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

    const blob = new Blob([wbout], { type: 'application/octet-stream' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '게시글_예시.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx, .xls',
    fileList,
    beforeUpload: file => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length > 1) {
            const posts = (jsonData.slice(1) as any[][]).map((row, index) => {
              let scheduledAt = row[2] ?? ''
              if (scheduledAt instanceof Date) {
                scheduledAt = format(scheduledAt, 'yyyy-MM-dd HH:mm:ss')
              }
              return {
                key: index,
                subject: row[0] ?? undefined,
                desc: row[1] ?? '',
                scheduledAt,
              }
            })
            setData(posts)
            message.success(`${file.name} 파일이 성공적으로 파싱되었습니다.`)
          } else {
            message.error('엑셀 파일에 데이터가 없습니다 (헤더 제외).')
            setData([])
          }
        } catch (error) {
          console.error('Error parsing excel file:', error)
          message.error('엑셀 파일을 파싱하는 중 오류가 발생했습니다.')
          setData([])
        }
      }
      reader.readAsArrayBuffer(file)

      setFileList([file])
      return false // antd upload action을 막기 위해 false 반환
    },
    onRemove: () => {
      setFileList([])
      setData([])
    },
  }

  const handleStartPosting = async () => {
    if (data.length === 0) {
      message.warning('업로드할 데이터가 없습니다.')
      return
    }

    try {
      const { data: result } = await apiClient.post('/post-jobs', {
        posts: data.map(({ key, ...rest }) => rest),
        loginId,
        loginPw,
      })

      message.success(result.message || `${data.length}개의 게시글이 성공적으로 예약되었습니다.`)
      setData([])
      setFileList([])
      fetchPostJobs() // 작업 목록 새로고침
    } catch (error) {
      console.error('Error posting data:', error)
      message.error('게시글을 예약하는 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/post-jobs/${id}`)
      fetchPostJobs()
    } catch (error) {
      console.error('Error deleting post job:', error)
      message.error('작업을 삭제하는 중 오류가 발생했습니다.')
    }
  }

  const handleRetry = async (id: string) => {
    try {
      await apiClient.post(`/post-jobs/${id}/retry`)
      fetchPostJobs()
    } catch (error) {
      console.error('Error retrying post job:', error)
      message.error('작업을 재시도하는 중 오류가 발생했습니다.')
    }
  }

  const columns = [
    {
      title: '주제',
      dataIndex: 'subject',
      key: 'subject',
      width: '30%',
    },
    {
      title: '글 내용',
      dataIndex: 'desc',
      key: 'desc',
    },
    {
      title: '예약일시',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ]

  const postJobColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '주제',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '글 내용',
      dataIndex: 'desc',
      key: 'desc',
      render: (text: string) => text.slice(0, 10) + '...',
    },
    {
      title: '로그인 ID',
      dataIndex: 'loginId',
      key: 'loginId',
    },
    {
      title: '예약일',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (text: string) => format(new Date(text), 'yy.MM.dd HH:mm'),
    },
    {
      title: '게시일',
      dataIndex: 'postedAt',
      key: 'postedAt',
      width: '100px',
      render: (text: string | null) => (text ? format(new Date(text), 'yy.MM.dd HH:mm') : '-'),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => format(new Date(text), 'yy.MM.dd HH:mm'),
    },
    {
      title: '결과',
      dataIndex: 'resultMsg',
      key: 'resultMsg',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        switch (text) {
          case 'pending':
            return <Tag color="blue">대기</Tag>
          case 'processing':
            return <Tag color="blue">처리중</Tag>
          case 'completed':
            return <Tag color="green">완료</Tag>
          case 'failed':
            return <Tag color="red">실패</Tag>
          default:
            return <Tag color="default">{text}</Tag>
        }
      },
    },
    {
      title: '삭제',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      render: (text: string, record: PostJob) => (
        <>
          <Button type="default" danger size="small" onClick={() => handleDelete(text)}>
            삭제
          </Button>
          {record.status === 'failed' && (
            <Button type="default" size="small" style={{ marginLeft: 4 }} onClick={() => handleRetry(text)}>
              재시도
            </Button>
          )}
        </>
      ),
    },
  ]

  return (
    <PageContainer
      title={
        <span>
          <UploadOutlined style={{ marginRight: 8 }} />
          자동 포스팅
        </span>
      }
      centered
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">클릭하거나 파일을 이 영역으로 드래그하여 업로드하세요.</p>
          <p className="ant-upload-hint">
            엑셀 파일(.xlsx, .xls)을 업로드하여 게시글을 자동으로 등록할 수 있습니다.
            <br />첫 번째 행은 헤더로 간주되어 무시됩니다.
            <br />
          </p>
        </Dragger>
        <Button type="link" onClick={handleDownloadExample} style={{ padding: 0 }}>
          예시 엑셀 파일 다운로드
        </Button>

        {data.length > 0 && (
          <>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="로그인 ID" required onChange={e => setLoginId(e.target.value)} />
              <Input.Password placeholder="로그인 PW" required onChange={e => setLoginPw(e.target.value)} />
              <Button
                type="primary"
                onClick={() => {
                  if (!loginId || !loginPw) {
                    message.error('로그인 정보를 입력해주세요')
                    return
                  }
                  handleStartPosting()
                }}
              >
                포스팅 시작
              </Button>
            </Space>
            <Table columns={columns} dataSource={data} pagination={{ pageSize: 5 }} />
          </>
        )}

        <Title level={4} style={{ marginTop: 40 }}>
          <Space>
            작업 목록
            <Button type="text" icon={<ReloadOutlined />} onClick={() => fetchPostJobs()} />
          </Space>
        </Title>
        <Table columns={postJobColumns} dataSource={postJobs} rowKey="id" pagination={{ pageSize: 10 }} />
      </Space>
    </PageContainer>
  )
}

export default PostJobPage
