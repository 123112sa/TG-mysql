import { readFileSync } from 'fs'
import { join } from 'path'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const root = process.cwd()
const factoryProductSource = readFileSync(
  join(root, 'src/components/modals/FactoryProductModal.tsx'),
  'utf8'
)
const inputRequirementSource = readFileSync(
  join(root, 'src/components/modals/InputRequirementResultModal.tsx'),
  'utf8'
)

assert(
  factoryProductSource.includes('产量预测计算结果'),
  'factory product result should use the production prediction mode name'
)
assert(
  inputRequirementSource.includes('当前为投料反算模式') &&
    inputRequirementSource.includes('测算结果'),
  'input requirement result should use the material back-calculation mode name'
)
assert(
  !factoryProductSource.includes('输入→输出计算结果') &&
    !inputRequirementSource.includes('当前为输出→输入模式') &&
    !inputRequirementSource.includes('输出→输入反算值'),
  'result displays should not expose legacy direction labels'
)

console.log('result mode labels verified')
