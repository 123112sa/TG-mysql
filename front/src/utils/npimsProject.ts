type PrimitiveRecord = Record<string, unknown>

export type ModelLinkCanvasContent = Record<string, PrimitiveRecord[]>

export type ModelLinkCompiledProject = {
  info: {
    version: string
    name: string
    timestamp: number
    entrance: string
  }
  content: Record<string, ModelLinkCanvasContent>
}

export type NpimsComponentRenamePatch = {
  canvasName: string
  nextName: string
  componentId?: string
  currentName?: string
}

export type NpimsProjectFile = {
  format: 'npimsproj'
  version: '1.0.0'
  projectName: string
  savedAt: string
  graph: ModelLinkCompiledProject
  streamValues?: Record<string, string>
}

const NPIMS_PROJECT_EXTENSION = '.npimsproj'

function cloneGraph<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * 把数字补成两位字符串，方便后面拼接文件名中的时间。
 */
function pad2(value: number) {
  return String(value).padStart(2, '0')
}

/**
 * 生成默认工程文件名。
 * 这里直接使用用户当前设备上的真实本地时间，并精确到秒，
 * 这样文件名会随着每次保存实时变化，不会再出现日期看起来固定不变的问题。
 */
export function getProjectDefaultName(prefix = 'project') {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad2(now.getMonth() + 1)
  const day = pad2(now.getDate())
  const hour = pad2(now.getHours())
  const minute = pad2(now.getMinutes())
  const second = pad2(now.getSeconds())
  return `${prefix}-${year}${month}${day}-${hour}${minute}${second}`
}

function normalizeFileName(fileName: string) {
  const trimmed = fileName.trim()
  if (!trimmed) {
    return `project${NPIMS_PROJECT_EXTENSION}`
  }

  return trimmed.endsWith(NPIMS_PROJECT_EXTENSION)
    ? trimmed
    : `${trimmed}${NPIMS_PROJECT_EXTENSION}`
}

/**
 * 把 ModelLink 直接编译出来的画布数据包装成我们自己的工程文件结构。
 * 这样做的目的不是单纯换个外壳，而是给工程文件补上一层稳定的数据协议：
 * 1. 前端本地下载时可以统一输出 `.npimsproj` 格式。
 * 2. 后端以后保存、读取、批量改名时，也围绕同一个结构工作。
 * 3. 后续如果需要扩展作者、项目说明、版本号等信息，也可以继续往这里加。
 */
export function createNpimsProjectFile(
  graph: ModelLinkCompiledProject,
  projectName = 'project'
): NpimsProjectFile {
  return {
    format: 'npimsproj',
    version: '1.0.0',
    projectName,
    savedAt: new Date().toISOString(),
    graph: cloneGraph(graph)
  }
}

/**
 * 把工程对象序列化成字符串，用于浏览器下载或后端传输。
 * 这里保留了缩进格式，方便后面直接打开文件查看内容和排查问题。
 */
export function serializeNpimsProjectFile(project: NpimsProjectFile) {
  return JSON.stringify(project, null, 2)
}

/**
 * 读取并校验 `.npimsproj` 文件内容。
 * 打开工程时必须先经过这里，主要是为了避免两类问题：
 * 1. 用户误选了普通 JSON 或其他无关文件。
 * 2. 文件虽然是 JSON，但缺少画布恢复所必须的 `info` 和 `content` 结构。
 * 以后如果工程文件版本升级，也可以在这里集中补兼容逻辑。
 */
export function parseNpimsProjectFile(raw: string): NpimsProjectFile {
  const parsed = JSON.parse(raw) as NpimsProjectFile

  if (parsed.format !== 'npimsproj' || !parsed.graph?.content || !parsed.graph?.info) {
    throw new Error('无效的 npimsproj 文件内容')
  }

  return parsed
}

/**
 * 按“画布名 + 组件 id/旧名称”的规则批量修改组件名称。
 * 这里先改工程对象，再重新装载到画布，而不是直接改某个临时选中对象，
 * 这样前端本地演示逻辑与后端未来回写工程文件的逻辑可以保持一致。
 * 后端后面只需要返回改名规则，前端就能用同一套方法把结果刷新回画布。
 */
export function applyRenamePatchesToProject(
  project: NpimsProjectFile,
  patches: NpimsComponentRenamePatch[]
) {
  const nextProject = cloneGraph(project)

  patches.forEach((patch) => {
    const canvas = nextProject.graph.content[patch.canvasName]
    if (!canvas) {
      return
    }

    Object.values(canvas).forEach((items) => {
      items.forEach((item) => {
        const itemId = typeof item.id === 'string' ? item.id : undefined
        const itemName = typeof item.name === 'string' ? item.name : undefined

        const idMatched = patch.componentId ? itemId === patch.componentId : true
        const nameMatched = patch.currentName ? itemName === patch.currentName : true

        if (idMatched && nameMatched && 'name' in item) {
          item.name = patch.nextName
        }
      })
    })
  })

  return nextProject
}

/**
 * 触发浏览器下载 `.npimsproj` 文件。
 * 当前是纯前端版本，所以最终保存目录仍由浏览器下载能力决定；
 * 如果后面要固定存到指定文件夹，可以在后端接口接通后改由后端落盘。
 */
export function downloadNpimsProjectFile(project: NpimsProjectFile, fileName = project.projectName) {
  const blob = new Blob([serializeNpimsProjectFile(project)], {
    type: 'application/json;charset=utf-8'
  })

  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = normalizeFileName(fileName)
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}
