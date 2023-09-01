# CRDT NodeJS editing trace benchmarks

This is copy-paste from https://jsonjoy.com/blog/list-crdt-benchmarks and here https://github.com/streamich/json-joy/tree/af2ab223aa65e87e51d219030c159d80cfa5f810/src/json-crdt/__bench__ all credit going to Vadims. It's extracted here since at the moment (1.9.2023) there were problems running it with the latest commit and since its coolness requires its own repo.

## How to run

1. `pnpm i`
2. `pnpm bench:crdt` or `pnpm bench:non-crdt`

## Library versions used

```json
"@automerge/automerge": "2.0.3",
"diamond-types-node": "1.0.2",
"json-joy": "^9.5.1",
"rope.js": "0.1.0",
"yjs": "13.6.7",
"ywasm": "0.16.10"
```
