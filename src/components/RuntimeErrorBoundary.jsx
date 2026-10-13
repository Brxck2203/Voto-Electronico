import { Component } from 'react'

/**
 * Un fallo de renderizado no debe dejar al usuario ante una pantalla vacía.
 * No muestra credenciales, tokens ni detalles internos en una build de producción.
 * Esta barrera es una medida de recuperación de UI, no una autorización.
 */
export class RuntimeErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, attempts: 0 }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error al renderizar Voto Electrónico:', error, info.componentStack)
  }

  retry = () => {
    this.setState(s => ({ error: null, attempts: s.attempts + 1 }))
  }

  render() {
    if (!this.state.error) {
      return <div key={this.state.attempts}>{this.props.children}</div>
    }

    const detail = import.meta.env.DEV
      ? (this.state.error?.message || String(this.state.error))
      : 'No se pudo mostrar esta pantalla. Por favor recarga la aplicación.'

    return <main role="alert" className="runtime-error-scene">
      <section className="runtime-error-panel">
        <p className="eyebrow">VOTO ELECTRÓNICO · DIAGNÓSTICO</p>
        <h1>Hubo un problema al mostrar el panel</h1>
        <p>Tu sesión no se ha convertido en otra cuenta ni se han cambiado tus permisos.</p>
        <p className="runtime-error-detail">{detail}</p>
        <p>Si el problema persiste, abre la consola del navegador con F12 y copia el primer error rojo, sin compartir contraseñas, códigos electorales ni tokens.</p>
        <div className="action-row">
          <button type="button" className="btn btn--secondary" onClick={this.retry}>Reintentar cargar el panel</button>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>Recargar aplicación</button>
        </div>
      </section>
    </main>
  }
}
