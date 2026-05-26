import Phaser from 'phaser'

export default class SlotsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SlotsScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.equipats = [...(data.equipats || [])]
        this.inventari = [...(data.inventari || [])]
        this.capsulaPreu = data.capsulaPreu ?? 50
        this.tirades = 0
        this.maxTirades = 5
        this.simbols = ['⚔', '💰', '💎', '🍺', '🔥', '⭐']
        this.guanyBrut = 0
        this.perduaBruta = 0
        this.perduaSeguro = 0
    }

    minBet() { return Math.max(5, Math.floor(this.monedes * 0.1)) }

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
            'RESULTATS DE LA PARTIDA',
            '',
            'Guany brut:        +' + this.guanyBrut + '$',
            'Perdua bruta:      -' + this.perduaBruta + '$',
            this.perduaSeguro > 0 ? 'Cobertura seguro:   +' + this.perduaSeguro + '$' : '',
            '',
            'NET: ' + (net >= 0 ? '+' : '') + net + '$'
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

    create() {
        localStorage.removeItem('cheat_slots')
        const { width, height } = this.scale
        this.add.image(width / 2, height / 2, 'casinoBg').setDisplaySize(width, height)
        this.afegirVinyeta(width, height)

        this.aposta = this.minBet()

        this.add.text(width/2, 30, 'SLOTS', {
            fontSize: '32px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.tiradesText = this.add.text(width/2, 70, `Tirada ${this.tirades + 1}/${this.maxTirades}`, {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '20px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Marc i rodets visuals
        this.add.rectangle(width/2, height/2 - 20, 440, 150, 0x1a1208)
            .setStrokeStyle(2, 0xc9a227)

        this.add.rectangle(width/2 - 140, height/2 - 20, 110, 110, 0x2b1a08)
            .setStrokeStyle(2, 0x6b4a1d)
        this.add.rectangle(width/2, height/2 - 20, 110, 110, 0x2b1a08)
            .setStrokeStyle(2, 0x6b4a1d)
        this.add.rectangle(width/2 + 140, height/2 - 20, 110, 110, 0x2b1a08)
            .setStrokeStyle(2, 0x6b4a1d)

        // Rodets
        this.reel1 = this.add.text(width/2 - 140, height/2 - 20, '❓', {
            fontSize: '70px'
        }).setOrigin(0.5).setDepth(2)
        this.reel2 = this.add.text(width/2, height/2 - 20, '❓', {
            fontSize: '70px'
        }).setOrigin(0.5).setDepth(2)
        this.reel3 = this.add.text(width/2 + 140, height/2 - 20, '❓', {
            fontSize: '70px'
        }).setOrigin(0.5).setDepth(2)

        this.add.text(width/2 - 140, height/2 + 50, '1', {
            fontSize: '11px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.add.text(width/2, height/2 + 50, '2', {
            fontSize: '11px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.add.text(width/2 + 140, height/2 + 50, '3', {
            fontSize: '11px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.resultText = this.add.text(width/2, height/2 + 80, '', {
            fontSize: '30px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

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
        apBtn(selY - 60, '\u25B2 +10', () => this.canviarAposta(10))
        apBtn(selY - 35, '\u25B2 +5', () => this.canviarAposta(5))
        this.betAmountText = this.add.text(selX, selY, this.aposta + '$', {
            fontSize: '28px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3, backgroundColor: '#1a120888',
            padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.betAmountText.on('pointerdown', () => {
            const v = window.prompt('Aposta (min ' + this.minBet() + '$, max ' + this.monedes + '$):', '' + this.aposta)
            if (v !== null) this.establirAposta(parseInt(v, 10))
        })
        apBtn(selY + 35, '\u25BC -5', () => this.canviarAposta(-5))
        apBtn(selY + 60, '\u25BC -10', () => this.canviarAposta(-10))

        // Premi info
        this.add.text(width/2, height - 140, '3 iguals: x10 | 2 iguals: x2 | Res: -aposta', {
            fontSize: '13px', fill: '#666', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Botó tirar
        this.btnTirar = this.add.rectangle(width/2, height - 80, 220, 56, 0x3d1a06)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xc9a227)
        this.btnTirarText = this.add.text(width/2, height - 80, 'TIRAR', {
            fontSize: '24px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.btnTirar.on('pointerdown', () => this.tirar())
        this.btnTirar.on('pointerover', () => this.btnTirar.setStrokeStyle(3, 0xffd700))
        this.btnTirar.on('pointerout', () => this.btnTirar.setStrokeStyle(2, 0xc9a227))

        this.input.keyboard.on('keydown-P', (event) => {
            if (event.altKey) this.obrirCheats()
        })

        // Botó sortir
        const btnSortir = this.add.text(16, height - 30, '<- Sortir', {
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

        addTxt(cx, cy - 50, 'TRUCS SLOTS', '15px', '#88ff88')

        const sKey = 'cheat_slots'
        const sEst = localStorage.getItem(sKey)
        const sTxt = addBtn(cx, cy - 10, 'Jackpot: ' + (sEst ? 'ON' : 'OFF'), () => {
            if (localStorage.getItem(sKey)) {
                localStorage.removeItem(sKey)
                sTxt.setText('Jackpot: OFF')
            } else {
                localStorage.setItem(sKey, '1')
                sTxt.setText('Jackpot: ON')
            }
        })

        addBtn(cx, cy + 30, 'TANCAR', tancar)
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
        circ.generateTexture('spot_slo', 520, 520)
        circ.destroy()
        const eraser = this.add.image(w / 2, h / 2 - 40, 'spot_slo').setVisible(false)
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
        this.betAmountText.setText(`${this.aposta}$`)
    }

    ajustarAposta() {
        const min = this.minBet()
        if (this.aposta < min) this.establirAposta(min)
        else if (this.aposta > this.monedes) this.establirAposta(this.monedes)
    }

    tirar() {
        if (this.tirades >= this.maxTirades) return
        this.btnTirar.disableInteractive()
        this.resultText.setText('')

        // Animació rodets
        let ticks = 0
        const interval = this.time.addEvent({
            delay: 80,
            repeat: 15,
            callback: () => {
                this.reel1.setText(this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)])
                this.reel2.setText(this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)])
                this.reel3.setText(this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)])
                ticks++
                if (ticks >= 15) {
                    interval.remove()
                    this.resolveTimada()
                }
            }
        })
    }

    resolveTimada() {
        let s1, s2, s3
        if (localStorage.getItem('cheat_slots')) {
            s1 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]
            s2 = s1
            s3 = s1
        } else {
            s1 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]
            s2 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]
            s3 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]
        }

        this.reel1.setText(s1)
        this.reel2.setText(s2)
        this.reel3.setText(s3)

        let guanyancia = 0
        let missatge = ''

        if (s1 === s2 && s2 === s3) {
            guanyancia = this.aposta * 10
            missatge = 'JACKPOT! +' + guanyancia + '$'
            this.resultText.setFill('#ffd700')
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            guanyancia = this.aposta * 2
            missatge = 'DOS IGUALS! +' + guanyancia + '$'
            this.resultText.setFill('#00ff88')
        } else {
            const perdua = this.aposta
            const seguro = this.getSeguroRate()
            guanyancia = 0
            missatge = 'PERDS -' + perdua + '$'
            this.monedes -= perdua
            this.perduaBruta += perdua
            this.perduaSeguro += Math.round(perdua * seguro)
            this.resultText.setFill('#ff4444')
        }

        if (guanyancia > 0) {
            this.monedes += guanyancia
            this.guanyBrut += guanyancia
        }

        this.monText.setText(Math.round(this.monedes) + '$')
        if (Math.round(this.monedes) <= 0) {
            this.time.delayedCall(800, () => this.mostrarArruinado())
            return
        }
        this.ajustarAposta()
        this.resultText.setText(missatge)
        this.tirades++
        this.tiradesText.setText('Tirada ' + Math.min(this.tirades + 1, this.maxTirades) + '/' + this.maxTirades)

        if (this.tirades >= this.maxTirades) {
            this.time.delayedCall(1500, () => this.mostrarResultats())
        } else {
            this.time.delayedCall(1500, () => {
                this.btnTirar.setInteractive({ useHandCursor: true })
            })
        }
    }

    acabar() {
        this.btnTirar.disableInteractive()
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