import { useEffect, useRef } from 'react'

export default function Radar() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let angle = 0
        let animId

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Cercles
            ctx.strokeStyle = '#00ff88'
            ctx.lineWidth = 0.5
            for (let r = 30; r <= 120; r += 30) {
                ctx.beginPath()
                ctx.arc(150, 150, r, 0, Math.PI * 2)
                ctx.stroke()
            }

            // Línies creuades
            ctx.beginPath()
            ctx.moveTo(150, 30)
            ctx.lineTo(150, 270)
            ctx.moveTo(30, 150)
            ctx.lineTo(270, 150)
            ctx.stroke()

            // Escombrada
            const gradient = ctx.createConicalGradient
                ? ctx.createConicalGradient(angle, 150, 150)
                : null

            ctx.save()
            ctx.translate(150, 150)
            ctx.rotate(angle)
            const sweep = ctx.createLinearGradient(0, 0, 120, 0)
            sweep.addColorStop(0, 'rgba(0,255,136,0.6)')
            sweep.addColorStop(1, 'rgba(0,255,136,0)')
            ctx.fillStyle = sweep
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.arc(0, 0, 120, -0.3, 0.3)
            ctx.closePath()
            ctx.fill()
            ctx.restore()

            // Punts aleatoris (enemics)
            ctx.fillStyle = '#ff4444'
            ctx.beginPath()
            ctx.arc(100, 80, 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(190, 170, 3, 0, Math.PI * 2)
            ctx.fill()

            angle += 0.03
            animId = requestAnimationFrame(draw)
        }

        draw()
        return () => cancelAnimationFrame(animId)
    }, [])

    return (
        <div className="card bg-dark text-white mb-4">
            <div className="card-body text-center">
                <h5 className="card-title">📡 Radar de Proximitat</h5>
                <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    style={{ borderRadius: '50%', border: '1px solid #00ff88' }}
                />
            </div>
        </div>
    )
}