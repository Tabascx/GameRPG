import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import client from '../graphql/client'
import { GET_PERFIL, REGISTRAR_JUGADOR, NETEGAR_BASE_DADES, SINCRONITZAR_JUGADOR } from '../graphql/queries'
import BootScene from '../game/BootScene'
import RecinteScene from '../game/RecinteScene'
import CasinoScene from '../game/CasinoScene'
import BlackjackScene from '../game/BlackjackScene'
import RuletaScene from '../game/RuletaScene'
import SlotsScene from '../game/SlotsScene'
import MonedaScene from '../game/MonedaScene'
import DausScene from '../game/DausScene'
import BossBlackjackScene from '../game/BossBlackjackScene'

export default function Battle({ jugadorId }) {
    const gameRef = useRef(null)
    const containerRef = useRef(null)
    const jugadorIdRef = useRef(jugadorId)
    const [jugador, setJugador] = useState(null)

    useEffect(() => {
        jugadorIdRef.current = jugadorId
    }, [jugadorId])

    useEffect(() => {
        if (!jugadorId) return

        const resetFlag = localStorage.getItem('irongate_reset')
        const uid = localStorage.getItem('uid') || 'anonim'
        const hasSave = localStorage.getItem(`irongate_save_${uid}`)

        if (resetFlag && !hasSave) {
            localStorage.removeItem('irongate_reset')
            const nick = localStorage.getItem('nickname') || 'Presoner'
            setJugador({
                nickname: nick,
                monedes: 400,
                diaActual: 1,
                millores: [],
                inventari: []
            })
            return
        }

        client.query({
            query: GET_PERFIL,
            variables: { id: jugadorId },
            fetchPolicy: 'network-only'
        }).then(({ data }) => {
            if (data?.perfilJugador) {
                setJugador(data.perfilJugador)
            } else {
                // Auto-registrar jugador si no existe
                const nick = localStorage.getItem('nickname') || 'Presoner'
                client.mutate({
                    mutation: REGISTRAR_JUGADOR,
                    variables: { nickname: nick }
                }).then(({ data: rData }) => {
                    if (rData?.registrarJugador?.__typename === 'Jugador') {
                        setJugador(rData.registrarJugador)
                    }
                })
            }
        }).catch(() => {})
    }, [jugadorId])

    useEffect(() => {
        if (!jugador) return
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
            nickname: jugador.nickname || 'Presoner',
            monedes: jugador.monedes ?? 400,
            dia: jugador.diaActual ?? 1,
            millores: jugador.millores || [],
            inventari: jugador.inventari || []
        })
        game.scene.add('RecinteScene', RecinteScene, false)
        game.scene.add('CasinoScene', CasinoScene, false)
        game.scene.add('BlackjackScene', BlackjackScene, false)
        game.scene.add('RuletaScene', RuletaScene, false)
        game.scene.add('SlotsScene', SlotsScene, false)
        game.scene.add('MonedaScene', MonedaScene, false)
        game.scene.add('DausScene', DausScene, false)
        game.scene.add('BossBlackjackScene', BossBlackjackScene, false)

        gameRef.current = game

        const syncHandler = async (e) => {
            const jId = jugadorIdRef.current
            if (!jId) {
                window.dispatchEvent(new CustomEvent('sincronitzacio-completada', { detail: { ok: false } }))
                return
            }
            try {
                await client.mutate({
                    mutation: SINCRONITZAR_JUGADOR,
                    variables: {
                        jugadorId: jId,
                        monedes: e.detail.monedes,
                        diaActual: e.detail.diaActual,
                        millores: e.detail.millores || []
                    }
                })
                window.dispatchEvent(new CustomEvent('sincronitzacio-completada', { detail: { ok: true } }))
            } catch (err) {
                console.error('Error sincronitzar:', err)
                window.dispatchEvent(new CustomEvent('sincronitzacio-completada', { detail: { ok: false } }))
            }
        }
        window.addEventListener('sincronitzar-jugador', syncHandler)

        const wipeHandler = async (e) => {
            try {
                const { data } = await client.mutate({
                    mutation: NETEGAR_BASE_DADES,
                    variables: { password: e.detail.password }
                })
                window.dispatchEvent(new CustomEvent('neteja-resultat', {
                    detail: data?.netejarBaseDades || { missatge: 'Error de connexio' }
                }))
            } catch (err) {
                window.dispatchEvent(new CustomEvent('neteja-resultat', {
                    detail: { missatge: 'Error: ' + err.message }
                }))
            }
        }
        window.addEventListener('netejar-base-dades', wipeHandler)

        return () => {
            window.removeEventListener('sincronitzar-jugador', syncHandler)
            window.removeEventListener('netejar-base-dades', wipeHandler)
            game.destroy(true)
            gameRef.current = null
        }
    }, [jugador])

    if (!jugador) {
        return (
            <div ref={containerRef} style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
                <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center text-light">Cargando perfil...</div>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }} />
    )
}
