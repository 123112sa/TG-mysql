import ReactECharts from 'echarts-for-react'
import { useCallback, useRef } from 'react'
import type { ScheduleOptimizeResult } from '../../types'
import {
  formatProgressPercent,
  getScheduleMonitorDateFromActiveAxisPointer,
  getScheduleMonitorDateFromChartEvent,
  getScheduleProgressRows
} from './scheduleChartUtils'

type Props = {
  schedule: ScheduleOptimizeResult
  selectedDate?: string
  onSelectDate?: (date: string) => void
}

type ZrClickEvent = {
  offsetX: number
  offsetY: number
}

type ActiveAxisPointer = {
  value: string | number
  pixelX: number
}

type AxisPointerUpdateEvent = {
  axesInfo?: Array<{
    axisDim?: string
    axisIndex?: number
    value?: string | number
  }>
}

type EChartsInstance = {
  getZr?: () => {
    on: (eventName: 'click', handler: (event: ZrClickEvent) => void) => void
    off: (eventName: 'click', handler: (event: ZrClickEvent) => void) => void
  }
  containPixel?: (finder: { gridIndex: number }, value: [number, number]) => boolean
  convertToPixel?: (
    finder: { xAxisIndex: number },
    value: string | number
  ) => number | number[]
}

const AXIS_POINTER_CLICK_TOLERANCE = 24

export default function ScheduleMonitorChart({ schedule, selectedDate, onSelectDate }: Props) {
  const chartRef = useRef<ReactECharts | null>(null)
  const activeAxisPointerRef = useRef<ActiveAxisPointer | null>(null)
  const selectDateFromAxisPointerRef = useRef<(chart: EChartsInstance, event: ZrClickEvent) => void>()
  const rows = getScheduleProgressRows(schedule)
  const dates = rows.map((item) => item.date)
  const selectedIndex = rows.findIndex((item) => item.date === selectedDate)

  const selectDateFromAxisPointer = useCallback(
    (chart: EChartsInstance, event: ZrClickEvent) => {
      const point: [number, number] = [event.offsetX, event.offsetY]
      if (chart.containPixel && !chart.containPixel({ gridIndex: 0 }, point)) {
        return
      }

      const date = getScheduleMonitorDateFromActiveAxisPointer(
        schedule,
        activeAxisPointerRef.current,
        event.offsetX,
        AXIS_POINTER_CLICK_TOLERANCE
      )
      if (date) {
        onSelectDate?.(date)
      }
    },
    [onSelectDate, schedule]
  )
  selectDateFromAxisPointerRef.current = selectDateFromAxisPointer

  const updateActiveAxisPointer = useCallback((event: AxisPointerUpdateEvent) => {
    const chart = chartRef.current?.getEchartsInstance?.() as EChartsInstance | undefined
    const axisInfo = event.axesInfo?.find((item) => item.axisDim === 'x') || event.axesInfo?.[0]
    if (!chart?.convertToPixel || !axisInfo || axisInfo.value === undefined) {
      activeAxisPointerRef.current = null
      return
    }

    const pixel = chart.convertToPixel({ xAxisIndex: axisInfo.axisIndex || 0 }, axisInfo.value)
    const pixelX = Array.isArray(pixel) ? Number(pixel[0]) : Number(pixel)
    if (!Number.isFinite(pixelX)) {
      activeAxisPointerRef.current = null
      return
    }

    activeAxisPointerRef.current = {
      value: axisInfo.value,
      pixelX
    }
  }, [])

  const handleChartReady = useCallback((chart: EChartsInstance) => {
    const zr = chart?.getZr?.()
    if (!zr) {
      return
    }

    const handleAxisPointerClick = (event: ZrClickEvent) => {
      selectDateFromAxisPointerRef.current?.(chart, event)
    }

    zr.on('click', handleAxisPointerClick)
  }, [])

  if (rows.length === 0) {
    return <div className="schedule-trend-empty">暂无监控预测数据</div>
  }

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#ffffff',
      borderColor: '#c0d0e6',
      borderWidth: 1,
      textStyle: { color: '#2d4059', fontSize: 13 },
      boxShadow: '0 4px 16px rgba(85,118,170,0.18)',
      padding: [12, 16],
      axisPointer: {
        type: 'line',
        snap: true,
        lineStyle: {
          color: '#b8c1cc',
          width: 1,
          type: 'dashed' as const
        }
      },
      formatter: (params: Array<{ dataIndex: number }>) => {
        if (!params || params.length === 0) return ''
        const item = rows[params[0].dataIndex]
        if (!item) return ''

        return `
          <div style="font-weight:600;margin-bottom:8px;color:#2d4059">${item.date}</div>
          <div style="display:flex;gap:32px;margin-bottom:6px">
            <span style="color:#718199">累计进度</span>
            <strong style="color:#2f73d9">${formatProgressPercent(item.actualProgress)}</strong>
          </div>
          <div style="display:flex;gap:32px;margin-bottom:6px">
            <span style="color:#718199">均衡基准</span>
            <strong style="color:#b0bec5">${formatProgressPercent(item.baselineProgress)}</strong>
          </div>
          <div style="display:flex;gap:32px">
            <span style="color:#718199">累计产量</span>
            <strong style="color:#2d4059">${item.cumulativeAmount.toFixed(2)} t</strong>
          </div>
        `
      }
    },
    legend: {
      data: ['计划累计进度', '均衡基准进度'],
      top: 8,
      textStyle: { color: '#718199', fontSize: 12 },
      itemWidth: 24,
      itemHeight: 2
    },
    grid: {
      left: 64,
      right: 36,
      top: 56,
      bottom: 40
    },
    xAxis: {
      type: 'category' as const,
      data: dates,
      axisLine: { lineStyle: { color: '#c0d0e6' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#718199',
        fontSize: 12,
        formatter: (value: string) => value.slice(5),
        interval: dates.length <= 8 ? 0 : Math.ceil(dates.length / 8) - 1,
        rotate: dates.length > 12 ? 45 : 0
      },
      name: '日期',
      nameLocation: 'center' as const,
      nameGap: 32,
      nameTextStyle: { color: '#718199', fontSize: 12 }
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#e8eef5', type: 'dashed' as const } },
      axisLabel: {
        color: '#718199',
        fontSize: 12,
        formatter: (value: number) => `${value}%`
      },
      name: '累计进度（%）',
      nameTextStyle: { color: '#718199', fontSize: 12 },
      nameGap: 44,
      nameLocation: 'center' as const
    },
    series: [
      {
        name: '计划累计进度',
        type: 'line',
        data: rows.map((item, index) => ({
          value: item.actualProgress,
          symbolSize: index === selectedIndex ? 11 : 6,
          itemStyle:
            index === selectedIndex
              ? {
                  color: '#ffffff',
                  borderColor: '#2f73d9',
                  borderWidth: 4,
                  shadowBlur: 12,
                  shadowColor: 'rgba(47,115,217,0.35)'
                }
              : undefined
        })),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#2f73d9', width: 2.5 },
        itemStyle: {
          color: '#2f73d9',
          borderColor: '#ffffff',
          borderWidth: 2
        },
        emphasis: {
          focus: 'series' as const,
          symbolSize: 10
        }
      },
      {
        name: '均衡基准进度',
        type: 'line',
        data: rows.map((item) => item.baselineProgress),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#b0bec5', width: 2, type: 'dashed' as const },
        emphasis: { focus: 'series' as const }
      }
    ]
  }

  return (
    <div className="schedule-trend-chart">
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: 430, width: '100%' }}
        notMerge
        lazyUpdate
        opts={{ renderer: 'svg' }}
        onChartReady={handleChartReady}
        onEvents={{
          updateAxisPointer: updateActiveAxisPointer,
          click: (event: { dataIndex?: number }) => {
            const date = getScheduleMonitorDateFromChartEvent(schedule, event)
            if (date) {
              onSelectDate?.(date)
            }
          }
        }}
      />
    </div>
  )
}
