import { describe, expect, it } from 'bun:test'
import { createMockScene } from '../scene.test'

describe('Entity', () => {
  it('should create an entity', () => {
    const scene = createMockScene()
    const entity = scene.entities.create()
    expect(entity).toBeDefined()
  })
})
