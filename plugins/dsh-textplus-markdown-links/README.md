<p align="center"><strong>文本增强：markdown links</strong></p>

markdown links

## 安装（任选一种）

**1）插件市场（推荐）**：在 https://deepseekbase.com/zh/tools/ 搜索 textplus_markdown_links，点安装。

**2）命令行**：

    dsh plugin --profile web add dsh-textplus-markdown-links

**3）GitHub monorepo（不经 npm 也能装）**：

    dsh plugin --profile web add github:moldkey/dsh-plugins#path:/plugins/dsh-textplus-markdown-links

## 能做什么

- markdown links
- 本地执行，输入不出机器
- 只注册一个工具，不常驻进程、无需网络

## 用法

在会话里直接说「用markdown_links」，或调用工具 textplus_markdown_links。

    工具: textplus_markdown_links
    参数: text（必填）

## 示例

输入：

    Hello 世界 13812345678

工具会返回处理结果，末尾带全部工具入口。

## 兼容

- DSH >= 0.2.0-rc.2
- Node 18+
- 无外部依赖

## 更多

- 全部工具：https://deepseekbase.com/zh/tools/
- 同类插件：github.com/moldkey/dsh-plugins

## 许可

MIT
