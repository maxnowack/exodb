# createIndexProvider

```ts
import { createIndexProvider } from '@signaldb/core'
```

An IndexProvider is an object that specifies how to create an index on a collection. It can be created with the `createIndexProvider()` function.
Take a look at the [`createIndex`](https://github.com/maxnowack/signaldb/blob/main/src/Collection/createIndex.ts) function for an example.

```js
const indexProvider = createIndexProvider({
  query(selector: FlatSelector<T>) {
    // Receives a flat selector (without $and, $or or $nor) as the first parameter
    // Returns an object with the following properties:
    // {
    //   matched: true, // Wether the index were hit by the selector
    //   keys: [0, 1, 2, 3], // An array of all matched items array indices in the memory adapter (only provided if matched = true)
    //   fields: ['name', 'age'], // An array of all fields that were used in the index.
    //                            // These fields will be removed from the selector before
    //                            // it is executed on the memory adapter for optimization.
    // }
  },
  rebuild(items: T[]) {
    // Rebuild the index and save the array indices
  },
})
```
