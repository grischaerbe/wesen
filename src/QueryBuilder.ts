import type { ComponentConstructor } from './types'
import type { Entity } from './Entity'
import { Component } from 'src/Component'

type Condition = (entity: Entity) => boolean

export class QueryBuilder {
  private conditions: Condition[] = []

  constructor(private readonly entities: Set<Entity>) {}

  private evaluateConditions(entity: Entity): boolean {
    // No conditions means match all
    if (this.conditions.length === 0) {
      return true
    }

    // All conditions must be met (AND logic)
    return this.conditions.every((condition) => condition(entity))
  }

  /**
   * Query for entities that have all of the specified components
   *
   * @example
   * ```ts
   * // Single component
   * query().with(PlayerComponent)
   *
   * // Multiple components
   * query().with(MovementComponent, SpriteComponent)
   * ```
   */
  with<CC extends ComponentConstructor>(
    component: CC,
    check?: (component: InstanceType<CC>) => boolean
  ): this
  with<const ComponentConstructors extends [ComponentConstructor, ...ComponentConstructor[]]>(
    components: ComponentConstructors,
    check?: (components: {
      [K in keyof ComponentConstructors]: InstanceType<ComponentConstructors[K]>
    }) => boolean
  ): this
  with(
    componentOrComponents:
      | ComponentConstructor
      | readonly [ComponentConstructor, ...ComponentConstructor[]],
    check?: (component: any) => boolean
  ): this {
    if (Array.isArray(componentOrComponents)) {
      const ctors = componentOrComponents as ComponentConstructor[]
      if (!check) {
        const condition: Condition = (entity) => {
          return ctors.every((ctor) => entity.components.has(ctor))
        }
        this.conditions.push(condition)
      } else {
        const condition: Condition = (entity) => {
          const instances = ctors.map((ctor) => entity.components.find(ctor))
          if (instances.some((instance) => instance === undefined)) {
            return false
          }
          return check(instances)
        }
        this.conditions.push(condition)
      }
    } else {
      const ctor = componentOrComponents as ComponentConstructor
      if (!check) {
        const condition: Condition = (entity) => {
          return entity.components.has(ctor)
        }
        this.conditions.push(condition)
      } else {
        const condition: Condition = (entity) => {
          const componentInstance = entity.components.find(ctor)
          if (!componentInstance) {
            return false
          }
          return check(componentInstance)
        }
        this.conditions.push(condition)
      }
    }

    return this
  }

  /**
   * Query for entities that don't have any of the specified components
   *
   * @example
   * ```ts
   * // Single component
   * query().without(InvisibleComponent)
   *
   * // Multiple components
   * query().without(DeadComponent, DisabledComponent)
   * ```
   */
  without(...components: ComponentConstructor[]): this {
    const condition: Condition = (entity) => {
      return !components.some((Component) => entity.components.has(Component))
    }
    this.conditions.push(condition)
    return this
  }

  /**
   * Get the first entity that matches the query conditions
   *
   * @example
   * ```ts
   * const player = query()
   *   .with(PlayerComponent)
   *   .without(DeadComponent)
   *   .first()
   * ```
   */
  first(): Entity | undefined {
    let result: Entity | undefined
    for (const entity of this.entities) {
      if (this.evaluateConditions(entity)) {
        result = entity
        break
      }
    }
    this.conditions = []
    return result
  }

  /**
   * Get all entities that match the query conditions
   *
   * @example
   * ```ts
   * const enemies = query()
   *   .with(EnemyComponent)
   *   .without(DeadComponent)
   *   .all()
   * ```
   */
  all(): Entity[] {
    const result: Entity[] = []
    for (const entity of this.entities) {
      if (this.evaluateConditions(entity)) {
        result.push(entity)
      }
    }
    this.conditions = []
    return result
  }

  /**
   * Count the number of entities that match the query conditions
   *
   * @example
   * ```ts
   * const activeEnemyCount = query()
   *   .with(EnemyComponent)
   *   .without(DeadComponent)
   *   .count()
   * ```
   */
  count(): number {
    return this.all().length
  }

  /**
   * Check if any entities match the query conditions
   *
   * @example
   * ```ts
   * const hasActivePlayers = query()
   *   .with(PlayerComponent)
   *   .without(DeadComponent)
   *   .exists()
   * ```
   */
  exists(): boolean {
    return this.first() !== undefined
  }
}
