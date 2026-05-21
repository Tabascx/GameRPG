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
        this.rondes = 0
        this.maxRondes = 3
        this.aposta = 50
        this.apostaColor = null
        this.girando = false
    }

    create() {
        const { width, height } = this.scale
        this.add.rectangle(width/2, height/2, width, height, 0x0a1a0a)

        this.add.text(width/2, 30, '🎡 RULETA', {
            fontSize: '28px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.rondesText = this.add.text(width/2, 65, `Ronda ${this.rondes + 1}/${this.maxRondes}`, {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Ruleta visual
        this.drawRuleta(width/2, height/2 - 80)

        // Número resultat al centre
        this.numText = this.add.text(width/2, height/2 - 40, '', {
            fontSize: '36px', fill: '#ffffff', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.resultText = this.add.text(width/2, height/2 + 110, '', {
            fontSize: '20px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

        // Botons apostar
        this.add.text(width/2, height/2 + 145, 'Aposta a:', {
            fontSize: '13px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.btnRed = this.addColorBtn(width/2 - 120, height/2 + 175, '🔴 ROIG x2', 0x8b0000, 'red')
        this.btnBlack = this.addColorBtn(width/2, height/2 + 175, '⚫ NEGRE x2', 0x222222, 'black')
        this.btnGreen = this.addColorBtn(width/2 + 120, height/2 + 175, '🟢 VERD x14', 0x006400, 'green')

        this.apostaText = this.add.text(width/2, height/2 + 210, 'Tria un color', {
            fontSize: '12px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Botó girar
        this.btnGirar = this.add.rectangle(width/2, height - 40, 160, 40, 0x3d1a06)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xc9a227)
        this.btnGirarText = this.add.text(width/2, height - 40, 'GIRAR', {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.btnGirar.on('pointerdown', () => this.girar())
        this.btnGirar.on('pointerover', () => this.btnGirar.setStrokeStyle(3, 0xffd700))
        this.btnGirar.on('pointerout', () => this.btnGirar.setStrokeStyle(2, 0xc9a227))

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

    drawRuleta(cx, cy) {
        const radius = 90
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
                const num = Phaser.Math.Between(0, 36)
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
        const btn = this.add.rectangle(x, y, 100, 34, color)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x888888)

        const label = this.add.text(x, y, text, {
            fontSize: '11px', fill: '#ffffff', fontFamily: 'serif'
        }).setOrigin(0.5)

        btn.on('pointerover', () => {
            if (this.apostaColor !== apostaColor) btn.setStrokeStyle(2, 0xffd700)
        })
        btn.on('pointerout', () => {
            if (this.apostaColor !== apostaColor) btn.setStrokeStyle(1, 0x888888)
        })
        btn.on('pointerdown', () => {
            this.apostaColor = apostaColor
            this.apostaText.setText(`Aposta seleccionada: ${text}`)
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
            this.resultText.setText(`✨ GUANYES +${guanyancia}$!`).setFill('#00ff88')
        } else {
            const seguro = this.millores.includes('muralla') ? 0.7 : 0.4
            const perdua = Math.round(this.aposta * (1 - seguro))
            this.monedes -= perdua
            this.resultText.setText(`💀 PERDS -${perdua}$`).setFill('#ff4444')
        }

        this.monText.setText(`${Math.round(this.monedes)}$`)
        this.rondes++
        this.girando = false
        this.apostaColor = null
        this.apostaText.setText('Tria un color').setFill('#a08c5a')
        this.btnRed.setStrokeStyle(1, 0x888888)
        this.btnBlack.setStrokeStyle(1, 0x888888)
        this.btnGreen.setStrokeStyle(1, 0x888888)

        if (this.rondes >= this.maxRondes) {
            this.rondesText.setText('Joc acabat!')
            this.time.delayedCall(2000, () => this.acabar())
        } else {
            this.rondesText.setText(`Ronda ${this.rondes + 1}/${this.maxRondes}`)
            this.btnGirar.setInteractive({ useHandCursor: true })
        }
    }

    acabar() {
        this.btnGirar.disableInteractive()
        this.btnRed.disableInteractive()
        this.btnBlack.disableInteractive()
        this.btnGreen.disableInteractive()
        this.scene.start('RecinteScene', {
            nickname: this.nickname,
            monedes: Math.round(this.monedes),
            dia: this.dia + 1,
            millores: this.millores
        })
    }
}