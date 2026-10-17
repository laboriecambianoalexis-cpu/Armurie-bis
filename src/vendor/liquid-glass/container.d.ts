export interface ContainerOptions {
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
}

export default class Container {
  constructor(options?: ContainerOptions)
  element: HTMLDivElement
  canvas: HTMLCanvasElement
  updateSizeFromDOM(): void
  destroy(): void
  static refresh(): void
  static instances: Container[]
}
