# B站点歌插件

这是一个Chrome浏览器扩展程序，可以在B站页面的视频卡片上添加"点歌"按钮，通过HTTP POST请求向指定服务器发送点歌请求。

## 功能特点

- 🎵 在B站视频卡片上自动添加点歌按钮
- 🔄 动态监听页面变化，支持动态加载的内容
- 📡 通过HTTP POST请求发送点歌请求
- ⚙️ 可配置的服务器地址、房间号和房间密码
- 💾 配置信息持久化存储
- 🎨 响应式设计，适配不同设备
- 🌙 支持深色模式和高对比度模式

## 安装方法

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入扩展程序页面 (`chrome://extensions/`)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

## 使用方法

### 1. 配置插件

1. 点击浏览器工具栏中的插件图标
2. 填写以下配置信息：
   - **服务器地址**: 服务器的域名和端口（例如：`example.com:8080`）
   - **房间号**: 点歌房间的ID
   - **房间密码**: 房间密码（可选）
3. 点击"保存配置"
4. 可选：点击"测试连接"验证配置是否正确

### 2. 点歌操作

1. 在任何B站页面（包含 `bilibili.com` 域名）浏览视频
2. 在视频卡片上会自动出现"点歌"按钮
3. 点击"点歌"按钮即可发送点歌请求
4. 按钮会显示发送状态（发送中、已点歌、失败等）

## 技术实现

### HTTP请求点歌

- 在background.js中处理点歌请求
- 使用标准的HTTP POST请求发送点歌信息
- 简单可靠，无需维护长连接

### 动态内容识别

- 使用MutationObserver监听页面DOM变化
- 自动识别新增的视频卡片元素
- 从视频链接中提取BV号

### 请求格式

发送到服务器的HTTP POST请求格式：

```json
{
  "houseId": "房间号",
  "password": "房间密码",
  "name": "BV1234567890",
  "source": "db"
}
```

### API端点

```http
POST https://{服务器地址}/music/pick
```

## 文件结构

```text
alisten-request-crx/
├── manifest.json          # 扩展程序清单文件
├── background.js          # 后台脚本，处理HTTP请求
├── content.js            # 内容脚本，处理页面元素
├── content.css           # 点歌按钮样式
├── popup.html            # 弹出页面HTML
├── popup.css             # 弹出页面样式
├── popup.js              # 弹出页面交互逻辑
├── icon16.png            # 16x16 图标
├── icon48.png            # 48x48 图标
├── icon128.png           # 128x128 图标
└── README.md             # 说明文档
```

## 浏览器兼容性

- Chrome 88+
- Edge 88+
- 其他基于Chromium的浏览器

## 注意事项

1. 插件只在包含 `bilibili.com` 域名的页面上工作
2. 需要配置正确的服务器地址才能正常工作
3. 服务器需要支持 HTTP POST 请求和指定的 API 格式
4. 插件使用简单的 HTTP 请求，无需维护连接状态

## 故障排除

### 点歌按钮不显示

- 检查是否在B站页面上
- 确认页面上存在 `.bili-video-card` 元素
- 检查浏览器控制台是否有错误信息

### 连接失败

- 验证服务器地址格式是否正确
- 检查服务器是否正在运行并且可访问
- 确认防火墙设置允许 HTTPS 连接
- 使用测试连接功能验证配置

### 点歌请求发送失败

- 检查网络连接
- 验证房间号和密码是否正确
- 查看浏览器控制台的错误信息
- 确认服务器支持 `/music/pick` API 端点

## 版本更新

### v1.1.0 - HTTP API 重构

- 🔄 **重大更新**: 从 WebSocket 连接改为 HTTP POST 请求
- 🗑️ **简化配置**: 移除了用户昵称配置项
- 📈 **性能提升**: 代码量减少 68%，更简单可靠
- 🧪 **改进测试**: 测试连接功能现在使用 HTTP 请求，提供更详细的错误信息
- ✅ **向后兼容**: 服务器同时支持新旧两种方式

### v1.0.0 - 初始版本

- 基于 WebSocket 的点歌功能
- 完整的配置界面
- 动态页面内容识别

## 开发说明

本项目使用纯JavaScript开发，遵循Chrome Extension Manifest V3规范。

### 开发环境

- Chrome 88+
- 文本编辑器或IDE

### 调试方法

1. 在扩展程序页面点击"检查视图"
2. 查看background.js和popup.js的控制台输出
3. 在网页上按F12查看content.js的控制台输出

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改善这个项目。
