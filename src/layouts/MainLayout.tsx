import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import logo from '../assets/images.png';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Projetos' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documentos' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = menuItems.find((item) =>
    item.key === '/' ? location.pathname === '/' : location.pathname.startsWith(item.key),
  )?.key ?? '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        className={`axm-sider ${collapsed ? 'axm-sider-collapsed' : ''}`}
      >
        <div className="axm-logo-area">
          <img
            src={logo}
            alt="AXM Consultoria"
            style={{ width: collapsed ? 34 : 72, height: 'auto' }}
          />
          {!collapsed && <span className="axm-logo-text">AXM Consultoria</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />

        <div style={{ flex: 1 }} />

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          <div
            className="axm-collapse-btn"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)',
              transition: 'color 0.2s',
            }}
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="axm-header" style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }} />
        </Header>

        <Content className="axm-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
