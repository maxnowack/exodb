import { Collection, createLocalStorageAdapter } from 'signaldb'
import maverickjsReactivityAdapter from 'signaldb-plugin-maverickjs'
import syncManager from '../system/syncManager'

const Todos = new Collection<{ id: string, text: string, completed: boolean }>({
  reactivity: maverickjsReactivityAdapter,
  persistence: createLocalStorageAdapter('todos-appwrite'),
})
Todos.on('persistence.error', (error) => {
  // eslint-disable-next-line no-console
  console.error('persistence.error', error)
})

syncManager.addCollection(Todos, { name: 'todos' })
void syncManager.syncAll()

export default Todos
