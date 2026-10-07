import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CalculatorOutlined,
  DownOutlined,
  NodeIndexOutlined
} from '@ant-design/icons'
import { Collapse, Dropdown } from 'antd'
import type { MouseEvent, MutableRefObject } from 'react'
import {
  BASIC_PALETTE_MODELS,
  SUBSYSTEM_PALETTE_MODELS,
  type CanvasLiveStats,
  type CanvasProjectApi
} from '../canvas/CanvasWorkspace'

type ContextRow = {
  label: string
  value: string
}

type ResultRow = {
  label: string
  value: number
  unit: string
}

type CanvasSideInfoProps = {
  liveStats: CanvasLiveStats | null
  paletteGroupKey: string
  onPaletteGroupChange: (key: string) => void
  view: 'info' | 'palette'
  onBackToInfo: () => void
  projectApiRef: MutableRefObject<CanvasProjectApi | null>
  contextTitle?: string
  contextRows?: ContextRow[]
  resultTitle?: string
  resultRows?: ResultRow[]
  resultEmptyText?: string
}

export default function CanvasSideInfo({
  liveStats,
  paletteGroupKey,
  onPaletteGroupChange,
  view,
  onBackToInfo,
  projectApiRef,
  contextTitle,
  contextRows = [],
  resultTitle,
  resultRows = [],
  resultEmptyText = '完成测算后显示结果'
}: CanvasSideInfoProps) {
  const paletteModels =
    paletteGroupKey === 'mahalec' ? BASIC_PALETTE_MODELS : SUBSYSTEM_PALETTE_MODELS

  const handlePaletteItemMouseDown = (
    model: typeof paletteModels[number],
    event: MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    event.stopPropagation()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    const api = projectApiRef.current
    if (!api) return
    api.startPaletteDrag(model as Parameters<CanvasProjectApi['startPaletteDrag']>[0], event.clientX, event.clientY)
  }

  if (view === 'palette') {
    return (
      <div className="side-info__section">
        <div className="side-info__section-title">
          <button className="side-info__back-btn" type="button" onClick={onBackToInfo}>
            <ArrowLeftOutlined />
          </button>
          <AppstoreOutlined />
          <Dropdown
            menu={{
              items: [
                { key: 'mahalec', label: '基础图库' },
                { key: 'subsystem', label: '子系统模块' }
              ],
              selectable: true,
              selectedKeys: [paletteGroupKey],
              onClick: ({ key }) => onPaletteGroupChange(key)
            }}
            trigger={['click']}
          >
            <span className="side-info__section-title-dropdown">
              图库 <DownOutlined style={{ fontSize: 10 }} />
            </span>
          </Dropdown>
        </div>
        <div className="side-info__palette-list">
          {paletteModels.map((model) => (
            <div
              key={`${model.type}-${model.name}`}
              className="side-info__palette-item"
              onMouseDown={(event) => handlePaletteItemMouseDown(model, event)}
            >
              <img
                className="side-info__palette-item-icon"
                src={`/images/${model.cover}`}
                alt={model.name}
              />
              <span className="side-info__palette-item-name">{model.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const collapseItems = [
    ...(contextTitle && contextRows.length > 0
      ? [{
          key: 'context',
          label: (
            <span className="side-info__collapse-title">
              <AppstoreOutlined />
              <span>{contextTitle}</span>
            </span>
          ),
          children: (
            <div className="side-info__context-content">
              <div className="side-info__grid">
                {contextRows.map((row) => (
                  <div className="side-info__kv" key={row.label}>
                    <span className="side-info__key">{row.label}</span>
                    <span className="side-info__val" title={row.value}>{row.value}</span>
                  </div>
                ))}
              </div>
              {resultTitle ? (
                <div className="side-info__inline-result">
                  <div className="side-info__inline-title">
                    <CalculatorOutlined />
                    <span>{resultTitle}</span>
                  </div>
                  {resultRows.length > 0 ? (
                    <div className="side-info__result-list">
                      {resultRows.map((row) => (
                        <div className="side-info__result-row" key={row.label}>
                          <span className="side-info__result-label" title={row.label}>{row.label}</span>
                          <span className="side-info__result-value">
                            {row.value.toFixed(2)}
                            <span className="side-info__result-unit">{row.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="side-info__result-empty">{resultEmptyText}</div>
                  )}
                </div>
              ) : null}
            </div>
          )
        }]
      : []),
    {
      key: 'canvas',
      label: (
        <span className="side-info__collapse-title">
          <NodeIndexOutlined />
          <span>画布信息</span>
        </span>
      ),
      children: liveStats ? (
        <div className="side-info__grid">
          <div className="side-info__kv">
            <span className="side-info__key">当前画布</span>
            <span className="side-info__val">{liveStats.currentCanvasName}</span>
          </div>
          <div className="side-info__kv">
            <span className="side-info__key">节点 / 连线</span>
            <span className="side-info__val">{liveStats.nodeCount} / {liveStats.edgeCount}</span>
          </div>
          <div className="side-info__kv">
            <span className="side-info__key">缩放</span>
            <span className="side-info__val">{Math.round(liveStats.scale * 100)}%</span>
          </div>
          <div className="side-info__kv">
            <span className="side-info__key">坐标 X / Y</span>
            <span className="side-info__val">
              {liveStats.coordinate.x.toFixed(0)} / {liveStats.coordinate.y.toFixed(0)}
            </span>
          </div>
          {liveStats.selectedName && liveStats.selectedName !== '未选中图元' ? (
            <div className="side-info__kv">
              <span className="side-info__key">当前选择</span>
              <span className="side-info__val side-info__val--selected" title={liveStats.selectedName}>
                {liveStats.selectedName.length > 10
                  ? `${liveStats.selectedName.slice(0, 10)}...`
                  : liveStats.selectedName}
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="side-info__empty">加载中...</div>
      )
    }
  ]

  return (
    <Collapse
      className="side-info__collapse"
      bordered={false}
      expandIconPosition="end"
      defaultActiveKey={['context', 'canvas']}
      items={collapseItems}
    />
  )
}
