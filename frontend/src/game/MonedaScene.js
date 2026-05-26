import Phaser from 'phaser'

export default class MonedaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MonedaScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.equipats = data.equipats || []
        this.inventari = data.inventari || []
        this.capsulaPreu = data.capsulaPreu ?? 50
        this.rondes = 0
        this.maxRondes = 3
        this.flipping = false
        this.guanyBrut = 0
        this.perduaBruta = 0
        this.perduaSeguro = 0
    }

    minBet() { return Math.max(5, Math.floor(this.monedes * 0.1)) }

    create() {
        localStorage.removeItem('cheat_moneda')
        const { width, height } = this.scale
        this.add.image(width / 2, height / 2, 'casinoBg').setDisplaySize(width, height)
        this.afegirVinyeta(width, height)

        this.aposta = this.minBet()

        this.add.text(width / 2, 30, 'CARA O CREU', {
            fontSize: '32px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.rondesText = this.add.text(width / 2, 70, `Ronda ${this.rondes + 1}/${this.maxRondes}`, {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '20px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Selector d'aposta vertical (dreta)
        const selX = width - 85
        const selY = height / 2
        this.add.text(selX, selY - 90, 'APOSTA', {
            fontSize: '12px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        const apBtn = (y, label, cb) => {
            const t = this.add.text(selX, y, label, {
                fontSize: '18px', fill: '#c9a227', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            t.on('pointerover', () => t.setFill('#ffffff'))
            t.on('pointerout', () => t.setFill('#c9a227'))
            t.on('pointerdown', cb)
            return t
        }
        apBtn(selY - 60, '▲ +10', () => this.canviarAposta(10))
        apBtn(selY - 35, '▲ +5', () => this.canviarAposta(5))
        this.apostaText = this.add.text(selX, selY, `${this.aposta}$`, {
            fontSize: '28px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3, backgroundColor: '#1a120888',
            padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.apostaText.on('pointerdown', () => {
            const v = window.prompt(`Aposta (min ${this.minBet()}$, max ${this.monedes}$):`, `${this.aposta}`)
            if (v !== null) this.establirAposta(parseInt(v, 10))
        })
        apBtn(selY + 35, '▼ -5', () => this.canviarAposta(-5))
        apBtn(selY + 60, '▼ -10', () => this.canviarAposta(-10))

        // Moneda (més gran)
        this.coin = this.add.circle(width / 2, height / 2 - 80, 80, 0xc9a227)
            .setStrokeStyle(4, 0xffd700)
        this.coinText = this.add.text(width / 2, height / 2 - 80, '?', {
            fontSize: '60px', fill: '#1a1208', fontFamily: 'serif', fontStyle: 'bold'
        }).setOrigin(0.5)
        this.coinLabel = this.add.text(width / 2, height / 2 - 165, '', {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

        // Resultat (més gran)
        this.resultText = this.add.text(width / 2, height / 2 + 10, '', {
            fontSize: '26px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        // Botons Cara / Creu (més grans)
        const btnW = 170
        const btnH = 54
        this.btnCara = this.add.rectangle(width / 2 - 90, height / 2 + 85, btnW, btnH, 0x1a3d06)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xc9a227)
        this.add.text(width / 2 - 90, height / 2 + 85, 'CARA', {
            fontSize: '20px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.btnCara.on('pointerover', () => this.btnCara.setStrokeStyle(3, 0xffd700))
        this.btnCara.on('pointerout', () => this.btnCara.setStrokeStyle(2, 0xc9a227))
        this.btnCara.on('pointerdown', () => this.triar('cara'))

        this.btnCreu = this.add.rectangle(width / 2 + 90, height / 2 + 85, btnW, btnH, 0x3d0606)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xc9a227)
        this.add.text(width / 2 + 90, height / 2 + 85, 'CREU', {
            fontSize: '20px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Botó sortir
        const btnSortir = this.add.text(16, height - 30, '← Sortir', {
            fontSize: '13px', fill: '#a08c5a', fontFamily: 'serif'
        }).setInteractive({ useHandCursor: true })
        btnSortir.on('pointerover', () => btnSortir.setFill('#c9a227'))
        btnSortir.on('pointerout', () => btnSortir.setFill('#a08c5a'))
        btnSortir.on('pointerdown', () => {
            this.scene.start('CasinoScene', {
                nickname: this.nickname,
                monedes: Math.round(this.monedes),
                dia: this.dia,
                millores: this.millores,
                equipats: this.equipats,
                inventari: this.inventari
            })
        })

        this.dibuixarEquipats()

        this.input.keyboard.on('keydown-P', (event) => {
            if (event.altKey) this.obrirCheats()
        })
    }

    obrirCheats() {
        const { width, height } = this.scale
        const cx = width / 2, cy = height / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50)
        const bg = this.add.rectangle(cx, cy, 280, 140, 0x0d0a06, 0.95).setDepth(51).setStrokeStyle(2, 0x88ff88)

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

        addTxt(cx, cy - 50, 'TRUCS MONEDA', '15px', '#88ff88')

        const mKey = 'cheat_moneda'
        const opcs = ['', 'cara', 'creu']
        const labels = { '': '---', 'cara': 'CARA', 'creu': 'CREU' }
        let idx = opcs.indexOf(localStorage.getItem(mKey) || '')
        const monTxt = addBtn(cx, cy - 10, 'Resultat: ' + labels[opcs[idx] || ''], () => {
            idx = (idx + 1) % opcs.length
            localStorage.setItem(mKey, opcs[idx])
            monTxt.setText('Resultat: ' + labels[opcs[idx]])
        })

        addBtn(cx, cy + 30, 'TANCAR', tancar)
    }

    dibuixarEquipats() {
        const items = (this.equipats || []).filter(Boolean)
        if (items.length === 0) return
        const startX = 90
        const y = 110
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
        circ.generateTexture('spot_mon', 520, 520)
        circ.destroy()
        const eraser = this.add.image(w / 2, h / 2 - 40, 'spot_mon').setVisible(false)
        rt.erase(eraser, w / 2, h / 2 - 40)
        eraser.destroy()
    }

    canviarAposta(delta) {
        this.establirAposta(this.aposta + delta)
    }

    establirAposta(v) {
        const min = this.minBet()
        if (isNaN(v) || v < min) v = min
        if (v > this.monedes) v = this.monedes
        this.aposta = v
        this.apostaText.setText(`${this.aposta}$`)
    }

    triar(opcio) {
        if (this.flipping || this.rondes >= this.maxRondes) return
        this.flipping = true

        this.btnCara.disableInteractive()
        this.btnCreu.disableInteractive()
        this.resultText.setText('')
        this.coinLabel.setText('')

        // Animació: la moneda gira 6 vegades (escala 1→0→1 cada vegada)
        const totalGirs = 6
        let gir = 0
        const gira = () => {
            this.tweens.add({
                targets: this.coin, scaleX: 0, duration: 60, ease: 'Sine.easeIn',
                onComplete: () => {
                    this.coinText.setText(gir % 2 === 0 ? '✝' : 'C')
                    this.coin.setFillStyle(gir % 2 === 0 ? 0x888888 : 0xc9a227)
                    this.tweens.add({
                        targets: this.coin, scaleX: 1, duration: 60, ease: 'Sine.easeOut',
                        onComplete: () => {
                            gir++
                            if (gir < totalGirs) {
                                gira()
                            } else {
                                const cheat = localStorage.getItem('cheat_moneda')
                                const resultat = cheat || (Math.random() < 0.5 ? 'cara' : 'creu')
                                const guanya = opcio === resultat

                                this.coinText.setText(resultat === 'cara' ? 'C' : '✝')
                                this.coinLabel.setText(resultat === 'cara' ? 'CARA' : 'CREU')
                                this.coin.setFillStyle(resultat === 'cara' ? 0xc9a227 : 0x888888)

                                if (guanya) {
                                    this.monedes += this.aposta
                                    this.guanyBrut += this.aposta
                                    this.resultText.setText(`${resultat.toUpperCase()}! +${this.aposta}$`).setFill('#00ff88')
                                } else {
                                    const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
                                    const seguro = seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
                                    const perdua = this.aposta
                                    this.monedes -= perdua
                                    this.perduaBruta += perdua
                                    this.perduaSeguro += Math.round(perdua * seguro)
                                    this.resultText.setText(`${resultat.toUpperCase()}! -${perdua}$`).setFill('#ff4444')
                                }

                                this.monText.setText(`${Math.round(this.monedes)}$`)
                                if (Math.round(this.monedes) <= 0) {
                                    this.time.delayedCall(800, () => this.mostrarArruinado())
                                    return
                                }
                                this.rondes++

                                if (this.rondes >= this.maxRondes) {
                                    this.rondesText.setText('Joc acabat!')
                                    this.time.delayedCall(1500, () => this.mostrarResultats())
                                } else {
                                    this.rondesText.setText(`Ronda ${this.rondes + 1}/${this.maxRondes}`)
                                    this.time.delayedCall(1200, () => {
                                        this.coin.setFillStyle(0xc9a227)
                                        this.coinText.setText('?')
                                        this.coinLabel.setText('')
                                        this.resultText.setText('')
                                        this.flipping = false
                                        this.btnCara.setInteractive({ useHandCursor: true })
                                        this.btnCreu.setInteractive({ useHandCursor: true })
                                    })
                                }
                            }
                        }
                    })
                }
            })
        }
        gira()
    }

    getSeguroRate() {
        const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
        return seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
    }

    mostrarArruinado() {
        const { width, height } = this.scale
        this.btnCara.disableInteractive()
        this.btnCreu.disableInteractive()
        const bg = this.add.rectangle(width / 2, height / 2, width * 0.85, 160, 0x111122, 0.95)
            .setDepth(100).setStrokeStyle(2, 0xc9a227)
        const txt = this.perduaSeguro > 0
            ? `Te has arruinado, pero tu seguro ha cubierto\nparte de tus apuestas: +${this.perduaSeguro}$`
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
            'RESULTATS DE LA PARTIDA',
            '',
            `Guany brut:        +${this.guanyBrut}$`,
            `Perdua bruta:      -${this.perduaBruta}$`,
            this.perduaSeguro > 0 ? `Cobertura seguro:   +${this.perduaSeguro}$` : '',
            '',
            `NET: ${net >= 0 ? '+' : ''}${net}$`
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
                const flash = this.add.text(width / 2, height / 2 + 90, `+${this.perduaSeguro}$`, {
                    fontSize: '28px', fill: '#00ff88', fontFamily: 'serif',
                    stroke: '#000', strokeThickness: 4
                }).setOrigin(0.5).setDepth(102)
                this.tweens.add({
                    targets: flash, alpha: 0, y: height / 2 + 40, duration: 1000,
                    onComplete: () => flash.destroy()
                })
                this.monedes += this.perduaSeguro
                this.monText.setText(`${Math.round(this.monedes)}$`)
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
}
