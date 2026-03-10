import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useAuth } from '../AuthContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', label: '概览' },
  { key: '/log', label: '日志' },
  { key: '/dns', label: 'DNS' },
  { key: '/inbounds', label: '入站' },
  { key: '/outbounds', label: '出站' },
  { key: '/route', label: '路由' },
  { key: '/experimental', label: '实验性' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="md" collapsedWidth={0}>
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center' }}>
          {collapsed ? 'S' : 'sing-box'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#fff' }}
          />
          <span style={{ flex: 1 }} />
          <Button type="text" icon={<LogoutOutlined />} onClick={logout} style={{ color: '#fff' }}>
            退出
          </Button>
        </Header>
        <Content style={{ margin: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
