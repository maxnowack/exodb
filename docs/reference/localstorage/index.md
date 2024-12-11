---
head:
- - link
  - rel: canonical
    href: https://signaldb.js.org/reference/localstorage/
- - meta
  - name: og:type
    content: article
- - meta
  - name: og:url
    content: https://signaldb.js.org/reference/localstorage/
- - meta
  - name: og:title
    content: '@signaldb/localstorage | SignalDB'
- - meta
  - name: og:description
    content: Discover how to use the localStorage Adapter in SignalDB for straightforward and efficient browser data storage.
- - meta
  - name: description
    content: Discover how to use the localStorage Adapter in SignalDB for straightforward and efficient browser data storage.
- - meta
  - name: keywords
    content: SignalDB, localStorage adapter, data persistence, browser storage, JavaScript, TypeScript, data management, local storage, collection setup, SignalDB adapters
---
# @signaldb/localstorage

## createLocalStorageAdapter (`default`)

```js
import createLocalStorageAdapter from '@signaldb/localstorage'
import { Collection } from '@signaldb/core'

const collection = new Collection({
  persistence: createLocalStorageAdapter('posts'),
})
```

Function to create a localStorage adapter for use with a collection.
The localStorage Adapter is the most straightforward tool for usage within a browser setting. To initiate its use, the only step required is designating a specific name to identify your data. This named data forms a collection that will be stored in the localStorage, from which it can be loaded or saved as needed.
