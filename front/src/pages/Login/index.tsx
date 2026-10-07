import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Alert, Button, Form, Input, Modal, Typography, message } from 'antd'
import { useState } from 'react'
import { loginApi, registerApi } from '../../api/auth'
import type { AuthUser, LoginFormState, RegisterFormState } from '../../types'

type LoginCardProps = {
  onLogin: (user: AuthUser) => void
}

export default function LoginCard({ onLogin }: LoginCardProps) {
  const [form] = Form.useForm<LoginFormState>()
  const [registerForm] = Form.useForm<RegisterFormState>()
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  const handleFinish = async (values: LoginFormState) => {
    setLoginLoading(true)
    setLoginError('')

    const result = await loginApi(values.username, values.password)

    setLoginLoading(false)

    if (result.status === 'success' && result.user) {
      messageApi.success(result.message)
      onLogin(result.user)
      return
    }

    setLoginError(result.message)
    messageApi.error(result.message)
  }

  const openRegister = () => {
    setRegisterOpen(true)
    registerForm.resetFields()
  }

  const closeRegister = () => {
    setRegisterOpen(false)
    setRegisterLoading(false)
    registerForm.resetFields()
  }

  const handleRegister = async () => {
    try {
      const values = await registerForm.validateFields()
      setRegisterLoading(true)

      const result = await registerApi(values.username, values.password)

      setRegisterLoading(false)

      if (result.status === 'register_success') {
        messageApi.success(result.message)
        closeRegister()
        return
      }

      messageApi.error(result.message)
    } catch (error) {
      setRegisterLoading(false)
      if (error instanceof Error) {
        messageApi.error(error.message)
      }
    }
  }

  return (
    <div className="login-wrap">
      {contextHolder}

      <section className="login-card">
        <div className="login-head">
          <span>化工厂调度系统</span>
          <span className="login-close">×</span>
        </div>

        <div className="login-body">
          <Form<LoginFormState>
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={handleFinish}
            className="login-form"
          >
            <Form.Item
              label={
                <span className="field-label">
                  <span className="required">*</span>用户账号
                </span>
              }
              name="username"
              rules={[{ required: true, message: '请输入用户账号' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username"
                autoComplete="username"
                size="large"
                className="system-input"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="field-label">
                  <span className="required">*</span>登录密码
                </span>
              }
              name="password"
              rules={[{ required: true, message: '请输入登录密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                autoComplete="current-password"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                className="system-input"
              />
            </Form.Item>

            {loginError ? <Alert type="error" showIcon message={loginError} className="login-alert" /> : null}

            <div className="login-action">
              <Button type="primary" htmlType="submit" className="login-submit-btn" loading={loginLoading}>
                登录
              </Button>
            </div>

            <div className="login-foot">
              <Typography.Link className="login-link">修改密码</Typography.Link>
              <Typography.Link className="login-link" onClick={openRegister}>
                新用户注册
              </Typography.Link>
            </div>
          </Form>
        </div>
      </section>

      <Modal
        open={registerOpen}
        title="用户注册"
        onCancel={closeRegister}
        onOk={handleRegister}
        confirmLoading={registerLoading}
        okText="注册"
        cancelText="取消"
        className="system-modal"
        destroyOnClose
      >
        <Form<RegisterFormState> form={registerForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="账号"
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入账号" className="system-input" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="system-input"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              className="system-input"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
