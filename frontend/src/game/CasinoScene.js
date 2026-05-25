import Phaser from 'phaser'

const JOCS = [
    { nom: 'Blackjack', escena: 'BlackjackScene', color: 0x1a3d06 },
    { nom: 'Ruleta', escena: 'RuletaScene', color: 0x3d1a00 },
    { nom: 'Slots', escena: 'SlotsScene', color: 0x1a0d3d },
    { nom: 'Cara o Creu', escena: 'MonedaScene', color: 0x3d3d06 },
]

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

        this.add.rectangle(width / 2, height / 2, width, height, 0x0d0a06)

        this.add.text(width / 2, height / 3, '🎲 CASINO 🎲', {
            fontSize: '36px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5)

        const info = this.add.text(width / 2, height / 2, '', {
            fontSize: '22px', fill: '#e8d5a3', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

        const monText = this.add.text(width - 16, 16, `${this.monedes}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0)

        // Triar joc aleatori
        const joc = Phaser.Utils.Array.GetRandom(JOCS)

        this.time.delayedCall(600, () => {
            info.setText(`Avui toca... ${joc.nom}!`)
            this.cameras.main.shake(300, 0.01)
        })

        this.time.delayedCall(1800, () => {
            this.cameras.main.fade(400, 0, 0, 0)
            this.time.delayedCall(400, () => {
                this.scene.start(joc.escena, {
                    nickname: this.nickname,
                    monedes: this.monedes,
                    dia: this.dia,
                    millores: this.millores
                })
            })
        })
    }
}
