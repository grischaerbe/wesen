import * as Phaser from 'phaser'
import { resetCurrentEntity, setCurrentEntity, type Component } from './Component'
import type { Entity } from './Entity'
import type { ComponentConstructor } from './types'

/**
 * A component system is a collection of components that are attached to an
 * entity. Components can be added, removed, and retrieved from the component
 * system.
 *
 * @example
 * ```ts
 * const componentSystem = new ComponentSystem(entity)
 * componentSystem.add(SpriteRendererComponent, 0, 0, 'ghost')
 * ```
 *
 * You may also listen for events on the component system:
 *
 * ```ts
 * componentSystem.on('add', (component) => {
 *   console.log('Component added:', component)
 * })
 * componentSystem.on('remove', (component) => {
 *   console.log('Component removed:', component)
 * })
 * ```
 */
export class ComponentSystem {
  private componentsMap: Map<typeof Component, Component> = new Map()
  private componentsList: Component[] = []
  private componentsListDirty = true

  /**
   * Events emitted by the component system.
   * Events:
   * - `'add'`: when a component is added
   *   - `on('add', (component: Component) => {})`
   * - `'remove'`: when a component is removed
   *   - `on('remove', (component: Component) => {})`
   * - `'update'`: when a component is added or removed
   *   - `on('update', () => {})`
   */
  public readonly events = new Phaser.Events.EventEmitter()

  constructor(private readonly entity: Entity) {}

  private rebuildList() {
    if (!this.componentsListDirty) return
    const values = Array.from(this.componentsMap.values())
    this.componentsList = values.sort((a, b) => a.priority - b.priority)
    this.componentsListDirty = false
  }

  /**
   * Iterate over all components in the component system.
   *
   * @example
   * ```ts
   * this.entity.components.forEach((component) => {
   *   console.log(component)
   * })
   * ```
   */
  public forEach(callback: (component: Component) => void) {
    this.rebuildList()
    for (let i = 0; i < this.componentsList.length; i++) {
      callback(this.componentsList[i])
    }
  }

  /**
   * Get a component from the component system. Will throw an error if the
   * component is not found.
   *
   * @example
   * ```ts
   * const spriteRenderer = this.entity.components.get(SpriteRendererComponent)
   * ```
   */
  public get<T extends Component>(Component: ComponentConstructor<T>): T {
    const instance = this.componentsMap.get(Component)
    if (!instance) {
      throw new Error(`Component ${Component.name} not found on entity`)
    }
    return instance as T
  }

  /**
   * Get a component from the component system. Will return `undefined` if the
   * component is not found.
   *
   * @example
   * ```ts
   * const spriteRenderer = this.entity.components.find(SpriteRendererComponent)
   * ```
   */
  public find<T extends Component>(Component: ComponentConstructor<T>): T | undefined {
    return this.componentsMap.get(Component) as T | undefined
  }

  /**
   * Check if a component exists in the component system.
   *
   * @example
   * ```ts
   * const hasSpriteRenderer = this.entity.components.has(SpriteRendererComponent)
   * ```
   */
  public has<T extends Component>(Component: ComponentConstructor<T>): boolean {
    return this.componentsMap.has(Component)
  }

  /**
   * Add a component to the component system. Will throw an error if the
   * component already exists.
   *
   * The constructor of the component will be called with the given arguments.
   *
   * @example
   * ```ts
   * this.entity.components.add(SpriteRendererComponent, 0, 0, 'ghost')
   * ```
   */
  public add<T extends ComponentConstructor>(
    Component: T,
    ...args: ConstructorParameters<T>
  ): InstanceType<T> {
    if (this.componentsMap.has(Component)) {
      throw new Error(`Can't add component because ${Component.name} already exists`)
    }

    setCurrentEntity(this.entity)
    const instance = new Component(...(args as unknown as []))
    resetCurrentEntity()
    instance.entity = this.entity

    this.componentsMap.set(Component, instance)

    this.componentsListDirty = true

    this.events.emit('add', instance)
    this.events.emit('update')
    return instance as InstanceType<T>
  }

  /**
   * Remove a component from the component system.
   *
   * @example
   * ```ts
   * this.entity.components.remove(SpriteRendererComponent)
   * ```
   */
  public remove<T extends Component>(Component: ComponentConstructor<T>) {
    const instance = this.componentsMap.get(Component)
    if (!instance) return
    instance.destroy()
    this.componentsMap.delete(Component)
    this.componentsListDirty = true

    this.events.emit('remove', instance)
    this.events.emit('update')
  }

  /**
   * Get all currently registered components.
   */
  public all(): Component[] {
    this.rebuildList()
    return this.componentsList
  }

  /**
   * Remove all components from the component system.
   *
   * @example
   * ```ts
   * this.entity.components.clear()
   * ```
   */
  public clear() {
    this.componentsMap.clear()
    this.componentsList = []
    this.componentsListDirty = false
  }
}
