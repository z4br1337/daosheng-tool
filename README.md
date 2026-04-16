# 学生成长档案可视化

导生/班委协同记录学生学习与心理情况，调用豆包大模型分析风险并标红，班级维度以词云和饼图可视化。

## 功能

- **学号注册 + 管理员审批**：用户注册绑定学号，管理员（学号 240153484）审批后方可使用
- **批量建档**：粘贴名单即可为每位学生创建空白档案
- **结构化记录**：按课堂出勤、学习困惑、学习态度、心理状态等字段分别填写
- **AI 分析**：一键调用豆包大模型（火山方舟），自动输出风险摘要并将关键短语标红
- **班级可视化**：出勤分布饼图 + 关键词词云，辅助例会复盘
- **移动端适配**：响应式布局，手机和电脑均可使用

## 技术栈

- Next.js 16 (App Router, Standalone output)
- Tailwind CSS 4
- Prisma + SQLite（可换 PostgreSQL）
- Recharts
- iron-session（Cookie 会话）
- 火山方舟豆包 API（OpenAI 兼容格式）

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 复制并编辑环境变量
cp .env.example .env
# 编辑 .env，填入 ARK_API_KEY 等

# 3. 初始化数据库
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

浏览器打开 http://localhost:3000，使用学号 **240153484** 注册即为管理员。

## 环境变量说明

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | 数据库连接串。本地默认 `file:./prisma/data.db`；Docker 镜像默认 `file:/app/prisma/data.db`（绝对路径，避免 SQLite 无法打开文件） |
| `SESSION_SECRET` | 是 | iron-session 加密密钥，≥32 字符 |
| `ARK_API_KEY` | 是 | 火山方舟 API Key（Bearer 令牌） |
| `ARK_BASE_URL` | 否 | 方舟端点，默认 `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_MODEL` | 是 | 模型名如 `doubao-seed-2-0-lite-260215` 或接入点 ID `ep-xxxx` |

## Zeabur 部署

1. 将仓库推送至 GitHub，在 Zeabur 绑定仓库并创建服务
2. 在服务环境变量中填入上表所有必填项
3. Zeabur 会自动检测 Dockerfile 并构建部署，暴露 8080 端口
4. **持久卷**：推荐挂到例如 `/data` 并设置 `DATABASE_URL=file:/data/data.db`。若挂到 `/app/prisma`，空卷会遮住镜像内的 `schema.prisma`，启动脚本会自动改用镜像内副本执行 `db push`；请确保该目录对运行用户可写
5. 如果希望使用 Zeabur 原生 Node 构建（而非 Docker），设置环境变量 `ZBPACK_IGNORE_DOCKERFILE=true`
