import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_PERFIL, REGISTRAR_JUGADOR, COMPRAR_MILLORA } from '../graphql/queries'
import Radar from '../components/Radar'
import Millores from '../components/Millores'
import Leaderboard from '../components/Leaderboard'

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJqdWdhZG9yMSIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.fgxo5xpVBxfm-Rf9OQ2Vm42CbHusauAvWLXQaz_2m7o'
const JUGADOR_ID = 'jugador1'

localStorage.setItem('token', TOKEN)

export default function Hangar({ jugador, setJugador }) {
    const [nickname, setNickname] = useState('')

    const { data, refetch } = useQuery(GET_PERFIL, {
        variables: { id: JUGADOR_ID }
    })

    useEffect(() => {
        if (data?.perfilJugador) {
            setJugador(data.perfilJugador)
        }
    }, [data])

    const [registrar] = useMutation(REGISTRAR_JUGADOR, {
        onCompleted: () => refetch()
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
                                        onChange={e => setNickname(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-warning w-100"
                                        onClick={() => registrar({ variables: { nickname } })}
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
                        jugadorId={JUGADOR_ID}
                        monedes={perfil?.monedes}
                        millores={perfil?.millores}
                        onComprar={(nom, descripcio) =>
                            comprar({ variables: { jugadorId: JUGADOR_ID, nom, descripcio } })
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