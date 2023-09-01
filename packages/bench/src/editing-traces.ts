import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const loadTrace = (filename: string) => {
  const buf = fs.readFileSync(filename)
  const text = zlib.gunzipSync(buf).toString()
  const json = JSON.parse(text) as Record<string, any>
  return json
}

const cache: { [key: string]: Record<string, any> } = {}

export const traces = {
  filename: (name: string) =>
    path.resolve('node_modules', 'editing-traces', 'sequential_traces', `${name}.json.gz`),
  get: (name: string) => {
    if (!cache[name]) {
      const filename = traces.filename(name)
      cache[name] = loadTrace(filename)
    }
    return cache[name]
  },
}
