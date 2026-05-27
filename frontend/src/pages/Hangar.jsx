import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_PERFIL, REGISTRAR_JUGADOR } from '../graphql/queries'
import Leaderboard from '../components/Leaderboard'

export default function Hangar({ setJugador, onReady }) {
    const [nickname, setNickname] = useState('')
    const [error, setError] = useState('')
    const [jugadorId, setJugadorId] = useState(() => localStorage.getItem('jugadorId') || '')

    const { data: perfilData } = useQuery(GET_PERFIL, {
        variables: { id: jugadorId },
        skip: !jugadorId,
        fetchPolicy: 'network-only'
    })

    useEffect(() => {
        if (perfilData?.perfilJugador) {
            setJugador(perfilData.perfilJugador)
            localStorage.setItem('jugadorId', perfilData.perfilJugador.id)
            localStorage.setItem('nickname', perfilData.perfilJugador.nickname)
            onReady()
        }
    }, [perfilData, setJugador, onReady])

    const [registrar] = useMutation(REGISTRAR_JUGADOR, {
        onCompleted: (result) => {
            const j = result?.registrarJugador
            if (j?.__typename === 'ErrorNoAutoritzat') {
                setError(j.missatge)
                return
            }
            if (j?.__typename === 'Jugador') {
                setError('')
                setJugadorId(j.id)
                localStorage.setItem('jugadorId', j.id)
                localStorage.setItem('nickname', j.nickname)
                setJugador(j)
                onReady()
            }
        },
        onError: (err) => setError(err.message)
    })

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="text-center" style={{ maxWidth: 420, width: '100%' }}>
                <h1 className="display-4" style={{ fontFamily: 'Cinzel, serif', color: '#c9a227', textShadow: '0 0 30px #c9a22766' }}>
                    IRON GATE
                </h1>
                <p className="mb-4" style={{ color: '#a08c5a', fontStyle: 'italic' }}>
                    Entra al casino. Sobrevive. Conquista.
                </p>

                {!jugadorId ? (
                    <div className="mb-4">
                        <input
                            className="form-control mb-2 text-center"
                            placeholder="Nombre del prisionero"
                            value={nickname}
                            onChange={e => { setNickname(e.target.value); setError('') }}
                        />
                        {error && <p className="text-danger small">{error}</p>}
                        <button
                            className="btn btn-warning w-100"
                            onClick={() => registrar({ variables: { nickname: nickname.trim() } })}
                            disabled={!nickname.trim()}
                        >
                            ENTRAR
                        </button>
                    </div>
                ) : (
                    <p className="text-muted small">Cargando perfil...</p>
                )}

                <Leaderboard />
            </div>
        </div>
    )
}
