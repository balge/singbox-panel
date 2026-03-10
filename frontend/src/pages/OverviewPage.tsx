import { Card, Descriptions } from 'antd';

export default function OverviewPage() {
  return (
    <Card title="配置概览">
      <Descriptions column={1}>
        <Descriptions.Item label="说明">
          左侧菜单可编辑 sing-box 配置各模块。保存后写入 /config.json，仅包含 sing-box 所需字段。
        </Descriptions.Item>
        <Descriptions.Item label="日志">仅可配置 log level。</Descriptions.Item>
        <Descriptions.Item label="入站">默认端口 2081 / 2082 / 2083，可增删改。</Descriptions.Item>
        <Descriptions.Item label="出站">支持添加机场订阅链接，解析为节点并合并。</Descriptions.Item>
        <Descriptions.Item label="规则集">默认 rule_set 可编辑，可添加远程或本地规则。</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
