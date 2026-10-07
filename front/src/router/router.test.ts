import { getDashboardRouteState, getEventWorkspaceRouteState } from './index'

const assertDeepEqual = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

function run() {
  assertDeepEqual(getDashboardRouteState('/'), {
    topMenu: 'project',
    resultView: null
  })

  assertDeepEqual(getDashboardRouteState('/canvas'), {
    topMenu: 'project',
    resultView: null
  })

  assertDeepEqual(getDashboardRouteState('/event'), {
    topMenu: 'event',
    resultView: null
  })

  assertDeepEqual(getDashboardRouteState('/event/material-calculation'), {
    topMenu: 'event',
    resultView: null
  })

  assertDeepEqual(getDashboardRouteState('/event/multi-load-optimization'), {
    topMenu: 'event',
    resultView: null
  })

  assertDeepEqual(getEventWorkspaceRouteState('/event'), 'material-calculation')
  assertDeepEqual(getEventWorkspaceRouteState('/event/material-calculation'), 'material-calculation')
  assertDeepEqual(getEventWorkspaceRouteState('/event/multi-load-optimization'), 'multi-load-optimization')

  assertDeepEqual(getDashboardRouteState('/results/daily'), {
    topMenu: 'result',
    resultView: 'daily'
  })

  assertDeepEqual(getDashboardRouteState('/results/monitor'), {
    topMenu: 'result',
    resultView: 'monitor'
  })

  assertDeepEqual(getDashboardRouteState('/unknown'), {
    topMenu: 'project',
    resultView: null
  })
}

run()
