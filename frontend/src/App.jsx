import { Suspense, lazy, useState, useCallback } from 'react'

const Auth = lazy(() => import('./pages/Auth'))
const Battle = lazy(() => import('./pages/Battle'))

function App() {
    const [page, setPage] = useState(() => {
        return localStorage.getItem('token') ? 'battle' : 'auth'
    })
    const [jugadorId, setJugadorId] = useState(() => localStorage.getItem('uid') || '')

    const onAuth = useCallback((uid) => {
        setJugadorId(uid)
        document.getElementById('game-container')?.focus()
        setPage('battle')
    }, [])

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <Suspense fallback={<div className="text-center text-light mt-4">Cargando...</div>}>
                {page === 'auth' ? (
                    <Auth onAuth={onAuth} />
                ) : (
                    <Battle jugadorId={jugadorId} />
                )}
            </Suspense>
        </div>
    )
}

export default App
