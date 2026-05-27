import Phaser from 'phaser'

export default class RuletaScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RuletaScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.equipats = [...(data.equipats || [])]
        this.inventari = [...(data.inventari || [])]
        this.capsulaPreu = data.capsulaPreu ?? 50
        this.rondes = 0
        this.maxRondes = 3
        this.apostaColor = null
        this.girando = false
        this.guanyBrut = 0
        this.perduaBruta = 0
        this.perduaSeguro = 0
    }

    create() {
        localStorage.removeItem('cheat_ruleta')
        const { width, height } = this.scale
        this.add.image(width / 2, height / 2, 'casinoBg').setDisplaySize(width, height)
        this.afegirVinyeta(width, height)
        this.aposta = this.minBet()

        this.add.text(width/2, 30, 'RULETA', {
            fontSize: '32px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.rondesText = this.add.text(width/2, 65, `Ronda ${this.rondes + 1}/${this.maxRondes}`, {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '20px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Ruleta visual
        this.drawRuleta(width/2, height/2 - 90)

        // Número resultat al centre
        this.numText = this.add.text(width/2, height/2 - 40, '', {
            fontSize: '36px', fill: '#ffffff', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.resultText = this.add.text(width/2, height/2 + 110, '', {
            fontSize: '26px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        // Botons apostar
        this.add.text(width/2, height/2 + 145, 'Apuesta a:', {
            fontSize: '13px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.btnRed = this.addColorBtn(width/2 - 120, height/2 + 175, 'ROIG x2', 0x8b0000, 'red')
        this.btnBlack = this.addColorBtn(width/2, height/2 + 175, 'NEGRE x2', 0x222222, 'black')
        this.btnGreen = this.addColorBtn(width/2 + 120, height/2 + 175, 'VERD x14', 0x006400, 'green')

        this.colorText = this.add.text(width/2, height/2 + 210, 'Elige un color', {
            fontSize: '12px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Selector d'aposta vertical (dreta)
        const selX = width - 85
        const selY = height / 2
        this.add.text(selX, selY - 90, 'APUESTA', {
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
            const v = window.prompt('Apuesta (min ' + this.minBet() + '$, max ' + this.monedes + '$):', '' + this.aposta)
            if (v !== null) this.establirAposta(parseInt(v, 10))
        })
        apBtn(selY + 35, '\u25BC -5', () => this.canviarAposta(-5))
        apBtn(selY + 60, '\u25BC -10', () => this.canviarAposta(-10))

        // Botó girar
        this.btnGirar = this.add.rectangle(width/2, height - 40, 200, 50, 0x3d1a06)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xc9a227)
        this.btnGirarText = this.add.text(width/2, height - 40, 'GIRAR', {
            fontSize: '22px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.btnGirar.on('pointerdown', () => this.girar())
        this.btnGirar.on('pointerover', () => this.btnGirar.setStrokeStyle(3, 0xffd700))
        this.btnGirar.on('pointerout', () => this.btnGirar.setStrokeStyle(2, 0xc9a227))

        // Botó sortir
        const btnSortir = this.add.text(16, height - 30, '← Salir', {
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

        addTxt(cx, cy - 50, 'TRUCOS RULETA', '15px', '#88ff88')

        const rKey = 'cheat_ruleta'
        const opcs = ['', 'red', 'black', 'green']
        const labels = { '': '---', 'red': 'ROJO', 'black': 'NEGRO', 'green': 'VERDE' }
        let idx = opcs.indexOf(localStorage.getItem(rKey) || '')
        const ruTxt = addBtn(cx, cy - 10, 'Color: ' + labels[opcs[idx] || ''], () => {
            idx = (idx + 1) % opcs.length
            localStorage.setItem(rKey, opcs[idx])
            ruTxt.setText('Color: ' + labels[opcs[idx]])
        })

        addBtn(cx, cy + 30, 'CERRAR', tancar)
    }

    afegirVinyeta(w, h) {
        const rt = this.add.renderTexture(0, 0, w, h).setDepth(1)
        rt.fill(0x000000, 0.55)
        const circ = this.make.graphics({ add: false })
        circ.fillStyle(0xffffff)
        circ.fillCircle(0, 0, 260)
        circ.generateTexture('spot_rul', 520, 520)
        circ.destroy()
        const eraser = this.add.image(w / 2, h / 2 - 40, 'spot_rul').setVisible(false)
        rt.erase(eraser, w / 2, h / 2 - 40)
        eraser.destroy()
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

    drawRuleta(cx, cy) {
        const radius = 110
        const sectors = 37

        // Contenidor de la ruleta (aquest girarà)
        this.ruletaContainer = this.add.container(cx, cy)

        for (let i = 0; i < sectors; i++) {
            const startAngle = (i / sectors) * Math.PI * 2 - Math.PI / 2
            const endAngle = ((i + 1) / sectors) * Math.PI * 2 - Math.PI / 2
            const color = i === 0 ? 0x006400 : i % 2 === 0 ? 0x111111 : 0x8b0000

            const graphics = this.add.graphics()
            graphics.fillStyle(color)
            graphics.beginPath()
            graphics.moveTo(0, 0)
            graphics.arc(0, 0, radius, startAngle, endAngle)
            graphics.closePath()
            graphics.fillPath()

            if (i % 3 === 0) {
                const midAngle = (startAngle + endAngle) / 2
                const tx = Math.cos(midAngle) * (radius * 0.7)
                const ty = Math.sin(midAngle) * (radius * 0.7)
                const label = this.add.text(tx, ty, `${i}`, {
                    fontSize: '8px', fill: '#ffffff'
                }).setOrigin(0.5)
                this.ruletaContainer.add(label)
            }

            this.ruletaContainer.add(graphics)
        }

        // Cercle central
        const centre = this.add.circle(0, 0, 20, 0xc9a227)
        const centreInner = this.add.circle(0, 0, 14, 0x1a1208)
        this.ruletaContainer.add([centre, centreInner])

        // Agulla fixa (fora del container, no gira)
        this.add.triangle(cx, cy - radius + 2, 0, 0, -8, -18, 8, -18, 0xffd700)
    }

    girar() {
        if (!this.apostaColor || this.girando || this.rondes >= this.maxRondes) return
        this.girando = true
        this.numText.setText('')
        this.resultText.setText('')
        this.btnGirar.disableInteractive()

        const totalRotation = Phaser.Math.Between(720, 1440)
        this.tweens.add({
            targets: this.ruletaContainer,
            angle: totalRotation,
            duration: 2500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                let num = Phaser.Math.Between(0, 36)
                const cheat = localStorage.getItem('cheat_ruleta')
                if (cheat) {
                    const rojos = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
                    if (cheat === 'green') num = 0
                    else if (cheat === 'red') num = Phaser.Utils.Array.GetRandom(rojos)
                    else if (cheat === 'black') {
                        const negros = []
                        for (let n = 1; n <= 36; n++) if (!rojos.includes(n)) negros.push(n)
                        num = Phaser.Utils.Array.GetRandom(negros)
                    }
                }
                this.numText.setText(`${num}`)
                this.resolveRonda(num)
            }
        })
    }

    getColor(num) {
        if (num === 0) return 'green'
        const rojos = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
        return rojos.includes(num) ? 'red' : 'black'
    }

    addColorBtn(x, y, text, color, apostaColor) {
        const btn = this.add.rectangle(x, y, 130, 44, color)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x888888)

        const label = this.add.text(x, y, text, {
            fontSize: '14px', fill: '#ffffff', fontFamily: 'serif'
        }).setOrigin(0.5)

        btn._btnText = label

        btn.on('pointerover', () => {
            if (this.apostaColor !== apostaColor) btn.setStrokeStyle(2, 0xffd700)
        })
        btn.on('pointerout', () => {
            if (this.apostaColor !== apostaColor) btn.setStrokeStyle(1, 0x888888)
        })
        btn.on('pointerdown', () => {
            this.apostaColor = apostaColor
            this.colorText.setText(`Apuesta seleccionada: ${text}`)
            this.btnRed.setStrokeStyle(this.apostaColor === 'red' ? 3 : 1, this.apostaColor === 'red' ? 0xffd700 : 0x888888)
            this.btnBlack.setStrokeStyle(this.apostaColor === 'black' ? 3 : 1, this.apostaColor === 'black' ? 0xffd700 : 0x888888)
            this.btnGreen.setStrokeStyle(this.apostaColor === 'green' ? 3 : 1, this.apostaColor === 'green' ? 0xffd700 : 0x888888)
        })

        btn.setDepth(5)
        label.setDepth(6)
        return btn
    }

    resolveRonda(num) {
        const color = this.getColor(num)
        let guanyancia = 0

        if (this.apostaColor === color) {
            guanyancia = color === 'green' ? this.aposta * 14 : this.aposta
            this.monedes += guanyancia
            this.guanyBrut += guanyancia
            this.resultText.setText('GANAS +' + guanyancia + '$!').setFill('#00ff88')
        } else {
            const perdua = this.aposta
            const seguro = this.getSeguroRate()
            this.monedes -= perdua
            this.perduaBruta += perdua
            this.perduaSeguro += Math.round(perdua * seguro)
            this.resultText.setText('PIERDES -' + perdua + '$').setFill('#ff4444')
        }

        this.monText.setText(Math.round(this.monedes) + '$')
        if (Math.round(this.monedes) <= 0) {
            this.time.delayedCall(800, () => this.mostrarArruinado())
            return
        }
        this.ajustarAposta()
        this.rondes++
        this.girando = false
        this.apostaColor = null
        this.colorText.setText('Tria un color').setFill('#a08c5a')
        this.btnRed.setStrokeStyle(1, 0x888888)
        this.btnBlack.setStrokeStyle(1, 0x888888)
        this.btnGreen.setStrokeStyle(1, 0x888888)

        if (this.rondes >= this.maxRondes) {
            this.rondesText.setText('Joc acabat!')
            this.time.delayedCall(2000, () => this.mostrarResultats())
        } else {
            this.rondesText.setText('Ronda ' + (this.rondes + 1) + '/' + this.maxRondes)
            this.btnGirar.setInteractive({ useHandCursor: true })
        }
    }

    minBet() { return Math.max(5, Math.floor(this.monedes * 0.1)) }

    getSeguroRate() {
        const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
        return seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
    }

    mostrarArruinado() {
        const { width, height } = this.scale
        this.btnGirar.disableInteractive()
        this.btnRed.disableInteractive()
        this.btnBlack.disableInteractive()
        this.btnGreen.disableInteractive()
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
            'RESULTADOS DE LA PARTIDA',
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
}