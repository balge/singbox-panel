import { Card, Form, Input, Button, Select, message } from 'antd';
import { useState, useEffect } from 'react';
import { getConfig, putConfig } from '../api';

export default function DnsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConfig()
      .then((c: Record<string, unknown>) => {
        const dns = c.dns as Record<string, unknown> | undefined;
        if (dns) {
          form.setFieldsValue({
            final: dns.final,
            strategy: dns.strategy,
            serversJson: JSON.stringify(dns.servers ?? [], null, 2),
            rulesJson: JSON.stringify(dns.rules ?? [], null, 2),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [form]);

  const save = async () => {
    const values = await form.validateFields();
    let servers: unknown[] = [];
    let rules: unknown[] = [];
    try {
      servers = JSON.parse(values.serversJson || '[]');
      rules = JSON.parse(values.rulesJson || '[]');
    } catch {
      message.error('servers 或 rules JSON 格式错误');
      return;
    }
    setSaving(true);
    try {
      const config = await getConfig();
      await putConfig({
        ...config,
        dns: { ...(config.dns as object), final: values.final, strategy: values.strategy, servers, rules },
      });
      message.success('已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="DNS" loading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item name={['final']} label="final">
          <Input placeholder="默认 DNS 标签" />
        </Form.Item>
        <Form.Item name={['strategy']} label="strategy">
          <Select
            allowClear
            options={[
              { value: 'prefer_ipv4', label: 'prefer_ipv4' },
              { value: 'prefer_ipv6', label: 'prefer_ipv6' },
              { value: 'ipv4_only', label: 'ipv4_only' },
              { value: 'ipv6_only', label: 'ipv6_only' },
            ]}
            placeholder="strategy"
          />
        </Form.Item>
        <Form.Item name={['serversJson']} label="servers (JSON)">
          <Input.TextArea rows={10} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name={['rulesJson']} label="rules (JSON)">
          <Input.TextArea rows={10} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={save} loading={saving}>
            保存
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
