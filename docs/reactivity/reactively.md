# Reactivity adapter for `@reactively/core`

## Adapter

```js
import { reactive, onCleanup } from '@reactively/core'
import { createReactivityAdapter } from 'signaldb'

const reactivityAdapter = createReactivityAdapter({
  create: () => {
        const dep = reactive(0)
        return {
          depend: () => {
            dep.get()
          },
          notify: () => {
            dep.set(dep.value + 1)
          },
        }
      },
      onDispose: (callback) => {
        nCleanup(callback)
      },
})
```

## Usage

```js
import { reactive } from '@reactively/core'
import { Collection } from 'signaldb'

const posts = new Collection({
  reactivity: reactivityAdapter,
})

reactive(() => {
  console.log(posts.find({ author: 'John' }).count())
})
```
