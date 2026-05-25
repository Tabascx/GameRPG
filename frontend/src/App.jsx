import { Suspense, lazy, useState } from 'react'

const Hangar = lazy(() => import('./pages/Hangar'))
const Battle = lazy(() => import('./pages/Battle'))

function App() {
  const [page, setPage] = useState(() => {
    return localStorage.getItem('jugadorId') ? 'battle' : 'hangar'
  })
  const [jugador, setJugador] = useState(null)

  return (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
        <Suspense fallback={<div className="text-center text-light mt-4">Carregant...</div>}>
          {page === 'hangar' ? (
              <Hangar jugador={jugador} setJugador={setJugador} onReady={() => setPage('battle')} />
          ) : (
              <Battle jugador={jugador} />
          )}
        </Suspense>
      </div>
  )
}

export default App
