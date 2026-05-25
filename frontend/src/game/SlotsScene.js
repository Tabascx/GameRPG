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
        this.tirades = 0
        this.maxTirades = 5
        this.aposta = 30
        this.simbols = ['⚔️', '💰', '💎', '🍺', '🔥', '⭐']
    }

    create() {
        const { width, height } = this.scale
        this.add.rectangle(width/2, height/2, width, height, 0x0d0a1a)

        this.add.text(width/2, 30, '🎰 SLOTS', {
            fontSize: '28px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.tiradesText = this.add.text(width/2, 70, `Tirada ${this.tirades + 1}/${this.maxTirades}`, {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Marc i rodets visuals
        this.add.rectangle(width/2, height/2 - 20, 360, 120, 0x1a1208)
            .setStrokeStyle(2, 0xc9a227)

        this.add.rectangle(width/2 - 120, height/2 - 20, 90, 90, 0x2b1a08)
            .setStrokeStyle(2, 0x6b4a1d)
        this.add.rectangle(width/2, height/2 - 20, 90, 90, 0x2b1a08)
            .setStrokeStyle(2, 0x6b4a1d)
        this.add.rectangle(width/2 + 120, height/2 - 20, 90, 90, 0x2b1a08)
            .setStrokeStyle(2, 0x6b4a1d)

        // Rodets
        this.reel1 = this.add.text(width/2 - 120, height/2 - 20, '❓', {
            fontSize: '58px'
        }).setOrigin(0.5).setDepth(2)
        this.reel2 = this.add.text(width/2, height/2 - 20, '❓', {
            fontSize: '58px'
        }).setOrigin(0.5).setDepth(2)
        this.reel3 = this.add.text(width/2 + 120, height/2 - 20, '❓', {
            fontSize: '58px'
        }).setOrigin(0.5).setDepth(2)

        this.add.text(width/2 - 120, height/2 + 40, '1', {
            fontSize: '11px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.add.text(width/2, height/2 + 40, '2', {
            fontSize: '11px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)
        this.add.text(width/2 + 120, height/2 + 40, '3', {
            fontSize: '11px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.resultText = this.add.text(width/2, height/2 + 80, '', {
            fontSize: '24px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

        this.add.text(width/2, height/2 + 120, `Aposta: ${this.aposta}$ per tirada`, {
            fontSize: '13px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Premi info
        this.add.text(width/2, height - 140, '3 iguals: x10 | 2 iguals: x2 | Res: -aposta', {
            fontSize: '11px', fill: '#666', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Botó tirar
        this.btnTirar = this.add.rectangle(width/2, height - 80, 180, 48, 0x3d1a06)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(2, 0xc9a227)
        this.btnTirarText = this.add.text(width/2, height - 80, '🎰 TIRAR', {
            fontSize: '20px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.btnTirar.on('pointerdown', () => this.tirar())
        this.btnTirar.on('pointerover', () => this.btnTirar.setStrokeStyle(3, 0xffd700))
        this.btnTirar.on('pointerout', () => this.btnTirar.setStrokeStyle(2, 0xc9a227))
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
        const s1 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]
        const s2 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]
        const s3 = this.simbols[Phaser.Math.Between(0, this.simbols.length - 1)]

        this.reel1.setText(s1)
        this.reel2.setText(s2)
        this.reel3.setText(s3)

        let guanyancia = 0
        let missatge = ''

        if (s1 === s2 && s2 === s3) {
            guanyancia = this.aposta * 10
            missatge = `🎉 JACKPOT! +${guanyancia}$`
            this.resultText.setFill('#ffd700')
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            guanyancia = this.aposta * 2
            missatge = `✨ DOS IGUALS! +${guanyancia}$`
            this.resultText.setFill('#00ff88')
        } else {
            const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
            const seguro = seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
            const perdua = this.aposta * (1 - seguro)
            guanyancia = -perdua
            missatge = `💀 PERDS -${Math.round(perdua)}$`
            this.resultText.setFill('#ff4444')
        }

        this.monedes += guanyancia
        this.monText.setText(`${Math.round(this.monedes)}$`)
        this.resultText.setText(missatge)
        this.tirades++
        this.tiradesText.setText(`Tirada ${Math.min(this.tirades + 1, this.maxTirades)}/${this.maxTirades}`)

        if (this.tirades >= this.maxTirades) {
            this.time.delayedCall(2000, () => this.acabar())
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
            millores: this.millores
        })
    }
}