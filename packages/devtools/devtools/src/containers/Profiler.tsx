import React, { useMemo, useState } from 'react'
import type { Collection } from '@signaldb/core'
import styled from 'styled-components'
import UnstyledCollectionList from '../components/CollectionList'
import Table from '../components/Table'
import dataStore from '../models/dataStore'
import useCollectionMeasuredTimes from '../utils/useCollectionMeasuredTimes'

const Wrapper = styled.div`
  display: grid;
  grid-template-areas: 'list items';
  grid-template-columns: 200px 1fr;
  overflow: hidden;
  height: 100%;
`
const CollectionList = styled(UnstyledCollectionList)`
  grid-area: list;
`
const Items = styled(Table)`
  grid-area: items;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
`

const Profiler: React.FC = () => {
  const [collectionName, setCollectionName] = useState<string>()
  const collectionsItem = dataStore.useItem('collections')
  const collection = useMemo(
    () => collectionsItem?.items.find(c => c.name === collectionName) as Collection<any>,
    [collectionsItem, collectionName],
  )
  const measuredTimes = useCollectionMeasuredTimes(collectionName || '')
  return (
    <Wrapper>
      <CollectionList
        value={collectionName}
        onChange={name => setCollectionName(name)}
      />
      {collection
        ? (
          <Items
            itemColumn={`${collectionName} (${measuredTimes.length} measurements)`}
            items={measuredTimes}
          />
        )
        : (
          <Items
            items={[]}
            placeholder="Select a collection on the left"
          />
        )}
    </Wrapper>
  )
}

export default Profiler
