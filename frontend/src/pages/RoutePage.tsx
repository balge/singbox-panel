import { Card, Input, Button, message } from 'antd';
import { useState, useEffect } from 'react';
import { getConfig, putConfig } from '../api';

export default function RoutePage() {
  const [routeJson, setRouteJson] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConfig()
      .then((c: Record<string, unknown>) => {
        const route = c.route as Record<string, unknown> | undefined;
        setRouteJson(JSON.stringify(route ?? {}, null, 2));
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(routeJson);
      if (typeof obj !== 'object' || obj === null) throw new Error('Must be object');
    } catch {
      message.error('JSON 格式错误');
      return;
    }
    setSaving(true);
    try {
      const config = await getConfig();
      await putConfig({ ...config, route: obj });
      message.success('已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="路由 (rules / rule_set / final)" loading={loading}>
      <Input.TextArea rows={24} value={routeJson} onChange={(e) => setRouteJson(e.target.value)} style={{ fontFamily: 'monospace' }} />
      <Button type="primary" onClick={save} loading={saving} style={{ marginTop: 16 }}>
        保存
      </Button>
    </Card>
  );
}
