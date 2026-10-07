import {
  AimOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  ControlOutlined,
  ExperimentOutlined,
  FileExcelOutlined,
  FolderOpenOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
  SaveOutlined,
  TableOutlined
} from '@ant-design/icons'
import { Button, Card, DatePicker, Descriptions, Empty, Input, Layout, Menu, message, Modal, Progress, Select, Space, Statistic, Table, Tag } from 'antd'
import type { MenuProps } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { saveProjectApi } from '../../api/project'
import {
  downloadCustomScheduleReportApi,
  downloadScheduleReportApi,
  listScheduleReportFieldsApi
} from '../../api/reports'
import { validateScheduleResultApi } from '../../api/schedule'
import { inputToOutputApi } from '../../api/solve'
import type { CanvasLiveStats, CanvasProjectApi } from '../../components/canvas/CanvasWorkspace'
import CanvasWorkspace from '../../components/canvas/CanvasWorkspace'
import ScheduleMonitorChart from '../../components/charts/ScheduleMonitorChart'
import ScheduleMonitorOverview from '../../components/charts/ScheduleMonitorOverview'
import ScheduleTrendChart from '../../components/charts/ScheduleTrendChart'
import type { ScheduleTrendMetricKey } from '../../components/charts/ScheduleTrendChart'
import { SCHEDULE_TREND_METRICS } from '../../components/charts/ScheduleTrendChart'
import { getScheduleTrendMetricSummary } from '../../components/charts/scheduleChartUtils'
import AccountMenu from '../../components/common/AccountMenu'
import MaterialParameterModal from '../../components/materialCalculation/MaterialParameterModal'
import ConstraintPreviewModal from '../../components/modals/ConstraintPreviewModal'
import FactoryProductModal from '../../components/modals/FactoryProductModal'
import InputRequirementResultModal from '../../components/modals/InputRequirementResultModal'
import PlanScheduleModal from '../../components/modals/PlanScheduleModal'
import ScheduleReportModal from '../../components/modals/ScheduleReportModal'
import ScheduleResultValidationModal from '../../components/modals/ScheduleResultValidationModal'
import ProjectContextBar from '../../components/project/ProjectContextBar'
import CanvasSideInfo from '../../components/workbench/CanvasSideInfo'
import CanvasWorkbench from '../../components/workbench/CanvasWorkbench'
import { APP_NAME, COLLAPSED_APP_NAME } from '../../config'
import useProjectSession from '../../hooks/useProjectSession'
import {
  EVENT_WORKSPACE_ROUTES,
  getDashboardRouteState,
  getEventWorkspaceRouteState,
  RESULT_VIEW_ROUTES,
  ROUTES,
  type EventWorkspaceRouteView
} from '../../router'
import { useScheduleStore } from '../../store/scheduleStore'
import { useMaterialCalculationStore } from '../../store/materialCalculationStore'
import MaterialCalculationPage from '../MaterialCalculation'
import MultiLoadOptimizationPage from '../MultiLoadOptimization'
import type {
  DailyScheduleResult,
  InputToOutputResult,
  OutputToInputResult,
  PlanScheduleInput,
  ScheduleOptimizeResult,
  SchedulePlan,
  ScheduleReportField,
  ScheduleReportMode,
  ScheduleResultValidationResult,
  SolveMode,
  Xh2Route,
} from '../../types'
import { getProjectDefaultName, type NpimsProjectFile } from '../../utils/npimsProject'

const FACTORY_CANVAS_PROJECT_NAME = '化工厂'
dayjs.locale('zh-cn')

const { Header, Sider, Content } = Layout

type CanvasViewMode = 'model-edit' | 'solve-result' | 'schedule-result'
type ResultAnalysisView = 'daily' | 'monitor' | 'trend'

type DashboardPageProps = {
  currentUser: string
  accountMenuOpen: boolean
  outputToInputResult: OutputToInputResult | null
  solveMode: SolveMode
  paletteOpen: boolean
  onToggleAccountMenu: (open: boolean) => void
  onTogglePalette: () => void
  onLogout: () => void
  onSolveModeChange: (mode: SolveMode) => void
  onOutputToInputSolve: (route: Xh2Route) => Promise<OutputToInputResult | null | void> | OutputToInputResult | null | void
  onReset: () => void
}

export default function DashboardPage({
  currentUser,
  accountMenuOpen,
  outputToInputResult,
  solveMode,
  paletteOpen,
  onToggleAccountMenu,
  onTogglePalette,
  onLogout,
  onSolveModeChange,
  onOutputToInputSolve,
  onReset
}: DashboardPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const projectApiRef = useRef<CanvasProjectApi | null>(null)
  const pendingCanvasProjectRef = useRef<NpimsProjectFile | null>(null)
  const pendingCanvasNameRef = useRef<string | null>(null)
  const openFileInputRef = useRef<HTMLInputElement | null>(null)
  const [canvasResetToken, setCanvasResetToken] = useState(0)
  const [canvasMode, setCanvasMode] = useState<CanvasViewMode>('model-edit')
  const [canvasNames, setCanvasNames] = useState<string[]>(['main'])
  const [activeCanvas, setActiveCanvas] = useState('main')
  const [factoryProductOpen, setFactoryProductOpen] = useState(false)
  const [inputRequirementResultOpen, setInputRequirementResultOpen] = useState(false)
  const [materialParameterOpen, setMaterialParameterOpen] = useState(false)
  const [planScheduleOpen, setPlanScheduleOpen] = useState(false)
  const [projectSaveOpen, setProjectSaveOpen] = useState(false)
  const [projectSaveName, setProjectSaveName] = useState('')
  const [projectSaving, setProjectSaving] = useState(false)
  const [scheduleReportModalOpen, setScheduleReportModalOpen] = useState(false)
  const [scheduleValidationModalOpen, setScheduleValidationModalOpen] = useState(false)
  const [scheduleValidationLoading, setScheduleValidationLoading] = useState(false)
  const [scheduleValidationResult, setScheduleValidationResult] = useState<ScheduleResultValidationResult | null>(null)
  const [constraintPreviewOpen, setConstraintPreviewOpen] = useState(false)
  const [scheduleReportFields, setScheduleReportFields] = useState<ScheduleReportField[]>([])
  const [scheduleReportFieldsLoading, setScheduleReportFieldsLoading] = useState(false)
  const [scheduleReportDownloading, setScheduleReportDownloading] = useState(false)
  const [activeTopMenu, setActiveTopMenu] = useState<'project' | 'event' | 'result'>('project')
  const [siderCollapsed, setSiderCollapsed] = useState(false)
  const [openSiderMenuKeys, setOpenSiderMenuKeys] = useState<string[]>(['project'])
  const [projectLibraryOpen, setProjectLibraryOpen] = useState(false)
  const [reportLibraryOpen, setReportLibraryOpen] = useState(false)
  const [resultAnalysisView, setResultAnalysisView] = useState<ResultAnalysisView | null>(null)
  const [scheduleTrendMetric, setScheduleTrendMetric] = useState<ScheduleTrendMetricKey>('product')
  const [inputToOutputResult, setInputToOutputResult] = useState<InputToOutputResult | null>(null)
  const [solveResultProject, setSolveResultProject] = useState<NpimsProjectFile | null>(null)
  const [liveStats, setLiveStats] = useState<CanvasLiveStats | null>(null)
  const [paletteGroupKey, setPaletteGroupKey] = useState('mahalec')
  const [sidePanelView, setSidePanelView] = useState<'info' | 'palette'>('info')
  const handleLiveStatsChange = useCallback((stats: CanvasLiveStats) => setLiveStats(stats), [])
  const projectSession = useProjectSession()
  const handleProjectOpened = useCallback((project: NpimsProjectFile) => {
    projectSession.markLoaded(project.projectName)
  }, [projectSession.markLoaded])
  const scheduleOptimizeResult = useScheduleStore((state) => state.scheduleOptimizeResult)
  const schedulePlans = useScheduleStore((state) => state.schedulePlans)
  const schedulePlansLoading = useScheduleStore((state) => state.schedulePlansLoading)
  const schedulePlanDeleting = useScheduleStore((state) => state.schedulePlanDeleting)
  const selectedSchedulePlanId = useScheduleStore((state) => state.selectedSchedulePlanId)
  const activeScheduleDate = useScheduleStore((state) => state.activeScheduleDate)
  const setScheduleOptimizeResult = useScheduleStore((state) => state.setScheduleOptimizeResult)
  const setSelectedSchedulePlanId = useScheduleStore((state) => state.setSelectedSchedulePlanId)
  const setActiveScheduleDate = useScheduleStore((state) => state.setActiveScheduleDate)
  const loadSchedulePlansAction = useScheduleStore((state) => state.loadSchedulePlans)
  const loadSchedulePlanDetailAction = useScheduleStore((state) => state.loadSchedulePlanDetail)
  const deleteSelectedSchedulePlan = useScheduleStore((state) => state.deleteSelectedSchedulePlan)
  const optimizeSchedulePlan = useScheduleStore((state) => state.optimizeSchedulePlan)
  const resetScheduleState = useScheduleStore((state) => state.resetScheduleState)
  const materialConfiguration = useMaterialCalculationStore((state) => state.serverSnapshot)
  const materialRunning = useMaterialCalculationStore((state) => state.running)
  const loadMaterialParameters = useMaterialCalculationStore((state) => state.loadCurrent)
  const setMaterialRunning = useMaterialCalculationStore((state) => state.setRunning)
  const setMaterialResultStatus = useMaterialCalculationStore((state) => state.setResultStatus)
  const isOutputToInput = solveMode === 'output-to-input'
  const eventWorkspace = getEventWorkspaceRouteState(location.pathname)
  const navigateToCanvas = (section: 'project' | 'event' = 'project') => {
    navigate(section === 'event' ? EVENT_WORKSPACE_ROUTES['material-calculation'] : ROUTES.canvas)
  }
  const navigateToEventWorkspace = (workspace: EventWorkspaceRouteView) => {
    navigate(EVENT_WORKSPACE_ROUTES[workspace])
  }
  const navigateToResultView = (view: ResultAnalysisView) => {
    if (projectApiRef.current && !pendingCanvasProjectRef.current) {
      const snapshot = projectApiRef.current.exportProjectData(projectSession.name)
      if (snapshot) {
        if (snapshot.graph.content[activeCanvas]) {
          snapshot.graph.info.entrance = activeCanvas
          pendingCanvasNameRef.current = activeCanvas
        }
        pendingCanvasProjectRef.current = snapshot
      }
    }
    navigate(RESULT_VIEW_ROUTES[view])
  }

  const handleSaveProject = () => {
    setProjectSaveName(getProjectDefaultName('project'))
    setProjectSaveOpen(true)
  }

  const confirmSaveProject = async () => {
    const projectName = projectSaveName.trim()
    if (!projectName) {
      message.error('请输入工程文件名')
      return
    }

    const project = projectApiRef.current?.exportProjectData(projectName)
    if (!project) {
      message.error('当前画布还没有准备好，暂时无法保存')
      return
    }

    setProjectSaving(true)
    try {
      await saveProjectApi({ project })
      projectSession.markSaved(project.projectName)
      setProjectSaveOpen(false)
      message.success(`已保存 ${project.projectName}.npimsproj`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '工程保存失败')
    } finally {
      setProjectSaving(false)
    }
  }

  const handleOpenProjectClick = () => {
    openFileInputRef.current?.click()
  }

  const closePaletteIfOpen = () => {
    if (paletteOpen) {
      onTogglePalette()
    }
  }

  const openProjectLibraryPanel = () => {
    setReportLibraryOpen(false)
    setProjectLibraryOpen((open) => !open)
  }

  const openReportLibraryPanel = () => {
    setProjectLibraryOpen(false)
    setReportLibraryOpen((open) => !open)
  }

  const openPalettePanel = () => {
    setProjectLibraryOpen(false)
    setReportLibraryOpen(false)
    setSidePanelView((prev) => (prev === 'palette' ? 'info' : 'palette'))
  }

  const handleOpenProjectChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const project = await projectApiRef.current?.openProjectFile(file)
      if (!project) {
        message.error('当前画布还没有准备好，暂时无法打开工程')
        return
      }

      message.success(`已打开工程 ${project.projectName}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '打开工程失败')
    }
  }

  const handleSolveClick = async () => {
    const configuration = useMaterialCalculationStore.getState().serverSnapshot
    if (!configuration || configuration.mode !== solveMode || configuration.version < 1) {
      message.info('请先完成并保存当前测算模式的参数设置')
      setMaterialParameterOpen(true)
      return
    }

    setMaterialRunning(true)
    try {
      if (solveMode === 'input-to-output') {
        const result = await inputToOutputApi(configuration.route)
        setInputToOutputResult(result)
        const loadedProject = result.project
          ? projectApiRef.current?.loadProjectData(result.project)
          : await projectApiRef.current?.openProjectFromLibrary(FACTORY_CANVAS_PROJECT_NAME)
        if (!loadedProject) {
          throw new Error('测算结果工程加载失败')
        }
        setSolveResultProject(loadedProject)
        setCanvasMode('solve-result')
        setMaterialResultStatus('success')
        message.success('产量预测完成')
        return
      }

      const result = await onOutputToInputSolve(configuration.route)
      const loadedProject = result?.project
        ? projectApiRef.current?.loadProjectData(result.project)
        : null
      if (loadedProject) {
        setSolveResultProject(loadedProject)
        setCanvasMode('solve-result')
      }
      if (!loadedProject && result?.project) {
        throw new Error('测算结果工程加载失败')
      }
      setMaterialResultStatus('success')
    } catch (error) {
      setMaterialResultStatus('error')
      message.error(error instanceof Error ? error.message : '物料测算失败')
    } finally {
      setMaterialRunning(false)
    }
  }

  const loadSchedulePlans = async () => {
    try {
      return await loadSchedulePlansAction()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '历史方案获取失败')
      return []
    }
  }

  const loadResultSchedulePlanDetail = async (planId: string | number) => {
    try {
      return await loadSchedulePlanDetailAction(planId)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '历史方案获取失败')
      return null
    }
  }

  const loadSchedulePlanDetail = async (planId: string | number) => {
    try {
      const result = await loadSchedulePlanDetailAction(planId)
      if (!result) {
        return
      }
      const firstDate = result.dailyResults[0]?.date || ''
      const firstProject = firstDate ? result.projectsByDate?.[firstDate] || result.project : result.project

      setCanvasMode('schedule-result')

      if (firstProject) {
        projectApiRef.current?.loadProjectData(firstProject)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '历史方案获取失败')
    }
  }

  const handleViewScheduleResult = async () => {
    const planId = selectedSchedulePlanId ?? scheduleOptimizeResult?.plan.id
    if (planId === undefined || planId === null || planId === '') {
      message.info('请先选择历史方案')
      return
    }

    if (!scheduleOptimizeResult || String(scheduleOptimizeResult.plan.id) !== String(planId)) {
      const result = await loadResultSchedulePlanDetail(planId)
      if (!result) {
        return
      }
    }

    setActiveTopMenu('result')
    setOpenSiderMenuKeys(['result'])
    setResultAnalysisView('daily')
    navigateToResultView('daily')
  }

  const handleOpenScheduleCanvas = async () => {
    const planId = selectedSchedulePlanId ?? scheduleOptimizeResult?.plan.id
    if (planId === undefined || planId === null || planId === '') {
      message.info('请先选择历史方案')
      return
    }

    const result = !scheduleOptimizeResult || String(scheduleOptimizeResult.plan.id) !== String(planId)
      ? await loadResultSchedulePlanDetail(planId)
      : scheduleOptimizeResult
    if (!result) {
      return
    }

    const fallbackDate = result.dailyResults[0]?.date || ''
    const targetDate = activeScheduleDate || fallbackDate
    const project = targetDate ? result.projectsByDate?.[targetDate] || result.project : result.project
    if (!project) {
      message.error('当前方案没有对应的优化工程')
      return
    }

    setCanvasMode('schedule-result')
    setActiveTopMenu('event')
    setOpenSiderMenuKeys(['event'])
    setResultAnalysisView(null)
    if (targetDate) {
      setActiveScheduleDate(targetDate)
    }
    pendingCanvasProjectRef.current = project
    navigateToEventWorkspace('multi-load-optimization')
  }

  const handleDeleteSchedulePlan = () => {
    if (selectedSchedulePlanId === undefined) {
      message.info('请先选择历史方案')
      return
    }

    const selectedPlan = schedulePlans.find((plan) => String(plan.id) === String(selectedSchedulePlanId))
    const selectedPlanName = selectedPlan?.planName || scheduleOptimizeResult?.plan.planName || '当前方案'

    Modal.confirm({
      title: `确认删除方案“${selectedPlanName}”吗？`,
      content: '删除后该方案及其每日优化结果将从历史记录中移除。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          const nextPlans = await deleteSelectedSchedulePlan()
          if (!nextPlans) {
            return
          }
          const hasRemainingPlans = nextPlans.length > 0
          setResultAnalysisView(null)
          setCanvasMode(hasRemainingPlans ? 'schedule-result' : 'model-edit')
          projectApiRef.current?.clearProjectData()
          setCanvasNames(['main'])
          setActiveCanvas('main')
          message.success('历史方案已删除')
        } catch (error) {
          message.error(error instanceof Error ? error.message : '历史方案删除失败')
        }
      }
    })
  }

  const handleResultMenuClick = () => {
    setActiveTopMenu('result')
    setProjectLibraryOpen(false)
    loadSchedulePlans().then((plans) => {
      if (!scheduleOptimizeResult && selectedSchedulePlanId === undefined && plans[0]?.id !== undefined) {
        loadResultSchedulePlanDetail(plans[0].id)
      }
    })
  }

  useEffect(() => {
    const routeState = getDashboardRouteState(location.pathname)
    setActiveTopMenu(routeState.topMenu)
    setResultAnalysisView(routeState.resultView)

    if (routeState.topMenu === 'result') {
      setOpenSiderMenuKeys(['result'])
      setProjectLibraryOpen(false)
      setReportLibraryOpen(false)
      loadSchedulePlans().then((plans) => {
        if (!scheduleOptimizeResult && selectedSchedulePlanId === undefined && plans[0]?.id !== undefined) {
          loadResultSchedulePlanDetail(plans[0].id)
        }
      })
      return
    }

    setOpenSiderMenuKeys([routeState.topMenu])
  }, [location.pathname])

  useEffect(() => {
    if (getEventWorkspaceRouteState(location.pathname) !== 'material-calculation') return
    if (materialConfiguration?.mode === solveMode) return
    void loadMaterialParameters(solveMode).catch((error) => {
      message.error(error instanceof Error ? error.message : '加载物料测算参数失败')
    })
  }, [loadMaterialParameters, location.pathname, materialConfiguration?.mode, solveMode])

  const getSelectedScheduleReportPlanId = () => scheduleOptimizeResult?.plan.id ?? selectedSchedulePlanId

  const handleValidateScheduleResult = async () => {
    const planId = getSelectedScheduleReportPlanId()
    if (planId === undefined || planId === null || planId === '') {
      message.info('请先生成或选择一个多负荷优化方案')
      return
    }

    setScheduleValidationModalOpen(true)
    setScheduleValidationLoading(true)
    setScheduleValidationResult(null)
    try {
      const result = await validateScheduleResultApi(planId)
      setScheduleValidationResult(result)
      if (result.compliant) {
        message.success(result.summaryMessage || '调度方案合规')
      } else {
        message.error(result.summaryMessage || '调度方案存在约束异常')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '结果校验失败')
    } finally {
      setScheduleValidationLoading(false)
    }
  }

  const handleOpenScheduleReport = async () => {
    const planId = getSelectedScheduleReportPlanId()
    if (planId === undefined || planId === null || planId === '') {
      message.info('请先生成或选择一个多负荷优化方案')
      return
    }

    setScheduleReportModalOpen(true)
    if (scheduleReportFields.length > 0 || scheduleReportFieldsLoading) {
      return
    }

    setScheduleReportFieldsLoading(true)
    try {
      setScheduleReportFields(await listScheduleReportFieldsApi())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '报表字段加载失败')
    } finally {
      setScheduleReportFieldsLoading(false)
    }
  }

  const handleConfirmScheduleReportDownload = async (mode: ScheduleReportMode, fields: string[]) => {
    const planId = getSelectedScheduleReportPlanId()
    if (planId === undefined || planId === null || planId === '') {
      message.info('请先生成或选择一个多负荷优化方案')
      return
    }
    if (mode === 'custom' && fields.length === 0) {
      message.info('请至少选择一个报表字段')
      return
    }

    setScheduleReportDownloading(true)
    try {
      if (mode === 'full') {
        await downloadScheduleReportApi(planId)
      } else {
        await downloadCustomScheduleReportApi(planId, fields)
      }
      setScheduleReportModalOpen(false)
      message.success('报表下载已开始')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '报表下载失败')
    } finally {
      setScheduleReportDownloading(false)
    }
  }

  const handleOpenConstraintPreview = () => {
    if (!scheduleOptimizeResult) {
      message.info('请先生成或选择一个多负荷优化方案')
      return
    }
    setConstraintPreviewOpen(true)
  }

  const handlePlanScheduleConfirm = async (value: PlanScheduleInput) => {
    try {
      const nextPlanName = value.planName.trim()
      if (!nextPlanName) {
        message.error('请输入方案名称')
        return
      }

      const optimizeResult = await optimizeSchedulePlan({ ...value, planName: nextPlanName })
      if (optimizeResult.status === 'duplicate') {
        message.error('方案名称已存在，请更换名称')
        return
      }

      const result = optimizeResult.result
      const firstDate = result.dailyResults[0]?.date || ''
      const firstProject = firstDate ? result.projectsByDate?.[firstDate] || result.project : result.project

      setCanvasMode('schedule-result')
      setPlanScheduleOpen(false)
      setResultAnalysisView('daily')
      setActiveTopMenu('result')
      navigateToResultView('daily')
      loadSchedulePlans()

      if (firstProject) {
        projectApiRef.current?.loadProjectData(firstProject)
      }

      message.success(`多负荷优化完成，${result.plan.startDate} 至 ${result.plan.endDate}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '多负荷优化方案失败')
    }
  }

  const handleScheduleDateChange = (date: string) => {
    setActiveScheduleDate(date)
    const project = scheduleOptimizeResult?.projectsByDate?.[date]
    if (!project) {
      message.error('当前日期没有对应的优化工程')
      return
    }

    const loadedProject = projectApiRef.current?.loadProjectData(project)
    if (!loadedProject) {
      message.error('多负荷优化工程加载失败')
    }
  }

  const handleScheduleDatePickerChange = (date: Dayjs | null) => {
    if (!date) {
      return
    }

    handleScheduleDateChange(date.format('YYYY-MM-DD'))
  }

  const disableUnavailableScheduleDate = (date: Dayjs) => {
    if (!scheduleOptimizeResult) {
      return true
    }

    const value = date.format('YYYY-MM-DD')
    return !scheduleOptimizeResult.dailyResults.some((item) => item.date === value)
  }

  const handleResetClick = () => {
    resetScheduleState()
    setProjectLibraryOpen(false)
    setReportLibraryOpen(false)
    setInputToOutputResult(null)
    setSolveResultProject(null)
    setResultAnalysisView(null)
    setCanvasMode('model-edit')
    projectApiRef.current?.clearProjectData()
    projectSession.markCleared()
    setCanvasNames(['main'])
    setActiveCanvas('main')
    onReset()
    navigateToCanvas()
  }

  const activateSiderSection = (section: 'project' | 'event' | 'result') => {
    setActiveTopMenu(section)
    if (section !== 'result') {
      setResultAnalysisView(null)
    }
    if (section !== 'project') {
      setProjectLibraryOpen(false)
      setReportLibraryOpen(false)
    }
    if (section === 'result') {
      loadSchedulePlans()
    }
  }

  const selectedSiderMenuKeys = [
    projectLibraryOpen
      ? 'project-files'
      : reportLibraryOpen
        ? 'project-reports'
        : paletteOpen
          ? 'project-palette'
          : activeTopMenu === 'event'
            ? materialParameterOpen
              ? 'event-custom'
              : eventWorkspace === 'multi-load-optimization'
                ? 'event-multi-load-optimization'
                : 'event-material-calculation'
            : activeTopMenu === 'result' && resultAnalysisView
              ? `result-${resultAnalysisView === 'daily' ? 'daily' : resultAnalysisView === 'monitor' ? 'monitor' : 'trend'}`
            : ''
  ].filter(Boolean)

  const siderMenuItems: MenuProps['items'] = [
    {
      key: 'project',
      icon: <AppstoreOutlined />,
      label: '项目',
      children: [
        { key: 'project-open', icon: <FolderOpenOutlined />, label: '打开工程' },
        { key: 'project-save', icon: <SaveOutlined />, label: '保存工程' },
        { key: 'project-files', icon: <FolderOpenOutlined />, label: '工程文件' },
        { key: 'project-reports', icon: <FileExcelOutlined />, label: '历史报表' },
        { key: 'project-palette', icon: <AppstoreOutlined />, label: '基础图库' }
      ]
    },
    {
      key: 'event',
      icon: <ControlOutlined />,
      label: '事件',
      children: [
        { key: 'event-custom', icon: <ControlOutlined />, label: '事件自定义' },
        { key: 'event-material-calculation', icon: <NodeIndexOutlined />, label: '物料测算与预测' },
        { key: 'event-multi-load-optimization', icon: <AimOutlined />, label: '多负荷优化' }
      ]
    },
    {
      key: 'result',
      icon: <LineChartOutlined />,
      label: '结果',
      children: [
        { key: 'result-daily', icon: <TableOutlined />, label: '每日优化表' },
        { key: 'result-monitor', icon: <AimOutlined />, label: '监控预测' },
        { key: 'result-trend', icon: <LineChartOutlined />, label: '趋势图' }
      ]
    }
  ]

  const handleSiderMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('project-')) {
      setActiveTopMenu('project')
      navigateToCanvas()
    }
    if (key.startsWith('event-')) {
      activateSiderSection('event')
      if (key === 'event-multi-load-optimization') {
        navigateToEventWorkspace('multi-load-optimization')
      } else {
        navigateToEventWorkspace('material-calculation')
      }
    }
    if (key.startsWith('result-')) {
      setReportLibraryOpen(false)
      handleResultMenuClick()
    }

    switch (key) {
      case 'project-open':
        handleOpenProjectClick()
        break
      case 'project-save':
        handleSaveProject()
        break
      case 'project-files':
        openProjectLibraryPanel()
        break
      case 'project-reports':
        openReportLibraryPanel()
        break
      case 'project-palette':
        openPalettePanel()
        break
      case 'event-custom':
        setMaterialParameterOpen(true)
        break
      case 'event-material-calculation':
        if (canvasMode === 'schedule-result') {
          setCanvasMode('model-edit')
        }
        break
      case 'event-multi-load-optimization':
        setCanvasMode('schedule-result')
        loadSchedulePlans()
        break
      case 'result-daily':
        setResultAnalysisView('daily')
        navigateToResultView('daily')
        break
      case 'result-monitor':
        setResultAnalysisView('monitor')
        navigateToResultView('monitor')
        break
      case 'result-trend':
        setResultAnalysisView('trend')
        navigateToResultView('trend')
        break
      default:
        break
    }
  }

  const handleSchedulePlanSelection = (planId: string | number | undefined) => {
    setSelectedSchedulePlanId(planId)
    if (planId !== undefined) {
      loadSchedulePlanDetail(planId)
      return
    }
    setScheduleOptimizeResult(null)
    setActiveScheduleDate('')
    setResultAnalysisView(null)
    projectApiRef.current?.clearProjectData()
    setCanvasNames(['main'])
    setActiveCanvas('main')
  }

  const handleMaterialResultOpen = () => {
    if (isOutputToInput) {
      setInputRequirementResultOpen(true)
      return
    }
    setFactoryProductOpen(true)
  }

  const handleMaterialModeChange = (nextMode: SolveMode) => {
    onSolveModeChange(nextMode)
  }

  const materialParametersReady = Boolean(
    materialConfiguration
    && materialConfiguration.mode === solveMode
    && materialConfiguration.version > 0
  )
  const materialResultReady = isOutputToInput
    ? Boolean(outputToInputResult)
    : Boolean(inputToOutputResult)
  const productOutput = inputToOutputResult?.outputs?.find((item) => item.outputName === 'TG')
  const materialResultRows = isOutputToInput
    ? outputToInputResult
      ? [
          { label: 'JB 投入量', value: outputToInputResult.jb, unit: 'L/min' },
          { label: 'MXX 投入量', value: outputToInputResult.mxx, unit: 'L/min' },
          { label: 'L/DX 投入量', value: outputToInputResult.ldx, unit: 'L/min' },
          { label: 'YLSN 投入量', value: outputToInputResult.ylsn, unit: 'L/min' }
        ]
      : []
    : productOutput?.outputAmount !== undefined
      ? [{ label: '硬质糖果成品', value: productOutput.outputAmount, unit: '吨' }]
      : []
  const selectedSchedulePlan = schedulePlans.find(
    (plan) => String(plan.id) === String(selectedSchedulePlanId)
  )

  const workbenchContextBar = activeTopMenu === 'event' ? (
    eventWorkspace === 'multi-load-optimization' ? (
      <MultiLoadOptimizationPage
        activeCanvas={activeCanvas}
        canvasNames={canvasNames}
        activeDate={activeScheduleDate ? dayjs(activeScheduleDate) : null}
        plans={schedulePlans}
        selectedPlanId={selectedSchedulePlanId}
        plansLoading={schedulePlansLoading}
        planDeleting={schedulePlanDeleting}
        hasResult={Boolean(scheduleOptimizeResult)}
        disableDate={disableUnavailableScheduleDate}
        onCanvasChange={setActiveCanvas}
        onDateChange={handleScheduleDatePickerChange}
        onPlanChange={handleSchedulePlanSelection}
        onCreatePlan={() => setPlanScheduleOpen(true)}
        onDeletePlan={handleDeleteSchedulePlan}
        onViewResult={handleViewScheduleResult}
        onReset={handleResetClick}
        onResetView={() => setCanvasResetToken((value) => value + 1)}
      />
    ) : (
      <MaterialCalculationPage
        mode={solveMode}
        activeCanvas={activeCanvas}
        canvasNames={canvasNames}
        parametersReady={materialParametersReady}
        resultReady={materialResultReady}
        running={materialRunning}
        onModeChange={handleMaterialModeChange}
        onCanvasChange={setActiveCanvas}
        onOpenParameters={() => setMaterialParameterOpen(true)}
        onRun={handleSolveClick}
        onViewResult={handleMaterialResultOpen}
        onReset={handleResetClick}
        onResetView={() => setCanvasResetToken((value) => value + 1)}
      />
    )
  ) : (
    <ProjectContextBar
      projectName={projectSession.name}
      status={projectSession.status}
      activeCanvas={activeCanvas}
      canvasNames={canvasNames}
      hasCanvasContent={Boolean(liveStats && (liveStats.nodeCount > 0 || liveStats.edgeCount > 0))}
      onCanvasChange={setActiveCanvas}
      onOpenProject={handleOpenProjectClick}
      onSaveProject={handleSaveProject}
      onResetView={() => setCanvasResetToken((value) => value + 1)}
    />
  )

  const workbenchContextTitle = activeTopMenu === 'event'
    ? eventWorkspace === 'multi-load-optimization'
      ? '多负荷优化'
      : '物料测算与预测'
    : undefined
  const workbenchContextRows = activeTopMenu === 'event'
    ? eventWorkspace === 'multi-load-optimization'
      ? [
          { label: '当前方案', value: selectedSchedulePlan?.planName || '未选择' },
          { label: '计算日期', value: activeScheduleDate || '未选择' },
          { label: '运行状态', value: scheduleOptimizeResult ? '方案已加载' : '待创建方案' }
        ]
      : [
          { label: '测算模式', value: isOutputToInput ? '投料反算' : '产量预测' },
          { label: '参数状态', value: materialParametersReady ? '已录入' : '待录入' },
          { label: '结果状态', value: solveResultProject ? '已生成' : '待测算' }
        ]
    : []

  return (
    <div className="dashboard-wrap">
      <Layout className="dashboard-shell">
        <input
          ref={openFileInputRef}
          type="file"
          accept=".npimsproj,application/json"
          className="project-file-input"
          onChange={handleOpenProjectChange}
        />
        <Header className="system-header">
          <div className="system-header__left">
            <div className="system-logo">{siderCollapsed ? COLLAPSED_APP_NAME : APP_NAME}</div>
            <Button
              className="dashboard-sider-trigger"
              type="text"
              icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSiderCollapsed((value) => !value)}
            />
            <div className="system-menu">
              <button
                className={`system-menu__item${activeTopMenu === 'project' ? ' is-active' : ''}`}
                type="button"
                onClick={() => {
                  setActiveTopMenu('project')
                  navigateToCanvas()
                }}
              >
                项目
              </button>
              <button
                className={`system-menu__item${activeTopMenu === 'event' ? ' is-active' : ''}`}
                type="button"
                onClick={() => {
                  setActiveTopMenu('event')
                  setReportLibraryOpen(false)
                  navigateToCanvas('event')
                }}
              >
                事件
              </button>
              <button
                className={`system-menu__item${activeTopMenu === 'result' ? ' is-active' : ''}`}
                type="button"
                onClick={() => {
                  setReportLibraryOpen(false)
                  handleResultMenuClick()
                  navigateToResultView(resultAnalysisView || 'daily')
                }}
              >
                结果
              </button>
            </div>
          </div>
          <AccountMenu
            currentUser={currentUser}
            open={accountMenuOpen}
            onOpenChange={onToggleAccountMenu}
            onLogout={onLogout}
          />
        </Header>

        {activeTopMenu !== 'event' ? (
          <section className="toolbar-strip project-strip">
            <div className="toolbar-icons">
              {activeTopMenu === 'project' ? (
                <>
                  <button className="toolbar-icon toolbar-icon--button" type="button" onClick={handleOpenProjectClick}>
                    <FolderOpenOutlined />
                    <span>打开工程</span>
                  </button>
                  <button className="toolbar-icon toolbar-icon--button" type="button" onClick={handleSaveProject}>
                    <SaveOutlined />
                    <span>保存工程</span>
                  </button>
                  <button
                    className={`toolbar-icon toolbar-icon--button${reportLibraryOpen ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => {
                      const nextOpen = !reportLibraryOpen
                      setReportLibraryOpen(nextOpen)
                    }}
                  >
                    <FileExcelOutlined />
                    <span>历史报表</span>
                  </button>
                </>
              ) : null}

              {activeTopMenu === 'result' ? (
                <>
                  <button
                    className="toolbar-icon toolbar-icon--button"
                    type="button"
                    onClick={() => {
                      if (!scheduleOptimizeResult) {
                        message.info('暂无多负荷优化结果')
                        return
                      }
                      setResultAnalysisView('daily')
                      navigateToResultView('daily')
                    }}
                  >
                    <TableOutlined />
                    <span>每日优化表</span>
                  </button>
                  <button
                    className="toolbar-icon toolbar-icon--button"
                    type="button"
                    onClick={() => {
                      if (!scheduleOptimizeResult) {
                        message.info('暂无多负荷优化结果')
                        return
                      }
                      setResultAnalysisView('monitor')
                      navigateToResultView('monitor')
                    }}
                  >
                    <AimOutlined />
                    <span>监控预测</span>
                  </button>
                  <button
                    className="toolbar-icon toolbar-icon--button"
                    type="button"
                    onClick={() => {
                      if (!scheduleOptimizeResult) {
                        message.info('暂无多负荷优化结果')
                        return
                      }
                      setResultAnalysisView('trend')
                      navigateToResultView('trend')
                    }}
                  >
                    <LineChartOutlined />
                    <span>趋势图</span>
                  </button>
                  <button
                    className="toolbar-icon toolbar-icon--button"
                    type="button"
                    onClick={handleOpenConstraintPreview}
                  >
                    <ExperimentOutlined />
                    <span>约束试运行</span>
                  </button>
                  <button
                    className="toolbar-icon toolbar-icon--button"
                    type="button"
                    disabled={scheduleReportDownloading}
                    onClick={handleOpenScheduleReport}
                  >
                    <FileExcelOutlined />
                    <span>报表</span>
                  </button>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        <Layout className="dashboard-body">
          <Sider
            className="dashboard-ant-sider"
            trigger={null}
            collapsible
            collapsed={siderCollapsed}
            collapsedWidth={64}
            breakpoint="lg"
            onCollapse={setSiderCollapsed}
            width={220}
          >
            <Menu
              className="dashboard-ant-menu"
              theme="dark"
              mode="inline"
              items={siderMenuItems}
              selectedKeys={selectedSiderMenuKeys}
              openKeys={siderCollapsed ? [] : openSiderMenuKeys}
              onClick={handleSiderMenuClick}
              onOpenChange={(keys) => {
                const validKeys = keys
                  .map(String)
                  .filter((key) => key === 'project' || key === 'event' || key === 'result')
                const latestKey = validKeys.find((key) => !openSiderMenuKeys.includes(key))
                const nextKeys = latestKey ? [latestKey] : validKeys
                setOpenSiderMenuKeys(nextKeys)
                if (latestKey === 'project' || latestKey === 'event' || latestKey === 'result') {
                  activateSiderSection(latestKey)
                }
              }}
            />
          </Sider>

          <Content
            className={`dashboard-main--canvas${activeTopMenu === 'result' ? ' dashboard-main--result' : ''}`}
          >
            {activeTopMenu === 'result' && resultAnalysisView ? (
              <ResultAnalysisWorkspace
                view={resultAnalysisView}
                schedule={scheduleOptimizeResult}
                activeDate={activeScheduleDate}
                plans={schedulePlans}
                selectedPlanId={selectedSchedulePlanId}
                plansLoading={schedulePlansLoading}
                reportDownloading={scheduleReportDownloading}
                trendMetric={scheduleTrendMetric}
                onTrendMetricChange={setScheduleTrendMetric}
                onPlanChange={(planId) => {
                  setSelectedSchedulePlanId(planId)
                  if (planId !== undefined) {
                    loadResultSchedulePlanDetail(planId)
                    return
                  }
                  setScheduleOptimizeResult(null)
                  setActiveScheduleDate('')
                }}
                onRefreshPlans={() => {
                  loadSchedulePlans()
                }}
                onOpenCanvas={handleOpenScheduleCanvas}
                onValidateResult={handleValidateScheduleResult}
                onOpenConstraintPreview={handleOpenConstraintPreview}
                onDownloadReport={handleOpenScheduleReport}
              />
            ) : (
              <CanvasWorkbench
                contextBar={workbenchContextBar}
                rightPanel={(
                  <CanvasSideInfo
                    liveStats={liveStats}
                    paletteGroupKey={paletteGroupKey}
                    onPaletteGroupChange={setPaletteGroupKey}
                    view={sidePanelView}
                    onBackToInfo={() => setSidePanelView('info')}
                    projectApiRef={projectApiRef}
                    contextTitle={workbenchContextTitle}
                    contextRows={workbenchContextRows}
                    resultTitle={eventWorkspace === 'material-calculation' ? '测算结果' : undefined}
                    resultRows={materialResultRows}
                  />
                )}
              >
                <CanvasWorkspace
                  showProjectLibrary={projectLibraryOpen}
                  showReportLibrary={reportLibraryOpen}
                  onCloseProjectLibrary={() => setProjectLibraryOpen(false)}
                  onCloseReportLibrary={() => setReportLibraryOpen(false)}
                  onLiveStatsChange={handleLiveStatsChange}
                  resetToken={canvasResetToken}
                  activeCanvasName={activeCanvas}
                  onCanvasNamesChange={setCanvasNames}
                  onActiveCanvasChange={setActiveCanvas}
                  onProjectChanged={projectSession.markChanged}
                  onProjectOpened={handleProjectOpened}
                  onProjectApiReady={(api) => {
                    projectApiRef.current = api
                    if (!api || !pendingCanvasProjectRef.current) {
                      return
                    }

                    const pendingProject = pendingCanvasProjectRef.current
                    const pendingCanvasName = pendingCanvasNameRef.current
                    const loadedProject = api.loadProjectData(pendingProject)
                    if (!loadedProject) {
                      message.error('工程画布恢复失败')
                      return
                    }
                    pendingCanvasProjectRef.current = null
                    pendingCanvasNameRef.current = null
                    if (pendingCanvasName && loadedProject.graph.content[pendingCanvasName]) {
                      // CanvasWorkspace 的首次同步 effect 仍持有挂载时的 main；等它结束后再恢复子画布。
                      window.requestAnimationFrame(() => setActiveCanvas(pendingCanvasName))
                    }
                  }}
                />
              </CanvasWorkbench>
            )}
          </Content>
        </Layout>
      </Layout>

      <Modal
        open={projectSaveOpen}
        title="保存工程"
        okText="保存"
        cancelText="取消"
        confirmLoading={projectSaving}
        okButtonProps={{ disabled: !projectSaveName.trim() }}
        onOk={confirmSaveProject}
        onCancel={() => { if (!projectSaving) setProjectSaveOpen(false) }}
        destroyOnHidden
      >
        <Input
          value={projectSaveName}
          onChange={(event) => setProjectSaveName(event.target.value)}
          onPressEnter={() => { void confirmSaveProject() }}
          placeholder="请输入工程文件名"
        />
      </Modal>
      <MaterialParameterModal
        open={materialParameterOpen}
        mode={solveMode}
        onModeChange={onSolveModeChange}
        onCancel={() => setMaterialParameterOpen(false)}
      />
      <InputRequirementResultModal
        open={inputRequirementResultOpen}
        result={outputToInputResult}
        onCancel={() => setInputRequirementResultOpen(false)}
      />
      <FactoryProductModal open={factoryProductOpen} mode={solveMode} onCancel={() => setFactoryProductOpen(false)} />
      <ScheduleReportModal
        open={scheduleReportModalOpen}
        loading={scheduleReportDownloading}
        fieldsLoading={scheduleReportFieldsLoading}
        fields={scheduleReportFields}
        onCancel={() => setScheduleReportModalOpen(false)}
        onDownload={handleConfirmScheduleReportDownload}
      />
      <ConstraintPreviewModal
        open={constraintPreviewOpen}
        schedule={scheduleOptimizeResult}
        onCancel={() => setConstraintPreviewOpen(false)}
      />
      <ScheduleResultValidationModal
        open={scheduleValidationModalOpen}
        loading={scheduleValidationLoading}
        result={scheduleValidationResult}
        onCancel={() => setScheduleValidationModalOpen(false)}
      />
      <PlanScheduleModal
        open={planScheduleOpen}
        onCancel={() => setPlanScheduleOpen(false)}
        onConfirm={handlePlanScheduleConfirm}
      />
    </div>
  )
}

function ResultAnalysisWorkspace({
  view,
  schedule,
  activeDate,
  plans,
  selectedPlanId,
  plansLoading,
  reportDownloading,
  trendMetric,
  onTrendMetricChange,
  onPlanChange,
  onRefreshPlans,
  onOpenCanvas,
  onValidateResult,
  onOpenConstraintPreview,
  onDownloadReport
}: {
  view: ResultAnalysisView
  schedule: ScheduleOptimizeResult | null
  activeDate: string
  plans: SchedulePlan[]
  selectedPlanId: string | number | undefined
  plansLoading: boolean
  reportDownloading: boolean
  trendMetric: ScheduleTrendMetricKey
  onTrendMetricChange: (metric: ScheduleTrendMetricKey) => void
  onPlanChange: (planId: string | number | undefined) => void
  onRefreshPlans: () => void
  onOpenCanvas: () => void
  onValidateResult: () => void
  onOpenConstraintPreview: () => void
  onDownloadReport: () => void
}) {
  const titles: Record<ResultAnalysisView, { title: string; desc: string }> = {
    daily: { title: '每日优化表', desc: '查看多负荷优化方案的每日投入量、产量与累计进度。' },
    monitor: { title: '监控预测', desc: '汇总当前调度进度，并对目标完成情况进行预测。' },
    trend: { title: '趋势图', desc: '按指标查看调度优化结果的时间序列变化。' }
  }

  return (
    <section className="result-workspace">
      <Card className="result-workspace__header" size="small">
        <div>
          <h2>{titles[view].title}</h2>
          <p>{titles[view].desc}</p>
        </div>
      </Card>

      <Card className="result-plan-bar" size="small">
        <div className="result-plan-bar__main">
          <Select
            allowClear
            showSearch
            placeholder="选择历史优化方案"
            loading={plansLoading}
            value={selectedPlanId}
            options={plans
              .filter((plan): plan is SchedulePlan & { id: string | number } => plan.id !== undefined)
              .map((plan) => ({
                value: plan.id,
                label: plan.planName || `${plan.startDate} ${plan.planningDays}天计划`
              }))}
            optionFilterProp="label"
            className="result-plan-bar__select"
            onChange={onPlanChange}
          />
          {schedule ? (
            <div className="result-plan-bar__meta">
              <span>{schedule.plan.startDate} 至 {schedule.plan.endDate}</span>
              <span>{schedule.plan.planningDays}天</span>
              <span>目标 {schedule.plan.targetAmount} 吨</span>
              <span>路线 {schedule.plan.route}</span>
            </div>
          ) : (
            <div className="result-plan-bar__meta result-plan-bar__meta--empty">
              请选择一个历史优化方案查看结果
            </div>
          )}
        </div>
        <Space className="result-plan-bar__actions" size={8} wrap>
          {view === 'daily' ? (
            <Button icon={<ExperimentOutlined />} disabled={!schedule} onClick={onValidateResult}>
              结果校验
            </Button>
          ) : null}
          <Button icon={<NodeIndexOutlined />} disabled={!schedule} onClick={onOpenCanvas}>
            打开对应画布
          </Button>
          <Button icon={<ReloadOutlined />} loading={plansLoading} onClick={onRefreshPlans}>
            刷新
          </Button>
          <Button icon={<ExperimentOutlined />} disabled={!schedule} onClick={onOpenConstraintPreview}>
            约束试运行
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            loading={reportDownloading}
            disabled={!schedule}
            onClick={onDownloadReport}
          >
            下载报表
          </Button>
        </Space>
      </Card>

      {!schedule ? (
        <Card className="result-workspace__empty">
          <Empty description="暂无多负荷优化结果，请在上方选择历史方案，或先在事件中生成多负荷优化方案。" />
        </Card>
      ) : (
        <>
          {view === 'daily' ? <DailyOptimizationPage schedule={schedule} /> : null}
          {view === 'monitor' ? <MonitorPredictionPage schedule={schedule} activeDate={activeDate} /> : null}
          {view === 'trend' ? (
            <TrendAnalysisPage
              schedule={schedule}
              trendMetric={trendMetric}
              onTrendMetricChange={onTrendMetricChange}
            />
          ) : null}
        </>
      )}
    </section>
  )
}

function DailyOptimizationPage({
  schedule
}: {
  schedule: ScheduleOptimizeResult
}) {
  const [detailDate, setDetailDate] = useState<string | null>(null)
  const stats = getDailyScheduleOverallStats(schedule)
  const detailIndex = detailDate ? schedule.dailyResults.findIndex((item) => item.date === detailDate) : -1
  const detailRecord = detailIndex >= 0 ? schedule.dailyResults[detailIndex] : null

  if (detailRecord) {
    return (
      <DailyOptimizationDetailPage
        schedule={schedule}
        record={detailRecord}
        index={detailIndex}
        onBack={() => setDetailDate(null)}
      />
    )
  }

  return (
    <div className="result-page result-page--monitor-soft">
      <div className="daily-dashboard">
        <Card className="daily-dashboard-main-card" hoverable>
          <div className="daily-dashboard-main-card__content">
            <Progress
              type="circle"
              percent={Number(stats.progress.toFixed(1))}
              size={118}
              status={stats.reachedTarget ? 'success' : 'active'}
            />
            <div className="daily-dashboard-main-card__body">
              <div className="daily-dashboard-main-card__eyebrow">方案完成概览</div>
              <h3>{schedule.plan.planName || '多负荷优化方案'}</h3>
              <div className="daily-dashboard-main-card__numbers">
                <span>总产量 <strong>{stats.totalProduct.toFixed(2)} t</strong></span>
                <span>目标 <strong>{stats.targetAmount.toFixed(2)} t</strong></span>
              </div>
              <div className="daily-dashboard-main-card__meta">
                <Tag color="blue">{schedule.plan.startDate} 至 {schedule.plan.endDate}</Tag>
                <Tag color="geekblue">路线 {schedule.plan.route}</Tag>
              </div>
            </div>
          </div>
        </Card>

        <div className="daily-dashboard-side-grid">
          <Card className="result-stat-card" size="small" hoverable>
            <Statistic title="计划周期" value={stats.planDays} suffix="天" />
          </Card>
          <Card className="result-stat-card" size="small" hoverable>
            <Statistic title="平均日产量" value={stats.averageDailyProduct} precision={2} suffix="t/日" />
          </Card>
          <Card className="result-stat-card" size="small" hoverable>
            <div className="result-status-card">
              <span>完成状态</span>
              <strong>{stats.statusTitle}</strong>
              <Tag color={stats.statusColor}>{stats.statusText}</Tag>
            </div>
          </Card>
        </div>
      </div>

      <Card className="result-table-card" title="每日优化明细">
        <Table<DailyScheduleResult>
          rowKey={(record) => record.date}
          size="small"
          pagination={false}
          scroll={{ x: 1320 }}
          sticky={{ offsetHeader: 0 }}
          dataSource={schedule.dailyResults}
          columns={getDailyScheduleColumns(schedule, setDetailDate)}
          rowClassName="daily-detail-row"
          onRow={(record) => ({
            onClick: () => setDetailDate(record.date)
          })}
        />
      </Card>
    </div>
  )
}

function DailyOptimizationDetailPage({
  schedule,
  record,
  index,
  onBack
}: {
  schedule: ScheduleOptimizeResult
  record: DailyScheduleResult
  index: number
  onBack: () => void
}) {
  const targetAmount = Number(schedule.plan.targetAmount || 0)
  const cumulativeAmount = schedule.dailyResults
    .slice(0, index + 1)
    .reduce((sum, item) => sum + Number(item.product || 0), 0)
  const cumulativeProgress = targetAmount > 0 ? Math.min((cumulativeAmount / targetAmount) * 100, 100) : 0
  const previousRecord = index > 0 ? schedule.dailyResults[index - 1] : null
  const productChange = previousRecord ? Number(record.product || 0) - Number(previousRecord.product || 0) : 0
  const inputRows = [
    { key: 'jb', material: 'JB', value: record.jb },
    { key: 'mxx', material: 'MXX', value: record.mxx },
    { key: 'ldx', material: 'L/DX', value: record.ldx },
    { key: 'dnx', material: 'DNX', value: record.dnx },
    { key: 'sa', material: 'SA', value: record.sa },
    { key: 'fsa', material: 'FSA', value: record.fsa },
    { key: 'ylsn', material: 'YLSN', value: record.ylsn },
    { key: 'nx', material: 'NX', value: record.nx }
  ]

  return (
    <div className="result-page daily-detail-page">
      <div className="daily-detail-page__toolbar">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回每日优化表
        </Button>
        <Tag color="blue">{record.date} {record.dayName}</Tag>
      </div>

      <Card className="result-overview-card" size="small">
        <Descriptions size="small" column={4}>
          <Descriptions.Item label="方案">{schedule.plan.planName || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前日期">
            {record.date} {record.dayName}
          </Descriptions.Item>
          <Descriptions.Item label="目标产量">{schedule.plan.targetAmount} 吨</Descriptions.Item>
          <Descriptions.Item label="路线">{schedule.plan.route}</Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="daily-detail-stat-grid">
        <Card className="result-stat-card result-stat-card--primary" size="small" hoverable>
          <Statistic title="当日产量" value={record.product} precision={2} suffix="t" />
        </Card>
        <Card className="result-stat-card" size="small" hoverable>
          <Statistic title="累计完成" value={cumulativeAmount} precision={2} suffix="t" />
        </Card>
        <Card className="result-stat-card" size="small" hoverable>
          <Statistic title="累计进度" value={cumulativeProgress} precision={1} suffix="%" />
          <Progress percent={Number(cumulativeProgress.toFixed(1))} showInfo={false} size="small" />
        </Card>
        <Card className="result-stat-card" size="small" hoverable>
          <Statistic
            title="较前日产量变化"
            value={previousRecord ? productChange : 0}
            precision={2}
            prefix={previousRecord && productChange > 0 ? '+' : undefined}
            suffix="t"
          />
        </Card>
      </div>

      <Card className="result-table-card" title="当日投入明细">
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={inputRows}
          columns={[
            { title: '物料', dataIndex: 'material', width: 160 },
            { title: '投入量', dataIndex: 'value', render: (value: number) => value.toFixed(2) },
            { title: '单位', render: () => 'L/min', width: 120 }
          ]}
        />
      </Card>
    </div>
  )
}

function MonitorPredictionPage({
  schedule,
  activeDate
}: {
  schedule: ScheduleOptimizeResult
  activeDate: string
}) {
  const [selectedMonitorDate, setSelectedMonitorDate] = useState(
    activeDate || schedule.dailyResults[0]?.date || ''
  )

  useEffect(() => {
    setSelectedMonitorDate(activeDate || schedule.dailyResults[0]?.date || '')
  }, [activeDate, schedule])

  return (
    <div className="result-page result-page--monitor-soft">
      <ScheduleMonitorOverview schedule={schedule} activeDate={selectedMonitorDate} />
      <Card className="result-chart-card" title="监控与预测">
        <ScheduleMonitorChart
          schedule={schedule}
          selectedDate={selectedMonitorDate}
          onSelectDate={setSelectedMonitorDate}
        />
      </Card>
    </div>
  )
}

function TrendAnalysisPage({
  schedule,
  trendMetric,
  onTrendMetricChange
}: {
  schedule: ScheduleOptimizeResult
  trendMetric: ScheduleTrendMetricKey
  onTrendMetricChange: (metric: ScheduleTrendMetricKey) => void
}) {
  const trendSummary = getScheduleTrendMetricSummary(schedule.dailyResults, trendMetric)
  const trendMetricMeta =
    SCHEDULE_TREND_METRICS.find((metric) => metric.value === trendMetric) || SCHEDULE_TREND_METRICS[0]
  const trendUnit = trendMetricMeta.unit

  return (
    <div className="result-page result-page--trend-soft">
      <Card className="result-chart-card">
        <div className="schedule-trend-controls">
          <span>展示指标</span>
          <Select<ScheduleTrendMetricKey>
            value={trendMetric}
            options={SCHEDULE_TREND_METRICS.map((metric) => ({ value: metric.value, label: metric.label }))}
            onChange={onTrendMetricChange}
            className="schedule-trend-select"
          />
        </div>
        <ScheduleTrendChart
          dailyResults={schedule.dailyResults}
          metricKey={trendMetric}
          targetAmount={Number(schedule.plan.targetAmount || 0)}
        />
      </Card>
      <div className="schedule-trend-summary-grid">
        <Card className="schedule-trend-summary-card" size="small" hoverable>
          <Statistic title="最大值" value={trendSummary.max.value.toFixed(2)} suffix={trendUnit} />
          <div className="schedule-trend-summary-card__date">{trendSummary.max.date || '--'}</div>
        </Card>
        <Card className="schedule-trend-summary-card" size="small" hoverable>
          <Statistic title="最小值" value={trendSummary.min.value.toFixed(2)} suffix={trendUnit} />
          <div className="schedule-trend-summary-card__date">{trendSummary.min.date || '--'}</div>
        </Card>
        <Card className="schedule-trend-summary-card" size="small" hoverable>
          <Statistic title="平均值" value={trendSummary.average.toFixed(2)} suffix={trendUnit} />
          <div className="schedule-trend-summary-card__date">全周期均值</div>
        </Card>
        <Card className="schedule-trend-summary-card" size="small" hoverable>
          <Statistic title="波动范围" value={trendSummary.range.toFixed(2)} suffix={trendUnit} />
          <div className="schedule-trend-summary-card__date">最大值 - 最小值</div>
        </Card>
      </div>
    </div>
  )
}

function getDailyScheduleOverallStats(schedule: ScheduleOptimizeResult) {
  const targetAmount = Number(schedule.plan.targetAmount || 0)
  const totalProduct = schedule.dailyResults.reduce((sum, item) => sum + Number(item.product || 0), 0)
  const planDays = Number(schedule.plan.planningDays || schedule.dailyResults.length || 0)
  const averageDailyProduct = planDays > 0 ? totalProduct / planDays : 0
  const progress = targetAmount > 0 ? Math.min((totalProduct / targetAmount) * 100, 100) : 0
  const remainingAmount = Math.max(targetAmount - totalProduct, 0)
  const reachedTarget = targetAmount > 0 && totalProduct >= targetAmount
  const nearTarget = targetAmount > 0 && progress >= 99
  const statusTitle = reachedTarget ? '已达成' : nearTarget ? '接近目标' : '未达成'
  const statusColor = reachedTarget ? 'success' : nearTarget ? 'processing' : 'warning'
  const statusText = `${formatProgressPercent(progress)} / 差额 ${remainingAmount.toFixed(2)}t`

  return {
    targetAmount,
    totalProduct,
    planDays,
    averageDailyProduct,
    progress,
    remainingAmount,
    reachedTarget,
    statusTitle,
    statusColor,
    statusText
  }
}

function getDailyScheduleColumns(schedule: ScheduleOptimizeResult, onOpenDetail: (date: string) => void) {
  return [
    {
      title: '日期信息',
      fixed: 'left' as const,
      children: [
        { title: '日期', dataIndex: 'date', fixed: 'left' as const, width: 112 },
        { title: '星期', dataIndex: 'dayName', width: 70 }
      ]
    },
    {
      title: '投入量（L/min）',
      children: [
        { title: 'JB', dataIndex: 'jb', width: 92, render: (value: number) => value.toFixed(2) },
        { title: 'MXX', dataIndex: 'mxx', width: 96, render: (value: number) => value.toFixed(2) },
        { title: 'L/DX', dataIndex: 'ldx', width: 96, render: (value: number) => value.toFixed(2) },
        { title: 'DNX', dataIndex: 'dnx', width: 96, render: (value: number) => value.toFixed(2) },
        { title: 'SA', dataIndex: 'sa', width: 92, render: (value: number) => value.toFixed(2) },
        { title: 'FSA', dataIndex: 'fsa', width: 92, render: (value: number) => value.toFixed(2) },
        { title: 'YLSN', dataIndex: 'ylsn', width: 96, render: (value: number) => value.toFixed(2) },
        { title: 'NX', dataIndex: 'nx', width: 92, render: (value: number) => value.toFixed(2) }
      ]
    },
    {
      title: '产出结果',
      children: [
        { title: '硬质糖果产量（t）', dataIndex: 'product', width: 145, render: (value: number) => value.toFixed(2) },
        {
          title: '累计进度',
          key: 'cumulativeProgress',
          width: 180,
          render: (_value: unknown, _record: DailyScheduleResult, index: number) => {
            const targetAmount = Number(schedule.plan.targetAmount || 0)
            if (targetAmount <= 0) {
              return '-'
            }

            const cumulativeAmount = schedule.dailyResults
              .slice(0, index + 1)
              .reduce((sum, item) => sum + Number(item.product || 0), 0)
            const progress = Math.min((cumulativeAmount / targetAmount) * 100, 100)
            return (
              <div className="schedule-progress-cell">
                <Progress percent={Number(progress.toFixed(1))} size="small" showInfo={false} />
                <span>{formatProgressPercent(progress)}</span>
              </div>
            )
          }
        },
        {
          title: '操作',
          key: 'action',
          width: 96,
          fixed: 'right' as const,
          render: (_value: unknown, record: DailyScheduleResult) => (
            <Button
              type="link"
              size="small"
              onClick={(event) => {
                event.stopPropagation()
                onOpenDetail(record.date)
              }}
            >
              查看详情
            </Button>
          )
        }
      ]
    }
  ]
}

function formatProgressPercent(value: number) {
  const rounded = Number(value.toFixed(1))
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}
