import { it, expect, vi } from 'vitest'
import { Collection, SyncManager } from '../../src'
import type { BaseItem } from '../../src/Collection'
import type { Changeset, LoadResponse } from '../../src/types/PersistenceAdapter'

interface TestItem extends BaseItem<string> {
  id: string,
  name: string,
}

it('should add a collection and register sync events', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [{ id: '1', name: 'Test Item' }],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })
  mockCollection.insert({ id: '2', name: 'New Item' })

  await new Promise((resolve) => { setTimeout(resolve, 110) })

  expect(mockPush).toHaveBeenCalled()
})

it('should handle pull and apply new changes during sync', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [{ id: '1', name: 'Test Item' }],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  await syncManager.sync('test')

  expect(mockPull).toHaveBeenCalled()
  expect(mockCollection.find().fetch()).toEqual([{ id: '1', name: 'Test Item' }])
})

it('should handle updates correctly during sync', async () => {
  let callCount = 0
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockImplementation(() => {
    callCount += 1
    if (callCount === 1) {
      return Promise.resolve({
        items: [{ id: '1', name: 'Test Item' }],
      })
    }
    return Promise.resolve({
      items: [{ id: '1', name: 'New Item' }],
    })
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })
  await syncManager.sync('test')
  expect(mockCollection.findOne({ id: '1' })?.name).toBe('Test Item')

  mockCollection.updateOne({ id: '1' }, { $set: { name: 'New Item' } })
  await syncManager.sync('test')

  expect(mockCollection.findOne({ id: '1' })?.name).toBe('New Item')
})

it('should push changes when items are added locally', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  mockCollection.emit('added', { id: '2', name: 'New Item' })

  await new Promise((resolve) => { setTimeout(resolve, 110) })

  expect(mockPush).toHaveBeenCalled()
})

it('should push changes when items are updated locally', async () => {
  let callCount = 0
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockImplementation(() => {
    callCount += 1
    if (callCount === 1) {
      return Promise.resolve({
        items: [{ id: '1', name: 'Test Item' }],
      })
    }
    return Promise.resolve({
      items: [{ id: '1', name: 'New Item' }],
    })
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })
  await syncManager.sync('test')

  mockCollection.updateOne({ id: '1' }, { $set: { name: 'Updated Locally' } })
  await new Promise((resolve) => { setTimeout(resolve, 110) })

  expect(mockPush).toHaveBeenCalled()
  expect(mockCollection.findOne({ id: '1' })?.name).toBe('New Item')
})

it('should push changes when items are removed locally', async () => {
  let callCount = 0
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockImplementation(() => {
    callCount += 1
    if (callCount <= 2) {
      return Promise.resolve({
        items: [{ id: '1', name: 'Test Item' }],
      })
    }
    return Promise.resolve({
      items: [],
    })
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })
  await syncManager.sync('test')

  mockCollection.removeOne({ id: '1' })
  await new Promise((resolve) => { setTimeout(resolve, 110) })

  expect(mockPush).toHaveBeenCalled()
  expect(mockCollection.findOne({ id: '1' })).toBeUndefined()
})

it('should debounce push requests', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  mockCollection.emit('added', { id: '2', name: 'First Item' })
  mockCollection.emit('added', { id: '3', name: 'Second Item' })

  await new Promise((resolve) => { setTimeout(resolve, 110) })

  expect(mockPush).toHaveBeenCalledTimes(1)
})

it('should handle sync errors and update sync operation status', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockRejectedValue(new Error('Sync failed'))

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  try {
    await syncManager.sync('test')
  } catch (error) {
    expect(error).toBeDefined()
  }

  const syncOperation = syncManager.isSyncing('test')
  expect(syncOperation).toBe(false)
})

it('should sync all collections', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection1 = new Collection<TestItem, string, any>()
  const mockCollection2 = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection1, { name: 'test1' })
  syncManager.addCollection(mockCollection2, { name: 'test2' })

  await syncManager.syncAll()

  expect(mockPull).toHaveBeenCalledTimes(2)
})

it('should handle pull errors and update sync operation status', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockRejectedValue(new Error('Pull failed'))

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  try {
    await syncManager.sync('test')
  } catch (error) {
    expect(error).toBeDefined()
    expect((error as Error).message).toBe('Pull failed')
  }

  const syncOperation = syncManager.isSyncing('test')
  expect(syncOperation).toBe(false)
})

it('should handle push errors and update sync operation status', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [{ id: '1', name: 'Test Item' }],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockRejectedValue(new Error('Push failed'))

  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  mockCollection.insert({ id: '2', name: 'New Item' })

  try {
    await syncManager.sync('test')
  } catch (error) {
    expect(error).toBeDefined()
    expect((error as Error).message).toBe('Push failed')
  }

  const syncOperation = syncManager.isSyncing('test')
  expect(syncOperation).toBe(false)
})

it('should register and apply remote changes with items', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [{ id: '1', name: 'Test Item' }],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  let onRemoteChangeHandler = vi.fn<(collectionName: string,
    data?: LoadResponse<TestItem>) => void>()
  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
    registerRemoteChange: (onRemoteChange) => {
      onRemoteChangeHandler = vi.fn().mockImplementation(onRemoteChange)
    },
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  // Simulate a remote change
  onRemoteChangeHandler('test', { items: [{ id: '2', name: 'Remote Item' }] })

  // wait to next tick
  await new Promise((resolve) => { setTimeout(resolve, 0) })

  // Verify that the collection includes the remote change
  expect(mockCollection.find().fetch()).toEqual([{ id: '2', name: 'Remote Item' }])
})

it('should register and apply remote changes with changes', async () => {
  let callCount = 0
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockImplementation(() => {
    callCount += 1
    if (callCount <= 1) {
      return Promise.resolve({ items: [{ id: '1', name: 'Test Item' }] })
    }
    return Promise.resolve({ changes: { added: [], modified: [], removed: [] } })
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  let onRemoteChangeHandler = vi.fn<(collectionName: string,
    data?: LoadResponse<TestItem>) => void>()
  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
    registerRemoteChange: (onRemoteChange) => {
      onRemoteChangeHandler = vi.fn().mockImplementation(onRemoteChange)
    },
  })

  const mockCollection = new Collection<TestItem, string, any>()
  syncManager.addCollection(mockCollection, { name: 'test' })
  await syncManager.sync('test')

  // Simulate a remote change
  onRemoteChangeHandler('test', { changes: { added: [{ id: '2', name: 'Remote Item' }], modified: [], removed: [] } })

  // wait to next tick
  await new Promise((resolve) => { setTimeout(resolve, 0) })

  // Verify that the collection includes the remote change
  expect(mockCollection.find().fetch()).toEqual([{ id: '1', name: 'Test Item' }, { id: '2', name: 'Remote Item' }])
})

it('should sync after a empty remote change was received', async () => {
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockResolvedValue({
    items: [{ id: '1', name: 'Test Item' }],
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockResolvedValue()

  let onRemoteChangeHandler = vi.fn<(collectionName: string,
    data?: LoadResponse<TestItem>) => void>()
  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
    registerRemoteChange: (onRemoteChange) => {
      onRemoteChangeHandler = vi.fn().mockImplementation(onRemoteChange)
    },
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })

  // Simulate a remote change
  onRemoteChangeHandler('test')

  // wait to next tick
  await new Promise((resolve) => { setTimeout(resolve, 0) })

  // Verify that the collection includes the remote change
  expect(mockCollection.find().fetch()).toEqual([{ id: '1', name: 'Test Item' }])
})

it('should call onError handler if an async error occurs', async () => {
  let callCount = 0
  const mockPull = vi.fn<() => Promise<LoadResponse<TestItem>>>().mockImplementation(() => {
    callCount += 1
    if (callCount === 1) {
      return Promise.resolve({
        items: [{ id: '1', name: 'Test Item' }],
      })
    }
    return Promise.resolve({
      items: [{ id: '1', name: 'New Item' }],
    })
  })

  const mockPush = vi.fn<(options: any, changes: Changeset<TestItem>) => Promise<void>>()
    .mockRejectedValue(new Error('Push error'))

  const onError = vi.fn()
  const syncManager = new SyncManager({
    pull: mockPull,
    push: mockPush,
    onError,
  })

  const mockCollection = new Collection<TestItem, string, any>()

  syncManager.addCollection(mockCollection, { name: 'test' })
  await syncManager.sync('test')

  mockCollection.updateOne({ id: '1' }, { $set: { name: 'Updated Locally' } })
  await new Promise((resolve) => { setTimeout(resolve, 110) })

  expect(mockPush).toHaveBeenCalled()
  expect(onError).toHaveBeenCalledWith(new Error('Push error'))
})
