import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import client from '../graphql/client'
import { COMPRAR_MILLORA, GET_PERFIL } from '../graphql/queries'
import BootScene from '../game/BootScene'
import RecinteScene from '../game/RecinteScene'
import CasinoScene from '../game/CasinoScene'
import BlackjackScene from '../game/BlackjackScene'
import RuletaScene from '../game/RuletaScene'
import SlotsScene from '../game/SlotsScene'
import MonedaScene from '../game/MonedaScene'

export default function Battle({ jugador }) {
    const gameRef = useRef(null)
    const containerRef = useRef(null)
    const jugadorRef = useRef(jugador)

    useEffect(() => {
        jugadorRef.current = jugador
    }, [jugador])

    useEffect(() => {
        if (gameRef.current) return

        const w = window.innerWidth
        const h = window.innerHeight

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            width: w,
            height: h,
            backgroundColor: '#0d0a06',
            parent: containerRef.current,
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            },
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: []
        })

        game.scene.add('BootScene', BootScene, true, {
            nickname: jugador?.nickname || 'Presoner',
            monedes: jugador?.monedes ?? 400,
            dia: jugador?.diaActual ?? 1,
            millores: jugador?.millores || [],
            inventari: jugador?.inventari || []
        })
        game.scene.add('RecinteScene', RecinteScene, false)
        game.scene.add('CasinoScene', CasinoScene, false)
        game.scene.add('BlackjackScene', BlackjackScene, false)
        game.scene.add('RuletaScene', RuletaScene, false)
        game.scene.add('SlotsScene', SlotsScene, false)
        game.scene.add('MonedaScene', MonedaScene, false)

        gameRef.current = game

        // Bridge: compra des de Phaser → GraphQL
        const compraHandler = async (e) => {
            const j = jugadorRef.current
            if (!j?.id) return

            try {
                const { data } = await client.mutate({
                    mutation: COMPRAR_MILLORA,
                    variables: {
                        jugadorId: j.id,
                        nom: e.detail.nom,
                        descripcio: e.detail.descripcio
                    }
                })

                // Refrescar perfil
                const { data: perfilData } = await client.query({
                    query: GET_PERFIL,
                    variables: { id: j.id },
                    fetchPolicy: 'network-only'
                })

                if (perfilData?.perfilJugador) {
                    window.dispatchEvent(new CustomEvent('perfil-updated', {
                        detail: perfilData.perfilJugador
                    }))
                }
            } catch (err) {
                console.error('Error compra:', err)
            }
        }
        window.addEventListener('comprar-millora', compraHandler)

        return () => {
            window.removeEventListener('comprar-millora', compraHandler)
            game.destroy(true)
            gameRef.current = null
        }
    }, [jugador])

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }} />
    )
}
