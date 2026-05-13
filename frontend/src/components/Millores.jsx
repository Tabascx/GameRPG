const MILLORES_DISPONIBLES = [
    { nom: 'muralla', descripcio: 'Muralla reforçada - El seguro cobreix més pèrdues', cost: 150 },
    { nom: 'taberna', descripcio: 'Taberna - +50$ de bonus cada dia', cost: 100 },
    { nom: 'cofre', descripcio: 'Cofre del tresor - Augmenta el límit de aposta', cost: 200 },
]

export default function Millores({ jugadorId, monedes, millores = [], onComprar }) {
    const milloraIds = millores.map(m => m.nom)

    return (
        <div className="card bg-dark text-white mb-4">
            <div className="card-body">
                <h5 className="card-title">🏰 Millores del Recinte</h5>
                {MILLORES_DISPONIBLES.map(m => {
                    const comprada = milloraIds.includes(m.nom)
                    const potComprar = monedes >= m.cost
                    return (
                        <div key={m.nom} className="card bg-secondary mb-2 p-2">
                            <p className="mb-1"><strong>{m.nom.toUpperCase()}</strong> — {m.cost}$</p>
                            <p className="mb-1 small">{m.descripcio}</p>
                            {comprada ? (
                                <span className="badge bg-success">✅ Comprada</span>
                            ) : (
                                <button
                                    className="btn btn-warning btn-sm"
                                    disabled={!potComprar}
                                    onClick={() => onComprar(m.nom, m.descripcio)}
                                >
                                    {potComprar ? 'Comprar' : 'Sense monedes'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}