import {
  Card,
  Input,
  Button,
  Select,
  message,
  Space,
  Tooltip,
  Modal,
  Row,
  Col,
  Form,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { getConfig, putConfig } from "../api";
import {
  dnsServersAtom,
  dnsRulesAtom,
  dnsFinalAtom,
  dnsStrategyAtom,
  outboundsAtom,
  routeRuleSetAtom,
  dnsServerOptionsAtom,
  ruleSetOptionsAtom,
  type DnsServer,
  type DnsRule,
  genId,
} from "../store";

const DNS_DOC_URL = "https://sing-box.sagernet.org/zh/configuration/dns/";
const DNS_RULE_DOC_URL =
  "https://sing-box.sagernet.org/zh/configuration/dns/rule/";

function DocLink({ url = DNS_DOC_URL }: { url?: string }) {
  return (
    <Tooltip title="查看 sing-box 文档">
      <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1">
        <InfoCircleOutlined />
      </a>
    </Tooltip>
  );
}

function splitLines(s: string | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

type RuleEditModalProps = {
  open: boolean;
  title: string;
  initial: DnsRule | null;
  onClose: () => void;
  onSubmit: (next: Partial<DnsRule>) => void;
  serverOptions: { label: string; value: string }[];
  outboundOptions: { label: string; value: string }[];
  ruleSetOptions: { label: string; value: string }[];
};

function RuleEditModal({
  open,
  title,
  initial,
  onClose,
  onSubmit,
  serverOptions,
  outboundOptions,
  ruleSetOptions,
}: RuleEditModalProps) {
  const [form] = Form.useForm();
  const condition =
    Form.useWatch("condition_type", form) ??
    initial?.condition_type ??
    "outbound";

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onSubmit(values as Partial<DnsRule>);
          })
          .catch(() => {});
      }}
      okText="确定"
      cancelText="取消"
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible && initial) {
          form.setFieldsValue({
            server_id: initial.server_id || undefined,
            condition_type: initial.condition_type,
            outbound_id: initial.outbound_id,
            clash_mode: initial.clash_mode,
            rule_set_ids: initial.rule_set_ids ?? [],
            package_name: initial.package_name,
            domain: initial.domain,
            domain_suffix: initial.domain_suffix,
            domain_keyword: initial.domain_keyword,
            domain_regex: initial.domain_regex,
          });
        }
      }}
      width={560}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="server_id"
          label="使用的 DNS 服务器（server）"
          rules={[{ required: true, message: "请选择 server" }]}
        >
          <Select
            placeholder="选择 server"
            options={serverOptions}
            showSearch
            optionFilterProp="label"
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="condition_type"
          label="条件类型"
          initialValue={initial?.condition_type ?? "outbound"}
        >
          <Select
            options={[
              { value: "outbound", label: "出站（outbound）" },
              { value: "clash_mode", label: "Clash 模式（clash_mode）" },
              { value: "rule_set", label: "规则集（rule_set）" },
              { value: "package_name", label: "包名（package_name）" },
              { value: "other", label: "域名模式" },
            ]}
          />
        </Form.Item>
        {condition === "outbound" && (
          <Form.Item
            name="outbound_id"
            label="出站（outbound）"
            tooltip="当流量使用该出站时使用本规则的 DNS。可选 any 或配置中 outbounds 的 tag。"
          >
            <Select
              allowClear
              placeholder="可选，如 any 或出站 tag"
              options={outboundOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        )}
        {condition === "clash_mode" && (
          <Form.Item name="clash_mode" label="Clash 模式（clash_mode）">
            <Select
              allowClear
              placeholder="可选"
              options={[
                { value: "direct", label: "direct" },
                { value: "global", label: "global" },
              ]}
            />
          </Form.Item>
        )}
        {condition === "rule_set" && (
          <Form.Item
            name="rule_set_ids"
            label="规则集（rule_set）"
            tooltip="从路由中已配置的 rule_set 选择，多选"
          >
            <Select
              mode="multiple"
              placeholder="选择规则集（可多选）"
              options={ruleSetOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        )}
        {condition === "package_name" && (
          <Form.Item
            name="package_name"
            label="包名（package_name）"
            tooltip="每行一个或逗号分隔，Android 应用包名"
          >
            <Input.TextArea
              rows={2}
              placeholder="如 com.google.android.youtube"
            />
          </Form.Item>
        )}
        {condition === "other" && (
          <Space vertical className="w-full">
            <Form.Item name="domain" label="域名（domain）">
              <Input.TextArea
                rows={2}
                placeholder="完整域名，每行一个或逗号分隔"
              />
            </Form.Item>
            <Form.Item name="domain_suffix" label="域名后缀（domain_suffix）">
              <Input.TextArea
                rows={2}
                placeholder="如 .example.com，每行一个或逗号分隔"
              />
            </Form.Item>
            <Form.Item
              name="domain_keyword"
              label="域名关键字（domain_keyword）"
            >
              <Input.TextArea
                rows={2}
                placeholder="关键字，每行一个或逗号分隔"
              />
            </Form.Item>
            <Form.Item name="domain_regex" label="域名正则（domain_regex）">
              <Input.TextArea
                rows={2}
                placeholder="正则表达式，每行一个或逗号分隔"
              />
            </Form.Item>
          </Space>
        )}
      </Form>
    </Modal>
  );
}

export default function DnsPage() {
  const [dnsServers, setDnsServers] = useAtom(dnsServersAtom);
  const [dnsRules, setDnsRules] = useAtom(dnsRulesAtom);
  const [dnsFinal, setDnsFinal] = useAtom(dnsFinalAtom);
  const [dnsStrategy, setDnsStrategy] = useAtom(dnsStrategyAtom);
  const [outbounds] = useAtom(outboundsAtom);
  const [routeRuleSet] = useAtom(routeRuleSetAtom);
  const [dnsServerOptions] = useAtom(dnsServerOptionsAtom);
  const [ruleSetOptions] = useAtom(ruleSetOptionsAtom);

  const [saving, setSaving] = useState(false);

  const outboundOptions = useMemo(
    () =>
      outbounds.map((o) => ({
        label: o.tag === "any" ? "any（任意出站）" : o.tag,
        value: o.id,
      })),
    [outbounds],
  );

  const serverMap = useMemo(
    () => new Map(dnsServers.map((s) => [s.id, s] as const)),
    [dnsServers],
  );
  const outboundMap = useMemo(
    () => new Map(outbounds.map((o) => [o.id, o] as const)),
    [outbounds],
  );
  const ruleSetMap = useMemo(
    () => new Map(routeRuleSet.map((r) => [r.id, r] as const)),
    [routeRuleSet],
  );

  const handleEditServer = (id: string, patch: Partial<DnsServer>) => {
    setDnsServers(
      dnsServers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const handleRemoveServer = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除该 server 后，引用它的规则也会被移除，是否继续？",
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        const remaining = dnsServers.filter((s) => s.id !== id);
        const remainingIds = new Set(remaining.map((s) => s.id));
        const remainingRules = dnsRules.filter((r) =>
          remainingIds.has(r.server_id),
        );
        const newFinal =
          dnsFinal && remainingIds.has(dnsFinal) ? dnsFinal : remaining[0]?.id;
        setDnsServers(remaining);
        setDnsRules(remainingRules);
        setDnsFinal(newFinal);
      },
    });
  };

  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [isCreatingServer, setIsCreatingServer] = useState(false);
  const [serverEditing, setServerEditing] = useState<DnsServer | null>(null);
  const [serverForm] = Form.useForm();

  const openServerModal = (server: DnsServer) => {
    setIsCreatingServer(false);
    setServerEditing(server);
    serverForm.setFieldsValue({
      tag: server.tag,
      address: server.address,
      address_resolver_id: server.address_resolver_id,
      strategy: server.strategy,
      detour_id: server.detour_id,
    });
    setServerModalOpen(true);
  };

  const openCreateServerModal = () => {
    const draft: DnsServer = {
      id: genId(),
      tag: "",
      address: "",
    };
    setIsCreatingServer(true);
    setServerEditing(draft);
    serverForm.setFieldsValue({
      tag: "",
      address: "",
      address_resolver_id: undefined,
      strategy: undefined,
      detour_id: undefined,
    });
    setServerModalOpen(true);
  };

  const handleSaveServerModal = () => {
    serverForm
      .validateFields()
      .then((values) => {
        if (!serverEditing) return;
        if (isCreatingServer) {
          const next: DnsServer = {
            ...serverEditing,
            ...(values as Partial<DnsServer>),
          };
          setDnsServers([...dnsServers, next]);
        } else {
          handleEditServer(serverEditing.id, values as Partial<DnsServer>);
        }
        setIsCreatingServer(false);
        setServerModalOpen(false);
      })
      .catch(() => {});
  };

  const handleRemoveRule = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除该 Rule 吗？",
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        setDnsRules(dnsRules.filter((r) => r.id !== id));
      },
    });
  };

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<DnsRule | null>(null);
  const [ruleEditingIndex, setRuleEditingIndex] = useState<number>(0);

  const openRuleModal = (index: number) => {
    setIsCreatingRule(false);
    setRuleEditingIndex(index);
    setRuleModalOpen(true);
  };

  const handleRuleModalSubmit = (patch: Partial<DnsRule>) => {
    if (isCreatingRule) {
      if (!ruleDraft) return;
      const next: DnsRule = { ...ruleDraft, ...patch };
      setDnsRules([...dnsRules, next]);
      setRuleDraft(null);
      setIsCreatingRule(false);
    } else {
      setDnsRules(
        dnsRules.map((r, i) =>
          i === ruleEditingIndex ? { ...r, ...patch } : r,
        ),
      );
    }
    setRuleModalOpen(false);
  };

  const save = async () => {
    if (!dnsServers.length) {
      message.error("请至少配置一个 DNS server");
      return;
    }
    const serverIds = new Set(dnsServers.map((s) => s.id));
    const invalidRuleIndex = dnsRules.findIndex(
      (r) => !r.server_id || !serverIds.has(r.server_id),
    );
    if (invalidRuleIndex !== -1) {
      message.error(`规则 ${invalidRuleIndex + 1} 的 server 不合法，请检查`);
      return;
    }

    const serversForConfig = dnsServers.map((s) => {
      const address_resolver =
        s.address_resolver_id && serverMap.get(s.address_resolver_id)?.tag;
      const detour = s.detour_id && outboundMap.get(s.detour_id)?.tag;
      const o: Record<string, unknown> = {
        tag: s.tag,
        address: s.address,
      };
      if (address_resolver) o.address_resolver = address_resolver;
      if (s.strategy) o.strategy = s.strategy;
      if (detour) o.detour = detour;
      return o;
    });

    const rulesForConfig = dnsRules
      .map((r) => {
        const serverTag = serverMap.get(r.server_id)?.tag;
        if (!serverTag) return null;
        const o: Record<string, unknown> = {
          server: serverTag,
        };
        const outboundTag =
          r.outbound_id && outboundMap.get(r.outbound_id)?.tag;
        if (outboundTag) o.outbound = outboundTag;
        if (r.clash_mode) o.clash_mode = r.clash_mode;
        const ruleSetTags =
          r.rule_set_ids
            ?.map((id) => ruleSetMap.get(id)?.tag)
            .filter(Boolean) ?? [];
        if (ruleSetTags.length) o.rule_set = ruleSetTags;
        const pn = splitLines(r.package_name);
        if (pn.length) o.package_name = pn;
        const dom = splitLines(r.domain);
        if (dom.length) o.domain = dom;
        const ds = splitLines(r.domain_suffix);
        if (ds.length) o.domain_suffix = ds;
        const dk = splitLines(r.domain_keyword);
        if (dk.length) o.domain_keyword = dk;
        const dr = splitLines(r.domain_regex);
        if (dr.length) o.domain_regex = dr;
        return o;
      })
      .filter(Boolean) as Record<string, unknown>[];

    const finalTag = dnsFinal ? serverMap.get(dnsFinal)?.tag : undefined;

    setSaving(true);
    try {
      const config = (await getConfig()) as Record<string, unknown>;
      const next = {
        ...config,
        dns: {
          ...(typeof config.dns === "object" && config.dns !== null
            ? (config.dns as object)
            : {}),
          final: finalTag,
          strategy: dnsStrategy,
          servers: serversForConfig,
          rules: rulesForConfig,
        },
      };
      await putConfig(next);
      message.success("已保存");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title={
        <span>
          DNS
          <DocLink />
        </span>
      }
    >
      <div className="mb-2">
        <span className="font-semibold text-sm">DNS 服务器列表（servers）</span>
      </div>
      <Row gutter={[16, 16]} className="items-stretch">
        {dnsServers.map((s, index) => {
          const addressResolver =
            s.address_resolver_id && serverMap.get(s.address_resolver_id)?.tag;
          const detour = s.detour_id && outboundMap.get(s.detour_id)?.tag;
          return (
            <Col xs={24} sm={12} md={8} key={s.id} className="flex">
              <Card
                size="small"
                title={`Server ${index + 1}`}
                extra={
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openServerModal(s)}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveServer(s.id)}
                    />
                  </Space>
                }
                className="flex-1 flex h-full flex-col min-h-[120px]"
              >
                <Space vertical size={4} className="w-full text-xs">
                  <div>
                    <strong>标签（tag）：</strong>
                    {s.tag || "—"}
                  </div>
                  <div>
                    <strong>地址（address）：</strong>
                    {s.address || "—"}
                  </div>
                  <div>
                    <strong>地址解析器（address_resolver）：</strong>
                    {addressResolver || "—"}
                  </div>
                  <div>
                    <strong>策略（strategy）：</strong>
                    {s.strategy || "—"}
                  </div>
                  <div>
                    <strong>绕行（detour）：</strong>
                    {detour || "—"}
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
        <Col xs={24} sm={12} md={8} className="flex">
          <Card
            size="small"
            className="flex-1 h-full border border-dashed cursor-pointer min-h-[120px] flex items-center justify-center"
            onClick={openCreateServerModal}
          >
            <Space vertical align="center" className="w-full">
              <PlusOutlined className="text-2xl text-neutral-400" />
              <span className="text-neutral-400">添加 server</span>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={isCreatingServer ? "新增 Server" : "编辑 Server"}
        open={serverModalOpen}
        onCancel={() => setServerModalOpen(false)}
        onOk={handleSaveServerModal}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        width={520}
      >
        <Form form={serverForm} layout="vertical">
          <Form.Item
            name="tag"
            label="标签（tag）"
            rules={[{ required: true, message: "请输入标签" }]}
          >
            <Input placeholder="如 dns_proxy" />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址（address）"
            rules={[{ required: true, message: "请输入地址" }]}
          >
            <Input placeholder="如 https://1.1.1.1/dns-query 或 rcode://refused" />
          </Form.Item>
          <Form.Item
            name="address_resolver_id"
            label="地址解析器（address_resolver）"
            tooltip="可选，选择用于解析本服务器地址的 DNS server"
          >
            <Select
              allowClear
              placeholder="可选，选择其他 server"
              options={dnsServerOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="strategy" label="策略（strategy）">
            <Select
              allowClear
              placeholder="可选"
              options={[
                { value: "", label: "空" },
                { value: "prefer_ipv4", label: "prefer_ipv4" },
                { value: "prefer_ipv6", label: "prefer_ipv6" },
                { value: "ipv4_only", label: "ipv4_only" },
                { value: "ipv6_only", label: "ipv6_only" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="detour_id"
            label="绕行（detour）"
            tooltip="可选，选择用于连接该 DNS 的出站"
          >
            <Select
              allowClear
              placeholder="可选，出站标签"
              options={outboundOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>

      <div className="mt-6 mb-2">
        <span className="font-semibold text-sm">DNS 规则列表（rules）</span>
      </div>

      <Row gutter={[16, 16]} className="items-stretch">
        {dnsRules.map((r, index) => {
          const serverTag = serverMap.get(r.server_id)?.tag ?? "";
          const condType = r.condition_type ?? "outbound";
          const condLabel =
            condType === "outbound"
              ? "出站（outbound）"
              : condType === "clash_mode"
                ? "Clash 模式（clash_mode）"
                : condType === "rule_set"
                  ? "规则集（rule_set）"
                  : condType === "package_name"
                    ? "包名（package_name）"
                    : "域名模式";
          const outboundTag =
            r.outbound_id && outboundMap.get(r.outbound_id)?.tag;
          const ruleSetTags =
            r.rule_set_ids
              ?.map((id) => ruleSetMap.get(id)?.tag)
              .filter(Boolean)
              .join(", ") ?? "";

          return (
            <Col xs={24} sm={12} md={8} key={r.id} className="flex">
              <Card
                size="small"
                title={`Rule ${index + 1}`}
                extra={
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openRuleModal(index)}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveRule(r.id)}
                    />
                  </Space>
                }
                className="flex-1 flex h-full flex-col min-h-[120px]"
              >
                <Space vertical size={4} className="w-full text-xs">
                  <div>
                    <strong>server：</strong>
                    {serverTag || "—"}
                  </div>
                  <div>
                    <strong>条件类型：</strong>
                    {condLabel}
                  </div>
                  {condType === "outbound" && (
                    <div>
                      <strong>outbound：</strong>
                      {outboundTag || "—"}
                    </div>
                  )}
                  {condType === "clash_mode" && (
                    <div>
                      <strong>clash_mode：</strong>
                      {r.clash_mode || "—"}
                    </div>
                  )}
                  {condType === "rule_set" && (
                    <div>
                      <strong>rule_set：</strong>
                      {ruleSetTags || "—"}
                    </div>
                  )}
                  {condType === "package_name" && (
                    <div>
                      <strong>package_name：</strong>
                      {r.package_name || "—"}
                    </div>
                  )}
                  {condType === "other" && (
                    <>
                      <div>
                        <strong>domain：</strong>
                        {r.domain || "—"}
                      </div>
                      <div>
                        <strong>domain_suffix：</strong>
                        {r.domain_suffix || "—"}
                      </div>
                      <div>
                        <strong>domain_keyword：</strong>
                        {r.domain_keyword || "—"}
                      </div>
                      <div>
                        <strong>domain_regex：</strong>
                        {r.domain_regex || "—"}
                      </div>
                    </>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
        <Col xs={24} sm={12} md={8} className="flex">
          <Card
            size="small"
            className="flex-1 h-full border border-dashed cursor-pointer min-h-[120px] flex items-center justify-center"
            onClick={() => {
              const firstServerId = dnsServers[0]?.id;
              if (!firstServerId) {
                message.error("请先添加至少一个 DNS server");
                return;
              }
              const draft: DnsRule = {
                id: genId(),
                server_id: firstServerId,
                condition_type: "outbound",
              };
              setIsCreatingRule(true);
              setRuleEditingIndex(-1);
              setRuleDraft(draft);
              setRuleModalOpen(true);
            }}
          >
            <Space vertical align="center" className="w-full">
              <PlusOutlined className="text-2xl text-neutral-400" />
              <span className="text-neutral-400">添加 rule</span>
            </Space>
          </Card>
        </Col>
      </Row>

      <Space vertical className="mt-6 mb-2 w-full">
        <div>
          <div className="font-semibold mr-2">默认 DNS（final）</div>
          <Select
            className="min-w-full"
            allowClear
            placeholder="请先添加 servers，再选择"
            options={dnsServerOptions}
            value={dnsFinal}
            onChange={(v) => setDnsFinal(v ?? undefined)}
            showSearch
            optionFilterProp="label"
          />
        </div>
        <div>
          <div className="font-semibold mr-2 mt-4">
            默认解析策略（strategy）
          </div>
          <Select
            className="min-w-full"
            allowClear
            placeholder="可选"
            value={dnsStrategy}
            onChange={(v) => setDnsStrategy(v ? String(v) : undefined)}
            options={[
              { value: "", label: "空" },
              { value: "prefer_ipv4", label: "prefer_ipv4" },
              { value: "prefer_ipv6", label: "prefer_ipv6" },
              { value: "ipv4_only", label: "ipv4_only" },
              { value: "ipv6_only", label: "ipv6_only" },
            ]}
          />
        </div>
      </Space>

      <RuleEditModal
        open={ruleModalOpen}
        title={
          isCreatingRule ? "新增 Rule" : `编辑 Rule ${ruleEditingIndex + 1}`
        }
        initial={dnsRules[ruleEditingIndex] ?? null}
        onClose={() => setRuleModalOpen(false)}
        onSubmit={handleRuleModalSubmit}
        serverOptions={dnsServerOptions}
        outboundOptions={outboundOptions}
        ruleSetOptions={ruleSetOptions}
      />

      <div className="mt-4">
        <Button type="primary" onClick={save} loading={saving}>
          保存
        </Button>
      </div>
    </Card>
  );
}
