import { Layout, Menu, Button, message } from "antd";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { useAuth } from "../AuthContext";
import {
  dnsServersAtom,
  dnsRulesAtom,
  dnsFinalAtom,
  dnsStrategyAtom,
  inboundsAtom,
  outboundsAtom,
  routeRuleSetAtom,
  routeRulesAtom,
  routeFinalAtom,
  parseConfig,
} from "../store";
import { getConfig } from "../api";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/", label: "概览" },
  { key: "/inbounds", label: "入站" },
  { key: "/outbounds", label: "出站" },
  { key: "/route", label: "路由" },
  { key: "/dns", label: "DNS" },
  { key: "/log", label: "日志" },
  { key: "/experimental", label: "实验性" },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const setDnsServers = useSetAtom(dnsServersAtom);
  const setDnsRules = useSetAtom(dnsRulesAtom);
  const setDnsFinal = useSetAtom(dnsFinalAtom);
  const setDnsStrategy = useSetAtom(dnsStrategyAtom);
  const setInbounds = useSetAtom(inboundsAtom);
  const setOutbounds = useSetAtom(outboundsAtom);
  const setRouteRuleSet = useSetAtom(routeRuleSetAtom);
  const setRouteRules = useSetAtom(routeRulesAtom);
  const setRouteFinal = useSetAtom(routeFinalAtom);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await getConfig();
        if (!mounted) return;
        const parsed = parseConfig(raw as Record<string, unknown>);
        setDnsServers(parsed.dnsServers);
        setDnsRules(parsed.dnsRules);
        setDnsFinal(parsed.dnsFinal);
        setDnsStrategy(parsed.dnsStrategy);
        setInbounds(parsed.inbounds);
        setOutbounds(parsed.outbounds);
        setRouteRuleSet(parsed.routeRuleSet);
        setRouteRules(parsed.routeRules);
        setRouteFinal(parsed.routeFinal);
      } catch (e) {
        if (!mounted) return;
        // 全局初始化失败时给出提示，避免页面空白
        // 具体错误在控制台查看
        // eslint-disable-next-line no-console
        console.error(e);
        message.error("加载配置失败，请检查后端状态");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    setDnsServers,
    setDnsRules,
    setDnsFinal,
    setDnsStrategy,
    setInbounds,
    setOutbounds,
    setRouteRuleSet,
    setRouteRules,
    setRouteFinal,
  ]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="md"
        collapsedWidth={0}
      >
        <div
          style={{ height: 32, margin: 16, color: "#fff", textAlign: "center" }}
        >
          {collapsed ? "S" : "sing-box"}
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
        <Header
          style={{
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: "#fff" }}
          />
          <span style={{ flex: 1 }} />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ color: "#fff" }}
          >
            退出
          </Button>
        </Header>
        <Content style={{ margin: 24, overflow: "auto" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
