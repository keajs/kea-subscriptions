import { setPluginContext, getPluginContext, Logic, LogicBuilder, afterMount, beforeUnmount, getContext } from "kea";
import type { BuiltLogic, CreateStoreOptions, KeaPlugin } from 'kea'

export type Subscription = (value: any, lastValue: any) => void

type RecordedSubscription = {
  selector: (state: any, props: any) => any
  subscription: Subscription
  lastValue: any
  logic: BuiltLogic
}

type SubscribersPluginContext = {
  subscriptions: Set<RecordedSubscription>
}
const getSubscribersContext = (): SubscribersPluginContext => getPluginContext('subscriptions')
const setSubscribersContext = (context: SubscribersPluginContext) => setPluginContext('subscriptions', context)

export function subscriptions<L extends Logic = Logic, I = Partial<Record<keyof L['values'], Subscription>>>(
  input: I | ((logic: BuiltLogic<L>) => I),
): LogicBuilder<L> {
  return (logic) => {
    const { subscriptions: globalSubscriptions } = getSubscribersContext()
    const subscriptions = typeof input === 'function' ? (input as (logic: BuiltLogic<L>) => I)(logic) : input
    for (const [key, subscription] of Object.entries(subscriptions)) {
      let recordedSubscription: RecordedSubscription | undefined
      afterMount(() => {
        const selector = logic.selectors[key]
        if (!selector) {
          throw new Error(
            `[KEA] Could not find selector for key "${key}" in logic "${logic.pathString}". Tried to set up a subscription for key "${key}".`,
          )
        }
        let lastValue: any
        try {
          lastValue = selector(getContext().store.getState(), logic.props)
        } catch (e) {
          console.error(`[KEA] Selector "${key}" on logic "${logic.pathString}" threw.`, e)
          throw e
        }
        if (typeof lastValue !== 'undefined') {
          subscription(lastValue, undefined)
        }
        recordedSubscription = {
          logic,
          subscription,
          selector,
          lastValue,
        }
        globalSubscriptions.add(recordedSubscription)
      })(logic)
      beforeUnmount(() => {
        if (recordedSubscription) {
          globalSubscriptions.delete(recordedSubscription)
        }
      })(logic)
    }
  }
}

export const subscriptionsPlugin: KeaPlugin = {
  name: 'subscriptions',
  events: {
    afterPlugin(): void {
      setSubscribersContext({
        subscriptions: new Set(),
      })
    },
    beforeReduxStore(options: CreateStoreOptions): void {
      options.middleware.push((store) => (next) => (action) => {
        const response = next(action)
        getSubscribersContext().subscriptions.forEach((sub) => {
          try {
            const newValue = sub.selector(store.getState(), sub.logic.props)
            if (sub.lastValue !== newValue) {
              const lastValue = sub.lastValue
              sub.lastValue = newValue
              sub.subscription(newValue, lastValue)
            }
          } catch (error) {
            console.error(`[KEA] Subscription Failed for action ${action.type} on logic ${sub.logic.pathString}.`)
            console.error(error)
          }
        })
        return response
      })
    },
  },
}
