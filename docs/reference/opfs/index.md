---
head:
- - link
  - rel: canonical
    href: https://signaldb.js.org/reference/opfs/
- - meta
  - name: og:type
    content: article
- - meta
  - name: og:url
    content: https://signaldb.js.org/reference/opfs/
- - meta
  - name: og:title
    content: '@signaldb/opfs | SignalDB'
- - meta
  - name: og:description
    content: Learn about the OPFS Adapter for SignalDB, a simple and straightforward way to store data in a browser's filesystem using the Origin Private File System API.
- - meta
  - name: description
    content: Learn about the OPFS Adapter for SignalDB, a simple and straightforward way to store data in a browser's filesystem using the Origin Private File System API.
- - meta
  - name: keywords
    content: OPFS Adapter, SignalDB, Origin Private File System API, data persistence, browser storage, Filesystem Adapter, JavaScript, TypeScript
---
# @signaldb/opfs

## createOPFSAdapter (`default`)

```js
import createOPFSAdapter from '@signaldb/opfs'
import { Collection } from '@signaldb/core'

const collection = new Collection({
  persistence: createOPFSAdapter('path/to/db.json'),
})
```

Function to create a OPFS adapter for use with a collection.
The OPFS Adapter is another way to store data in a browser environment.
This adapter is based on the [Origin Private File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system). It is a simple and straightforward way to store data in the browser's filesystem. The only thing required is to specify the desired filename for each file.

The OPFS Adapter is an alternative to the [Filesystem Adapter](https://signaldb.js.org/reference/fs/). The OPFS Adapter can only be used in a browser environment, while the Filesystem Adapter can only be used in a Node.js environment.

*Credits to [jamesgibson14](https://github.com/jamesgibson14)*
