import { Card, Progress } from 'antd'
import type { ScheduleOptimizeResult } from '../../types'

type ScheduleMonitorOverviewProps = {
  schedule: ScheduleOptimizeResult
  activeDate: string
}

function formatProgressPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%'
  }

  const normalized = Math.round(value * 10) / 10
  return Number.isInteger(normalized) ? `${normalized.toFixed(0)}%` : `${normalized.toFixed(1)}%`
}

function getMonitorStatus(deltaPercent: number) {
  if (deltaPercent >= 2) {
    return { className: 'schedule-monitor-card--ahead', title: '进度超前', text: `偏差 +${deltaPercent.toFixed(1)}%` }
  }

  if (deltaPercent <= -2) {
    return { className: 'schedule-monitor-card--behind', title: '进度滞后', text: `偏差 ${deltaPercent.toFixed(1)}%` }
  }

  const prefix = deltaPercent > 0 ? '+' : ''
  return { className: 'schedule-monitor-card--normal', title: '进度正常', text: `偏差 ${prefix}${deltaPercent.toFixed(1)}%` }
}

export default function ScheduleMonitorOverview({
  schedule,
  activeDate
}: ScheduleMonitorOverviewProps) {
  const dailyResults = schedule.dailyResults || []
  const selectedIndex = Math.max(
    dailyResults.findIndex((item) => item.date === activeDate),
    0
  )
  const selectedRecord = dailyResults[selectedIndex] || dailyResults[0]
  const targetAmount = Number(schedule.plan.targetAmount || 0)
  const planDays = Number(schedule.plan.planningDays || dailyResults.length || 0)
  const cumulativeAmount = dailyResults
    .slice(0, selectedRecord ? selectedIndex + 1 : 0)
    .reduce((sum, item) => sum + Number(item.product || 0), 0)
  const progress = targetAmount > 0 ? Math.min((cumulativeAmount / targetAmount) * 100, 100) : 0
  const expectedProgress = planDays > 0 && selectedRecord ? ((selectedIndex + 1) / planDays) * 100 : 0
  const remainingAmount = Math.max(targetAmount - cumulativeAmount, 0)
  const predictedDaysLeft = targetAmount > 0 && cumulativeAmount > 0
    ? Math.max(Math.ceil((remainingAmount / cumulativeAmount) * (selectedIndex + 1)), 0)
    : Math.max(planDays - selectedIndex - 1, 0)
  const predictedDate = selectedRecord
    ? new Date(`${selectedRecord.date}T00:00:00`)
    : null
  if (predictedDate) {
    predictedDate.setDate(predictedDate.getDate() + predictedDaysLeft)
  }

  const status = getMonitorStatus(progress - expectedProgress)
  const selectedDateLabel = selectedRecord?.date || schedule.plan.startDate || '--'
  const predictedDateText = predictedDate
    ? predictedDate.toISOString().slice(0, 10)
    : schedule.plan.endDate

  return (
    <div className="schedule-monitor-overview">
      <Card className="schedule-monitor-overview__main" size="small" hoverable>
        <div className="schedule-monitor-card__content schedule-monitor-card__content--main">
          <span className="schedule-monitor-overview__label">{selectedDateLabel} 累计进度</span>
          <strong className="schedule-monitor-overview__value">{formatProgressPercent(progress)}</strong>
          <Progress percent={Number(progress.toFixed(1))} showInfo={false} size="small" />
        </div>
      </Card>

      <Card className="schedule-monitor-card" size="small" hoverable>
        <div className="schedule-monitor-card__content">
          <span>累计完成</span>
          <strong>{cumulativeAmount.toFixed(2)} t</strong>
        </div>
      </Card>

      <Card className="schedule-monitor-card" size="small" hoverable>
        <div className="schedule-monitor-card__content">
          <span>剩余产量</span>
          <strong>{remainingAmount.toFixed(2)} t</strong>
        </div>
      </Card>

      <Card className="schedule-monitor-card" size="small" hoverable>
        <div className="schedule-monitor-card__content">
          <span>预计完成日期</span>
          <strong>{predictedDateText}</strong>
        </div>
      </Card>

      <Card className={`schedule-monitor-card ${status.className}`} size="small" hoverable>
        <div className="schedule-monitor-card__content">
          <span>进度状态</span>
          <strong>{status.title}</strong>
          <small>{status.text}</small>
        </div>
      </Card>
    </div>
  )
}
