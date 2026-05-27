import Phaser from 'phaser'

const JOCS = [
    { nom: 'Blackjack', escena: 'BlackjackScene', color: 0x1a3d06 },
    { nom: 'Ruleta', escena: 'RuletaScene', color: 0x3d1a00 },
    { nom: 'Slots', escena: 'SlotsScene', color: 0x1a0d3d },
    { nom: 'Cara o Creu', escena: 'MonedaScene', color: 0x3d3d06 },
    { nom: 'Daus (Boss)', escena: 'DausScene', color: 0x3d0606 },
    { nom: 'Blackjack (Boss)', escena: 'BossBlackjackScene', color: 0x3d0606 },
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
        this.equipats = [...(data.equipats || [])]
        this.inventari = [...(data.inventari || [])]
        this.capsulaPreu = data.capsulaPreu ?? 50
    }

    create() {
        const { width, height } = this.scale

        this.add.image(width / 2, height / 2, 'casinoBg').setDisplaySize(width, height)
        this.afegirVinyeta(width, height)

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

        // Triar joc (forçat per cheat, dia 5/10=boss, o aleatori)
        let joc
        if (this.dia === 5) {
            this.scene.start('DausScene', {
                nickname: this.nickname,
                monedes: this.monedes,
                dia: this.dia,
                millores: this.millores,
                equipats: this.equipats,
                inventari: this.inventari,
                capsulaPreu: this.capsulaPreu
            })
            return
        }
        if (this.dia === 10) {
            this.scene.start('BossBlackjackScene', {
                nickname: this.nickname,
                monedes: this.monedes,
                dia: this.dia,
                millores: this.millores,
                equipats: this.equipats,
                inventari: this.inventari,
                capsulaPreu: this.capsulaPreu
            })
            return
        }
        const forcjat = localStorage.getItem('cheat_joc')
        if (forcjat) {
            joc = JOCS.find(j => j.escena === forcjat)
        }
        if (!joc) {
            joc = Phaser.Utils.Array.GetRandom(JOCS.filter(j => j.escena !== 'DausScene' && j.escena !== 'BossBlackjackScene'))
        }

        this.time.delayedCall(600, () => {
                info.setText(`Hoy toca... ${joc.nom}!`)
            this.cameras.main.shake(300, 0.01)
        })

        this.time.delayedCall(1800, () => {
            this.cameras.main.fade(400, 0, 0, 0)
            this.time.delayedCall(400, () => {
                this.scene.start(joc.escena, {
                    nickname: this.nickname,
                    monedes: this.monedes,
                    dia: this.dia,
                    millores: this.millores,
                    equipats: this.equipats,
                    inventari: this.inventari,
                    capsulaPreu: this.capsulaPreu
                })
            })
        })
    }

    afegirVinyeta(w, h) {
        const rt = this.add.renderTexture(0, 0, w, h).setDepth(1)
        rt.fill(0x000000, 0.55)
        const circ = this.make.graphics({ add: false })
        circ.fillStyle(0xffffff)
        circ.fillCircle(0, 0, 260)
        circ.generateTexture('spot_cas', 520, 520)
        circ.destroy()
        const eraser = this.add.image(w / 2, h / 2 - 40, 'spot_cas').setVisible(false)
        rt.erase(eraser, w / 2, h / 2 - 40)
        eraser.destroy()
    }
}
