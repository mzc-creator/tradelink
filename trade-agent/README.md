# TradeLink · 一期原型

完整 PRD：[`trade_agent_prd.md`](../trade_agent_prd.md)  
客户管理方案：[`crm_redesign.md`](../crm_redesign.md)

## 页面

| 文件 | 说明 |
|------|------|
| `proactive-agent-v1.html` | 营销Agent · 今日推荐 |
| `crm-v2.html` | 客户管理 · 企业 / 联系人双视图 |
| `customer-detail.html` | 企业详情（`?id=`）；旧的联系人 id 会转到所属企业 · 联系人 Tab |

浏览器直接打开，或双击 `open-agent.bat`。

## 规则摘要

- 销售阶段只在**企业**；联系人无独立阶段，列表展示所属企业阶段
- Agent 转客户 → 企业阶段默认「待联系」
- 询盘（表单/私信）同时创建企业 + 联系人；海关和企业资料可暂时为空
- 不设联系人详情页；核心触达信息在联系人列表，点所属企业进企业详情
