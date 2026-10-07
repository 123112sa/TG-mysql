import ReactECharts from 'echarts-for-react'
import type { DailyScheduleResult } from '../../types'

export type ScheduleTrendMetricKey =
  | 'product'
  | 'jb'
  | 'mxx'
  | 'ldx'
  | 'dnx'
  | 'sa'
  | 'fsa'
  | 'ylsn'
  | 'nx'

export const SCHEDULE_TREND_METRICS: Array<{
  value: ScheduleTrendMetricKey
  label: string
  unit: string
  axisTitle: string
}> = [
  { value: 'product', label: '硬质糖果产量', unit: 't', axisTitle: '产量（t）' },
  { value: 'jb', label: 'JB投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'mxx', label: 'MXX投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'ldx', label: 'L/DX投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'dnx', label: 'DNX投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'sa', label: 'SA投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'fsa', label: 'FSA投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'ylsn', label: 'YLSN投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
  { value: 'nx', label: 'NX投入量', unit: 'L/min', axisTitle: '投入量（L/min）' },
]

const formatProgressPercent = (value: number) => {
  const rounded = Number(value.toFixed(1))
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}

type Props = {
  dailyResults: DailyScheduleResult[]
  metricKey: ScheduleTrendMetricKey
  targetAmount: number
}

export default function ScheduleTrendChart({ dailyResults, metricKey, targetAmount }: Props) {
  const metric = SCHEDULE_TREND_METRICS.find((m) => m.value === metricKey) || SCHEDULE_TREND_METRICS[0]
  const values = dailyResults.map((item) => Number(item[metric.value] || 0))

  if (values.length === 0) {
    return <div className="schedule-trend-empty">暂无趋势数据</div>
  }

  const dates = dailyResults.map((item) => item.date)
  const maxValue = Math.max(...values, metric.value === 'product' ? 120 : 50)
  const yMax = Math.ceil(maxValue / 10) * 10

  const cumulativeProducts = dailyResults.reduce<number[]>((acc, item, index) => {
    const previous = index > 0 ? acc[index - 1] : 0
    acc.push(previous + Number(item.product || 0))
    return acc
  }, [])

  const option = {
    grid: {
      left: 64,
      right: 36,
      top: 28,
      bottom: 58,
    },
    xAxis: {
      type: 'category' as const,
      data: dates,
      axisLine: { lineStyle: { color: '#c0d0e6' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#718199',
        fontSize: 12,
        formatter: (value: string) => value.slice(5), // MM-DD
        interval: dates.length <= 8 ? 0 : Math.ceil(dates.length / 8) - 1,
        rotate: dates.length > 12 ? 45 : 0,
      },
      name: '日期',
      nameLocation: 'center' as const,
      nameGap: 38,
      nameTextStyle: { color: '#718199', fontSize: 12 },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: yMax,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#e8eef5', type: 'dashed' as const } },
      axisLabel: { color: '#718199', fontSize: 12 },
      name: metric.axisTitle,
      nameTextStyle: { color: '#718199', fontSize: 12 },
      nameGap: 44,
      nameLocation: 'center' as const,
    },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'box-shadow:none;',
      formatter: (params: Array<{ dataIndex: number }>) => {
        if (!params || params.length === 0) return ''
        const idx = params[0].dataIndex
        const item = dailyResults[idx]
        const val = Number(item[metric.value] || 0)
        const prod = Number(item.product || 0)
        const progress = targetAmount > 0 ? Math.min((cumulativeProducts[idx] / targetAmount) * 100, 100) : 0
        return `
          <div class="schedule-trend-tooltip-card" style="box-sizing:border-box;min-width:238px;padding:15px 16px;border:1px solid rgba(94,139,210,0.18);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,251,255,0.96));box-shadow:0 18px 40px rgba(18,35,66,0.18);color:#203756;">
          <div style="font-weight:700;margin-bottom:10px;color:#203756;font-size:14px">${item.date}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:28px;margin-bottom:8px">
            <span style="color:#718199">${metric.label}</span>
            <strong style="color:#2f73d9;font-size:16px">${val.toFixed(2)} ${metric.unit}</strong>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:28px;margin-bottom:8px">
            <span style="color:#718199">产量</span>
            <strong style="color:#2d4059">${prod.toFixed(2)} t</strong>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:28px">
            <span style="color:#718199">累计进度</span>
            <strong style="color:#2d4059">${formatProgressPercent(progress)}</strong>
          </div>
          </div>
        `
      },
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        showSymbol: false,
        symbolSize: 4,
        lineStyle: { color: '#2f73d9', width: 2.5 },
        itemStyle: {
          color: '#2f73d9',
          borderColor: '#ffffff',
          borderWidth: 1.6,
          opacity: 0.55,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(47,115,217,0.12)' },
              { offset: 0.7, color: 'rgba(47,115,217,0.04)' },
              { offset: 1, color: 'rgba(47,115,217,0)' },
            ],
          },
        },
        emphasis: {
          focus: 'series' as const,
          symbolSize: 11,
          itemStyle: {
            color: '#2f73d9',
            borderColor: '#ffffff',
            borderWidth: 3,
            opacity: 1,
            shadowBlur: 16,
            shadowColor: 'rgba(47,115,217,0.42)',
          },
        },
      },
    ],
  }

  return (
    <div className="schedule-trend-chart">
      <ReactECharts
        option={option}
        style={{ height: 300, width: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}
