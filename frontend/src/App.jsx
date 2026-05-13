import { useState } from 'react'
import Hangar from './pages/Hangar'
import Battle from './pages/Battle'

function App() {
  const [page, setPage] = useState('hangar')
  const [jugador, setJugador] = useState(null)

  return (
      <div>
        <nav className="navbar navbar-dark bg-dark px-4">
          <span className="navbar-brand">🔒 IRON GATE</span>
          <div>
            <button
                className="btn btn-outline-light me-2"
                onClick={() => setPage('hangar')}
            >
              Hangar
            </button>
            <button
                className="btn btn-danger"
                onClick={() => setPage('battle')}
                disabled={!jugador}
            >
              Batallar
            </button>
          </div>
        </nav>

        {page === 'hangar' ? (
            <Hangar jugador={jugador} setJugador={setJugador} />
        ) : (
            <Battle jugador={jugador} />
        )}
      </div>
  )
}

export default App