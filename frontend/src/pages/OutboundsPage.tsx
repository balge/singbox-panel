import { Card, Input, Button, message } from 'antd';
import { useState, useEffect } from 'react';
import { getConfig, putConfig, fetchSubscription } from '../api';

export default function OutboundsPage() {
  const [json, setJson] = useState('[]');
  const [subUrl, setSubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  const load = () => {
    setLoading(true);
    getConfig()
      .then((c: Record<string, unknown>) => {
        const outbounds = c.outbounds as unknown[] | undefined;
        setJson(JSON.stringify(outbounds ?? [], null, 2));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    let arr: unknown[];
    try {
      arr = JSON.parse(json);
      if (!Array.isArray(arr)) throw new Error('Must be array');
    } catch {
      message.error('JSON 格式错误');
      return;
    }
    setSaving(true);
    try {
      const config = await getConfig();
      await putConfig({ ...config, outbounds: arr });
      message.success('已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addSubscription = async () => {
    if (!subUrl.trim()) {
      message.warning('请输入订阅链接');
      return;
    }
    setFetching(true);
    try {
      const { outbounds: newOutbounds } = await fetchSubscription(subUrl.trim());
      const current = JSON.parse(json) as unknown[];
      const next = [...current, ...newOutbounds];
      setJson(JSON.stringify(next, null, 2));
      message.success(`已添加 ${newOutbounds.length} 个节点`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '拉取订阅失败');
    } finally {
      setFetching(false);
    }
  };

  return (
    <Card title="出站 (支持机场订阅)" loading={loading}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="订阅链接 (支持明文多行 / Base64)"
          value={subUrl}
          onChange={(e) => setSubUrl(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <Button type="primary" onClick={addSubscription} loading={fetching}>
          拉取并追加节点
        </Button>
      </div>
      <Input.TextArea rows={24} value={json} onChange={(e) => setJson(e.target.value)} style={{ fontFamily: 'monospace' }} />
      <Button type="primary" onClick={save} loading={saving} style={{ marginTop: 16 }}>
        保存
      </Button>
    </Card>
  );
}
