import { useCallback, useReducer } from 'react'

export type ProjectSessionSource = 'blank' | 'file'
export type ProjectSessionStatus = 'empty' | 'unsaved' | 'loaded' | 'modified'

export type ProjectSessionState = {
  name: string
  source: ProjectSessionSource
  dirty: boolean
}

export type ProjectSessionAction =
  | { type: 'changed' }
  | { type: 'loaded'; projectName: string }
  | { type: 'saved'; projectName: string }
  | { type: 'cleared' }

export function createInitialProjectSession(): ProjectSessionState {
  return {
    name: '未命名工程',
    source: 'blank',
    dirty: false
  }
}

export function projectSessionReducer(
  state: ProjectSessionState,
  action: ProjectSessionAction
): ProjectSessionState {
  switch (action.type) {
    case 'changed':
      return state.dirty ? state : { ...state, dirty: true }
    case 'loaded':
      return {
        name: action.projectName,
        source: 'file',
        dirty: false
      }
    case 'saved':
      return {
        name: action.projectName,
        source: 'file',
        dirty: false
      }
    case 'cleared':
      return createInitialProjectSession()
    default:
      return state
  }
}

export function getProjectSessionStatus(state: ProjectSessionState): ProjectSessionStatus {
  if (state.source === 'file') {
    return state.dirty ? 'modified' : 'loaded'
  }

  return state.dirty ? 'unsaved' : 'empty'
}

export default function useProjectSession() {
  const [state, dispatch] = useReducer(projectSessionReducer, undefined, createInitialProjectSession)

  const markChanged = useCallback(() => dispatch({ type: 'changed' }), [])
  const markLoaded = useCallback((projectName: string) => {
    dispatch({ type: 'loaded', projectName })
  }, [])
  const markSaved = useCallback((projectName: string) => {
    dispatch({ type: 'saved', projectName })
  }, [])
  const markCleared = useCallback(() => dispatch({ type: 'cleared' }), [])

  return {
    ...state,
    status: getProjectSessionStatus(state),
    markChanged,
    markLoaded,
    markSaved,
    markCleared
  }
}
