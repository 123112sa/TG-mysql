import { AimOutlined, DeleteOutlined, DownOutlined, FileExcelOutlined, FolderOpenOutlined, ReloadOutlined } from '@ant-design/icons'
import { Card, Drawer, Dropdown } from 'antd'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  deleteProjectApi,
  listProjectFilesApi,
  openProjectApi,
  type ProjectLibraryFile
} from '../../api/project'
import {
  getHistoryReportOpenUrl,
  listHistoryReportsApi,
  type HistoryReportFile
} from '../../api/reports'
import {
  applyRenamePatchesToProject,
  createNpimsProjectFile,
  downloadNpimsProjectFile,
  parseNpimsProjectFile,
  type ModelLinkCompiledProject,
  type NpimsComponentRenamePatch,
  type NpimsProjectFile
} from '../../utils/npimsProject'

type Point = {
  x: number
  y: number
}

type GraphModel = {
  id?: string
  name?: string
  desc?: string
  _type?: string
  in?: Iterable<GraphRelationItem>
  out?: Iterable<GraphRelationItem>
  proto?: {
    _uType?: string
  }
  getRelation?: () => [
    GraphRelationItem[],
    GraphRelationItem[]
  ]
}

type GraphRelationItem = {
  id?: string
  name?: string
  _type?: string
}

type RelationViewItem = {
  id: string
  name: string
  model?: GraphModel
}

type ConnectorEndpoint = GraphRelationItem | [string, string, string] | null | undefined

type ConnectorModel = {
  source?: ConnectorEndpoint
  destination?: ConnectorEndpoint
  target?: ConnectorEndpoint
}

type PaletteModel = {
  cover: string
  type: string
  name: string
  preloadType?: 0 | 1 | 2 | 3
  preloadData?: unknown
  shape: {
    imgsrc: string
    points: number[]
    width?: number
    height?: number
  }
}

type PaletteGroup = {
  key: string
  name: string
  basePath: string
  models: PaletteModel[]
}

type ModelLinkCanvasStore<T> = {
  data?: T[]
  getData?: () => T[]
}

type ModelLinkCanvas = {
  name?: string
  active?: boolean
  el?: HTMLCanvasElement
  render?: () => void
  load?: (data: unknown) => void
  relink?: (data: unknown) => void
  setProperty?: (key: string, value: string) => void
  select?: (models: GraphModel[]) => void
  transform?: {
    translate?: Point
    boundary?: unknown
    scale?: number
    setTranslate?: (x: number, y: number) => void
    setScale?: (scale: number) => void
  }
  utils?: {
    resetTransform?: () => void
  }
  stores?: {
    gm?: ModelLinkCanvasStore<GraphModel>
    sub?: ModelLinkCanvasStore<GraphModel>
    port?: ModelLinkCanvasStore<GraphModel>
    connector?: ModelLinkCanvasStore<unknown>
  }
}

type ModelLinkInstance = {
  create: (name: string, active?: boolean, unique?: boolean) => ModelLinkCanvas
  display?: (name: string, animate?: boolean) => ModelLinkCanvas | null
  loadModels: (models: Record<string, PaletteGroup>) => void
  getModels?: () => Array<{ _uType?: string }>
  preload?: (model: unknown, type?: number) => { on?: (event: Event) => void }
  resetSize?: () => void
  destroy?: () => void
  compile?: (options?: { json?: boolean; name?: string }) => string | ModelLinkCompiledProject
  load?: (data: string, triggerLoad?: boolean) => void
  focus?: (model: GraphModel) => void
  activeCanvas?: ModelLinkCanvas
  canvasSet?: Record<string, ModelLinkCanvas>
}

export type CanvasProjectApi = {
  saveProjectFile: (projectName?: string) => NpimsProjectFile | null
  exportProjectData: (projectName?: string) => NpimsProjectFile | null
  loadProjectData: (project: NpimsProjectFile) => NpimsProjectFile | null
  clearProjectData: () => NpimsProjectFile | null
  openProjectFile: (file: File) => Promise<NpimsProjectFile | null>
  openProjectFromLibrary: (projectName: string) => Promise<NpimsProjectFile | null>
  applyComponentRenames: (patches: NpimsComponentRenamePatch[]) => NpimsProjectFile | null
  /** Start dragging a palette model from an external panel. */
  startPaletteDrag: (model: PaletteModel, clientX: number, clientY: number) => void
  /** Drop a palette model into the canvas at the given page coordinates. */
  dropPaletteModel: (model: PaletteModel, pageX: number, pageY: number) => void
}

export type CanvasLiveStats = {
  nodeCount: number
  edgeCount: number
  selectedName: string
  scale: number
  coordinate: { x: number; y: number }
  canvasCount: number
  currentCanvasName: string
}

type CanvasWorkspaceProps = {
  showProjectLibrary?: boolean
  showReportLibrary?: boolean
  onCloseProjectLibrary?: () => void
  onCloseReportLibrary?: () => void
  onLiveStatsChange?: (stats: CanvasLiveStats) => void
  resetToken?: number
  activeCanvasName?: string
  onCanvasNamesChange?: (names: string[]) => void
  onActiveCanvasChange?: (name: string) => void
  onProjectApiReady?: (api: CanvasProjectApi | null) => void
  onProjectChanged?: () => void
  onProjectOpened?: (project: NpimsProjectFile) => void
}

declare global {
  interface Window {
    ModelLink?: new (options: Record<string, unknown>) => ModelLinkInstance
  }
}

export const BASIC_PALETTE_MODELS: PaletteModel[] = [
  { cover: 'mahalec_icon_2/SOURCE.png', type: 'SOURCE', name: '原料', shape: { imgsrc: 'mahalec_icon_2/SOURCE.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/DESTINATION.png', type: 'DESTINATION', name: '产品', shape: { imgsrc: 'mahalec_icon_2/DESTINATION.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/STREAM.png', type: 'STREAM', name: '流股', shape: { imgsrc: 'mahalec_icon_2/STREAM.png', points: [0, 8, 16, 24], width: 20, height: 20 } },
  { cover: 'mahalec_icon_2/CDU.png', type: 'PROCESS', name: '加工装置', shape: { imgsrc: 'mahalec_icon_2/CDU.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/MIX.png', type: 'MIX', name: '汇流', shape: { imgsrc: 'mahalec_icon_2/MIX.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/SPLIT.png', type: 'SPLIT', name: '分流', shape: { imgsrc: 'mahalec_icon_2/SPLIT.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/BLENDER.png', type: 'BLENDER', name: '调和', shape: { imgsrc: 'mahalec_icon_2/BLENDER.png', points: [0, 8, 16, 24] } }
]

export const SUBSYSTEM_PALETTE_MODELS: PaletteModel[] = [
  { cover: 'mahalec_icon_2/SUB.png', type: 'SUBSYSTEM', name: '子系统模块', preloadType: 1, preloadData: 'subsystem', shape: { imgsrc: 'mahalec_icon_2/SUB.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/IN.png', type: 'SUBSYSTEM_IN', name: '入端口', preloadType: 2, preloadData: 'subsystem-in', shape: { imgsrc: 'mahalec_icon_2/IN.png', points: [0, 8, 16, 24] } },
  { cover: 'mahalec_icon_2/OUT.png', type: 'SUBSYSTEM_OUT', name: '出端口', preloadType: 3, preloadData: 'subsystem-out', shape: { imgsrc: 'mahalec_icon_2/OUT.png', points: [0, 8, 16, 24] } }
]

const MODEL_GROUPS: Record<string, PaletteGroup> = {
  mahalec: { key: 'mahalec', name: '基础图库', basePath: '/images/', models: BASIC_PALETTE_MODELS },
  subsystem: { key: 'subsystem', name: '子系统模块', basePath: '/images/', models: SUBSYSTEM_PALETTE_MODELS }
}

const PALETTE_GROUPS: PaletteGroup[] = [
  MODEL_GROUPS.mahalec,
  MODEL_GROUPS.subsystem
]

const REQUIRED_MODEL_TYPES = Array.from(
  new Set([...BASIC_PALETTE_MODELS, ...SUBSYSTEM_PALETTE_MODELS].map((model) => model.type))
)

const loadModelLinkScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.ModelLink) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-model-link="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('ModelLink_iii.js 加载失败')), {
        once: true
      })
      return
    }

    const script = document.createElement('script')
    script.src = '/ModelLink_iii.js'
    script.async = true
    script.dataset.modelLink = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('ModelLink_iii.js 加载失败'))
    document.body.appendChild(script)
  })

const waitForModelPrototypes = (
  modelLink: ModelLinkInstance,
  requiredTypes = REQUIRED_MODEL_TYPES,
  timeoutMs = 5000
) =>
  new Promise<void>((resolve, reject) => {
    const startedAt = Date.now()

    const check = () => {
      const loadedTypes = new Set(
        (modelLink.getModels?.() || [])
          .map((model) => model?._uType)
          .filter((type): type is string => !!type)
      )
      const missingTypes = requiredTypes.filter((type) => !loadedTypes.has(type))

      if (missingTypes.length === 0) {
        resolve()
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`画布模型资源加载超时：${missingTypes.join('、')}`))
        return
      }

      window.setTimeout(check, 50)
    }

    check()
  })

function centerCanvasOnOrigin(
  activeCanvas?: ModelLinkCanvas | null,
  syncState?: (next: { scale: number; coordinate: Point }) => void
) {
  if (centerCanvasTransformOnOrigin(activeCanvas, syncState)) {
    return
  }

  activeCanvas?.utils?.resetTransform?.()
  syncState?.({
    scale: 1,
    coordinate: { x: 0, y: 0 }
  })
}

/**
 * 将指定画布的视图重置到红点居中位置。
 * 非激活画布只写 transform，不主动 render，避免覆盖当前显示内容。
 */
function centerCanvasTransformOnOrigin(
  canvas?: ModelLinkCanvas | null,
  syncState?: (next: { scale: number; coordinate: Point }) => void,
  shouldRender = true
) {
  const canvasEl = canvas?.el

  if (!canvas?.transform || !canvasEl) {
    return false
  }

  // 激活画布需要立即渲染；非激活画布只预设初始 transform。
  if (shouldRender) {
    canvas.transform.setScale?.(1)
    canvas.transform.setTranslate?.(canvasEl.width / 2, canvasEl.height / 2)
    canvas.render?.()
    syncState?.({
      scale: 1,
      coordinate: { x: 0, y: 0 }
    })
    return true
  }

  canvas.transform.scale = 1
  canvas.transform.translate = {
    x: canvasEl.width / 2,
    y: canvasEl.height / 2
  }

  if (canvas.transform.boundary) {
    canvas.transform.boundary = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
  }

  return true
}

function syncCanvasLayout(
  mountHost: HTMLDivElement | null,
  mountEl: HTMLDivElement | null,
  modelLink: ModelLinkInstance | null,
  syncState?: (next: { scale: number; coordinate: Point }) => void
) {
  if (!mountHost || !mountEl || !modelLink) {
    return
  }

  const nextHeight = mountHost.clientHeight
  if (nextHeight > 0) {
    mountEl.style.height = `${nextHeight}px`
    mountEl.style.minHeight = `${nextHeight}px`
  }

  modelLink.resetSize?.()
  centerCanvasOnOrigin(modelLink.activeCanvas, syncState)
}

function getCanvasNames(modelLink: ModelLinkInstance | null) {
  const names = Object.keys(modelLink?.canvasSet || {})
  return names.length > 0 ? names : ['main']
}

function syncCanvasStats(
  activeCanvas: ModelLinkCanvas | undefined,
  setNodeCount: (count: number) => void,
  setEdgeCount: (count: number) => void
) {
  const nodes = activeCanvas?.stores?.gm?.getData?.() || activeCanvas?.stores?.gm?.data || []
  const edges =
    activeCanvas?.stores?.connector?.getData?.() || activeCanvas?.stores?.connector?.data || []

  setNodeCount(Array.isArray(nodes) ? nodes.length : 0)
  setEdgeCount(Array.isArray(edges) ? edges.length : 0)
}

function getEndpointId(endpoint: ConnectorEndpoint) {
  if (!endpoint) {
    return ''
  }

  if (Array.isArray(endpoint)) {
    return endpoint[2] || ''
  }

  return endpoint.id || ''
}

function getEndpointName(endpoint: ConnectorEndpoint, nodes: GraphModel[]) {
  if (!endpoint) {
    return ''
  }

  if (!Array.isArray(endpoint) && endpoint.name) {
    return endpoint.name
  }

  const endpointId = getEndpointId(endpoint)
  return nodes.find((node) => node.id === endpointId)?.name || endpointId
}

function getCanvasNodes(canvas?: ModelLinkCanvas | null) {
  const stores = canvas?.stores
  return [
    ...(stores?.gm?.getData?.() || stores?.gm?.data || []),
    ...(stores?.sub?.getData?.() || stores?.sub?.data || []),
    ...(stores?.port?.getData?.() || stores?.port?.data || [])
  ]
}

function uniqueRelationItems(items: RelationViewItem[]) {
  const map = new Map<string, RelationViewItem>()
  items.forEach((item) => {
    const key = item.id || item.name
    if (key && !map.has(key)) {
      map.set(key, item)
    }
  })
  return Array.from(map.values())
}

function formatProjectTime(raw?: string) {
  if (!raw) {
    return '时间未知'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return raw
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatFileSize(size?: number) {
  const bytes = Number(size || 0)
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CanvasWorkspace({
  showProjectLibrary = false,
  showReportLibrary = false,
  onCloseProjectLibrary,
  onCloseReportLibrary,
  onLiveStatsChange,
  resetToken = 0,
  activeCanvasName = 'main',
  onCanvasNamesChange,
  onActiveCanvasChange,
  onProjectApiReady,
  onProjectChanged,
  onProjectOpened
}: CanvasWorkspaceProps) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const mountHostRef = useRef<HTMLDivElement | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const mlRef = useRef<ModelLinkInstance | null>(null)
  const selectedModelRef = useRef<GraphModel | null>(null)
  const pendingCenterCanvasNamesRef = useRef<Set<string>>(new Set())
  const knownCanvasNamesRef = useRef<Set<string>>(new Set(['main']))
  const loadingProjectRef = useRef(false)
  const projectChangeReadyRef = useRef(false)
  const onProjectChangedRef = useRef(onProjectChanged)
  const onProjectOpenedRef = useRef(onProjectOpened)
  const selectSuppressed = useRef(false)

  useEffect(() => {
    onProjectChangedRef.current = onProjectChanged
  }, [onProjectChanged])

  useEffect(() => {
    onProjectOpenedRef.current = onProjectOpened
  }, [onProjectOpened])

  const notifyProjectChanged = () => {
    if (!projectChangeReadyRef.current || loadingProjectRef.current) {
      return
    }

    onProjectChangedRef.current?.()
  }

  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [scale, setScale] = useState(1)
  const [coordinate, setCoordinate] = useState<Point>({ x: 0, y: 0 })
  const [nodeCount, setNodeCount] = useState(0)
  const [edgeCount, setEdgeCount] = useState(0)
  const [selectedName, setSelectedName] = useState('未选中图元')

  // Push live stats up to parent so the right sidebar can display canvas info
  useEffect(() => {
    onLiveStatsChange?.({
      nodeCount,
      edgeCount,
      selectedName,
      scale,
      coordinate,
      canvasCount: 1,
      currentCanvasName: activeCanvasName,
    })
  }, [nodeCount, edgeCount, selectedName, scale, coordinate, activeCanvasName, onLiveStatsChange])

  const [selectedModel, setSelectedModel] = useState<GraphModel | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')
  const [activePaletteGroupKey, setActivePaletteGroupKey] = useState('mahalec')
  const [sidePanelWidth, setSidePanelWidth] = useState(0)
  const [projectFiles, setProjectFiles] = useState<ProjectLibraryFile[]>([])
  const [projectFilesLoading, setProjectFilesLoading] = useState(false)
  const [projectFilesError, setProjectFilesError] = useState('')
  const [projectActionName, setProjectActionName] = useState('')
  const [reportFiles, setReportFiles] = useState<HistoryReportFile[]>([])
  const [reportFilesLoading, setReportFilesLoading] = useState(false)
  const [reportFilesError, setReportFilesError] = useState('')
  const [ghost, setGhost] = useState<{
    visible: boolean
    left: number
    top: number
    model: PaletteModel | null
  }>({
    visible: false,
    left: 0,
    top: 0,
    model: null
  })
  const [draggingModel, setDraggingModel] = useState<PaletteModel | null>(null)

  const activePaletteGroup =
    PALETTE_GROUPS.find((group) => group.key === activePaletteGroupKey) || PALETTE_GROUPS[0]

  // 右侧面板优先级：报表库 > 图元属性 > 工程文件。
  const showInspectorPanel = !!selectedModel && !showReportLibrary
  const showProjectLibraryPanel = showProjectLibrary && !showReportLibrary && !showInspectorPanel
  const showReportLibraryPanel = showReportLibrary && !showInspectorPanel

  const closeReportLibrary = () => onCloseReportLibrary?.()
  const closeProjectLibrary = () => onCloseProjectLibrary?.()
  const closeInspector = () => {
    mlRef.current?.activeCanvas?.select?.([])
  }

  const handleFitCanvas = () => {
    if (!mlRef.current) return
    mlRef.current.resetSize?.()
  }

  function syncSelection(nextSelected: GraphModel | null) {
    selectedModelRef.current = nextSelected
    setSelectedModel(nextSelected ? { ...nextSelected } : null)
    setNameDraft(nextSelected?.name || '')
    setDescDraft(nextSelected?.desc || '')
    setSelectedName(nextSelected?.name || '未选中图元')
  }

  /**
   * 对待首次展示的画布做一次居中修正。
   * 完成后会从待处理集合移除，避免影响用户后续手动拖动画布。
   */
  const centerPendingCanvas = (canvasName: string) => {
    if (!pendingCenterCanvasNamesRef.current.has(canvasName)) {
      return
    }

    // 旧引擎切换子画布时会异步覆盖 transform，短时间多次校正更稳定。
    let attempt = 0
    const maxAttempts = 6

    const runCenter = () => {
      if (!pendingCenterCanvasNamesRef.current.has(canvasName)) {
        return
      }

      if (!mlRef.current?.activeCanvas || mlRef.current.activeCanvas.name !== canvasName) {
        if (attempt < maxAttempts) {
          attempt += 1
          window.setTimeout(runCenter, 60)
        }
        return
      }

      syncCanvasLayout(mountHostRef.current, mountRef.current, mlRef.current, ({
        scale: nextScale,
        coordinate: nextCoordinate
      }) => {
        setScale(nextScale)
        setCoordinate(nextCoordinate)
      })

      if (attempt >= maxAttempts - 1) {
        pendingCenterCanvasNamesRef.current.delete(canvasName)
        return
      }

      attempt += 1
      window.setTimeout(runCenter, 60)
    }

    window.setTimeout(runCenter, 30)
  }

  const exportProjectData = (projectName = 'project') => {
    const compiled = mlRef.current?.compile?.({ json: false })
    if (!compiled || typeof compiled === 'string') {
      return null
    }

    return createNpimsProjectFile(compiled, projectName)
  }

  /** 将工程对象统一装载回画布，并同步画布列表、统计和选中状态。 */
  const loadProjectDataIntoCanvas = (project: NpimsProjectFile) => {
    if (!mlRef.current?.load) {
      return null
    }

    // 工程加载会递归创建多张画布；加载期间禁止 create 包装逻辑额外 render。
    loadingProjectRef.current = true

    try {
      mlRef.current.load(JSON.stringify(project.graph), true)
    } finally {
      loadingProjectRef.current = false
    }

    const currentCanvasNames = getCanvasNames(mlRef.current)
    pendingCenterCanvasNamesRef.current = new Set(currentCanvasNames)
    knownCanvasNamesRef.current = new Set(currentCanvasNames)
    const entranceCanvasName = project.graph.info.entrance || 'main'
    const nextActiveCanvas = currentCanvasNames.includes(entranceCanvasName)
      ? entranceCanvasName
      : mlRef.current.activeCanvas?.name || 'main'

    if (mlRef.current.activeCanvas?.name !== nextActiveCanvas) {
      mlRef.current.display?.(nextActiveCanvas, false)
    }

    onCanvasNamesChange?.(currentCanvasNames)
    onActiveCanvasChange?.(mlRef.current.activeCanvas?.name || nextActiveCanvas)
    syncCanvasStats(mlRef.current.activeCanvas, setNodeCount, setEdgeCount)
    syncSelection(null)

    // 入口画布首次展示时做一次居中修正。
    centerPendingCanvas(nextActiveCanvas)

    return project
  }

  /** 清空当前工程并恢复到空的 main 画布。 */
  const clearProjectData = () => {
    return loadProjectDataIntoCanvas({
      format: 'npimsproj',
      version: '1.0.0',
      projectName: 'project',
      savedAt: new Date().toISOString(),
      graph: {
        info: {
          version: '1.0.0',
          name: 'project',
          timestamp: Date.now(),
          entrance: 'main'
        },
        content: {
          main: {}
        }
      }
    })
  }

  const saveProjectFile = (projectName = 'project') => {
    const project = exportProjectData(projectName)
    if (!project) {
      return null
    }

    downloadNpimsProjectFile(project, projectName)
    return project
  }

  /** 打开本地 `.npimsproj` 文件并恢复到画布。 */
  const openProjectFile = async (file: File) => {
    const raw = await file.text()
    const project = parseNpimsProjectFile(raw)
    const loadedProject = loadProjectDataIntoCanvas(project)
    if (loadedProject) {
      onProjectOpenedRef.current?.(loadedProject)
    }
    return loadedProject
  }

  /** 批量应用图元重命名补丁，并重新装载工程。 */
  const applyComponentRenames = (patches: NpimsComponentRenamePatch[]) => {
    const project = exportProjectData('project')
    if (!project) {
      return null
    }

    const nextProject = applyRenamePatchesToProject(project, patches)
    const loadedProject = loadProjectDataIntoCanvas(nextProject)
    if (loadedProject) {
      notifyProjectChanged()
    }
    return loadedProject
  }

  /** 读取右侧工程文件面板列表。 */
  const loadProjectLibrary = async () => {
    setProjectFilesLoading(true)
    setProjectFilesError('')

    try {
      const files = await listProjectFilesApi()
      setProjectFiles(Array.isArray(files) ? files : [])
    } catch (libraryError) {
      setProjectFiles([])
      setProjectFilesError(
        libraryError instanceof Error ? libraryError.message : '工程文件列表读取失败'
      )
    } finally {
      setProjectFilesLoading(false)
    }
  }

  const loadReportLibrary = async () => {
    setReportFilesLoading(true)
    setReportFilesError('')

    try {
      const files = await listHistoryReportsApi()
      setReportFiles(Array.isArray(files) ? files : [])
    } catch (libraryError) {
      setReportFiles([])
      setReportFilesError(
        libraryError instanceof Error ? libraryError.message : '\u5386\u53f2\u62a5\u8868\u5217\u8868\u8bfb\u53d6\u5931\u8d25'
      )
    } finally {
      setReportFilesLoading(false)
    }
  }

  const handleOpenHistoryReport = (reportFile: HistoryReportFile) => {
    window.open(getHistoryReportOpenUrl(reportFile.fileName), '_blank', 'noopener,noreferrer')
  }

  /** 从工程文件列表读取指定工程并装载到画布。 */
  const openProjectFromLibrary = async (projectName: string) => {
    setProjectActionName(projectName)

    try {
      const project = await openProjectApi({ projectName })
      const loadedProject = loadProjectDataIntoCanvas(project)
      if (loadedProject) {
        onProjectOpenedRef.current?.(loadedProject)
      }
      return loadedProject
    } finally {
      setProjectActionName('')
    }
  }

  const handleOpenProjectFromLibrary = async (projectFile: ProjectLibraryFile) => {
    try {
      await openProjectFromLibrary(projectFile.fileName)
    } catch (openError) {
      setProjectFilesError(openError instanceof Error ? openError.message : '工程读取失败')
    }
  }

  /** 从工程文件列表删除指定工程。 */
  const handleDeleteProjectFromLibrary = async (projectFile: ProjectLibraryFile) => {
    setProjectActionName(projectFile.fileName)

    try {
      await deleteProjectApi({ projectName: projectFile.fileName })
      setProjectFiles((current) => current.filter((item) => item.fileName !== projectFile.fileName))
    } catch (deleteError) {
      setProjectFilesError(deleteError instanceof Error ? deleteError.message : '工程删除失败')
    } finally {
      setProjectActionName('')
    }
  }

  useEffect(() => {
    if (!ready) {
      onProjectApiReady?.(null)
      return
    }

    onProjectApiReady?.({
      saveProjectFile,
      exportProjectData,
      loadProjectData: loadProjectDataIntoCanvas,
      clearProjectData,
      openProjectFile,
      openProjectFromLibrary,
      applyComponentRenames,
      startPaletteDrag,
      dropPaletteModel
    })

    return () => {
      onProjectApiReady?.(null)
    }
  }, [onProjectApiReady, ready])

  useEffect(() => {
    let disposed = false

    const syncSidePanelWidth = () => {
      const shellRect = shellRef.current?.getBoundingClientRect()
      if (!shellRect) {
        setSidePanelWidth(0)
        return
      }

      setSidePanelWidth(Math.max(0, Math.floor(window.innerWidth - shellRect.right)))
    }

    const syncCanvasMeta = (modelLink: ModelLinkInstance | null) => {
      const names = getCanvasNames(modelLink)
      onCanvasNamesChange?.(names)

      const currentCanvas = modelLink?.activeCanvas?.name || 'main'
      onActiveCanvasChange?.(currentCanvas)
      syncCanvasStats(modelLink?.activeCanvas, setNodeCount, setEdgeCount)
    }

    const init = async () => {
      try {
        await loadModelLinkScript()
        if (disposed || !mountRef.current || !window.ModelLink) {
          return
        }

        const modelLink = new window.ModelLink({
          el: mountRef.current,
          size: 2,
          settings: {
            grid: true,
            label: true,
            labelMode: 'name',
            magnet: true,
            noRepeatName: true
          },
          subscribers: {
            onCreate: () => {
              syncCanvasStats(modelLink.activeCanvas, setNodeCount, setEdgeCount)
              notifyProjectChanged()
            },
            onRemove: () => {
              syncCanvasStats(modelLink.activeCanvas, setNodeCount, setEdgeCount)
              syncSelection(null)
              notifyProjectChanged()
            },
            onConnect: () => {
              syncCanvasStats(modelLink.activeCanvas, setNodeCount, setEdgeCount)
              notifyProjectChanged()
            },
            onAddCanvas: () => {
              const nextNames = getCanvasNames(modelLink)
              nextNames.forEach((name) => {
                if (!knownCanvasNamesRef.current.has(name)) {
                  pendingCenterCanvasNamesRef.current.add(name)
                }
              })
              knownCanvasNamesRef.current = new Set(nextNames)
              syncCanvasMeta(modelLink)

              // 新建子系统画布后，先把当前激活画布校正到中心视图。
              const activeName = modelLink.activeCanvas?.name
              if (activeName) {
                centerPendingCanvas(activeName)
              }
              notifyProjectChanged()
            },
            onRemoveCanvas: () => {
              knownCanvasNamesRef.current = new Set(getCanvasNames(modelLink))
              syncCanvasMeta(modelLink)
              notifyProjectChanged()
            },
            onChangeCanvas: (opt: { v?: ModelLinkCanvas }) => {
              const name = opt?.v?.name || modelLink.activeCanvas?.name || 'main'
              onActiveCanvasChange?.(name)
              syncCanvasMeta(modelLink)
              syncSelection(null)
              centerPendingCanvas(name)
            },
            onScale: (opt: { v?: number }) => {
              setScale(opt?.v || 1)
            },
            onCoordinateChange: (opt: { v?: Point }) => {
              setCoordinate(opt?.v || { x: 0, y: 0 })
            },
            onSelect: (opt: { v?: GraphModel[] }) => {
              if (selectSuppressed.current) return
              syncSelection(opt?.v?.[0] || null)
            },
            onPropChange: (opt: { v?: { key?: string; target?: GraphModel } }) => {
              if (selectSuppressed.current) return
              const target = opt?.v?.target || null
              if (target) {
                syncSelection(target)
              }

              if (target?._type === 'sub' && opt?.v?.key === 'name') {
                onCanvasNamesChange?.(getCanvasNames(modelLink))
              }
              notifyProjectChanged()
            }
          }
        })

        mlRef.current = modelLink

        // 包装旧引擎的 create：新画布先登记为待居中，避免首次进入子系统时视图偏移。
        const rawCreate = modelLink.create.bind(modelLink)
        modelLink.create = (name: string, active = true, unique = true) => {
          const beforeNames = new Set(getCanvasNames(modelLink))
          const nextCanvas = rawCreate(name, active, unique)
          const nextCanvasName = nextCanvas?.name || name

          if (!beforeNames.has(nextCanvasName)) {
            pendingCenterCanvasNamesRef.current.add(nextCanvasName)
          }

          // 工程加载过程中只登记画布名，不插入额外 render。
          if (loadingProjectRef.current) {
            return nextCanvas
          }

          window.setTimeout(() => {
            centerCanvasTransformOnOrigin(nextCanvas, undefined, false)
          }, 0)

          window.setTimeout(() => {
            centerCanvasTransformOnOrigin(nextCanvas, undefined, false)
          }, 40)

          window.setTimeout(() => {
            centerCanvasTransformOnOrigin(nextCanvas, undefined, false)
          }, 120)

          return nextCanvas
        }

        modelLink.create('main')
        knownCanvasNamesRef.current = new Set(['main'])
        modelLink.loadModels(MODEL_GROUPS)
        await waitForModelPrototypes(modelLink)
        if (disposed) {
          return
        }

        syncCanvasLayout(mountHostRef.current, mountRef.current, modelLink, ({
          scale: nextScale,
          coordinate: nextCoordinate
        }) => {
          setScale(nextScale)
          setCoordinate(nextCoordinate)
        })
        syncCanvasMeta(modelLink)
        syncSidePanelWidth()
        projectChangeReadyRef.current = true
        setReady(true)
      } catch (scriptError) {
        setError(scriptError instanceof Error ? scriptError.message : '画布引擎初始化失败')
      }
    }

    init()

    return () => {
      disposed = true
      projectChangeReadyRef.current = false
      mlRef.current?.destroy?.()
      mlRef.current = null
      selectedModelRef.current = null
    }
  }, [onActiveCanvasChange, onCanvasNamesChange])

  useEffect(() => {
    if (!ready || !mlRef.current || !mountHostRef.current) {
      return
    }

    const syncSidePanelWidth = () => {
      const shellRect = shellRef.current?.getBoundingClientRect()
      if (!shellRect) {
        setSidePanelWidth(0)
        return
      }

      setSidePanelWidth(Math.max(0, Math.floor(window.innerWidth - shellRect.right)))
    }

    const syncCanvasSize = () => {
      syncCanvasLayout(mountHostRef.current, mountRef.current, mlRef.current, ({
        scale: nextScale,
        coordinate: nextCoordinate
      }) => {
        setScale(nextScale)
        setCoordinate(nextCoordinate)
      })
      syncSidePanelWidth()
    }

    const timer = window.setTimeout(syncCanvasSize, 80)
    const observer = new ResizeObserver(() => {
      syncCanvasSize()
    })
    observer.observe(mountHostRef.current)

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [ready])

  useEffect(() => {
    if (!ready || !activeCanvasName || !mlRef.current) {
      return
    }

    const currentCanvasName = mlRef.current.activeCanvas?.name || 'main'
    if (currentCanvasName === activeCanvasName) {
      centerPendingCanvas(activeCanvasName)
      return
    }

    mlRef.current.display?.(activeCanvasName, false)
    onActiveCanvasChange?.(mlRef.current.activeCanvas?.name || activeCanvasName)
    syncCanvasStats(mlRef.current.activeCanvas, setNodeCount, setEdgeCount)
    syncSelection(null)

    // 首次切到该画布时做居中修正。
    centerPendingCanvas(activeCanvasName)
  }, [activeCanvasName, ready])

  useEffect(() => {
    if (!ready || resetToken === 0) {
      return
    }

    centerCanvasOnOrigin(mlRef.current?.activeCanvas, ({ scale: nextScale, coordinate: nextCoordinate }) => {
      setScale(nextScale)
      setCoordinate(nextCoordinate)
    })
  }, [ready, resetToken])

  useEffect(() => {
    const syncSidePanelWidth = () => {
      const shellRect = shellRef.current?.getBoundingClientRect()
      if (!shellRect) {
        setSidePanelWidth(0)
        return
      }

      setSidePanelWidth(Math.max(0, Math.floor(window.innerWidth - shellRect.right)))
    }

    syncSidePanelWidth()
    window.addEventListener('resize', syncSidePanelWidth)

    return () => {
      window.removeEventListener('resize', syncSidePanelWidth)
    }
  }, [showProjectLibrary, selectedModel])

  useEffect(() => {
    if (!showProjectLibrary) {
      setProjectFilesError('')
      return
    }

    loadProjectLibrary()
  }, [showProjectLibrary])

  useEffect(() => {
    if (!showReportLibrary) {
      setReportFilesError('')
      return
    }

    loadReportLibrary()
  }, [showReportLibrary])

  const startPaletteDrag = (model: PaletteModel, clientX: number, clientY: number) => {
    if (!ready || !mlRef.current) {
      return
    }

    // 先取消当前选中图元，防止拖入时属性面板仍然打开。
    selectSuppressed.current = true
    mlRef.current.activeCanvas?.select?.([])

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    setDraggingModel(model)
    setGhost({
      visible: true,
      left: clientX - 20,
      top: clientY - 20,
      model
    })
  }

  const handlePaletteMouseDown = (model: PaletteModel, event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    startPaletteDrag(model, event.clientX, event.clientY)
  }

  const handlePaletteGroupSelect = (groupKey: string) => {
    setActivePaletteGroupKey(groupKey)
  }

  const stopDragging = () => {
    setDraggingModel(null)
    setGhost({
      visible: false,
      left: 0,
      top: 0,
      model: null
    })
    window.setTimeout(() => {
      selectSuppressed.current = false
    }, 100)
  }

  /**
   * Public helper exposed via CanvasProjectApi so the SideInfo palette
   * can drop a model into the canvas without the internal drag mask.
   */
  const dropPaletteModel = (model: PaletteModel, pageX: number, pageY: number) => {
    if (!ready || !mlRef.current || !mountRef.current) {
      return
    }

    // 先取消画布中当前选中的图元，启用 select suppression 防止 preload.on 事件重新触发 select
    selectSuppressed.current = true
    mlRef.current.activeCanvas?.select?.([])

    const rect = mountRef.current.getBoundingClientRect()
    const dropPayload = {
      offsetX: pageX - rect.left,
      offsetY: pageY - rect.top,
      data: model.preloadData ?? model.type
    }

    mlRef.current
      ?.preload?.(dropPayload.data, model.preloadType ?? 0)
      ?.on?.(dropPayload as unknown as Event)

    // 延迟解除 suppression，确保 preload 的所有异步事件都已忽略
    window.setTimeout(() => {
      selectSuppressed.current = false
    }, 100)
  }

  const handleDragMaskMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!draggingModel) {
      return
    }

    event.preventDefault()
    setGhost({
      visible: true,
      left: event.clientX - 20,
      top: event.clientY - 20,
      model: draggingModel
    })
  }

  const handleDragMaskUp = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!draggingModel) {
      return
    }

    const rect = mountRef.current?.getBoundingClientRect()
    if (rect) {
      const inCanvas =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (inCanvas) {
        const dropPayload = {
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          data: draggingModel.preloadData ?? draggingModel.type
        }

        mlRef.current
          ?.preload?.(dropPayload.data, draggingModel.preloadType ?? 0)
          ?.on?.(dropPayload as unknown as Event)
      }
    }

    stopDragging()
  }

  const handleUpdateSelectedName = () => {
    const nextName = nameDraft.trim()
    if (!selectedModelRef.current || !nextName) {
      return
    }

    mlRef.current?.activeCanvas?.setProperty?.('name', nextName)
    selectedModelRef.current.name = nextName
    setSelectedModel({ ...selectedModelRef.current })
    setSelectedName(nextName)
  }

  const handleUpdateSelectedDesc = () => {
    if (!selectedModelRef.current) {
      return
    }

    const nextDesc = descDraft.trim()
    mlRef.current?.activeCanvas?.setProperty?.('desc', nextDesc)
    selectedModelRef.current.desc = nextDesc
    setSelectedModel({ ...selectedModelRef.current })
  }

  const getSelectedRelations = (index: 0 | 1) => {
    const currentModel = selectedModelRef.current
    if (!currentModel?.id) {
      return []
    }

    const relationList = currentModel.getRelation?.()[index] || []
    const relationItems = uniqueRelationItems(
      relationList.map((item) => ({
        id: item.id || item.name || '',
        name: item.name || item.id || '',
        model: item as GraphModel
      }))
    )
    if (relationItems.length) {
      return relationItems
    }

    const directRelationList = Array.from(index === 0 ? currentModel.in || [] : currentModel.out || [])
    const directRelationItems = uniqueRelationItems(
      directRelationList.map((item) => ({
        id: item.id || item.name || '',
        name: item.name || item.id || '',
        model: item as GraphModel
      }))
    )
    if (directRelationItems.length) {
      return directRelationItems
    }

    const activeCanvas = mlRef.current?.activeCanvas
    const nodes = getCanvasNodes(activeCanvas)
    const connectors =
      activeCanvas?.stores?.connector?.getData?.() || activeCanvas?.stores?.connector?.data || []

    if (!Array.isArray(nodes) || !Array.isArray(connectors)) {
      return []
    }

    const items = (connectors as ConnectorModel[])
      .map<RelationViewItem | null>((connector) => {
        const source = connector.source
        const destination = connector.destination || connector.target
        const sourceId = getEndpointId(source)
        const destinationId = getEndpointId(destination)

        if (index === 0 && destinationId === currentModel.id) {
          return {
            id: sourceId,
            name: getEndpointName(source, nodes),
            model: nodes.find((node) => node.id === sourceId)
          }
        }

        if (index === 1 && sourceId === currentModel.id) {
          return {
            id: destinationId,
            name: getEndpointName(destination, nodes),
            model: nodes.find((node) => node.id === destinationId)
          }
        }

        return null
      })
      .filter((item): item is RelationViewItem => !!item?.name)

    return uniqueRelationItems(items)
  }

  const handleFocusRelation = (relation: RelationViewItem) => {
    const modelLink = mlRef.current
    if (!modelLink) {
      return
    }

    const allCanvases = Object.values(modelLink.canvasSet || {})
    const target =
      relation.model ||
      allCanvases.flatMap((canvas) => getCanvasNodes(canvas)).find((node) => node.id === relation.id)

    if (!target) {
      return
    }

    if (modelLink.focus) {
      modelLink.focus(target)
      return
    }

    modelLink.activeCanvas?.select?.([target])
  }

  const statusText = useMemo(
    () => `节点 ${nodeCount} / 连线 ${edgeCount} / 当前选择 ${selectedName}`,
    [edgeCount, nodeCount, selectedName]
  )

  return (
    <>
      <div ref={shellRef} className="legacy-canvas-shell">

        <div className="legacy-canvas">
          <section className="legacy-canvas__stage">
            {error ? <div className="legacy-canvas__error">{error}</div> : null}

            <div ref={mountHostRef} className="legacy-canvas__mount">
              <div ref={mountRef} id="model-link" className="legacy-canvas__model-link" />
            </div>
          </section>
        </div>

        <Drawer
          title={<span style={{ fontSize: 16, fontWeight: 700 }}>历史报表</span>}
          open={showReportLibraryPanel}
          onClose={closeReportLibrary}
          placement="right"
          width={380}
          styles={{
            body: { padding: '16px 20px' },
          }}
          extra={
            <button
              className="legacy-canvas__project-refresh"
              type="button"
              onClick={loadReportLibrary}
              disabled={reportFilesLoading}
            >
              <ReloadOutlined />
              <span>刷新</span>
            </button>
          }
        >
          <div className="legacy-canvas__project-tip">
            展示 reports 文件夹中已生成的 Excel 报表。
          </div>

          {reportFilesError ? (
            <div className="legacy-canvas__project-error">{reportFilesError}</div>
          ) : null}

          {reportFilesLoading ? (
            <div className="legacy-canvas__project-empty">正在读取历史报表...</div>
          ) : null}

          {!reportFilesLoading && reportFiles.length === 0 ? (
            <div className="legacy-canvas__project-empty">当前没有可显示的历史报表</div>
          ) : null}

          {!reportFilesLoading && reportFiles.length > 0 ? (
            <div className="legacy-canvas__project-list">
              {reportFiles.map((reportFile) => (
                <Card
                  key={reportFile.fileName}
                  className="legacy-canvas__project-card"
                  size="small"
                  hoverable
                >
                  <div className="legacy-canvas__project-meta">
                    <div className="legacy-canvas__project-name">{reportFile.reportName}</div>
                    <div className="legacy-canvas__project-file">{reportFile.fileName}</div>
                    <div className="legacy-canvas__project-time">
                      更新时间：{formatProjectTime(reportFile.updatedAt)}
                    </div>
                    <div className="legacy-canvas__project-time">
                      文件大小：{formatFileSize(reportFile.size)}
                    </div>
                  </div>
                  <div className="legacy-canvas__project-actions legacy-canvas__project-actions--single">
                    <button
                      className="legacy-canvas__project-button"
                      type="button"
                      onClick={() => handleOpenHistoryReport(reportFile)}
                    >
                      <FileExcelOutlined />
                      <span>打开</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </Drawer>

        <Drawer
          title={<span style={{ fontSize: 16, fontWeight: 700 }}>工程文件</span>}
          open={showProjectLibraryPanel}
          onClose={closeProjectLibrary}
          placement="right"
          width={380}
          styles={{
            body: { padding: '16px 20px' },
          }}
          extra={
            <button
              className="legacy-canvas__project-refresh"
              type="button"
              onClick={loadProjectLibrary}
              disabled={projectFilesLoading}
            >
              <ReloadOutlined />
              <span>刷新</span>
            </button>
          }
        >
          {projectFilesError ? (
            <div className="legacy-canvas__project-error">{projectFilesError}</div>
          ) : null}

          {projectFilesLoading ? (
            <div className="legacy-canvas__project-empty">正在读取工程文件列表...</div>
          ) : null}

          {!projectFilesLoading && projectFiles.length === 0 ? (
            <div className="legacy-canvas__project-empty">当前没有可显示的工程文件</div>
          ) : null}

          {!projectFilesLoading && projectFiles.length > 0 ? (
            <div className="legacy-canvas__project-list">
              {projectFiles.map((projectFile) => {
                const busy = projectActionName === projectFile.fileName
                return (
                  <Card
                    key={projectFile.fileName}
                    className="legacy-canvas__project-card"
                    size="small"
                    hoverable
                  >
                    <div className="legacy-canvas__project-meta">
                      <div className="legacy-canvas__project-name">{projectFile.projectName}</div>
                      <div className="legacy-canvas__project-file">{projectFile.fileName}</div>
                      <div className="legacy-canvas__project-time">
                        更新时间：{formatProjectTime(projectFile.updatedAt || projectFile.savedAt)}
                      </div>
                    </div>
                    <div className="legacy-canvas__project-actions">
                      <button
                        className="legacy-canvas__project-button"
                        type="button"
                        disabled={busy}
                        onClick={() => handleOpenProjectFromLibrary(projectFile)}
                      >
                        <FolderOpenOutlined />
                        <span>加载</span>
                      </button>
                      <button
                        className="legacy-canvas__project-button is-danger"
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeleteProjectFromLibrary(projectFile)}
                      >
                        <DeleteOutlined />
                        <span>删除</span>
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </Drawer>

        <Drawer
          title={<span style={{ fontSize: 16, fontWeight: 700 }}>{selectedModel?.name || '图元'} 属性</span>}
          open={showInspectorPanel}
          onClose={closeInspector}
          placement="right"
          width={340}
          mask={false}
          styles={{
            body: { padding: '16px 20px' },
          }}
        >
          <div className="legacy-canvas__field">
            <label className="legacy-canvas__field-label">ID</label>
            <div className="legacy-canvas__field-readonly">{selectedModel?.id || '-'}</div>
          </div>

          <div className="legacy-canvas__field">
            <label className="legacy-canvas__field-label">名称</label>
            <div className="legacy-canvas__field-row">
              <input
                className="legacy-canvas__field-input"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
              />
              <button
                className="legacy-canvas__field-button"
                type="button"
                onClick={handleUpdateSelectedName}
              >
                更新
              </button>
            </div>
          </div>

          <div className="legacy-canvas__field">
            <label className="legacy-canvas__field-label">描述</label>
            <div className="legacy-canvas__field-row">
              <input
                className="legacy-canvas__field-input"
                value={descDraft}
                placeholder="描述"
                onChange={(event) => setDescDraft(event.target.value)}
              />
              <button
                className="legacy-canvas__field-button"
                type="button"
                onClick={handleUpdateSelectedDesc}
              >
                更新
              </button>
            </div>
          </div>

          <div className="legacy-canvas__field">
            <label className="legacy-canvas__field-label">输入</label>
            <div className="legacy-canvas__relation-box">
              {getSelectedRelations(0).map((relation) => (
                <button
                  className="legacy-canvas__relation-tag"
                  key={`in-${relation.id || relation.name}`}
                  type="button"
                  onClick={() => handleFocusRelation(relation)}
                >
                  {relation.name}
                </button>
              ))}
            </div>
          </div>

          <div className="legacy-canvas__field">
            <label className="legacy-canvas__field-label">输出</label>
            <div className="legacy-canvas__relation-box">
              {getSelectedRelations(1).map((relation) => (
                <button
                  className="legacy-canvas__relation-tag"
                  key={`out-${relation.id || relation.name}`}
                  type="button"
                  onClick={() => handleFocusRelation(relation)}
                >
                  {relation.name}
                </button>
              ))}
            </div>
          </div>
        </Drawer>

        <div className="workspace-statusbar">
          <div className="workspace-statusbar__left">
            <span className="workspace-statusbar__stat">
              <span className="workspace-statusbar__dot" style={{ background: '#22a06b' }} />
              节点 {nodeCount}
            </span>
            <span className="workspace-statusbar__stat">
              <span className="workspace-statusbar__dot" style={{ background: '#2f73d9' }} />
              连线 {edgeCount}
            </span>
            <span className="workspace-statusbar__stat workspace-statusbar__stat--dim">
              当前 {selectedName}
            </span>
          </div>
          <div className="workspace-statusbar__right">
            <button
              className="workspace-statusbar__btn"
              type="button"
              onClick={handleFitCanvas}
              title="适应画布"
            >
              <AimOutlined />
            </button>
            <span className="workspace-statusbar__coord">
              X {coordinate.x.toFixed(0)} / Y {coordinate.y.toFixed(0)}
            </span>
            <span className="workspace-statusbar__zoom">{Math.round(scale * 100)}%</span>
          </div>
        </div>
      </div>

      {draggingModel ? (
        <div
          className="legacy-canvas__drag-mask"
          onMouseMove={handleDragMaskMove}
          onMouseUp={handleDragMaskUp}
        />
      ) : null}

      {ghost.visible && ghost.model ? (
        <img
          className="legacy-canvas__ghost"
          src={`/images/${ghost.model.cover}`}
          alt={ghost.model.name}
          style={{
            left: `${ghost.left}px`,
            top: `${ghost.top}px`
          }}
        />
      ) : null}
    </>
  )
}
