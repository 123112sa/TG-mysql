import {
  createInitialProjectSession,
  getProjectSessionStatus,
  projectSessionReducer
} from './useProjectSession'

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`)
  }
}

const initial = createInitialProjectSession()
assertEqual(initial.name, '未命名工程')
assertEqual(getProjectSessionStatus(initial), 'empty')

const created = projectSessionReducer(initial, { type: 'changed' })
assertEqual(getProjectSessionStatus(created), 'unsaved')

const loaded = projectSessionReducer(created, {
  type: 'loaded',
  projectName: '化工厂'
})
assertEqual(loaded.name, '化工厂')
assertEqual(getProjectSessionStatus(loaded), 'loaded')

const modified = projectSessionReducer(loaded, { type: 'changed' })
assertEqual(getProjectSessionStatus(modified), 'modified')

const saved = projectSessionReducer(modified, {
  type: 'saved',
  projectName: '化工厂-v2'
})
assertEqual(saved.name, '化工厂-v2')
assertEqual(getProjectSessionStatus(saved), 'loaded')

const cleared = projectSessionReducer(saved, { type: 'cleared' })
assertEqual(cleared.name, '未命名工程')
assertEqual(getProjectSessionStatus(cleared), 'empty')

console.log('project session state verified')
