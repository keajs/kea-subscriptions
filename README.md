[![NPM Version](https://img.shields.io/npm/v/kea-subscriptions.svg)](https://www.npmjs.com/package/kea-subscriptions)
[![minified](https://badgen.net/bundlephobia/min/kea-subscriptions)](https://bundlephobia.com/result?p=kea-subscriptions)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/kea-subscriptions)](https://bundlephobia.com/result?p=kea-subscriptions)
[![Backers on Open Collective](https://opencollective.com/kea/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/kea/sponsors/badge.svg)](#sponsors)

# kea-subscriptions

Subscribe to changes in values. Works with kea `3.0.0` and up.

## Sample usage

[Read the documentation](https://keajs.org/docs/plugins/subscriptions)

```ts
import { kea, actions, reducers } from 'kea'
import { subscriptionsPlugin, subscriptions } from 'kea-subscriptions'

// once per app
resetContext({ plugins: [subscriptionsPlugin] }) // hook into redux

const logic = kea([
  actions({ setMyValue: (value) => ({ value }) }),
  reducers({ myValue: ['default', { setMyValue: (_, { value }) => value }] }),
  subscriptions({ myValue: (value, oldValue) => console.log({ value, oldValue }) }),
])

logic.mount()
// [console.log] { value: 'default', oldValue: undefined }
logic.actions.setMyValue('coffee')
// [console.log] { value: 'coffee', oldValue: 'default' }
logic.actions.setMyValue('bagels')
// [console.log] { value: 'bagels', oldValue: 'coffee' }
```
