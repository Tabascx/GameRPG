import Phaser from 'phaser'

export default class BlackjackScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BlackjackScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.aposta = 50
        this.mans = 0
        this.maxMans = 5
        this.guanyades = 0
    }

    create() {
        const { width, height } = this.scale
        this.add.rectangle(width/2, height/2, width, height, 0x0a2a0a)

        this.add.text(width/2, 30, '🃏 BLACKJACK', {
            fontSize: '28px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.infoText = this.add.text(width/2, 70, `Mà ${this.mans + 1}/${this.maxMans} — Aposta: ${this.aposta}$`, {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Cartes
        this.cartesJugador = []
        this.cartesDealer = []
        this.valorJugador = 0
        this.valorDealer = 0

        this.dealerText = this.add.text(width/2, 120, 'Dealer: ?', {
            fontSize: '18px', fill: '#ff8888', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.jugadorText = this.add.text(width/2, height - 180, 'Tu: 0', {
            fontSize: '18px', fill: '#88ff88', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.resultText = this.add.text(width/2, height/2, '', {
            fontSize: '32px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        // Botons
        this.btnPedirCarta = this.addBtn(width/2 - 80, height - 80, 'CARTA', 0x1a3d06, () => this.pedirCarta())
        this.btnPlantar = this.addBtn(width/2 + 80, height - 80, 'PLANTAR', 0x3d1a06, () => this.plantar())

        this.repartirMa()
    }

    addBtn(x, y, text, color, callback) {
        const btn = this.add.rectangle(x, y, 120, 40, color)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0xc9a227)
        this.add.text(x, y, text, {
            fontSize: '14px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        btn.on('pointerdown', callback)
        btn.on('pointerover', () => btn.setStrokeStyle(2, 0xffd700))
        btn.on('pointerout', () => btn.setStrokeStyle(1, 0xc9a227))
        return btn
    }

    getCard() {
        const vals = [1,2,3,4,5,6,7,8,9,10,10,10,10]
        return vals[Phaser.Math.Between(0, vals.length - 1)]
    }

    getCardEmoji(val) {
        const emojis = { 1:'🂡', 10:'🂪', 11:'🂫', 12:'🂭', 13:'🂮' }
        return emojis[val] || `[${val}]`
    }

    repartirMa() {
        // Netejar cartes visuals anteriors
        this.children.list
            .filter(c => c.getData && c.getData('carta'))
            .forEach(c => c.destroy())

        this.cartesJugador = [this.getCard(), this.getCard()]
        this.cartesDealer = [this.getCard(), this.getCard()]
        this.valorJugador = this.cartesJugador.reduce((a,b) => a+b, 0)
        this.valorDealer = this.cartesDealer.reduce((a,b) => a+b, 0)

        this.drawCartes()
        this.jugadorText.setText(`Tu: ${this.valorJugador}`)
        this.dealerText.setText('Dealer: ?')
        this.resultText.setText('')
        this.infoText.setText(`Mà ${this.mans + 1}/${this.maxMans} — Aposta: ${this.aposta}$`)

        this.btnPedirCarta.setVisible(true)
        this.btnPlantar.setVisible(true)
    }

    drawCartes() {
        const { width, height } = this.scale

        this.cartesJugador.forEach((val, i) => {
            const card = this.add.rectangle(
                width/2 - 60 + i * 70, height - 260, 50, 70, 0xffffff
            ).setData('carta', true)
            this.add.text(
                width/2 - 60 + i * 70, height - 260, `${val}`,
                { fontSize: '20px', fill: '#000', fontFamily: 'serif' }
            ).setOrigin(0.5).setData('carta', true)
        })

        // Dealer carta oculta
        this.add.rectangle(width/2 - 35, 200, 50, 70, 0x333333)
            .setData('carta', true)
        this.add.text(width/2 - 35, 200, '?',
            { fontSize: '20px', fill: '#fff', fontFamily: 'serif' }
        ).setOrigin(0.5).setData('carta', true)

        this.add.rectangle(width/2 + 35, 200, 50, 70, 0xffffff)
            .setData('carta', true)
        this.add.text(width/2 + 35, 200, `${this.cartesDealer[1]}`,
            { fontSize: '20px', fill: '#000', fontFamily: 'serif' }
        ).setOrigin(0.5).setData('carta', true)
    }

    pedirCarta() {
        const nova = this.getCard()
        this.cartesJugador.push(nova)
        this.valorJugador += nova
        this.jugadorText.setText(`Tu: ${this.valorJugador}`)

        const { width, height } = this.scale
        const i = this.cartesJugador.length - 1
        this.add.rectangle(width/2 - 60 + i * 70, height - 260, 50, 70, 0xffffff).setData('carta', true)
        this.add.text(width/2 - 60 + i * 70, height - 260, `${nova}`,
            { fontSize: '20px', fill: '#000', fontFamily: 'serif' }
        ).setOrigin(0.5).setData('carta', true)

        if (this.valorJugador > 21) {
            this.acabarMa(false)
        }
    }

    plantar() {
        this.dealerText.setText(`Dealer: ${this.valorDealer}`)
        const guanya = this.valorJugador <= 21 && (this.valorDealer > 21 || this.valorJugador > this.valorDealer)
        this.acabarMa(guanya)
    }

    acabarMa(guanya) {
        this.btnPedirCarta.setVisible(false)
        this.btnPlantar.setVisible(false)
        this.mans++

        if (guanya) {
            this.monedes += this.aposta
            this.guanyades++
            this.resultText.setText('✨ GUANYES!').setFill('#00ff88')
        } else {
            const seguro = this.millores.includes('muralla') ? 0.7 : 0.4
            const perdua = this.valorJugador > 21
                ? this.aposta
                : this.aposta * (1 - seguro)
            this.monedes -= perdua
            this.resultText.setText('💀 PERDS!').setFill('#ff4444')
        }

        this.monText.setText(`${Math.round(this.monedes)}$`)

        if (this.mans >= this.maxMans) {
            this.time.delayedCall(1500, () => this.acabarJoc())
        } else {
            this.time.delayedCall(1500, () => this.repartirMa())
        }
    }

    acabarJoc() {
        this.btnPedirCarta.disableInteractive()
        this.btnPlantar.disableInteractive()
        this.scene.start('RecinteScene', {
            nickname: this.nickname,
            monedes: Math.round(this.monedes),
            dia: this.dia + 1,
            millores: this.millores
        })
    }
}