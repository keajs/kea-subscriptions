import { resetContext, kea, actions, reducers } from 'kea'

import { subscriptionsPlugin, subscriptions } from '../index'

describe('subscriptions', () => {
  beforeEach(() => {
    resetContext({
      plugins: [subscriptionsPlugin],
    })
  })

  test('subscriptions work', async () => {
    const print = []
    const logic = kea([
      actions({ setMyValue: (value) => ({ value }) }),
      reducers({ myValue: ['default', { setMyValue: (_, { value }) => value }] }),
      subscriptions({ myValue: (value, oldValue) => print.push({ value, oldValue }) }),
    ])
    expect(print).toEqual([])
    logic.mount()
    expect(print).toEqual([{ value: 'default', oldValue: undefined }])
    logic.actions.setMyValue('oldValue')
    expect(print).toEqual([
      { value: 'default', oldValue: undefined },
      { value: 'oldValue', oldValue: 'default' },
    ])
    logic.actions.setMyValue('newValue')
    expect(print).toEqual([
      { value: 'default', oldValue: undefined },
      { value: 'oldValue', oldValue: 'default' },
      { value: 'newValue', oldValue: 'oldValue' },
    ])
  })
})
