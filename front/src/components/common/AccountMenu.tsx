import { DownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'

type AccountMenuProps = {
  currentUser: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogout: () => void
}

export default function AccountMenu({
  currentUser,
  open,
  onOpenChange,
  onLogout
}: AccountMenuProps) {
  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      trigger={['click']}
      menu={{
        items: [
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: onLogout
          }
        ]
      }}
    >
      <Button type="text" className="account-button" icon={<UserOutlined />}>
        当前登录账号：{currentUser}
        <DownOutlined className="account-arrow" />
      </Button>
    </Dropdown>
  )
}
