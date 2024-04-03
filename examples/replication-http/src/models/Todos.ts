import { ReplicatedCollection, createLocalStorageAdapter } from 'signaldb'
import maverickjsReactivityAdapter from 'signaldb-plugin-maverickjs'

function authenticatedFetch(path: string, options?: RequestInit) {
  const databaseId = '65676881edfe6a3e7e2c'
  const projectId = '6567685ea287ba49be81'
  const apiKey = '93af1c77389b021789b5038400d94c1622d6ccb7e83663d1a7d7e153654c8ecc5c7a6dfde7b0588fcf5b2d31417dd26dcd2bdfae2e899cc9de426951047ba32630206ac0c0d082e247dd4089beebce3c5502db47f96e21825691da98bcf890eab6a14c7bc5f721f81617c267cb3489d5f8a457ca39354ee07ee7f1d27c6402ed'
  return fetch(`https://cloud.appwrite.io/v1/databases/${databaseId}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    },
  })
}

const Todos = new ReplicatedCollection<{ id: string, text: string, completed: boolean }>({
  reactivity: maverickjsReactivityAdapter,
  persistence: createLocalStorageAdapter('todos'),
  pull: async () => {
    const result: {
      total: number,
      documents: {
        $id: string,
        text: string,
        completed: boolean,
      }[],
    } = await authenticatedFetch('/collections/todos/documents').then(res => res.json())
    return {
      items: result.documents.map(item => ({
        id: item.$id,
        text: item.text,
        completed: item.completed,
      })),
    }
  },
  push: async (changes) => {
    await Promise.all([
      ...changes.added.map(async (item) => {
        await authenticatedFetch('/collections/todos/documents', {
          method: 'POST',
          body: JSON.stringify({
            documentId: item.id,
            data: {
              text: item.text,
              completed: item.completed,
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }),
      ...changes.modified.map(async (item) => {
        await authenticatedFetch(`/collections/todos/documents/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            data: {
              text: item.text,
              completed: item.completed,
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }),
      ...changes.removed.map(async (item) => {
        await authenticatedFetch(`/collections/todos/documents/${item.id}`, {
          method: 'DELETE',
        })
      }),
    ])
  },
})
Todos.on('persistence.error', (error) => {
  // eslint-disable-next-line no-console
  console.error('persistence.error', error)
})

export default Todos
