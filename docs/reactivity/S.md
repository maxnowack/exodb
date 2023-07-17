# Reactivity adapter for `S.js`

## Adapter

```js
import S from 's-js'
import { createReactivityAdapter } from 'signaldb'

const reactivityAdapter = createReactivityAdapter({
  create: () => {
    const dep = S.data(true)
    return {
      depend: () => {
        dep()
      },
      notify: () => {
        dep(true)
      },
    }
  },
  onDispose: (callback) => {
    S.cleanup(callback)
  },
})
```

## Usage

```js
import { Collection } from 'signaldb'
import S from 's-js'

const posts = new Collection({
  reactivity: reactivityAdapter,
})

S(() => {
  console.log(posts.find({ author: 'John' }).count())
})
```
