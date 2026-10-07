export const ROUTES = {
  dashboard: '/',
  canvas: '/canvas',
  event: '/event',
  materialCalculation: '/event/material-calculation',
  multiLoadOptimization: '/event/multi-load-optimization',
  resultsDaily: '/results/daily',
  resultsMonitor: '/results/monitor',
  resultsTrend: '/results/trend',
  login: '/login'
} as const

export type DashboardTopMenu = 'project' | 'event' | 'result'
export type ResultRouteView = 'daily' | 'monitor' | 'trend'
export type EventWorkspaceRouteView = 'material-calculation' | 'multi-load-optimization'

export type DashboardRouteState = {
  topMenu: DashboardTopMenu
  resultView: ResultRouteView | null
}

export const RESULT_VIEW_ROUTES: Record<ResultRouteView, string> = {
  daily: ROUTES.resultsDaily,
  monitor: ROUTES.resultsMonitor,
  trend: ROUTES.resultsTrend
}

export const EVENT_WORKSPACE_ROUTES: Record<EventWorkspaceRouteView, string> = {
  'material-calculation': ROUTES.materialCalculation,
  'multi-load-optimization': ROUTES.multiLoadOptimization
}

export const getEventWorkspaceRouteState = (pathname: string): EventWorkspaceRouteView =>
  pathname === ROUTES.multiLoadOptimization ? 'multi-load-optimization' : 'material-calculation'

export const getDashboardRouteState = (pathname: string): DashboardRouteState => {
  if (
    pathname === ROUTES.event ||
    pathname === ROUTES.materialCalculation ||
    pathname === ROUTES.multiLoadOptimization
  ) {
    return {
      topMenu: 'event',
      resultView: null
    }
  }

  if (pathname === ROUTES.resultsDaily) {
    return {
      topMenu: 'result',
      resultView: 'daily'
    }
  }

  if (pathname === ROUTES.resultsMonitor) {
    return {
      topMenu: 'result',
      resultView: 'monitor'
    }
  }

  if (pathname === ROUTES.resultsTrend) {
    return {
      topMenu: 'result',
      resultView: 'trend'
    }
  }

  return {
    topMenu: 'project',
    resultView: null
  }
}
