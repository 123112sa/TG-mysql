import { readFileSync } from 'fs'
import { join } from 'path'
import assert from 'assert'

const root = process.cwd()
const source = readFileSync(join(root, 'src/components/charts/ScheduleMonitorChart.tsx'), 'utf8')

assert(source.includes('top: 8'), 'monitor chart legend should be displayed at the top')
assert(!source.includes('bottom: 8'), 'monitor chart legend should not stay at the bottom')
assert(source.includes('top: 56'), 'monitor chart grid should leave space for the top legend')
assert(source.includes('bottom: 40'), 'monitor chart grid should reduce bottom legend space')
assert(source.includes("style={{ height: 430, width: '100%' }}"), 'monitor chart should be taller')

console.log('schedule monitor visual layout verified')
