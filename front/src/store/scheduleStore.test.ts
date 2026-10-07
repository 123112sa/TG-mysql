import { createScheduleStore } from './scheduleStoreCore'
import type { PlanScheduleInput, ScheduleOptimizeResult, SchedulePlan } from '../types'

const assertEqual = (actual: unknown, expected: unknown) => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`)
  }
}

const assertDeepEqual = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
}

const makeResult = (id: number | string, firstDate = '2026-07-08'): ScheduleOptimizeResult => ({
  plan: {
    id,
    planName: `plan-${id}`,
    startDate: firstDate,
    endDate: '2026-07-09',
    planningDays: 2,
    targetAmount: 100,
    route: 'MXX'
  },
  dailyResults: [
    {
      date: firstDate,
      dayIndex: 1,
      dayName: 'Wed',
      jb: 1,
      mxx: 2,
      ldx: 3,
      dnx: 4,
      sa: 5,
      fsa: 6,
      ylsn: 7,
      nx: 8,
      product: 9,
      mxxflc: 10,
      x2_2d: 11,
      cztg: 12,
      txxhcc: 13,
      yttg: 14,
      tg: 15
    }
  ],
  projectsByDate: {}
})

async function run() {
  const plans: SchedulePlan[] = [
    {
      id: 1,
      planName: 'existing',
      startDate: '2026-07-08',
      endDate: '2026-07-09',
      planningDays: 2,
      targetAmount: 100,
      route: 'MXX'
    }
  ]

  const store = createScheduleStore({
    listSchedulePlans: async () => plans,
    getSchedulePlan: async (planId: number | string) => makeResult(planId),
    deleteSchedulePlan: async () => undefined,
    optimizeSchedule: async (input: PlanScheduleInput) => makeResult(input.planName, input.startDate)
  })

  const loadedPlans = await store.getState().loadSchedulePlans()
  assertEqual(store.getState().schedulePlansLoading, false)
  assertDeepEqual(loadedPlans, plans)
  assertDeepEqual(store.getState().schedulePlans, plans)

  const detail = await store.getState().loadSchedulePlanDetail(1)
  assertEqual(detail?.plan.id, 1)
  assertEqual(store.getState().selectedSchedulePlanId, 1)
  assertEqual(store.getState().activeScheduleDate, '2026-07-08')

  const duplicateResult = await store.getState().optimizeSchedulePlan({
    planName: ' existing ',
    startDate: '2026-07-10',
    planningDays: 2,
    targetAmount: 120,
    route: 'MXX'
  })
  assertEqual(duplicateResult.status, 'duplicate')
  assertEqual(store.getState().scheduleOptimizeResult?.plan.id, 1)

  const optimizeResult = await store.getState().optimizeSchedulePlan({
    planName: 'new-plan',
    startDate: '2026-07-10',
    planningDays: 2,
    targetAmount: 120,
    route: 'MXX'
  })
  assertEqual(optimizeResult.status, 'success')
  assertEqual(store.getState().selectedSchedulePlanId, 'new-plan')
  assertEqual(store.getState().activeScheduleDate, '2026-07-10')

  await store.getState().deleteSelectedSchedulePlan()
  assertEqual(store.getState().selectedSchedulePlanId, undefined)
  assertEqual(store.getState().scheduleOptimizeResult, null)
  assertEqual(store.getState().activeScheduleDate, '')
  assertEqual(store.getState().schedulePlanDeleting, false)
}

run()
