import { useState } from 'react'
import { loadDeveloperTools } from '@signaldb/core'
import Todos from '../../models/Todos'
import List from './List'

loadDeveloperTools()

const App: React.FC = () => {
  const [text, setText] = useState('')
  return (
    <>
      <input
        type="text"
        value={text}
        placeholder="Type and press Enter to add a new item …"
        onChange={event => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            if (text === '') return
            Todos.insert({
              text,
              completed: false,
            })
            setText('')
          }
        }}
      />
      <List />
    </>
  )
}

export default App
