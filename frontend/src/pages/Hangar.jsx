import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_PERFIL, REGISTRAR_JUGADOR, COMPRAR_MILLORA } from '../graphql/queries'
import Radar from '../components/Radar'
import Millores from '../components/Millores'
import Leaderboard from '../components/Leaderboard'

export default function Hangar({ setJugador }) {
    const [nickname, setNickname] = useState('')
    const [error, setError] = useState('')
    const [jugadorId, setJugadorId] = useState(() => localStorage.getItem('jugadorId') || '')

    const { data, refetch } = useQuery(GET_PERFIL, {
        variables: { id: jugadorId },
        skip: !jugadorId,
        fetchPolicy: 'network-only'
    })

    useEffect(() => {
        if (data?.perfilJugador) {
            setJugador(data.perfilJugador)
            localStorage.setItem('jugadorId', data.perfilJugador.id)
        }
    }, [data, setJugador])

    const [registrar] = useMutation(REGISTRAR_JUGADOR, {
        onCompleted: (result) => {
            const jugadorRegistrado = result?.registrarJugador
            if (jugadorRegistrado?.__typename === 'ErrorNoAutoritzat') {
                setError(jugadorRegistrado.missatge)
                return
            }
            if (jugadorRegistrado?.__typename === 'Jugador') {
                setError('')
                setJugadorId(jugadorRegistrado.id)
                localStorage.setItem('jugadorId', jugadorRegistrado.id)
                setJugador(jugadorRegistrado)
                refetch({ id: jugadorRegistrado.id })
            }
        },
        onError: (err) => {
            setError(err.message)
        }
    })

    const [comprar] = useMutation(COMPRAR_MILLORA, {
        onCompleted: () => refetch()
    })

    const perfil = data?.perfilJugador

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5 className="card-title">🔒 Iron Gate</h5>
                            {perfil ? (
                                <>
                                    <p>Pilot: <strong>{perfil.nickname}</strong></p>
                                    <p>Monedes: <strong>{perfil.monedes}$</strong></p>
                                    <p>Dia: <strong>{perfil.diaActual}</strong></p>
                                </>
                            ) : (
                                <div>
                                    <input
                                        className="form-control mb-2"
                                        placeholder="Nom del pilot"
                                        value={nickname}
                                        onChange={e => {
                                            setNickname(e.target.value)
                                            setError('')
                                        }}
                                    />
                                    {error && <p className="text-danger mb-2">{error}</p>}
                                    <button
                                        className="btn btn-warning w-100"
                                        onClick={() => registrar({ variables: { nickname: nickname.trim() } })}
                                        disabled={!nickname.trim()}
                                    >
                                        Registrar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <Radar />
                </div>

                <div className="col-md-4">
                    <Millores
                        jugadorId={jugadorId}
                        monedes={perfil?.monedes}
                        millores={perfil?.millores}
                        onComprar={(nom, descripcio) =>
                            comprar({ variables: { jugadorId: jugadorId, nom, descripcio } })
                        }
                    />
                </div>

                <div className="col-md-4">
                    <Leaderboard />
                </div>
            </div>
        </div>
    )
}
