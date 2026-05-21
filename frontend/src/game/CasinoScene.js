import Phaser from 'phaser'

export default class CasinoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CasinoScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
    }

    create() {
        const { width, height } = this.scale

        // Fons
        this.add.rectangle(width/2, height/2, width, height, 0x0d0a06)

        // Títol
        this.add.text(width/2, 60, '⚔ TRIA EL TEU DESTÍ', {
            fontSize: '28px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.add.text(width/2, 100, `Dia ${this.dia} — ${this.monedes}$`, {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        // Jocs
        const jocs = [
            { nom: 'Blackjack', emoji: '🃏', desc: '5 mans · Guanya amb 21', escena: 'BlackjackScene', color: 0x1a3d06 },
            { nom: 'Ruleta', emoji: '🎡', desc: '3 rondes · Aposta al número', escena: 'RuletaScene', color: 0x3d1a00 },
            { nom: 'Slots', emoji: '🎰', desc: '5 tirades · Combina símbols', escena: 'SlotsScene', color: 0x1a0d3d },
        ]

        jocs.forEach((joc, i) => {
            const x = width * (i + 1) / 4
            const y = height / 2

            const card = this.add.rectangle(x, y, 160, 200, joc.color)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0xc9a227)

            this.add.text(x, y - 60, joc.emoji, { fontSize: '48px' }).setOrigin(0.5)
            this.add.text(x, y + 10, joc.nom, {
                fontSize: '20px', fill: '#c9a227', fontFamily: 'serif'
            }).setOrigin(0.5)
            this.add.text(x, y + 40, joc.desc, {
                fontSize: '12px', fill: '#e8d5a3', fontFamily: 'serif',
                wordWrap: { width: 140 }
            }).setOrigin(0.5)

            card.on('pointerover', () => card.setStrokeStyle(3, 0xffd700))
            card.on('pointerout', () => card.setStrokeStyle(2, 0xc9a227))
            card.on('pointerdown', () => {
                this.cameras.main.fade(300, 0, 0, 0)
                this.time.delayedCall(300, () => {
                    this.scene.start(joc.escena, {
                        nickname: this.nickname,
                        monedes: this.monedes,
                        dia: this.dia,
                        millores: this.millores
                    })
                })
            })
        })

        // Tornar al recinte
        const back = this.add.text(width/2, height - 40, '← Tornar al recinte', {
            fontSize: '14px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })

        back.on('pointerover', () => back.setFill('#c9a227'))
        back.on('pointerout', () => back.setFill('#a08c5a'))
        back.on('pointerdown', () => {
            this.scene.start('RecinteScene', {
                nickname: this.nickname,
                monedes: this.monedes,
                dia: this.dia,
                millores: this.millores
            })
        })
    }
}