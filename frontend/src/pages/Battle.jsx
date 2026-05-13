import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import GameScene from '../game/GameScene'

export default function Battle({ jugador }) {
    const gameRef = useRef(null)

    useEffect(() => {
        if (gameRef.current) return

        gameRef.current = new Phaser.Game({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            backgroundColor: '#000011',
            parent: 'phaser-container',
            scene: [GameScene],
        })

        return () => {
            gameRef.current?.destroy(true)
            gameRef.current = null
        }
    }, [])

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-12 text-center">
                    <h3 className="text-warning">⚔️ Combat — Dia {jugador?.diaActual}</h3>
                    <p className="text-white">Monedes: <strong>{jugador?.monedes}$</strong></p>
                </div>
                <div className="col-12 d-flex justify-content-center">
                    <div id="phaser-container" />
                </div>
            </div>
        </div>
    )
}