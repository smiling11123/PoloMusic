import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { search } from '../../stores/search'

describe('Search Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has empty keyword by default', () => {
    const store = search()
    expect(store.keyword).toBe('')
  })

  it('updates keyword reactively', () => {
    const store = search()
    store.keyword = 'test query'
    expect(store.keyword).toBe('test query')
  })
})
