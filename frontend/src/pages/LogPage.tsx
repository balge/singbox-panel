import { Card, Select, Button, message } from 'antd';
import { useState, useEffect } from 'react';
import { getConfig, putConfig } from '../api';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic'];

export default function LogPage() {
  const [level, setLevel] = useState<string>('info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConfig()
      .then((c: Record<string, unknown>) => {
        const log = c.log as Record<string, unknown> | undefined;
        if (log && typeof log.level === 'string') setLevel(log.level);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const config = await getConfig();
      const next = { ...config, log: { ...(config.log as object), level } };
      await putConfig(next);
      message.success('已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="日志 (仅 level)" loading={loading}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>level</span>
        <Select value={level} onChange={setLevel} options={LOG_LEVELS.map((l) => ({ label: l, value: l }))} style={{ width: 120 }} />
        <Button type="primary" onClick={save} loading={saving}>
          保存
        </Button>
      </div>
    </Card>
  );
}
