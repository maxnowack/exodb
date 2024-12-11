import {
  signal,
  peek,
  getScope,
  onDispose,
} from '@maverick-js/signals'
import { createReactivityAdapter } from 'signaldb'

const maverickjsReactivityAdapter = createReactivityAdapter({
  create: () => {
    const dep = signal(0)
    return {
      depend: () => {
        dep()
      },
      notify: () => {
        dep.set(peek(() => dep() + 1))
      },
    }
  },
  isInScope: () => !!getScope(),
  onDispose: callback => onDispose(callback),
})

export default maverickjsReactivityAdapter
