/**
 * node benchmarks/json-crdt/bench.traces.crdt-libs.js
 * NODE_ENV=production node --prof benchmarks/json-crdt/bench.traces.crdt-libs.js
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

const editorList = [
  'StringRga (json-joy)',
  'json-joy',
  'Y.js',
  'Y.rs',
  // 'AutomergeUnstable',
  // 'Automerge',
] as const

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
    ', Txs:',
    trace.txns.length,
    ', Len:',
    trace.endContent.length
  )
  for (const editorName of editorList) {
    runTrace(traceName, editorName, iterations)
  }
  console.log('')
}

for (const traceName of traceList) {
  runTraceWithAllEditors(traceName, 50)
}
