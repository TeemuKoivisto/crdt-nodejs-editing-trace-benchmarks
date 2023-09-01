import { traces } from './editing-traces'
import { StringRga } from 'json-joy/esm/json-crdt/types/rga-string/StringRga'
import { Timestamp } from 'json-joy/esm/json-crdt-patch/clock'
import { Doc } from 'diamond-types-node'
import * as Y from 'yjs'
import * as Automerge from '@automerge/automerge'
import AutomergeUnstable from '@automerge/automerge/dist/cjs/unstable'
import { Model } from 'json-joy/esm/json-crdt/model'
import Rope from 'rope.js'
import Yrs from 'ywasm'

type Library =
  | 'StringRga (json-joy)'
  | 'json-joy'
  | 'diamond-types-node'
  | 'Y.js'
  | 'Y.rs'
  | 'V8 strings'
  | 'Automerge'
  | 'AutomergeUnstable'
  | 'rope.js'

interface Factory {
  name: Library
  factory: () => {
    ins: (pos: number, insert: string) => void
    del: (pos: number, len: number) => void
    get: () => string
    len: () => number
    chunks: () => number
  }
}

export const editors = {
  'StringRga (json-joy)': {
    name: 'StringRga (json-joy)',
    factory: () => {
      let time = 0
      const rga = new StringRga(new Timestamp(1, time++))
      return {
        ins: (pos: number, insert: string) => {
          rga.insAt(pos, new Timestamp(1, time), insert)
          time += insert.length
        },
        del: (pos: number, len: number) => {
          rga.delete(rga.findInterval(pos, len))
        },
        get: () => rga.view(),
        len: () => rga.length(),
        chunks: () => rga.size(),
      }
    },
  },
  // 'json-joy': {
  //   name: 'json-joy',
  //   factory: () => {
  //     const model = Model.withLogicalClock()
  //     model.api.root('')
  //     const str = model.api.str([])
  //     return {
  //       ins: (pos: number, insert: string) => {
  //         str.ins(pos, insert)
  //       },
  //       del: (pos: number, len: number) => {
  //         str.del(pos, len)
  //       },
  //       get: () => str.view(),
  //       len: () => str.view().length,
  //       chunks: () => str.node.size(),
  //     }
  //   },
  // },
  'diamond-types-node': {
    name: 'diamond-types-node',
    factory: () => {
      const doc = new Doc('seph')
      return {
        ins: (pos: number, insert: string) => {
          doc.ins(pos, insert)
        },
        del: (pos: number, len: number) => {
          doc.del(pos, len)
        },
        get: () => doc.get(),
        len: () => doc.get().length,
        chunks: () => 0,
      }
    },
  },
  'Y.js': {
    name: 'Y.js',
    factory: () => {
      const ydoc = new Y.Doc()
      const ytext = ydoc.getText()
      return {
        ins: (pos: number, insert: string) => {
          ytext.insert(pos, insert)
        },
        del: (pos: number, len: number) => {
          ytext.delete(pos, len)
        },
        get: () => ytext.toString(),
        len: () => ytext.toString().length,
        chunks: () => {
          let cnt = 0
          let curr = ytext._start
          while (curr) {
            cnt++
            curr = curr.right
          }
          return cnt
        },
      }
    },
  },
  'Y.rs': {
    name: 'Y.rs',
    factory: () => {
      const ydoc = new Yrs.YDoc({})
      const ytext = ydoc.getText('test')
      return {
        ins: (pos: number, insert: string) => {
          ytext.insert(pos, insert, {})
        },
        del: (pos: number, len: number) => {
          ytext.delete(pos, len)
        },
        get: () => ytext.toString(),
        len: () => ytext.toString().length,
        chunks: () => 0,
      }
    },
  },
  'V8 strings': {
    name: 'V8 strings',
    factory: () => {
      let str = ''
      return {
        ins: (pos: number, insert: string) => {
          str = str.slice(0, pos) + insert + str.slice(pos)
        },
        del: (pos: number, len: number) => {
          str = str.slice(0, pos) + str.slice(pos + len)
        },
        get: () => str,
        len: () => str.length,
        chunks: () => 0,
      }
    },
  },
  Automerge: {
    name: 'Automerge',
    factory: () => {
      let doc = Automerge.init()
      doc = Automerge.change(doc, doc => {
        doc.text = new Automerge.Text()
      })
      return {
        ins: (pos: number, insert: string) => {
          doc = Automerge.change(doc, doc => {
            doc.text.insertAt(pos, ...insert.split(''))
          })
        },
        del: (pos: number, len: number) => {
          doc = Automerge.change(doc, doc => {
            doc.text.deleteAt(pos, len)
          })
        },
        get: () => doc.text + '',
        len: () => doc.text.length,
        chunks: () => doc.text.elems.length,
      }
    },
  },
  AutomergeUnstable: {
    name: 'AutomergeUnstable',
    factory: () => {
      let doc = AutomergeUnstable.from({ text: '' })
      return {
        ins: (pos: number, insert: string) => {
          doc = AutomergeUnstable.change(doc, doc => {
            AutomergeUnstable.splice(doc, 'text', pos, 0, insert)
          })
        },
        del: (pos: number, len: number) => {
          doc = AutomergeUnstable.change(doc, doc => {
            AutomergeUnstable.splice(doc, 'text', pos, len)
          })
        },
        get: () => AutomergeUnstable.toJS(doc).text,
        len: () => AutomergeUnstable.toJS(doc).text.length,
        chunks: () => 0,
      }
    },
  },
  'rope.js': {
    name: 'rope.js',
    factory: () => {
      const r = new Rope([''])
      return {
        ins: (pos: number, insert: string) => {
          r.splice(pos, 0, insert)
        },
        del: (pos: number, len: number) => {
          r.splice(pos, len, '')
        },
        get: () => r.toString(),
        len: () => r.toString().length,
        chunks: () => r.segs.length,
      }
    },
  },
} satisfies Record<Library, Factory>

export const runTraceOnEditor = (json: Record<string, any>, editor: Factory) => {
  const txns = json.txns
  const txnsLength = txns.length
  const editorInstance = editor.factory()
  if (json.startContent) editorInstance.ins(0, json.startContent)
  for (let i = 0; i < txnsLength; i++) {
    const transaction = txns[i]
    const patches = transaction.patches
    const length = patches.length
    for (let j = 0; j < length; j++) {
      const patch = patches[j]
      const pos = patch[0]
      const del = patch[1]
      const insert = patch[2]
      if (del) editorInstance.del(pos, del)
      if (insert) editorInstance.ins(pos, insert)
    }
  }
  return editorInstance
}

function numberWithCommas(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const runTrace = (traceName: string, editorName: keyof typeof editors, iterations = 1) => {
  const editorFactory = editors[editorName] as Factory
  if (editorFactory === undefined) return
  const trace = traces.get(traceName)
  let instance: ReturnType<Factory['factory']>,
    view = ''
  console.log('----------------------------------------------------------------------------')
  console.log(editorFactory.name)
  console.log('----------------------------------------------------------------------------')
  let best = Infinity
  let worst = 0
  const measurements = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    instance = runTraceOnEditor(trace, editorFactory)
    view = instance.get()
    const end = performance.now()
    const ms = end - start
    if (ms < best) best = ms
    if (ms > worst) worst = ms
    measurements.push(ms)
    // console.log('#' + (i + 1) + ':', Number((ms).toFixed(1)));
    console.log(Number(ms.toFixed(3)))
  }
  // console.log('Result:', view);
  console.log(
    'Correct:',
    view === trace.endContent,
    'Length:',
    instance.len(),
    'Chunks:',
    instance.chunks()
  )
  const avg = measurements.reduce((acc, x) => acc + x, 0) / measurements.length
  console.log(
    'Best:',
    Number(best.toFixed(1)),
    'Worst:',
    Number(worst.toFixed(1)),
    'Average:',
    Number(avg.toFixed(1)),
    'Tx/sec:',
    numberWithCommas(Math.round(trace.txns.length / (avg / 1000)))
  )
}
