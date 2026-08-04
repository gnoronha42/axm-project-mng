import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Drawer, Dropdown, Layout, Menu, Space, Typography } from 'antd';
import {
  ApartmentOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  UserOutlined,
} from '@ant-design/icons';
import logo from '../assets/images.png';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useAuth } from '../auth/AuthContext';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Projetos' },
  { key: '/fluxo', icon: <ApartmentOutlined />, label: 'Fluxo' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documentos' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useBreakpoint();
  const { user, logout } = useAuth();

  const selectedKey =
    menuItems.find((item) =>
      item.key === '/' ? location.pathname === '/' : location.pathname.startsWith(item.key),
    )?.key ?? '/';

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const handleNavigate = (key: string) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={({ key }) => handleNavigate(key)}
    />
  );

  const logoBlock = (
    <div className="axm-logo-area">
      <img
        src={logo}
        alt="AXM Consultoria"
        style={{ width: collapsed && !isMobile ? 34 : 72, height: 'auto' }}
      />
      {(!collapsed || isMobile) && <span className="axm-logo-text">AXM Consultoria</span>}
    </div>
  );

  const siderContent = (
    <>
      {logoBlock}
      {menu}
      <div style={{ flex: 1 }} />
      {!isMobile && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          <button
            type="button"
            className="axm-sider-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
      )}
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={240}
          collapsedWidth={72}
          className={`axm-sider ${collapsed ? 'axm-sider-collapsed' : ''}`}
        >
          {siderContent}
        </Sider>
      )}

      <Layout className="axm-main">
        <Header className="axm-header">
          {isMobile && (
            <button
              type="button"
              className="axm-mobile-menu-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
            >
              <MenuOutlined />
            </button>
          )}
          <Typography.Text className="axm-header-title" ellipsis>
            AXM Project Manager
          </Typography.Text>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Sair',
                  onClick: () => {
                    logout();
                    navigate('/login', { replace: true });
                  },
                },
              ],
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer', flexShrink: 0 }} size={8}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#f9c556', color: '#111' }} />
              {!isMobile && (
                <Typography.Text ellipsis style={{ maxWidth: 160 }}>
                  {user?.name}
                </Typography.Text>
              )}
            </Space>
          </Dropdown>
        </Header>

        <Content className="axm-content">
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title={null}
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={280}
        styles={{ body: { padding: 0, background: '#141414' } }}
        className="axm-mobile-drawer"
      >
        <div className="axm-sider axm-sider-drawer">{siderContent}</div>
      </Drawer>
    </Layout>
  );
}
