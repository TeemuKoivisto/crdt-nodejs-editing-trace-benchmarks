/**
 * node benchmarks/json-crdt/bench.traces.non-crdt-libs.js
 * NODE_ENV=production node --prof benchmarks/json-crdt/bench.traces.non-crdt-libs.js
 * node --prof-process isolate-0xnnnnnnnnnnnn-v8.log
 */

import { traces } from './editing-traces'
import { runTrace } from './editors'
import os from 'os'

const traceList = [
  'friendsforever_flat',
  'sveltecomponent',
  'rustcode',
  'seph-blog1',
  'automerge-paper',
]

const editorList = ['StringRga (json-joy)', 'diamond-types-node', 'rope.js', 'V8 strings'] as const

const runTraceWithAllEditors = (traceName: string, iterations: number) => {
  const trace = traces.get(traceName)
  const version = process.version
  const arch = os.arch()
  const cpu = os.cpus()[0].model
  console.log('')
  console.log('')
  console.log('============================================================================')
  console.log('Node.js =', version, ', Arch =', arch, ', CPU =', cpu)
  console.log('============================================================================')
  console.log(
    'Editing trace:',
    JSON.stringify(traceName),
    ', Transactions:',
    trace.txns.length,
    ', End length:',
    trace.endContent.length
  )
  for (const editorName of editorList) {
    runTrace(traceName, editorName, iterations)
  }
}

for (const traceName of traceList) {
  runTraceWithAllEditors(traceName, 50)
}
