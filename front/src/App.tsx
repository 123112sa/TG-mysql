import { CheckCircleFilled } from '@ant-design/icons'
import { ConfigProvider, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { outputToInputApi } from './api/solve'
import BackgroundScene from './components/common/BackgroundScene'
import DashboardPage from './pages/Dashboard'
import LoginCard from './pages/Login'
import type { AuthUser, OutputToInputResult, SolveMode, Xh2Route } from './types'

type CenterNotice = {
  open: boolean
  text: string
}

export default function App() {
  const [currentUser, setCurrentUser] = useState('')
  const [outputToInputResult, setOutputToInputResult] = useState<OutputToInputResult | null>(null)
  const [solveMode, setSolveMode] = useState<SolveMode>('input-to-output')
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [centerNotice, setCenterNotice] = useState<CenterNotice>({ open: false, text: '' })

  useEffect(() => {
    if (!centerNotice.open) {
      return
    }

    const timer = window.setTimeout(() => {
      setCenterNotice((current) => ({ ...current, open: false }))
    }, 1600)

    return () => window.clearTimeout(timer)
  }, [centerNotice.open])

  const resetWorkState = () => {
    setOutputToInputResult(null)
    setSolveMode('input-to-output')
    setAccountMenuOpen(false)
    setPaletteOpen(false)
  }

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user.displayName || user.username)
    resetWorkState()
    setCenterNotice({ open: true, text: '登录成功' })
  }

  const handleLogout = () => {
    setCurrentUser('')
    resetWorkState()
  }

  const handleOutputToInputSolve = async (route: Xh2Route) => {
    setSolveMode('output-to-input')

    try {
      const result = await outputToInputApi(route)
      setOutputToInputResult(result)
      message.success('投料反算已完成')
      return result
    } catch (error) {
      message.error(error instanceof Error ? error.message : '投料反算接口调用失败')
      return null
    }
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2f73d9',
          colorText: '#2c3e57',
          colorBgContainer: '#ffffff',
          borderRadius: 2,
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif'
        }
      }}
    >
      <BrowserRouter>
        <BackgroundScene>
          {currentUser ? (
            <DashboardPage
              currentUser={currentUser}
              accountMenuOpen={accountMenuOpen}
              outputToInputResult={outputToInputResult}
              solveMode={solveMode}
              paletteOpen={paletteOpen}
              onToggleAccountMenu={setAccountMenuOpen}
              onTogglePalette={() => setPaletteOpen((open) => !open)}
              onLogout={handleLogout}
              onSolveModeChange={setSolveMode}
              onOutputToInputSolve={handleOutputToInputSolve}
              onReset={resetWorkState}
            />
          ) : (
            <LoginCard onLogin={handleLogin} />
          )}

          {centerNotice.open ? (
            <div className="center-notice">
              <div className="center-notice__card">
                <CheckCircleFilled className="center-notice__icon" />
                <span>{centerNotice.text}</span>
              </div>
            </div>
          ) : null}
        </BackgroundScene>
      </BrowserRouter>
    </ConfigProvider>
  )
}
