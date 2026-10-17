import { Component, type ReactNode } from 'react'

/** Filet de sécurité : si un effet visuel (WebGL) plante, il disparaît sans faire tomber la caisse. */
export class FxBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Effet visuel désactivé :', error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
