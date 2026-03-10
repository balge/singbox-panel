import { Card, Input, Button, message } from 'antd';
import { useState, useEffect } from 'react';
import { getConfig, putConfig } from '../api';

export default function InboundsPage() {
  const [json, setJson] = useState('[]');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConfig()
      .then((c: Record<string, unknown>) => {
        const inbounds = c.inbounds as unknown[] | undefined;
        setJson(JSON.stringify(inbounds ?? [], null, 2));
      })
      .finally(() => setLoading(false));
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
      await putConfig({ ...config, inbounds: arr });
      message.success('已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="入站 (默认端口 2081 / 2082 / 2083)" loading={loading}>
      <Input.TextArea rows={20} value={json} onChange={(e) => setJson(e.target.value)} style={{ fontFamily: 'monospace' }} />
      <Button type="primary" onClick={save} loading={saving} style={{ marginTop: 16 }}>
        保存
      </Button>
    </Card>
  );
}
