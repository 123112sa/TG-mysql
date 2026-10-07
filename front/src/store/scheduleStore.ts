import { create } from 'zustand'
import { deleteSchedulePlanApi, getSchedulePlanApi, listSchedulePlansApi, optimizeScheduleApi } from '../api/schedule'
import { createScheduleStoreState, type ScheduleStore, type ScheduleStoreServices } from './scheduleStoreCore'

const defaultScheduleServices: ScheduleStoreServices = {
  listSchedulePlans: listSchedulePlansApi,
  getSchedulePlan: getSchedulePlanApi,
  deleteSchedulePlan: deleteSchedulePlanApi,
  optimizeSchedule: optimizeScheduleApi
}

export const useScheduleStore = create<ScheduleStore>()(createScheduleStoreState(defaultScheduleServices))

export type { OptimizeSchedulePlanResult, ScheduleStore, ScheduleStoreServices } from './scheduleStoreCore'
export { createScheduleStore } from './scheduleStoreCore'
