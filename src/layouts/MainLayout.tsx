import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Drawer, Dropdown, Layout, Tooltip } from 'antd';
import { mediaUrl } from '../services/apiClient';
import { useThemeMode } from '../theme/ThemeContext';
import {
  ApartmentOutlined,
  CalculatorOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MenuOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import logo from '../assets/images.png';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useAuth } from '../auth/AuthContext';

const { Sider, Header, Content } = Layout;

const baseMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/projects', icon: <ProjectOutlined />, label: 'Projetos' },
  { key: '/fluxo', icon: <ApartmentOutlined />, label: 'Fluxo' },
  { key: '/documents', icon: <FileTextOutlined />, label: 'Documentos' },
  { key: '/fiscal', icon: <CalculatorOutlined />, label: 'Fiscal' },
  { key: '/conformidade', icon: <SafetyCertificateOutlined />, label: 'SAGAT' },
  { key: '/biblioteca', icon: <ReadOutlined />, label: 'Biblioteca' },
];

const equipeItem = { key: '/equipe', icon: <TeamOutlined />, label: 'Equipe' };

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useBreakpoint();
  const { user, logout } = useAuth();
  const { mode } = useThemeMode();

  const menuItems = useMemo(
    () => (user?.role === 'admin' ? [...baseMenuItems, equipeItem] : baseMenuItems),
    [user?.role],
  );

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

  const closeToggle = !isMobile && (
    <button
      type="button"
      className="axm-sider-toggle"
      onClick={() => setCollapsed(true)}
      aria-label="Fechar menu"
    >
      <ArrowLeftOutlined />
    </button>
  );

  const nav = (
    <nav className="axm-icon-nav" aria-label="Menu principal">
      {closeToggle}
      {menuItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`axm-icon-nav-item${selectedKey === item.key ? ' is-active' : ''}`}
          onClick={() => handleNavigate(item.key)}
        >
          <span className="axm-icon-nav-circle">{item.icon}</span>
          <span className="axm-icon-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  const siderContent = nav;

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--content-bg)' }}>
      {!isMobile && !collapsed && (
        <Sider theme={mode === 'dark' ? 'dark' : 'light'} width={112} trigger={null} className="axm-sider">
          {siderContent}
        </Sider>
      )}

      <Layout className="axm-main" style={{ background: 'var(--content-bg)' }}>
        <Header className="axm-header">
          <div className="axm-header-left">
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
            {!isMobile && collapsed && (
              <button
                type="button"
                className="axm-sider-toggle"
                onClick={() => setCollapsed(false)}
                aria-label="Mostrar menu"
              >
                <ArrowRightOutlined />
              </button>
            )}
          </div>

          <img src={logo} alt="AXM" className="axm-header-logo" />

          <Dropdown
            menu={{
              items: [
                {
                  key: 'perfil',
                  icon: <UserOutlined />,
                  label: 'Minha conta',
                  onClick: () => navigate('/perfil'),
                },
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
            <Tooltip title={user?.name} placement="left">
              <button type="button" className="axm-header-user" aria-label={user?.name ?? 'Conta'}>
                <Avatar
                  size={32}
                  src={mediaUrl(user?.avatarUrl)}
                  icon={<UserOutlined />}
                  style={{ background: '#f9c556', color: '#111' }}
                />
              </button>
            </Tooltip>
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
        width={140}
        styles={{ body: { padding: 0, background: 'var(--content-bg)' } }}
        className="axm-mobile-drawer"
      >
        <div className="axm-sider axm-sider-drawer">{siderContent}</div>
      </Drawer>
    </Layout>
  );
}
