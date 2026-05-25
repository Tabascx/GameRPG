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
        this.rondes = 0
        this.maxRondes = 3
        this.aposta = 50
        this.flipping = false
    }

    create() {
        const { width, height } = this.scale
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a)

        this.add.text(width / 2, 30, 'CARA O CREU', {
            fontSize: '28px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.rondesText = this.add.text(width / 2, 65, `Ronda ${this.rondes + 1}/${this.maxRondes} — Aposta: ${this.aposta}$`, {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Moneda
        this.coin = this.add.circle(width / 2, height / 2 - 60, 60, 0xc9a227)
            .setStrokeStyle(3, 0xffd700)
        this.coinText = this.add.text(width / 2, height / 2 - 60, '?', {
            fontSize: '48px', fill: '#1a1208', fontFamily: 'serif', fontStyle: 'bold'
        }).setOrigin(0.5)
        this.coinLabel = this.add.text(width / 2, height / 2 - 120, '', {
            fontSize: '13px', fill: '#e8d5a3', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5)

        // Resultat
        this.resultText = this.add.text(width / 2, height / 2 + 20, '', {
            fontSize: '22px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

        // Botons Cara / Creu
        const btnW = 130
        const btnH = 44
        this.btnCara = this.add.rectangle(width / 2 - 80, height / 2 + 90, btnW, btnH, 0x1a3d06)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xc9a227)
        this.add.text(width / 2 - 80, height / 2 + 90, 'CARA', {
            fontSize: '16px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.btnCara.on('pointerover', () => this.btnCara.setStrokeStyle(3, 0xffd700))
        this.btnCara.on('pointerout', () => this.btnCara.setStrokeStyle(2, 0xc9a227))
        this.btnCara.on('pointerdown', () => this.triar('cara'))

        this.btnCreu = this.add.rectangle(width / 2 + 80, height / 2 + 90, btnW, btnH, 0x3d0606)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xc9a227)
        this.add.text(width / 2 + 80, height / 2 + 90, 'CREU', {
            fontSize: '16px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.btnCreu.on('pointerover', () => this.btnCreu.setStrokeStyle(3, 0xffd700))
        this.btnCreu.on('pointerout', () => this.btnCreu.setStrokeStyle(2, 0xc9a227))
        this.btnCreu.on('pointerdown', () => this.triar('creu'))

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
                millores: this.millores
            })
        })
    }

    triar(opcio) {
        if (this.flipping || this.rondes >= this.maxRondes) return
        this.flipping = true

        this.btnCara.disableInteractive()
        this.btnCreu.disableInteractive()
        this.resultText.setText('')
        this.coinLabel.setText('')

        // Animació de la moneda (girs)
        this.tweens.add({
            targets: this.coin,
            scaleX: { from: 1, to: 0 },
            duration: 100,
            yoyo: true,
            repeat: 7,
            ease: 'Sine.easeInOut',
            onYoyo: (tween, target) => {
                // Canviar text durant la meitat de cada flip
                this.coinText.setText(this.coinText.text === '?' ? '?' : '?')
            },
            onComplete: () => {
                const resultat = Math.random() < 0.5 ? 'cara' : 'creu'
                const guanya = opcio === resultat

                this.coinText.setText(resultat === 'cara' ? 'C' : '✝')
                this.coinLabel.setText(resultat === 'cara' ? 'CARA' : 'CREU')
                this.coin.setFillStyle(resultat === 'cara' ? 0xc9a227 : 0x888888)

                if (guanya) {
                    this.monedes += this.aposta
                    this.resultText.setText(`✨ CARA! +${this.aposta}$`).setFill('#00ff88')
                } else {
                    const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
                    const seguro = seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
                    const perdua = Math.round(this.aposta * (1 - seguro))
                    this.monedes -= perdua
                    this.resultText.setText(`💀 CREU! -${perdua}$`).setFill('#ff4444')
                }

                this.monText.setText(`${Math.round(this.monedes)}$`)
                this.rondes++

                if (this.rondes >= this.maxRondes) {
                    this.rondesText.setText('Joc acabat!')
                    this.time.delayedCall(2000, () => this.acabar())
                } else {
                    this.rondesText.setText(`Ronda ${this.rondes + 1}/${this.maxRondes} — Aposta: ${this.aposta}$`)
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
        })
    }

    acabar() {
        this.btnCara.disableInteractive()
        this.btnCreu.disableInteractive()
        this.scene.start('RecinteScene', {
            nickname: this.nickname,
            monedes: Math.round(this.monedes),
            dia: this.dia + 1,
            millores: this.millores
        })
    }
}
