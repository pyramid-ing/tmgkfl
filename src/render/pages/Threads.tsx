import { MinusCircleOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Checkbox, Form, Input, InputNumber, message, Table } from 'antd'
import React, { useEffect } from 'react'
import { apiClient } from '../api'
import PageContainer from '../components/shared/PageContainer'

const STORAGE_KEY = 'threads-form-data'

const ThreadsPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = React.useState(false)
  const [jobId, setJobId] = React.useState<string | null>(null)
  const [logs, setLogs] = React.useState<any[]>([])

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        form.setFieldsValue(parsed)
      }
    } catch (e) {
      console.error('Failed to load data from localStorage', e)
    }
  }, [form])

  useEffect(() => {
    if (!jobId) return

    const fetchLogs = async () => {
      try {
        const { data } = await apiClient.get(`/logs/${jobId}`)
        setLogs(data.logs ?? [])
      } catch (error) {
        console.error('로그 조회 실패:', error)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)

    return () => clearInterval(interval)
  }, [jobId])

  const onFinish = async (values: any) => {
    if (!values.followAction && !values.likeAction && !values.repostAction && !values.commentAction) {
      message.error('자동화 작업을 최소 1개 이상 선택해주세요.')
      return
    }
    setLoading(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
      const { data } = await apiClient.post('/threads/start', {
        id: values.id,
        pw: values.password,
        keyword: values.keyword,
        minDelay: values.minDelay,
        maxDelay: values.maxDelay,
        followMessages: values.followMessages,
        followAction: values.followAction ?? false,
        likeAction: values.likeAction ?? false,
        repostAction: values.repostAction ?? false,
        commentAction: values.commentAction ?? false,
        maxCount: values.maxCount,
      })
      setJobId(data.jobId)
      message.success(data.message)
    } catch (error: any) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
      message.error(error.response?.data?.message || '자동화 시작에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer
      title={
        <span>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          자동 스하리
        </span>
      }
      centered
    >
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ followMessages: [''] }}>
        <Form.Item
          name="id"
          label="인스타그램 ID"
          rules={[{ required: true, message: '인스타그램 ID를 입력해주세요.' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="keyword"
          label="검색 키워드"
          rules={[
            {
              required: true,
              message: '작업할 검색 키워드를 입력해주세요.',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="딜레이 시간(초) - 해당 시간 내 랜덤하게 지연시간을 발생시켜 봇탐지를 방지합니다"
          style={{ marginBottom: 0 }}
        >
          <Form.Item
            name="minDelay"
            rules={[{ required: true, message: '최소 딜레이 시간을 입력해주세요.' }]}
            style={{
              display: 'inline-block',
              width: 'calc(50% - 8px)',
              marginRight: '16px',
            }}
          >
            <InputNumber min={1} max={60} placeholder="최소 딜레이" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maxDelay"
            rules={[
              { required: true, message: '최대 딜레이 시간을 입력해주세요.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('minDelay') <= value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('최대 딜레이는 최소 딜레이보다 커야 합니다.'))
                },
              }),
            ]}
            style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
          >
            <InputNumber min={1} max={60} placeholder="최대 딜레이" style={{ width: '100%' }} />
          </Form.Item>
        </Form.Item>

        <Form.Item
          name="maxCount"
          label="최대 작업 횟수"
          rules={[
            {
              required: true,
              message: '최대 작업 횟수를 입력해주세요.',
            },
          ]}
        >
          <InputNumber min={1} max={999} style={{ width: '100%' }} />
        </Form.Item>

        <Form.List name="followMessages">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item label={index === 0 ? '댓글 멘트 (ex. 팔로우요청)' : ''} required={false} key={field.key}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: '멘트를 입력하거나 이 항목을 삭제해주세요.',
                        },
                      ]}
                      noStyle
                      style={{ flex: 1, marginRight: 8 }}
                    >
                      <Input.TextArea rows={6} placeholder="팔로우시 상대방에게 보낼 메시지" />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined
                        style={{ marginLeft: 10, color: 'red', fontSize: 20 }}
                        onClick={() => remove(field.name)}
                      />
                    ) : null}
                  </div>
                </Form.Item>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block>
                  + 멘트 추가 (여러개중 랜덤으로 댓글포스팅)
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item label="자동화 작업 선택">
          <Form.Item name="followAction" valuePropName="checked" noStyle>
            <Checkbox>팔로우</Checkbox>
          </Form.Item>
          <Form.Item name="likeAction" valuePropName="checked" noStyle>
            <Checkbox>좋아요</Checkbox>
          </Form.Item>
          <Form.Item name="repostAction" valuePropName="checked" noStyle>
            <Checkbox>리포스트</Checkbox>
          </Form.Item>
          <Form.Item name="commentAction" valuePropName="checked" noStyle>
            <Checkbox>댓글</Checkbox>
          </Form.Item>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            자동화 시작
          </Button>
        </Form.Item>
      </Form>
      {logs.length > 0 && (
        <Table
          dataSource={logs}
          columns={[
            {
              title: '시간',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: text => new Date(text).toLocaleString(),
            },
            {
              title: '메시지',
              dataIndex: 'message',
              key: 'message',
            },
          ]}
          pagination={false}
          scroll={{ y: 300 }}
        />
      )}
    </PageContainer>
  )
}

export default ThreadsPage
