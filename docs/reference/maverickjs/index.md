---
head:
- - link
  - rel: canonical
    href: https://signaldb.js.org/reference/maverickjs/
- - meta
  - name: og:type
    content: article
- - meta
  - name: og:url
    content: https://signaldb.js.org/reference/maverickjs/
- - meta
  - name: og:title
    content: '@signaldb/maverickjs - SignalDB Reactivity Adapter for @maverick-js/signals'
- - meta
  - name: og:description
    content: Discover how to integrate @maverick-js/signals with SignalDB using the reactivity adapter for seamless reactive database integration.
- - meta
  - name: description
    content: Discover how to integrate @maverick-js/signals with SignalDB using the reactivity adapter for seamless reactive database integration.
- - meta
  - name: keywords
    content: SignalDB, @maverick-js/signals, reactivity adapter, reactive programming, JavaScript, real-time updates, integration guide, @signaldb/maverickjs, collection setup, automatic cleanup, scope check
---
# @signaldb/maverickjs

## maverickjsReactivityAdapter (`default`)

```js
import { effect } from '@maverick-js/signals'
import maverickjsReactivityAdapter from '@signaldb/maverickjs'
import { Collection } from '@signaldb/core'

const posts = new Collection({
  reactivity: maverickjsReactivityAdapter,
})

effect(() => {
  console.log(posts.find({ author: 'John' }).count())
})
```

Reactivity adapter for usage with [Maverick signals](https://github.com/maverick-js/signals).

Maverick.js's signals provide a powerful foundation for reactive programming, and their integration with signaldb showcases this strength vividly. Signals, in essence, are observables in maverick.js that let you store state and react to changes in real-time. When paired with signaldb, developers can gain the advantage of seamlessly creating reactive databases. The maverick.js reactivity adapter for signaldb simplifies this integration. By utilizing the reactivity adapter, the bridge between maverick.js signals and signaldb is streamlined, making it easier for developers to set up and maintain reactivity across their applications. This integration ensures that the data stays up-to-date, responsive, and efficient, all while adhering to the "lazy principle" that advocates for maximum efficiency with minimal burden on the developer. Whether you're looking to build robust UI libraries or simply want a lightweight solution for enhanced reactivity, integrating maverick.js's signals with signaldb via the reactivity adapter is a step in the right direction.
