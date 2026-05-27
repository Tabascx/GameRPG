import Phaser from 'phaser'

export default class DausScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DausScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.equipats = [...(data.equipats || [])]
        this.inventari = [...(data.inventari || [])]
        this.capsulaPreu = data.capsulaPreu ?? 50
        this.guanyBrut = 0
        this.perduaBruta = 0
        this.perduaSeguro = 0
    }

    create() {
        const { width, height } = this.scale
        this.add.image(width / 2, height / 2, 'casinoBg').setDisplaySize(width, height)
        this.afegirVinyeta(width, height)

        localStorage.removeItem('cheat_daus')

        this.apostaBase = Math.max(10, Math.floor(this.monedes * 0.7 / 10) * 10)
        if (this.apostaBase > this.monedes) this.apostaBase = Math.floor(this.monedes / 10) * 10
        if (this.apostaBase < 10) this.apostaBase = 10

        this.apostaPar = false
        this.apostaMajor = false

        this.add.text(width / 2, 30, 'DADOS DEL BOSS', {
            fontSize: '34px', fill: '#ff4444', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5)

        this.add.text(width / 2, 72, 'Día 5 — Ronda Única', {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width / 2, height - 95, `${this.monedes}$`, {
            fontSize: '22px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Daus visuals
        this.dau1Img = this.add.image(width / 2 - 55, height / 2 - 50, 'dau_1').setDisplaySize(100, 100)
        this.dau2Img = this.add.image(width / 2 + 55, height / 2 - 50, 'dau_1').setDisplaySize(100, 100)

        // Selectors
        const selY = height / 2 + 40
        this.add.text(width / 2, selY - 20, 'Apuesta:', {
            fontSize: '15px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5)

        this.btnPar = this.add.text(width / 2 - 90, selY + 10, 'PAR', {
            fontSize: '20px', fill: '#888', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 14, y: 6 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.btnPar.on('pointerdown', () => this.togglePar())

        this.btnImpar = this.add.text(width / 2 + 90, selY + 10, 'IMPAR', {
            fontSize: '20px', fill: '#888', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 14, y: 6 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.btnImpar.on('pointerdown', () => this.toggleImpar())

        this.btnMajor = this.add.text(width / 2 - 90, selY + 55, '>7', {
            fontSize: '22px', fill: '#888', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 16, y: 6 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.btnMajor.on('pointerdown', () => this.toggleMajor())

        this.btnMenor = this.add.text(width / 2 + 90, selY + 55, '<7', {
            fontSize: '22px', fill: '#888', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 16, y: 6 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.btnMenor.on('pointerdown', () => this.toggleMenor())

        this.betInfo = this.add.text(width / 2, selY + 100, `Apuesta total: ${this.apostaBase}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5)

        this.resultText = this.add.text(width / 2, height / 2 + 30, '', {
            fontSize: '36px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.btnTirar = this.add.rectangle(width / 2, height - 35, 200, 48, 0x3d1a06)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xc9a227)
        this.btnTirarText = this.add.text(width / 2, height - 35, 'TIRAR DADOS', {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.btnTirar.on('pointerdown', () => this.tirar())
        this.btnTirar.on('pointerover', () => this.btnTirar.setStrokeStyle(3, 0xffd700))
        this.btnTirar.on('pointerout', () => this.btnTirar.setStrokeStyle(2, 0xc9a227))

        this.input.keyboard.on('keydown-P', (event) => {
            if (event.altKey) this.obrirCheats()
        })

        this.dibuixarEquipats()
    }

    togglePar() {
        this.apostaPar = 'par'
        this.apostaImpar = null
        this.btnPar.setFill('#44aaff')
        this.btnImpar.setFill('#888')
        this.actualitzarInfo()
    }

    toggleImpar() {
        this.apostaPar = 'impar'
        this.apostaImpar = null
        this.btnImpar.setFill('#44aaff')
        this.btnPar.setFill('#888')
        this.actualitzarInfo()
    }

    toggleMajor() {
        this.apostaMajor = this.apostaMajor === 'major' ? null : 'major'
        this.btnMajor.setFill(this.apostaMajor ? '#44aaff' : '#888')
        this.btnMenor.setFill('#888')
        this.actualitzarInfo()
    }

    toggleMenor() {
        const v = this.apostaMajor === 'menor' ? null : 'menor'
        this.apostaMajor = v
        this.btnMenor.setFill(v ? '#44aaff' : '#888')
        this.btnMajor.setFill('#888')
        this.actualitzarInfo()
    }

    actualitzarInfo() {
        let parts = 0
        if (this.apostaPar) parts++
        if (this.apostaMajor) parts++
        if (parts === 0) {
            this.betInfo.setText(`Apuesta total: 0$`)
            return
        }
        const perPart = Math.floor(this.apostaBase / parts)
        this.betInfo.setText(`Apuesta: ${perPart}$ x${parts}  (total ${perPart * parts}$)`)
    }

    tirar() {
        let parts = 0
        if (this.apostaPar) parts++
        if (this.apostaMajor) parts++
        if (parts === 0) return

        const perPart = Math.floor(this.apostaBase / parts)
        const totalAposta = perPart * parts

        this.monedes -= totalAposta
        this.monText.setText(`${Math.round(this.monedes)}$`)
        if (Math.round(this.monedes) < 0) {
            this.mostrarArruinado()
            return
        }

        this.btnTirar.disableInteractive()
        this.btnPar.disableInteractive()
        this.btnImpar.disableInteractive()
        this.btnMajor.disableInteractive()
        this.btnMenor.disableInteractive()

        let d1, d2, suma
        const cheat = localStorage.getItem('cheat_daus')
        if (cheat) {
            const target = parseInt(cheat)
            d1 = Phaser.Math.Between(Math.max(1, target - 6), Math.min(6, target - 1))
            d2 = target - d1
            suma = target
        } else {
            d1 = Phaser.Math.Between(1, 6)
            d2 = Phaser.Math.Between(1, 6)
            suma = d1 + d2
        }
        const esPar = suma % 2 === 0

        // Animació daus
        let ticks = 0
        const interval = this.time.addEvent({
            delay: 60,
            repeat: 10,
            callback: () => {
                this.dau1Img.setTexture(`dau_${Phaser.Math.Between(1, 6)}`)
                this.dau2Img.setTexture(`dau_${Phaser.Math.Between(1, 6)}`)
                ticks++
                if (ticks >= 10) {
                    interval.remove()
                    this.dau1Img.setTexture(`dau_${d1}`)
                    this.dau2Img.setTexture(`dau_${d2}`)
                    this.resolveResultat(d1, d2, suma, esPar, perPart, parts)
                }
            }
        })
    }

    resolveResultat(d1, d2, suma, esPar, perPart, parts) {
        let guany = 0
        let perd = 0

        if (this.apostaPar) {
            const ok = (this.apostaPar === 'par' && esPar) || (this.apostaPar === 'impar' && !esPar)
            if (ok) guany += perPart * 2
            else perd += perPart
        }
        if (this.apostaMajor) {
            let ok = false
            if (suma === 7) ok = false
            else if (this.apostaMajor === 'major') ok = suma > 7
            else ok = suma < 7
            if (ok) guany += perPart * 2
            else perd += perPart
        }

        this.monedes += guany
        this.guanyBrut += guany
        if (perd > 0) {
            this.perduaBruta += perd
            const seguro = this.getSeguroRate()
            this.perduaSeguro += Math.round(perd * seguro)
        }

        const missatge = []
        if (this.apostaPar) missatge.push(this.apostaPar === 'par' ? (esPar ? 'Par +' + (perPart*2) + '$' : 'Par PERDIDO') : (!esPar ? 'Impar +' + (perPart*2) + '$' : 'Impar PERDIDO'))
        if (this.apostaMajor) {
            const r = suma === 7 ? '7=PERDIDO' : this.apostaMajor === 'major' ? (suma > 7 ? '>7 +' + (perPart*2) + '$' : '>7 PERDIDO') : (suma < 7 ? '<7 +' + (perPart*2) + '$' : '<7 PERDIDO')
            missatge.push(r)
        }

        this.resultText.setText(`Dados: ${d1}+${d2}=${suma}\n${missatge.join(' | ')}`).setFill(guany > perd ? '#00ff88' : perd > guany ? '#ff4444' : '#c9a227')

        this.monText.setText(`${Math.round(this.monedes)}$`)
        if (Math.round(this.monedes) <= 0) {
            this.time.delayedCall(800, () => this.mostrarArruinado())
            return
        }

        this.time.delayedCall(2500, () => this.mostrarResultats())
    }

    getSeguroRate() {
        const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
        return seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
    }

    mostrarArruinado() {
        const { width, height } = this.scale
        this.btnTirar.disableInteractive()
        const bg = this.add.rectangle(width / 2, height / 2, width * 0.85, 160, 0x111122, 0.95)
            .setDepth(100).setStrokeStyle(2, 0xc9a227)
        const txt = this.perduaSeguro > 0
            ? 'Te has arruinado, pero tu seguro ha cubierto\nparte de tus apuestas: +' + this.perduaSeguro + '$'
            : 'Te has arruinado!'
        const msg = this.add.text(width / 2, height / 2 - 20, txt, {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif',
            align: 'center', lineSpacing: 4
        }).setOrigin(0.5).setDepth(101)
        const btn = this.add.text(width / 2, height / 2 + 40, '[ Continuar ]', {
            fontSize: '16px', fill: '#c9a227', fontFamily: 'serif',
            backgroundColor: '#1a3d0688', padding: { x: 16, y: 6 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true })
        btn.on('pointerover', () => btn.setFill('#ffffff'))
        btn.on('pointerout', () => btn.setFill('#c9a227'))
        btn.on('pointerdown', () => {
            bg.destroy(); msg.destroy(); btn.destroy()
            this.mostrarResultats()
        })
    }

    mostrarResultats() {
        const { width, height } = this.scale
        const net = this.guanyBrut - this.perduaBruta + this.perduaSeguro
        const bg = this.add.rectangle(width / 2, height / 2, width * 0.85, 260, 0x0a0a1a, 0.95)
            .setDepth(100).setStrokeStyle(2, 0xc9a227)

        const lines = [
            'RESULTADOS',
            '',
            'Ganancia bruta:   +' + this.guanyBrut + '$',
            'Pérdida bruta:     -' + this.perduaBruta + '$',
            this.perduaSeguro > 0 ? 'Cobertura seguro:   +' + this.perduaSeguro + '$' : '',
            '',
            'NETO: ' + (net >= 0 ? '+' : '') + net + '$'
        ]
        const text = this.add.text(width / 2, height / 2 - 80, lines.join('\n'), {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif',
            align: 'left', lineSpacing: 4, fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(101)

        const aBtn = this.add.text(width / 2, height / 2 + 90, '[ Acceptar ]', {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif',
            backgroundColor: '#1a3d0688', padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true })

        aBtn.on('pointerover', () => aBtn.setFill('#ffffff'))
        aBtn.on('pointerout', () => aBtn.setFill('#c9a227'))
        aBtn.on('pointerdown', () => {
            aBtn.disableInteractive()
            if (this.perduaSeguro > 0) {
                const flash = this.add.text(width / 2, height / 2 + 90, '+' + this.perduaSeguro + '$', {
                    fontSize: '28px', fill: '#00ff88', fontFamily: 'serif',
                    stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(102)
                this.tweens.add({
                    targets: flash, alpha: 0, y: height / 2 + 40, duration: 1000,
                    onComplete: () => flash.destroy()
                })
                this.monedes += this.perduaSeguro
                this.monText.setText(Math.round(this.monedes) + '$')
                this.time.delayedCall(600, () => this.acabar())
            } else {
                this.acabar()
            }
        })
    }

    acabar() {
        this.scene.start('RecinteScene', {
            nickname: this.nickname,
            monedes: Math.round(this.monedes),
            dia: this.dia + 1,
            millores: this.millores,
            equipats: this.equipats,
            inventari: this.inventari,
            capsulaPreu: this.capsulaPreu
        })
    }

    obrirCheats() {
        const { width, height } = this.scale
        const cx = width / 2, cy = height / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50)
        const bg = this.add.rectangle(cx, cy, 260, 120, 0x0d0a06, 0.95).setDepth(51).setStrokeStyle(2, 0x88ff88)

        const tancar = () => {
            overlay.destroy(); bg.destroy()
            this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy())
        }

        const addTxt = (x, y, txt, s, c) =>
            this.add.text(x, y, txt, { fontSize: s || '14px', fill: c || '#88ff88', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(53)

        const addBtn = (x, y, txt, cb) => {
            const t = this.add.text(x, y, txt, { fontSize: '13px', fill: '#ffd700', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1a0a88', padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setDepth(53).setInteractive({ useHandCursor: true })
            t.on('pointerover', () => t.setFill('#ffffff'))
            t.on('pointerout', () => t.setFill('#ffd700'))
            t.on('pointerdown', cb)
            return t
        }

        addTxt(cx, cy - 40, 'TRUCOS DADOS', '15px', '#88ff88')

        const dKey = 'cheat_daus'
        const dEst = localStorage.getItem(dKey)
        const dTxt = addBtn(cx, cy, 'Forzar dados: ' + (dEst || '---'), () => {
            const opcs = ['', '2', '7', '12']
            const idx = (opcs.indexOf(localStorage.getItem(dKey) || '') + 1) % opcs.length
            const v = opcs[idx]
            if (v) localStorage.setItem(dKey, v)
            else localStorage.removeItem(dKey)
            dTxt.setText('Forzar dados: ' + (v || '---'))
        })

        addBtn(cx, cy + 30, 'CERRAR', tancar)
    }

    dibuixarEquipats() {
        const items = (this.equipats || []).filter(Boolean)
        if (items.length === 0) return
        const startX = 90
        const y = 105
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const x = startX + i * 90
            const cor = item.raresa === 'legendari' ? '#ff8800'
                : item.raresa === 'epic' ? '#cc44ff'
                : item.raresa === 'raro' ? '#44aaff' : '#c9a227'
            const t = this.add.text(x, y, item.nomItem || item.nom || '?', {
                fontSize: '11px', fill: cor, fontFamily: 'serif',
                backgroundColor: '#1a120888', padding: { x: 6, y: 3 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            let tip = null
            t.on('pointerover', () => {
                tip = this.add.text(x, y + 20, this.descEfecte(item), {
                    fontSize: '10px', fill: '#e8d5a3', fontFamily: 'serif',
                    backgroundColor: '#0d0a0688', padding: { x: 6, y: 4 },
                    stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5).setDepth(40)
            })
            t.on('pointerout', () => { if (tip) { tip.destroy(); tip = null } })
        }
    }

    descEfecte(item) {
        const ef = item.efecte
        if (!ef) return 'Sense efecte'
        const m = {
            bonus_guany: `+${Math.round(ef.valor * 100)}% guanys`,
            reduccio_perdua: `-${Math.round(ef.valor * 100)}% perdues`,
            prob_guany_ruleta: `+${Math.round(ef.valor * 100)}% prob ruleta`,
            prob_jackpot_slots: `+${Math.round(ef.valor * 100)}% jackpot`,
            prob_guany_moneda: `+${Math.round(ef.valor * 100)}% prob moneda`,
            prob_joker: `+${Math.round(ef.valor * 100)}% prob comodin`,
            as_seguro: 'As=11 sempre',
            carta_extra: '+1 carta max',
            ronda_extra: '+1 ronda',
            monedes_extra: `+${ef.valor}$ inici`,
            revelar_crupier: 'Revela carta',
            anular_perdua: 'Anula 1 perdua',
            doble_aposta: 'Duplica aposta',
        }
        return `${item.raresa || '?'}: ${m[ef.tipus] || ef.tipus}`
    }

    afegirVinyeta(w, h) {
        const rt = this.add.renderTexture(0, 0, w, h).setDepth(1)
        rt.fill(0x000000, 0.55)
        const circ = this.make.graphics({ add: false })
        circ.fillStyle(0xffffff)
        circ.fillCircle(0, 0, 260)
        circ.generateTexture('spot_dau', 520, 520)
        circ.destroy()
        const eraser = this.add.image(w / 2, h / 2 - 40, 'spot_dau').setVisible(false)
        rt.erase(eraser, w / 2, h / 2 - 40)
        eraser.destroy()
    }
}
