import type { BaseItem } from 'signaldb/Collection/types'
import type { Changeset, LoadResponse } from 'signaldb/types/PersistenceAdapter'
import Collection from '../Collection'
import debounce from '../utils/debounce'
import PromiseQueue from '../utils/PromiseQueue'
import createLocalStorageAdapter from '../persistence/createLocalStorageAdapter'
import type PersistenceAdapter from '../types/PersistenceAdapter'
import type ReactivityAdapter from '../types/ReactivityAdapter'
import sync from './sync'
import type { Change, Snapshot, SyncOperation } from './types'

type SyncOptions<T extends Record<string, any>> = {
  name: string,
} & T

interface Options<
  CollectionOptions extends Record<string, any>,
  ItemType extends BaseItem<IdType> = BaseItem,
  IdType = any,
> {
  pull: (
    collectionOptions: SyncOptions<CollectionOptions>,
  ) => Promise<LoadResponse<ItemType>>,
  push: (
    collectionOptions: SyncOptions<CollectionOptions>,
    changes: Changeset<ItemType>,
  ) => Promise<void>,
  registerRemoteChange?: (
    onChange: (
      collectionOptions: SyncOptions<CollectionOptions>,
      data?: LoadResponse<ItemType>,
    ) => void | Promise<void>
  ) => void,

  id?: string,
  persistenceAdapter?: (id: string) => PersistenceAdapter<any, any>,
  reactivity?: ReactivityAdapter,
}

export default class SyncManager<
  CollectionOptions extends Record<string, any>,
  ItemType extends BaseItem<IdType> = BaseItem,
  IdType = any,
> {
  private options: Options<CollectionOptions, ItemType, IdType>
  private collections: Map<string, [
    Collection<ItemType, IdType, any>,
    SyncOptions<CollectionOptions>,
  ]> = new Map()

  private changes: Collection<Change<ItemType>>
  private snapshots: Collection<Snapshot<ItemType>>
  private syncOperations: Collection<SyncOperation>
  private remoteChanges: Collection<Change>
  private syncQueues: Map<string, PromiseQueue> = new Map()

  constructor(options: Options<CollectionOptions, ItemType, IdType>) {
    this.options = options
    const id = this.options.id ?? 'default-sync-manager'
    const { reactivity } = this.options

    const persistenceAdapter = options.persistenceAdapter ?? createLocalStorageAdapter
    this.changes = new Collection({ persistence: persistenceAdapter(`${id}-changes`), reactivity })
    this.remoteChanges = new Collection({ persistence: persistenceAdapter(`${id}-remote-changes`), reactivity })
    this.snapshots = new Collection({ persistence: persistenceAdapter(`${id}-snapshots`), reactivity })
    this.syncOperations = new Collection({ persistence: persistenceAdapter(`${id}-sync-operations`), reactivity })
    if (this.options.registerRemoteChange) {
      this.options.registerRemoteChange(({ name }, data) => {
        if (data == null) {
          void this.sync(name)
        } else {
          void this.syncWithData(name, data)
        }
      })
    }

    this.changes.setMaxListeners(1000)
    this.remoteChanges.setMaxListeners(1000)
    this.snapshots.setMaxListeners(1000)
    this.syncOperations.setMaxListeners(1000)
  }

  private getSyncQueue(name: string) {
    if (this.syncQueues.get(name) == null) {
      this.syncQueues.set(name, new PromiseQueue())
    }
    return this.syncQueues.get(name) as PromiseQueue
  }

  public getCollection(name: string) {
    const entry = this.collections.get(name)
    if (entry == null) throw new Error(`Collection with id '${name}' not found`)
    return entry
  }

  public addCollection(
    collection: Collection<ItemType, IdType, any>,
    options: SyncOptions<CollectionOptions>,
  ) {
    this.collections.set(options.name, [collection, options])
    collection.on('added', (item) => {
      // skip the change if it was a remote change
      if (this.remoteChanges.findOne({ collectionName: options.name, type: 'insert', data: item })) {
        this.remoteChanges.removeOne({ collectionName: options.name, type: 'insert', data: item })
        return
      }
      this.changes.insert({
        collectionName: options.name,
        time: Date.now(),
        type: 'insert',
        data: item,
      })
      this.schedulePush(options.name)
    })
    collection.on('changed', ({ id }, modifier) => {
      const data = { id, modifier }
      // skip the change if it was a remote change
      if (this.remoteChanges.findOne({ collectionName: options.name, type: 'update', data })) {
        this.remoteChanges.removeOne({ collectionName: options.name, type: 'update', data })
        return
      }
      this.changes.insert({
        collectionName: options.name,
        time: Date.now(),
        type: 'update',
        data,
      })
      this.schedulePush(options.name)
    })
    collection.on('removed', ({ id }) => {
      // skip the change if it was a remote change
      if (this.remoteChanges.findOne({ collectionName: options.name, type: 'remove', data: id })) {
        this.remoteChanges.removeOne({ collectionName: options.name, type: 'remove', data: id })
        return
      }
      this.changes.insert({
        collectionName: options.name,
        time: Date.now(),
        type: 'remove',
        data: id,
      })
      this.schedulePush(options.name)
    })
  }

  private deboucedPush = debounce(async (name: string) => {
    await this.pushChanges(name)
  }, 100)

  private schedulePush(name: string) {
    this.deboucedPush(name)
  }

  /**
   *
   */
  public async syncAll() {
    await Promise.all([...this.collections.keys()].map(id => this.sync(id)))
  }

  public isSyncing(name?: string) {
    return this.syncOperations.findOne({
      ...name ? { collectionName: name } : {},
      status: 'active',
    }, { fields: { status: 1 } }) != null
  }

  public async sync(name: string, options: { force?: boolean, onlyWithChanges?: boolean } = {}) {
    // schedule for next tick to allow other tasks to run first
    await new Promise((resolve) => { setTimeout(resolve, 0) })
    const doSync = async () => {
      if (options?.onlyWithChanges) {
        const lastFinishedSync = this.syncOperations.findOne({ collectionName: name, status: 'done' }, { sort: { time: -1 } })
        const currentChanges = this.changes.find({
          collectionName: name,
          $and: [
            { time: { $gte: lastFinishedSync?.end ?? 0 } },
            { time: { $lte: Date.now() } },
          ],
        }, { sort: { time: 1 } }).count()
        if (currentChanges === 0) return
      }
      const entry = this.getCollection(name)
      const collectionOptions = entry[1]

      const data = await this.options.pull(collectionOptions)
      await this.syncWithData(name, data)
    }
    await (options?.force ? doSync() : this.getSyncQueue(name).add(doSync))
  }

  public async pushChanges(name: string) {
    await this.sync(name, {
      onlyWithChanges: true,
    })
  }

  private async syncWithData(name: string, data: LoadResponse<ItemType>) {
    const entry = this.getCollection(name)
    const [collection, collectionOptions] = entry

    const syncTime = Date.now()

    const syncId = this.syncOperations.insert({
      start: syncTime,
      collectionName: name,
      status: 'active',
    })

    const lastFinishedSync = this.syncOperations.findOne({ collectionName: name, status: 'done' }, { sort: { time: -1 } })
    const lastSnapshot = this.snapshots.findOne({ collectionName: name }, { sort: { time: -1 } })
    const currentChanges = this.changes.find({
      collectionName: name,
      $and: [
        { time: { $gte: lastFinishedSync?.end ?? 0 } },
        { time: { $lte: syncTime } },
      ],
    }, { sort: { time: 1 } }).fetch()

    await sync<ItemType, ItemType['id']>({
      changes: currentChanges,
      lastSnapshot: lastSnapshot?.items,
      data,
      pull: () => this.options.pull(collectionOptions),
      push: changes => this.options.push(collectionOptions, changes),
      insert: (item) => {
        this.remoteChanges.insert({
          collectionName: name,
          time: Date.now(),
          type: 'insert',
          data: item,
        })
        collection.insert(item)
      },
      update: (itemId, modifier) => {
        this.remoteChanges.insert({
          collectionName: name,
          time: Date.now(),
          type: 'update',
          data: { id: itemId, modifier },
        })
        collection.updateOne({ id: itemId } as Record<string, any>, modifier)
      },
      remove: (itemId) => {
        this.remoteChanges.insert({
          collectionName: name,
          time: Date.now(),
          type: 'remove',
          data: itemId,
        })
        collection.removeOne({ id: itemId } as Record<string, any>)
      },
    })
      .then(async (snapshot) => {
        // clean up old snapshots
        this.snapshots.removeMany({ collectionName: name, time: { $lte: syncTime } })

        // clean up processed changes
        this.changes.removeMany({
          collectionName: name,
          id: { $in: currentChanges.map(c => c.id) },
        })

        // insert new snapshot
        this.snapshots.insert({
          time: syncTime,
          collectionName: name,
          items: snapshot,
        })

        // delay sync operation update to next tick to allow other tasks to run first
        await new Promise((resolve) => { setTimeout(resolve, 0) })

        this.syncOperations.updateOne({ id: syncId }, {
          $set: { status: 'done', end: Date.now() },
        })
      })
      .catch((error: any) => {
        this.syncOperations.updateOne({ id: syncId }, {
          $set: { status: 'error', end: Date.now(), error },
        })
        throw error
      })

    // check if there are unsynced changes to push
    // after the sync was finished successfully
    await this.sync(name, {
      force: true,
      onlyWithChanges: true,
    })
  }
}
