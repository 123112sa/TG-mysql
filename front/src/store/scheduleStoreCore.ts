import { createStore, type StoreApi } from 'zustand/vanilla'
import type { PlanScheduleInput, ScheduleOptimizeResult, SchedulePlan } from '../types'

export type ScheduleStoreServices = {
  listSchedulePlans: () => Promise<SchedulePlan[]>
  getSchedulePlan: (planId: number | string) => Promise<ScheduleOptimizeResult>
  deleteSchedulePlan: (planId: number | string) => Promise<unknown>
  optimizeSchedule: (input: PlanScheduleInput) => Promise<ScheduleOptimizeResult>
}

export type OptimizeSchedulePlanResult =
  | {
      status: 'success'
      result: ScheduleOptimizeResult
    }
  | {
      status: 'duplicate'
      plans: SchedulePlan[]
    }

type ScheduleStoreState = {
  scheduleOptimizeResult: ScheduleOptimizeResult | null
  schedulePlans: SchedulePlan[]
  selectedSchedulePlanId: string | number | undefined
  activeScheduleDate: string
  schedulePlansLoading: boolean
  schedulePlanDeleting: boolean
  scheduleOptimizing: boolean
}

export type ScheduleStore = ScheduleStoreState & {
  setScheduleOptimizeResult: (result: ScheduleOptimizeResult | null) => void
  setSchedulePlans: (plans: SchedulePlan[]) => void
  setSelectedSchedulePlanId: (planId: string | number | undefined) => void
  setActiveScheduleDate: (date: string) => void
  loadSchedulePlans: () => Promise<SchedulePlan[]>
  loadSchedulePlanDetail: (planId: string | number) => Promise<ScheduleOptimizeResult | null>
  deleteSelectedSchedulePlan: () => Promise<SchedulePlan[] | null>
  optimizeSchedulePlan: (input: PlanScheduleInput) => Promise<OptimizeSchedulePlanResult>
  resetScheduleState: () => void
}

const initialScheduleState: ScheduleStoreState = {
  scheduleOptimizeResult: null,
  schedulePlans: [],
  selectedSchedulePlanId: undefined,
  activeScheduleDate: '',
  schedulePlansLoading: false,
  schedulePlanDeleting: false,
  scheduleOptimizing: false
}

const getFirstScheduleDate = (result: ScheduleOptimizeResult) => result.dailyResults[0]?.date || ''

export const createScheduleStoreState =
  (services: ScheduleStoreServices) =>
  (
    set: StoreApi<ScheduleStore>['setState'],
    get: StoreApi<ScheduleStore>['getState']
  ): ScheduleStore => ({
    ...initialScheduleState,
    setScheduleOptimizeResult: (result) => set({ scheduleOptimizeResult: result }),
    setSchedulePlans: (plans) => set({ schedulePlans: plans }),
    setSelectedSchedulePlanId: (planId) => set({ selectedSchedulePlanId: planId }),
    setActiveScheduleDate: (date) => set({ activeScheduleDate: date }),
    loadSchedulePlans: async () => {
      set({ schedulePlansLoading: true })
      try {
        const plans = await services.listSchedulePlans()
        set({ schedulePlans: plans })
        return plans
      } finally {
        set({ schedulePlansLoading: false })
      }
    },
    loadSchedulePlanDetail: async (planId) => {
      const result = await services.getSchedulePlan(planId)
      set({
        scheduleOptimizeResult: result,
        selectedSchedulePlanId: result.plan.id ?? planId,
        activeScheduleDate: getFirstScheduleDate(result)
      })
      return result
    },
    deleteSelectedSchedulePlan: async () => {
      const planId = get().selectedSchedulePlanId
      if (planId === undefined) {
        return null
      }

      set({ schedulePlanDeleting: true })
      try {
        await services.deleteSchedulePlan(planId)
        const plans = await services.listSchedulePlans()
        set({
          schedulePlans: plans,
          selectedSchedulePlanId: undefined,
          scheduleOptimizeResult: null,
          activeScheduleDate: ''
        })
        return plans
      } finally {
        set({ schedulePlanDeleting: false })
      }
    },
    optimizeSchedulePlan: async (input) => {
      const nextPlanName = input.planName.trim()
      const cachedPlans = get().schedulePlans
      const plans = cachedPlans.length > 0 ? cachedPlans : await services.listSchedulePlans()

      if (plans.some((plan) => (plan.planName || '').trim() === nextPlanName)) {
        set({ schedulePlans: plans })
        return {
          status: 'duplicate',
          plans
        }
      }

      set({ scheduleOptimizing: true })
      try {
        const result = await services.optimizeSchedule({
          ...input,
          planName: nextPlanName
        })
        set({
          scheduleOptimizeResult: result,
          selectedSchedulePlanId: result.plan.id,
          activeScheduleDate: getFirstScheduleDate(result)
        })
        return {
          status: 'success',
          result
        }
      } finally {
        set({ scheduleOptimizing: false })
      }
    },
    resetScheduleState: () => set({ ...initialScheduleState })
  })

export function createScheduleStore(services: ScheduleStoreServices) {
  return createStore<ScheduleStore>()(createScheduleStoreState(services))
}
