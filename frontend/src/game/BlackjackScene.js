import Phaser from 'phaser'

const CARD_W = 109
const CARD_H = 148
const CARD_GAP = 107

export default class BlackjackScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BlackjackScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.equipats = [...(data.equipats || [])]
        this.inventari = [...(data.inventari || [])]
        this.capsulaPreu = data.capsulaPreu ?? 50
        this.mans = 0
        this.maxMans = 5
        this.guanyades = 0
        this.guanyBrut = 0
        this.perduaBruta = 0
        this.perduaSeguro = 0
    }

    minBet() { return Math.max(5, Math.floor(this.monedes * 0.1)) }

    SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades']
    RANKS = [
        { rank: 'A', value: 1 }, { rank: '2', value: 2 }, { rank: '3', value: 3 },
        { rank: '4', value: 4 }, { rank: '5', value: 5 }, { rank: '6', value: 6 },
        { rank: '7', value: 7 }, { rank: '8', value: 8 }, { rank: '9', value: 9 },
        { rank: '10', value: 10 }, { rank: 'J', value: 10 },
        { rank: 'Q', value: 10 }, { rank: 'K', value: 10 },
    ]

    calcHand(cards) {
        let total = 0, aces = 0
        for (const c of cards) {
            total += c.value
            if (c.rank === 'A') aces++
        }
        while (aces > 0 && total + 10 <= 21) { total += 10; aces-- }
        return total
    }

    buildDeck() {
        const deck = []
        for (const suit of this.SUITS) {
            for (const r of this.RANKS) {
                deck.push({ ...r, suit, img: `card_${suit}_${r.rank}` })
            }
        }
        deck.push({ rank: '*', value: 0, suit: 'Joker', img: 'cardJoker' })
        Phaser.Utils.Array.Shuffle(deck)
        return deck
    }

    drawCard() {
        if (this.deck.length === 0) return null
        if (localStorage.getItem('cheat_blackjack_joker')) {
            const idx = this.deck.findIndex(c => c.rank === '*')
            if (idx >= 0) return this.deck.splice(idx, 1)[0]
        }
        return this.deck.pop()
    }

    drawThreeForCheat() {
        const result = []
        const needs = [10, 10, 1]
        for (const v of needs) {
            const idx = this.deck.findIndex(c => c.value === v)
            if (idx >= 0) { result.push(this.deck.splice(idx, 1)[0]) }
            else { result.push(this.drawCard()) }
        }
        return result
    }

    create() {
        localStorage.removeItem('cheat_blackjack')
        localStorage.removeItem('cheat_blackjack_joker')
        const { width, height } = this.scale
        this.add.image(width / 2, height / 2, 'casinoBg').setDisplaySize(width, height)
        this.afegirVinyeta(width, height)

        this.aposta = this.minBet()

        this.add.text(width / 2, 30, 'BLACKJACK', {
            fontSize: '36px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.infoText = this.add.text(width / 2, 60, `Mano ${this.mans + 1}/${this.maxMans}`, {
            fontSize: '20px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.ruleText = this.add.text(width / 2, height / 2 - 20, 'El crupier se planta en 16', {
            fontSize: '15px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5)

        this.deckX = Math.min(width * 0.72, width - CARD_W - 15)
        this.deckY = 65
        const selX = this.deckX
        const selY = height / 2

        this.add.text(selX, selY - 80, 'APUESTA', {
            fontSize: '14px', fill: '#a08c5a', fontFamily: 'serif'
        }).setOrigin(0.5)

        const apBtn = (y, label, cb) => {
            const t = this.add.text(selX, y, label, {
                fontSize: '20px', fill: '#c9a227', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            t.on('pointerover', () => t.setFill('#ffffff'))
            t.on('pointerout', () => t.setFill('#c9a227'))
            t.on('pointerdown', cb)
            return t
        }
        apBtn(selY - 55, '\u25B2 +10', () => this.canviarAposta(10))
        apBtn(selY - 28, '\u25B2 +5', () => this.canviarAposta(5))
        this.betAmountText = this.add.text(selX, selY + 5, this.aposta + '$', {
            fontSize: '32px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3, backgroundColor: '#1a120888',
            padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        this.betAmountText.on('pointerdown', () => {
            const v = window.prompt('Apuesta (min ' + this.minBet() + '$, max ' + this.monedes + '$):', '' + this.aposta)
            if (v !== null) this.establirAposta(parseInt(v, 10))
        })
        apBtn(selY + 38, '\u25BC -5', () => this.canviarAposta(-5))
        apBtn(selY + 65, '\u25BC -10', () => this.canviarAposta(-10))

        this.cartesJugador = []
        this.cartesCrupier = []
        this.valorJugador = 0
        this.valorCrupier = 0

        this.dealerText = this.add.text(width / 2, 100, 'Crupier: ?', {
            fontSize: '26px', fill: '#ff8888', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.jugadorText = this.add.text(width / 2, height - 135, 'Tu: 0', {
            fontSize: '26px', fill: '#88ff88', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.monText = this.add.text(width / 2, height - 95, `${this.monedes}$`, {
            fontSize: '22px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(0.5)

        this.resultText = this.add.text(width / 2, height / 2, '', {
            fontSize: '42px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.btnPedirCarta = this.addBtn(width / 2 - 80, height - 35, 'CARTA', 0x1a3d06, () => this.pedirCarta())
        this.btnPlantar = this.addBtn(width / 2 + 80, height - 35, 'PLANTAR', 0x3d1a06, () => this.plantar())
        this._mostrarBotonsCartes(false)

        this.btnApostar = this.addBtn(width / 2, height / 2 + 60, 'APOSTAR', 0x1a3d06, () => this.confirmarAposta())

        this.dibuixarEquipats()

        this.input.keyboard.on('keydown-P', (event) => {
            if (event.altKey) this.obrirCheats()
        })
    }

    confirmarAposta() {
        if (this.aposta < this.minBet() || this.aposta > this.monedes) return
        this.btnApostar.setVisible(false)
        this.btnApostar._btnText.setVisible(false)
        this._mostrarBotonsCartes(true)
        this.btnPedirCarta.setInteractive({ useHandCursor: true })
        this.btnPlantar.setInteractive({ useHandCursor: true })
        this.repartirMa()
    }

    afegirVinyeta(w, h) {
        const rt = this.add.renderTexture(0, 0, w, h).setDepth(1)
        rt.fill(0x000000, 0.55)
        const circ = this.make.graphics({ add: false })
        circ.fillStyle(0xffffff)
        circ.fillCircle(0, 0, 260)
        const key = 'spot_' + (this.vignetteId || 0)
        this.vignetteId = (this.vignetteId || 0) + 1
        circ.generateTexture(key, 520, 520)
        circ.destroy()
        const eraser = this.add.image(w / 2, h / 2 - 40, key).setVisible(false)
        rt.erase(eraser, w / 2, h / 2 - 40)
        eraser.destroy()
    }

    dibuixarEquipats() {
        const items = (this.equipats || []).filter(Boolean)
        if (items.length === 0) return
        const { width } = this.scale
        const startX = 90
        const y = 118
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

    getCardX(count, i) {
        const totalW = (count - 1) * CARD_GAP
        return this.scale.width / 2 - totalW / 2 + i * CARD_GAP
    }

    flyCardTo(key, tx, ty, dataTag) {
        const img = this.add.image(this.deckX, this.deckY, key)
            .setDisplaySize(CARD_W, CARD_H).setData('carta', true).setAlpha(0.6)
        this.tweens.add({
            targets: img, x: tx, y: ty, alpha: 1, duration: 250, ease: 'Power2'
        })
        if (dataTag === 'dealer1') this.dealerCard1 = img
        if (dataTag) img.setData('tag', dataTag)
        return img
    }

    drawDeckStack() {
        this.children.list
            .filter(c => c.getData && c.getData('deckStack'))
            .forEach(c => c.destroy())
        const n = Math.min(4, this.deck.length)
        for (let i = 0; i < n; i++) {
            this.add.image(this.deckX - i * 2, this.deckY - i * 2, 'cardBack')
                .setDisplaySize(CARD_W, CARD_H).setData('deckStack', true).setDepth(0)
        }
    }

    findPlayerImgs() {
        const { height } = this.scale
        const midY = height / 2
        return this.children.list.filter(c =>
            c.getData && c.getData('carta') && c.y > midY &&
            c.texture && c.texture.key !== 'cardJoker'
        ).sort((a, b) => a.x - b.x)
    }

    reposicionar() {
        const imgs = this.findPlayerImgs()
        const cards = this.cartesJugador.filter(c => c.rank !== '*')
        for (let i = 0; i < Math.min(imgs.length, cards.length); i++) {
            const tx = this.getCardX(cards.length, i)
            this.tweens.add({ targets: imgs[i], x: tx, duration: 200, ease: 'Power2' })
        }
    }

    efecteJoker(jokerIdx, jokerImg) {
        if (!this.dealerCard1 || !this.cartesCrupier[0] || !jokerImg) return
        this.btnPedirCarta.disableInteractive()
        this.btnPlantar.disableInteractive()

        const tx = this.dealerCard1.x
        const ty = this.dealerCard1.y

        this.tweens.add({
            targets: jokerImg,
            x: tx, y: ty,
            scaleX: 0.6, scaleY: 0.6,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                this.dealerCard1.setTexture(this.cartesCrupier[0].img)
                this.valorCrupier = this.calcHand(this.cartesCrupier)
                this.dealerText.setText(`Crupier: ${this.valorCrupier}`)

                this.tweens.add({
                    targets: [this.dealerCard1, jokerImg],
                    x: tx + 10, duration: 50, yoyo: true, repeat: 5,
                    onComplete: () => {
                        this.cartesJugador = this.cartesJugador.filter((_, i) => i !== jokerIdx)
                        this.valorJugador = this.calcHand(this.cartesJugador)
                        this.jugadorText.setText(`Tu: ${this.valorJugador}`)
                        this.reposicionar()

                        this.tweens.add({
                            targets: jokerImg,
                            y: -120, alpha: 0, duration: 400,
                            onComplete: () => {
                                jokerImg.destroy()
                                this.btnPedirCarta.setInteractive({ useHandCursor: true })
                                this.btnPlantar.setInteractive({ useHandCursor: true })
                            }
                })
            }
        })

        this.time.delayedCall(1000, () => {
            if (this.valorJugador === 21) {
                this.acabarMa('blackjack')
            }
        })
            }
        })
    }

    canviarAposta(delta) { this.establirAposta(this.aposta + delta) }

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

    addBtn(x, y, text, color, callback) {
        const btn = this.add.rectangle(x, y, 150, 48, color)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xc9a227)
        btn._btnText = this.add.text(x, y, text, {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        btn.on('pointerdown', callback)
        btn.on('pointerover', () => btn.setStrokeStyle(2, 0xffd700))
        btn.on('pointerout', () => btn.setStrokeStyle(1, 0xc9a227))
        return btn
    }

    _mostrarBotonsCartes(visible) {
        this.btnPedirCarta.setVisible(visible)
        this.btnPedirCarta._btnText.setVisible(visible)
        this.btnPlantar.setVisible(visible)
        this.btnPlantar._btnText.setVisible(visible)
    }

    repartirMa() {
        this.monedes -= this.aposta
        this.monText.setText(`${Math.round(this.monedes)}$`)
        if (Math.round(this.monedes) < 0) {
            this.mostrarArruinado()
            return
        }

        this.children.list
            .filter(c => c.getData && c.getData('carta'))
            .forEach(c => c.destroy())
        this.dealerCard1 = null

        this.deck = this.buildDeck()
        this.drawDeckStack()

        if (localStorage.getItem('cheat_blackjack')) {
            this.cartesJugador = this.drawThreeForCheat()
        } else {
            this.cartesJugador = [this.drawCard(), this.drawCard()]
        }
        this.cartesCrupier = [this.drawCard(), this.drawCard()]
        this.valorJugador = this.calcHand(this.cartesJugador)
        this.valorCrupier = this.calcHand(this.cartesCrupier)

        this.jugadorText.setText(`Tu: ${this.valorJugador}`)
        this.dealerText.setText('Crupier: ?')
        this.resultText.setText('')
        this.infoText.setText(`Mano ${this.mans + 1}/${this.maxMans}`)
        this._mostrarBotonsCartes(true)
        this.btnPedirCarta.setInteractive({ useHandCursor: true })
        this.btnPlantar.setInteractive({ useHandCursor: true })

        const { width, height } = this.scale
        const dealerY = 190
        const jugadorY = height - 230

        this.time.delayedCall(200, () => {
            this.flyCardTo('cardBack', this.getCardX(2, 0), dealerY, 'dealer1')
        })
        this.time.delayedCall(400, () => {
            this.flyCardTo(this.cartesCrupier[1].img, this.getCardX(2, 1), dealerY)
            this.sound.play('snd_npc')
        })
        this.time.delayedCall(600, () => {
            for (let i = 0; i < this.cartesJugador.length; i++) {
                this.time.delayedCall(i * 200, () => {
                    const img = this.flyCardTo(this.cartesJugador[i].img,
                        this.getCardX(this.cartesJugador.length, i), jugadorY)
                    this.sound.play('snd_player')
                    if (this.cartesJugador[i].rank === '*') {
                        this.time.delayedCall(300, () => this.efecteJoker(i, img))
                    }
                })
            }
        })
    }

    pedirCarta() {
        const nova = this.drawCard()
        if (!nova) return
        this.cartesJugador.push(nova)
        this.valorJugador = this.calcHand(this.cartesJugador)
        this.jugadorText.setText(`Tu: ${this.valorJugador}`)
        this.drawDeckStack()

        const { height } = this.scale
        const jugadorY = height - 230
        const i = this.cartesJugador.length - 1
        const tx = this.getCardX(this.cartesJugador.length, i)
        const img = this.flyCardTo(nova.img, tx, jugadorY)
        this.sound.play('snd_player')

        if (nova.rank === '*') {
            this.time.delayedCall(400, () => this.efecteJoker(i, img))
            return
        }

        if (this.valorJugador > 21) {
            this.time.delayedCall(400, () => this.acabarMa('lose'))
        } else if (this.valorJugador === 21) {
            this.time.delayedCall(400, () => this.acabarMa('blackjack'))
        }
    }

    plantar() {
        this.btnPedirCarta.disableInteractive()
        this.btnPlantar.disableInteractive()

        if (this.dealerCard1 && this.cartesCrupier[0] && this.cartesCrupier[0].img) {
            this.tweens.add({
                targets: this.dealerCard1, alpha: 0, duration: 200,
                onComplete: () => {
                    this.dealerCard1.setTexture(this.cartesCrupier[0].img)
                    this.dealerCard1.setAlpha(0.6)
                    this.tweens.add({
                        targets: this.dealerCard1, alpha: 1, duration: 300,
                        onComplete: () => {
                            this.dealerText.setText(`Crupier: ${this.valorCrupier}`)
                            this.time.delayedCall(500, () => this.dealerDraw())
                        }
                    })
                }
            })
        } else {
            this.time.delayedCall(300, () => this.dealerDraw())
        }
    }

    dealerDraw() {
        this.valorCrupier = this.calcHand(this.cartesCrupier)
        if (this.valorCrupier >= 16) {
            this.resolveStanding()
            return
        }

        const nova = this.drawCard()
        if (!nova) {
            this.resolveStanding()
            return
        }

        this.cartesCrupier.push(nova)
        this.valorCrupier = this.calcHand(this.cartesCrupier)
        this.dealerText.setText(`Crupier: ${this.valorCrupier}`)
        this.drawDeckStack()

        const { width } = this.scale
        const dealerY = 190
        const i = this.cartesCrupier.length - 1
        const tx = this.getCardX(this.cartesCrupier.length, i)
        this.flyCardTo(nova.img, tx, dealerY)
        this.sound.play('snd_npc')

        this.time.delayedCall(500, () => {
            if (this.valorCrupier > 21) {
                this.time.delayedCall(300, () => this.acabarMa('win'))
            } else if (this.valorCrupier >= 16) {
                this.resolveStanding()
            } else {
                this.dealerDraw()
            }
        })
    }

    resolveStanding() {
        if (this.valorJugador === this.valorCrupier) {
            this.acabarMa('push')
        } else {
            const guanya = this.valorJugador > this.valorCrupier
            this.acabarMa(guanya ? 'win' : 'lose')
        }
    }

    acabarMa(result) {
        this._mostrarBotonsCartes(false)
        this.mans++

        if (result === 'push') {
            this.monedes += this.aposta
            this.resultText.setText('EMPATE!').setFill('#c9a227')
        } else if (result === 'blackjack') {
            this.monedes += this.aposta * 3
            this.guanyBrut += this.aposta * 2
            this.guanyades++
            this.resultText.setText('BLACKJACK! x3').setFill('#ffd700')
        } else if (result === 'win') {
            this.monedes += this.aposta * 2
            this.guanyBrut += this.aposta
            this.guanyades++
            this.resultText.setText('GANAS!').setFill('#00ff88')
        } else {
            this.perduaBruta += this.aposta
            const seguro = this.getSeguroRate()
            this.perduaSeguro += Math.round(this.aposta * seguro)
            this.resultText.setText('PIERDES!').setFill('#ff4444')
        }

        this.monText.setText(`${Math.round(this.monedes)}$`)
        if (Math.round(this.monedes) <= 0) {
            this.time.delayedCall(800, () => this.mostrarArruinado())
            return
        }
        this.ajustarAposta()

        if (this.mans >= this.maxMans) {
            this.time.delayedCall(1500, () => this.mostrarResultats())
        } else {
            this.time.delayedCall(1200, () => {
                this.btnApostar.setVisible(true)
                this.btnApostar._btnText.setVisible(true)
                this._mostrarBotonsCartes(false)
            })
        }
    }

    getSeguroRate() {
        const seg = Array.isArray(this.millores) && this.millores.find(m => m.nom === 'seguro')
        return seg ? [0.25, 0.35, 0.5][seg.nivell - 1] || 0.5 : 0
    }

    mostrarArruinado() {
        const { width, height } = this.scale
        this.btnPedirCarta.disableInteractive()
        this.btnPlantar.disableInteractive()
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
                this.time.delayedCall(600, () => this.acabarJoc())
            } else {
                this.acabarJoc()
            }
        })
    }

    obrirCheats() {
        const { width, height } = this.scale
        const cx = width / 2, cy = height / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50)
        const bg = this.add.rectangle(cx, cy, 280, 180, 0x0d0a06, 0.95).setDepth(51).setStrokeStyle(2, 0x88ff88)

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

        addTxt(cx, cy - 50, 'TRUCOS BLACKJACK', '15px', '#88ff88')

        const bjKey = 'cheat_blackjack'
        const bjEst = localStorage.getItem(bjKey)
        const bjTxt = addBtn(cx, cy - 10, '21 forzado: ' + (bjEst ? 'SÍ' : 'NO'), () => {
            if (localStorage.getItem(bjKey)) {
                localStorage.removeItem(bjKey)
                bjTxt.setText('21 forzado: NO')
            } else {
                localStorage.setItem(bjKey, '1')
                bjTxt.setText('21 forzado: SÍ')
            }
        })

        const jkKey = 'cheat_blackjack_joker'
        const jkEst = localStorage.getItem(jkKey)
        const jkTxt = addBtn(cx, cy + 15, 'Forzar Joker: ' + (jkEst ? 'SÍ' : 'NO'), () => {
            if (localStorage.getItem(jkKey)) {
                localStorage.removeItem(jkKey)
                jkTxt.setText('Forzar Joker: NO')
            } else {
                localStorage.setItem(jkKey, '1')
                jkTxt.setText('Forzar Joker: SÍ')
            }
        })

        addBtn(cx, cy + 50, 'CERRAR', tancar)
    }

    acabarJoc() {
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
