import {
  applyTemplateToDraft,
  clearMaterialDraft,
  restoreMaterialDraft
} from './materialCalculationStoreCore'
import type {
  MaterialParameterConfiguration,
  MaterialParameterDraft,
  MaterialParameterTemplate
} from '../types'

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

const savedConfiguration: MaterialParameterConfiguration = {
  mode: 'input-to-output',
  route: 'MXX',
  inputs: {
    jb: 10,
    mxx: 20,
    ldx: 0,
    ylsn: 30
  },
  version: 3,
  updatedAt: '2026-08-25 10:00:00'
}

const currentDraft: MaterialParameterDraft = {
  mode: savedConfiguration.mode,
  route: savedConfiguration.route,
  inputs: { ...savedConfiguration.inputs! }
}

const sameContextTemplate: MaterialParameterTemplate = {
  id: 1,
  name: 'MXX 常用投入',
  description: '常规生产参数',
  mode: 'input-to-output',
  route: 'MXX',
  inputs: {
    jb: 16.5,
    mxx: 33,
    ldx: 0,
    ylsn: 19.99
  },
  version: 1,
  createdAt: '2026-08-25 10:10:00',
  updatedAt: '2026-08-25 10:10:00'
}

const crossContextTemplate: MaterialParameterTemplate = {
  id: 2,
  name: 'LDX 目标反算',
  description: '',
  mode: 'output-to-input',
  route: 'LDX',
  target: {
    productCode: 'TG',
    productName: '硬质糖果成品',
    amount: 107.37
  },
  version: 1,
  createdAt: '2026-08-25 10:20:00',
  updatedAt: '2026-08-25 10:20:00'
}

function run() {
  const directResult = applyTemplateToDraft(currentDraft, sameContextTemplate)
  assertEqual(directResult.requiresConfirmation, false)
  assertDeepEqual(directResult.draft.inputs, sameContextTemplate.inputs)

  const guardedResult = applyTemplateToDraft(currentDraft, crossContextTemplate)
  assertEqual(guardedResult.requiresConfirmation, true)
  assertDeepEqual(guardedResult.draft, currentDraft)

  const confirmedResult = applyTemplateToDraft(currentDraft, crossContextTemplate, true)
  assertEqual(confirmedResult.requiresConfirmation, false)
  assertEqual(confirmedResult.draft.mode, 'output-to-input')
  assertEqual(confirmedResult.draft.route, 'LDX')
  assertDeepEqual(confirmedResult.draft.target, crossContextTemplate.target)

  // Applying a template must not mutate the formal configuration snapshot.
  assertDeepEqual(savedConfiguration.inputs, { jb: 10, mxx: 20, ldx: 0, ylsn: 30 })
  assertEqual(savedConfiguration.version, 3)

  assertDeepEqual(clearMaterialDraft(currentDraft), {
    mode: 'input-to-output',
    route: 'MXX',
    inputs: { jb: 0, mxx: 0, ldx: 0, ylsn: 0 }
  })
  assertDeepEqual(restoreMaterialDraft(savedConfiguration), currentDraft)
}

run()
