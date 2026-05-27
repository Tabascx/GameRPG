import { useQuery } from '@apollo/client'
import { GET_LEADERBOARD } from '../graphql/queries'

export default function Leaderboard() {
    const { data, loading } = useQuery(GET_LEADERBOARD)

    if (loading) return <div className="text-white">Cargando...</div>

    return (
        <div className="card bg-dark text-white mb-4">
            <div className="card-body">
                <h5 className="card-title">🏆 Clasificación</h5>
                <table className="table table-dark table-striped">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Jugador</th>
                        <th>Nivel</th>
                        <th>Monedas</th>
                        <th>Día</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data?.leaderboard.map((j, i) => (
                        <tr key={j.id}>
                            <td>{i + 1}</td>
                            <td>{j.nickname}</td>
                            <td>{j.nivell}</td>
                            <td>{j.monedes}$</td>
                            <td>{j.diaActual}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
