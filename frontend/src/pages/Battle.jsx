import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import LoginScene from '../game/LoginScene'
import RecinteScene from '../game/RecinteScene'
import CasinoScene from '../game/CasinoScene'
import BlackjackScene from '../game/BlackjackScene'
import RuletaScene from '../game/RuletaScene'
import SlotsScene from '../game/SlotsScene'

export default function Battle({ jugador }) {
    const gameRef = useRef(null)

    useEffect(() => {
        if (gameRef.current) return

        gameRef.current = new Phaser.Game({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            backgroundColor: '#0d0a06',
            parent: 'phaser-container',
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            },
            scene: [LoginScene, RecinteScene, CasinoScene, BlackjackScene, RuletaScene, SlotsScene]
        })

        return () => {
            gameRef.current?.destroy(true)
            gameRef.current = null
        }
    }, [])

    return (
        <div style={{ background: '#0d0a06', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
            <div id="phaser-container" />
        </div>
    )
}