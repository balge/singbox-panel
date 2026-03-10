import { Card, Form, Input, Switch, Button, message } from 'antd';
import { useState, useEffect } from 'react';
import { getConfig, putConfig } from '../api';

export default function ExperimentalPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getConfig()
      .then((c: Record<string, unknown>) => {
        const exp = c.experimental as Record<string, unknown> | undefined;
        if (exp) {
          const clash = exp.clash_api as Record<string, unknown> | undefined;
          const cache = exp.cache_file as Record<string, unknown> | undefined;
          form.setFieldsValue({
            external_controller: clash?.external_controller,
            secret: clash?.secret,
            cache_enabled: cache?.enabled ?? true,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [form]);

  const save = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const config = await getConfig();
      const exp = (config.experimental as Record<string, unknown>) || {};
      await putConfig({
        ...config,
        experimental: {
          ...exp,
          clash_api: {
            ...(exp.clash_api as object),
            external_controller: values.external_controller,
            secret: values.secret,
          },
          cache_file: { ...(exp.cache_file as object), enabled: values.cache_enabled },
        },
      });
      message.success('已保存');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="实验性 (clash_api / cache_file)" loading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item name="external_controller" label="clash_api.external_controller">
          <Input placeholder="127.0.0.1:9090" />
        </Form.Item>
        <Form.Item name="secret" label="clash_api.secret">
          <Input placeholder="secret" />
        </Form.Item>
        <Form.Item name="cache_enabled" label="cache_file.enabled" valuePropName="checked">
          <Switch />
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
