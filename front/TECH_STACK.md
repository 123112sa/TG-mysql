# Front 技术栈说明

## 核心技术栈

- Node.js：`v16.20.2`
- TypeScript：`4.9.5`
- React：`18.2.0`
- React DOM：`18.2.0`
- Vite：`4.5.14`
- `@vitejs/plugin-react`：`3.1.0`

## 类型与开发辅助

- `@types/node`：`18.19.36`
- `@types/react`：`18.2.79`
- `@types/react-dom`：`18.2.25`
- `ts-node`：`10.9.1`

## UI 组件库

- Ant Design (`antd`)：`6.3.6`
- `@ant-design/icons`：`6.1.1`

## 编译与配置说明

- TypeScript 编译目标：`ES2020`
- JSX 运行时：`react-jsx`
- 构建工具：Vite
- 前端开发端口：`5173`
- 后端代理目标：`http://127.0.0.1:6000`

## 画布实现说明

当前界面中的“画布”不是第三方画布引擎，也不是基于某个独立 canvas 库实现的，因此没有单独的“画布版本号”。

它当前的实现方式是：

- 基于 React 组件实现
- 使用普通 DOM 元素（`div`）作为画布容器
- 使用 CSS 背景网格模拟画布网格
- 使用 Pointer 事件实现拖拽
- 使用 Wheel 事件实现缩放
- 使用 React 状态管理视图偏移、缩放比例和坐标显示

也就是说，这个画布本质上是：

```text
React 18 + TypeScript + DOM/CSS + Pointer/Wheel 事件
```

不是以下这类第三方画布库：

- Fabric.js
- Konva
- PixiJS
- AntV X6
- 原生 HTML5 Canvas 绘图库

## 主要相关文件

- `front/package.json`
- `front/tsconfig.json`
- `front/src/components/CanvasWorkspace.tsx`
- `front/vite.config.ts`

