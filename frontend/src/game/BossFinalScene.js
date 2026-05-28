import Phaser from 'phaser'

const CARD_W = 109
const CARD_H = 148
const CARD_GAP = 107
const WORLD_W = 1672
const WORLD_H = 941

export default class BossFinalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossFinalScene' })
    }

    init(data) {
        this.nickname = data.nickname
        this.monedes = data.monedes
        this.dia = data.dia
        this.millores = data.millores
        this.equipats = [...(data.equipats || [])]
        this.inventari = [...(data.inventari || [])]
        this.capsulaPreu = data.capsulaPreu ?? 50
        this.playerHP = 5
        this.bossHP = 5
        this.ronda = 0
        this.cartesJugador = []
        this.cartesBoss = []
        this.fase = 1
        this.turno = 'jugador'
        this.bossQuemarUsada = false
        this.fin = false
    }

    SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades']
    RANKS = [
        { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
        { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
        { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 10 },
        { rank: 'J', value: 11 }, { rank: 'Q', value: 12 }, { rank: 'K', value: 13 },
        { rank: 'A', value: 14 },
    ]

    buildDeck() {
        const deck = []
        for (const suit of this.SUITS) {
            for (const r of this.RANKS) {
                deck.push({ ...r, suit, img: `card_${suit}_${r.rank}` })
            }
        }
        deck.push({ rank: '*', value: 15, suit: 'Joker', img: 'cardJoker' })
        Phaser.Utils.Array.Shuffle(deck)
        return deck
    }

    drawCard() {
        if (this.deck.length === 0) return null
        if (localStorage.getItem('cheat_joker_final')) {
            const idx = this.deck.findIndex(c => c.rank === '*')
            if (idx >= 0) return this.deck.splice(idx, 1)[0]
        }
        return this.deck.pop()
    }

    reshuffleDeck() {
        this.deck = this.buildDeck()
        this.drawDeckStack()
    }

    create() {
        localStorage.removeItem('cheat_joker_final')
        localStorage.removeItem('cheat_valor_final')
        localStorage.removeItem('cheat_quemar_final')
        const { width, height } = this.scale

        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
        this.fitCamera()

        this.add.image(0, 0, 'bossStage').setOrigin(0, 0).setDepth(0)
        this.afegirVinyeta()

        this.deck = this.buildDeck()
        this.deckX = 1400
        this.deckY = WORLD_H / 2
        this.drawDeckStack()

        this.bossLabel = this.add.text(825, 100, 'El Director', {
            fontSize: '20px', fill: '#ff8888', fontFamily: 'serif'
        }).setOrigin(0.5)

        this._crearCorazones()

        this.infoText = this.add.text(WORLD_W / 2, 310, '', {
            fontSize: '22px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5)

        this.btnRobar = this.addBtn(475, 490, 'ROBAR CARTA', 0x1a3d06, () => this.robarCarta())
        this.btnPlantar = this.addBtn(475, 590, 'PLANTARSE', 0x3d1a06, () => this.plantar())

        this.dialogBg = this.add.rectangle(WORLD_W / 2, WORLD_H - 65, WORLD_W * 0.8, 45, 0x0a0a1a, 0.85)
            .setDepth(50).setStrokeStyle(1, 0xc9a227).setVisible(false)
        this.dialogText = this.add.text(WORLD_W / 2, WORLD_H - 65, '', {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2, align: 'center'
        }).setOrigin(0.5).setDepth(51).setVisible(false)

        this.dibuixarEquipats()

        this.input.keyboard.on('keydown-P', (event) => {
            if (event.altKey) this.obrirCheats()
        })

        this.scale.on('resize', () => this.fitCamera())
    }

    fitCamera() {
        if (!this.cameras?.main) return
        const zoom = Math.min(this.scale.width / WORLD_W, this.scale.height / WORLD_H)
        this.cameras.main.setZoom(zoom)
        this.cameras.main.centerOn(WORLD_W / 2, WORLD_H / 2)
    }

    _crearCorazones() {
        const HS_BOSS = 16, GAP_BOSS = 0
        const HS_PLAYER = 22, GAP_PLAYER = 4
        this.playerHearts = []
        this.bossHearts = []

        const bStartX = 780
        const bY = 135
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(bStartX + i * (HS_BOSS + GAP_BOSS), bY, 'hp_0')
                .setDisplaySize(HS_BOSS, HS_BOSS).setDepth(5)
            this.bossHearts.push(h)
        }

        const pStartX = 1080
        const pY = 670
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(pStartX + i * (HS_PLAYER + GAP_PLAYER), pY, 'hp_0')
                .setDisplaySize(HS_PLAYER, HS_PLAYER).setDepth(5)
            this.playerHearts.push(h)
        }

        this._refrescarCorazones()
    }

    _refrescarCorazones() {
        for (let i = 0; i < 5; i++) {
            const bFull = i >= (5 - this.bossHP)
            this.bossHearts[i].setTexture(bFull ? 'hp_0' : 'hp_14')
        }
        for (let i = 0; i < 5; i++) {
            const pFull = i < this.playerHP
            this.playerHearts[i].setTexture(pFull ? 'hp_0' : 'hp_14')
        }
    }

    _cambiarHP(quien, delta) {
        if (delta < 0) this.sound.play('snd_damage')
        if (quien === 'jugador') {
            const oldHP = this.playerHP
            this.playerHP = Math.max(0, Math.min(5, this.playerHP + delta))
            if (delta < 0 && this.playerHP < oldHP) {
                const idx = this.playerHP
                if (idx >= 0 && idx < 5) this._animPerdidaJugador(idx)
            } else if (delta > 0 && this.playerHP > oldHP) {
                const idx = this.playerHP - 1
                if (idx >= 0 && idx < 5) this._animGananciaJugador(idx)
            }
        } else {
            const oldHP = this.bossHP
            this.bossHP = Math.max(0, Math.min(5, this.bossHP + delta))
            if (delta < 0 && this.bossHP < oldHP) {
                const idx = 5 - this.bossHP - 1
                if (idx >= 0 && idx < 5) this._animPerdidaBoss(idx)
            } else if (delta > 0 && this.bossHP > oldHP) {
                const idx = 5 - this.bossHP
                if (idx >= 0 && idx < 5) this._animGananciaBoss(idx)
            }
        }
    }

    _animPerdida(hearts, idx) {
        const h = hearts[idx]
        const cx = WORLD_W / 2
        const cy = WORLD_H / 2
        const fx = this.add.image(h.x, h.y, 'hp_0').setDisplaySize(28, 28).setDepth(6)

        this.tweens.add({
            targets: fx,
            x: cx, y: cy,
            scaleX: 3, scaleY: 3,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => {
                let frame = 0
                this.time.addEvent({
                    delay: 40,
                    repeat: 14,
                    callback: () => {
                        frame++
                        fx.setTexture(`hp_${frame}`)
                        if (frame === 14) {
                            this.tweens.add({
                                targets: fx,
                                alpha: 0,
                                duration: 300,
                                onComplete: () => {
                                    fx.destroy()
                                    this._refrescarCorazones()
                                }
                            })
                        }
                    }
                })
            }
        })
    }

    _animGanancia(hearts, idx) {
        const h = hearts[idx]
        const cx = WORLD_W / 2
        const cy = WORLD_H / 2
        const fx = this.add.image(cx, cy, 'hp_14').setDisplaySize(28, 28).setDepth(6).setAlpha(0)

        this.tweens.add({ targets: fx, alpha: 1, duration: 200 })

        let frame = 14
        this.time.addEvent({
            delay: 40,
            repeat: 14,
            callback: () => {
                frame--
                fx.setTexture(`hp_${frame}`)
                if (frame === 0) {
                    this.tweens.add({
                        targets: fx,
                        x: h.x, y: h.y,
                        scaleX: 1, scaleY: 1,
                        duration: 400,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            fx.destroy()
                            this._refrescarCorazones()
                        }
                    })
                }
            }
        })
    }

    _animPerdidaBoss(idx) {
        this._animPerdida(this.bossHearts, idx)
    }

    _animPerdidaJugador(idx) {
        this._animPerdida(this.playerHearts, idx)
    }

    _animGananciaBoss(idx) {
        this._animGanancia(this.bossHearts, idx)
    }

    _animGananciaJugador(idx) {
        this._animGanancia(this.playerHearts, idx)
    }

    _refrescarTextos() {
    }

    _actualizarFase() {
        const nueva = this.bossHP >= 3 ? 1 : this.bossHP === 2 ? 2 : 3
        if (nueva !== this.fase) {
            this.fase = nueva

            if (this.fase === 2) {
                this._mostrarDialogo('Las luces del casino se tiñen de rojo...', 2000)
            } else if (this.fase === 3) {
                this._mostrarDialogo('"¡Has llegado lejos, prisionero! ¡Pero esto se acaba aquí!"', 3000)
            }
        }
    }

    _mostrarDialogo(msg, duration) {
        this.dialogBg.setVisible(true)
        this.dialogText.setVisible(true)
        this.dialogText.setText(msg)
        this.time.delayedCall(duration || 2500, () => {
            this.dialogBg.setVisible(false)
            this.dialogText.setVisible(false)
        })
    }

    addBtn(x, y, text, color, callback) {
        const btn = this.add.rectangle(x, y, 160, 48, color)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xc9a227)
        btn._btnText = this.add.text(x, y, text, {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif'
        }).setOrigin(0.5)
        btn.on('pointerdown', callback)
        btn.on('pointerover', () => btn.setStrokeStyle(2, 0xffd700))
        btn.on('pointerout', () => btn.setStrokeStyle(1, 0xc9a227))
        return btn
    }

    _setBotonesActivos(activo) {
        if (activo) {
            this.btnRobar.setInteractive({ useHandCursor: true })
            this.btnPlantar.setInteractive({ useHandCursor: true })
        } else {
            this.btnRobar.disableInteractive()
            this.btnPlantar.disableInteractive()
        }
    }

    _vibrarBtn(btn) {
        if (btn._vibrando) return
        btn._vibrando = true
        const origX = btn.x
        this.tweens.add({
            targets: btn,
            x: origX - 4,
            duration: 35,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                btn.x = origX
                btn._vibrando = false
            }
        })
    }

    robarCarta() {
        if (this.turno !== 'jugador' || this.fin) return

        if (this.cartesJugador.length >= 7) {
            this._vibrarBtn(this.btnRobar)
            this.infoText.setText('¡Máximo 7 cartas!').setFill('#ff8844')
            this.time.delayedCall(1200, () => this.infoText.setText(''))
            return
        }

        const carta = this.drawCard()
        if (!carta) {
            this.infoText.setText('Mazo vacío. Te plantas forzado.')
            this.time.delayedCall(800, () => this.plantar())
            return
        }

        this.cartesJugador.push(carta)
        this.drawDeckStack()

        const jugadorY = 675
        const i = this.cartesJugador.length - 1
        const tx = this.getCardX(this.cartesJugador.length, i)

        // [HOOK] flyCardTo con animación de cartas
        this.flyCardTo(carta.img, tx, jugadorY)
        this.sound.play('snd_player')

        if (carta.rank === '*') {
            this._curarJugador()
            // [HOOK] animación Joker: fuego verde/dorado, sonido único
            this.infoText.setText('¡JOKER! +1\u2665').setFill('#00ff88')
            this.time.delayedCall(600, () => this.infoText.setText(''))
        }
    }

    plantar() {
        if (this.turno !== 'jugador' || this.fin) return

        this.turno = 'boss'
        this._setBotonesActivos(false)

        if (this.cartesJugador.length === 0) {
            this.cartesJugador.push({ rank: '?', value: 0, suit: 'none', img: 'cardBack' })
        }

        this.infoText.setText('El Director juega...')
        this.time.delayedCall(1000, () => this._turnoBoss())
    }

    _turnoBoss() {
        this.cartesBoss = []

        this._bossDrawLoop()
    }

    _bossDrawLoop() {
        this._revelarCartaPrevia()

        const carta = this.drawCard()
        if (!carta) {
            if (this.cartesBoss.length === 0) {
                this.cartesBoss.push({ rank: '?', value: 0, suit: 'none', img: 'bossCardBack' })
            }
            this._revelarCartasBoss()
            this.time.delayedCall(500, () => this._resolverRonda())
            return
        }

        this.cartesBoss.push(carta)
        this.drawDeckStack()

        const bossY = 425
        const i = this.cartesBoss.length - 1
        const tx = this.getCardX(this.cartesBoss.length, i)

        this.flyCardTo('bossCardBack', tx, bossY, 'boss-card')
        this.sound.play('snd_boss')

        if (carta.rank === '*') {
            this._curarBoss()
        }

        if (carta.value >= 14) {
            this.infoText.setText('El Director se planta.')
            this.time.delayedCall(800, () => {
                this._revelarCartasBoss()
                this.time.delayedCall(1000, () => this._resolverRonda())
            })
            return
        }

        if (this.cartesBoss.length >= 4) {
            this.infoText.setText('El Director se planta.')
            this.time.delayedCall(800, () => {
                this._revelarCartasBoss()
                this.time.delayedCall(1000, () => this._resolverRonda())
            })
            return
        }

        const playerVal = this.cartesJugador.length > 0
            ? this.cartesJugador[this.cartesJugador.length - 1].value : 0

        if (carta.value === playerVal) {
            this.infoText.setText('El Director se planta.')
            this.time.delayedCall(800, () => {
                this._revelarCartasBoss()
                this.time.delayedCall(1000, () => this._resolverRonda())
            })
            return
        }

        if (carta.value < playerVal) {
            this.time.delayedCall(500, () => this._bossDrawLoop())
            return
        }

        this.infoText.setText('El Director se planta.')
        this.time.delayedCall(800, () => {
            this._revelarCartasBoss()
            this.time.delayedCall(1000, () => this._resolverRonda())
        })
    }

    _revelarCartaPrevia() {
        if (this.cartesBoss.length === 0) return
        const prevSprite = this.children.list.find(
            c => c.getData && c.getData('tag') === 'boss-card'
        )
        if (!prevSprite) return
        const carta = this.cartesBoss[this.cartesBoss.length - 1]
        this.tweens.add({
            targets: prevSprite,
            displayWidth: 0,
            duration: 150,
            onComplete: () => {
                prevSprite.setTexture(carta.img)
                prevSprite.setDisplaySize(CARD_W, CARD_H)
                prevSprite.setData('tag', 'boss-card-revealed')
                this.tweens.add({
                    targets: prevSprite,
                    displayWidth: CARD_W,
                    duration: 150
                })
            }
        })
    }

    _revelarCartasBoss() {
        const bossCards = this.children.list.filter(
            c => c.getData && c.getData('tag') === 'boss-card'
        )
        const ultima = this.cartesBoss[this.cartesBoss.length - 1]
        if (ultima) {
            this._mostrarDialogo(`El Director revela: ${ultima.value}`, 1500)
        }
        bossCards.forEach((c) => {
            const idx = this.cartesBoss.length - 1
            if (idx >= 0 && idx < this.cartesBoss.length) {
                this.tweens.add({
                    targets: c,
                    displayWidth: 0,
                    duration: 150,
                    onComplete: () => {
                        c.setTexture(this.cartesBoss[idx].img)
                        c.setDisplaySize(CARD_W, CARD_H)
                        c.setData('tag', 'boss-card-revealed')
                        this.tweens.add({
                            targets: c,
                            displayWidth: CARD_W,
                            duration: 150
                        })
                    }
                })
            }
        })
    }

    _resolverRonda() {
        let jVal = this.cartesJugador.length > 0
            ? this.cartesJugador[this.cartesJugador.length - 1].value : 0
        let bVal = this.cartesBoss.length > 0
            ? this.cartesBoss[this.cartesBoss.length - 1].value : 0

        const forcarQuemar = localStorage.getItem('cheat_quemar_final')
        if (jVal > bVal && (this.bossHP === 1 || forcarQuemar) && (!this.bossQuemarUsada || forcarQuemar)) {
            this.bossQuemarUsada = true
            this._habilidadQuemar()
            return
        }

        if (jVal > bVal && Math.random() < 0.35) {
            const ultimaBoss = this.cartesBoss[this.cartesBoss.length - 1]
            const jCards = this.children.list.filter(
                c => c.getData && c.getData('carta') && c.y > WORLD_H / 2
            )
            const lastPlayerCard = jCards.length > 0 ? jCards[jCards.length - 1] : null
            const bCards = this.children.list.filter(
                c => c.getData && (c.getData('tag') === 'boss-card' || c.getData('tag') === 'boss-card-revealed')
            )
            const lastBossCard = bCards.length > 0 ? bCards[bCards.length - 1] : null

            if (ultimaBoss && lastPlayerCard && lastBossCard) {
                this._animPipa(lastBossCard, lastPlayerCard, ultimaBoss, bVal)
                return
            }
            this._mostrarAlerta('"El Director fuma su pipa... el humo rodea tus cartas." — ¡Empate!', 2500)
            this._aplicarResultado(bVal, bVal)
            return
        }

        this._aplicarResultado(jVal, bVal)
    }

    _mostrarAlerta(msg, duration) {
        const cx = WORLD_W / 2
        const cy = WORLD_H / 2
        const padX = 30
        const padY = 18

        const tempTxt = this.add.text(0, 0, msg, {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3, align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5)

        const tw = tempTxt.width + padX * 2
        const th = tempTxt.height + padY * 2
        tempTxt.destroy()

        const bg = this.add.rectangle(cx, cy, tw, th, 0x000000, 0.85)
            .setDepth(60).setStrokeStyle(2, 0xc9a227).setScrollFactor(0)
        const txt = this.add.text(cx, cy, msg, {
            fontSize: '18px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3, align: 'center',
            wordWrap: { width: 500 }
        }).setOrigin(0.5).setDepth(61).setScrollFactor(0)

        this.time.delayedCall(duration, () => {
            bg.destroy()
            txt.destroy()
        })
    }

    _animPipa(bossCard, playerCard, bossData, bVal) {
        this.sound.play('snd_smoke')
        this._mostrarAlerta('"El Director fuma su pipa... el humo rodea tus cartas."', 2500)

        const overlayBoss = this.add.rectangle(
            bossCard.x, bossCard.y, CARD_W, CARD_H, 0x888888, 0.65
        ).setDepth(7)

        this.tweens.add({ targets: overlayBoss, alpha: 0.1, duration: 100, yoyo: true, repeat: 1,
            onComplete: () => {
                overlayBoss.destroy()

                const overlayPlayer = this.add.rectangle(
                    playerCard.x, playerCard.y, CARD_W, CARD_H, 0x888888, 0.65
                ).setDepth(7)

                this.tweens.add({ targets: overlayPlayer, alpha: 0.1, duration: 100, yoyo: true, repeat: 1,
                    onComplete: () => {
                        const flash = this.add.rectangle(
                            playerCard.x, playerCard.y, CARD_W, CARD_H, 0xffffff, 1
                        ).setDepth(8)

                        playerCard.setTexture(bossData.img)
                        playerCard.setDisplaySize(CARD_W, CARD_H)
                        overlayPlayer.destroy()

                        this.tweens.add({
                            targets: flash,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => {
                                flash.destroy()
                                this._aplicarResultado(bVal, bVal)
                            }
                        })
                    }
                })
            }
        })
    }

    _aplicarResultado(jVal, bVal) {
        let resultado = ''
        if (jVal > bVal) {
            this._cambiarHP('boss', -1)
            resultado = `GANAS esta ronda! (${jVal} vs ${bVal})`
            this.infoText.setText(resultado).setFill('#00ff88')
        } else if (bVal > jVal) {
            this._cambiarHP('jugador', -1)
            resultado = `PIERDES esta ronda. (${jVal} vs ${bVal})`
            this.infoText.setText(resultado).setFill('#ff4444')
        } else {
            resultado = `EMPATE! (${jVal} vs ${bVal})`
            this.infoText.setText(resultado).setFill('#c9a227')
        }

        this._actualizarFase()

        if (this.playerHP <= 0) {
            this.time.delayedCall(1500, () => this._mostrarGameOver())
            return
        }
        if (this.bossHP <= 0) {
            this.time.delayedCall(1500, () => this._mostrarVictoria())
            return
        }

        this.time.delayedCall(4000, () => {
            this.ronda++
            this.infoText.setText('')
            this.turno = 'jugador'

            this.children.list
                .filter(c => c.getData && c.getData('carta'))
                .forEach(c => c.destroy())

            this.cartesJugador = []
            this.cartesBoss = []

            this.reshuffleDeck()
            this._setBotonesActivos(true)
        })
    }

    _curarJugador() {
        if (this.playerHP < 5) {
            this._cambiarHP('jugador', 1)
        }
    }

    _curarBoss() {
        if (this.bossHP < 5) {
            this._cambiarHP('boss', 1)
        }
    }

    _habilidadQuemar() {
        this.sound.play('snd_burn')
        this._mostrarAlerta('"¡Esta partida no ha terminado!" — ¡El Director quema tu carta!', 3000)

        if (this.cartesJugador.length >= 2) {
            const jCards = this.children.list.filter(
                c => c.getData && c.getData('carta') && c.y > WORLD_H / 2
            )
            const lastCardSprite = jCards.length > 0 ? jCards[jCards.length - 1] : null
            this.cartesJugador.pop()
            const nuevaVal = this.cartesJugador[this.cartesJugador.length - 1].value

            const afterEffect = () => {
                this.children.list
                    .filter(c => c.getData && c.getData('carta') && c.y > WORLD_H / 2)
                    .forEach(c => c.destroy())

                const jugadorY = 675
                for (let i = 0; i < this.cartesJugador.length; i++) {
                    const tx = this.getCardX(this.cartesJugador.length, i)
                    this.flyCardTo(this.cartesJugador[i].img, tx, jugadorY)
                }

                this.time.delayedCall(3200, () => {
                    const jVal = nuevaVal
                    const bVal = this.cartesBoss.length > 0
                        ? this.cartesBoss[this.cartesBoss.length - 1].value : 0
                    this._aplicarResultado(jVal, bVal)
                })
            }

            if (lastCardSprite) {
                const redFlash = this.add.rectangle(
                    lastCardSprite.x, lastCardSprite.y, CARD_W, CARD_H, 0xff0000, 0.6
                ).setDepth(8)

                this.tweens.add({
                    targets: redFlash, alpha: 0,
                    duration: 200, yoyo: true, repeat: 1,
                    onComplete: () => {
                        redFlash.destroy()
                        const orangeFlash = this.add.rectangle(
                            lastCardSprite.x, lastCardSprite.y, CARD_W, CARD_H, 0xff8800, 0.7
                        ).setDepth(8)

                        this.tweens.add({
                            targets: orangeFlash, alpha: 0,
                            duration: 200, yoyo: true, repeat: 1,
                            onComplete: () => {
                                orangeFlash.destroy()
                                const blackFlash = this.add.rectangle(
                                    lastCardSprite.x, lastCardSprite.y, CARD_W, CARD_H, 0x000000, 1
                                ).setDepth(9)

                                this.tweens.add({
                                    targets: lastCardSprite,
                                    alpha: 0, scaleX: 0.5, scaleY: 0.5,
                                    duration: 400,
                                    onComplete: () => {
                                        blackFlash.destroy()
                                        afterEffect()
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                afterEffect()
            }
        } else {
            this._cambiarHP('jugador', -1)
            this.infoText.setText('¡Solo tenías una carta... quemada! -1\u2665').setFill('#ff4444')

            if (this.playerHP <= 0) {
                this.time.delayedCall(3000, () => this._mostrarGameOver())
                return
            }

            this.time.delayedCall(3200, () => {
                this.ronda++
                this.infoText.setText('')
                this.turno = 'jugador'

                this.children.list
                    .filter(c => c.getData && c.getData('carta'))
                    .forEach(c => c.destroy())

                this.cartesJugador = []
                this.cartesBoss = []

                this.reshuffleDeck()
                this._setBotonesActivos(true)
            })
        }
    }

    _mostrarGameOver() {
        this.fin = true
        this._setBotonesActivos(false)
        const { width, height } = this.scale

        const overlay = this.add.rectangle(width / 2, height / 2, width * 3, height * 3, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0)
        const bg = this.add.rectangle(width / 2, height / 2, 380, 260, 0x0d0a06, 0.95)
            .setDepth(101).setStrokeStyle(2, 0xff4444).setScrollFactor(0)

        const txt = this.add.text(width / 2, height / 2 - 60, 'DERROTA', {
            fontSize: '40px', fill: '#ff4444', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0)

        const sub = this.add.text(width / 2, height / 2 - 10, 'El casino te ha atrapado para siempre.', {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0)

        const btnReset = this.add.text(width / 2, height / 2 + 50, 'REINICIAR', {
            fontSize: '20px', fill: '#ffd700', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 24, y: 8 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true }).setScrollFactor(0)
        btnReset.on('pointerover', () => btnReset.setFill('#ffffff'))
        btnReset.on('pointerout', () => btnReset.setFill('#ffd700'))
        btnReset.on('pointerdown', () => this._resetRun())

        const btnSortir = this.add.text(width / 2, height / 2 + 100, 'CERRAR SESIÓN', {
            fontSize: '16px', fill: '#ff6666', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 20, y: 6 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true }).setScrollFactor(0)
        btnSortir.on('pointerover', () => btnSortir.setFill('#ff0000'))
        btnSortir.on('pointerout', () => btnSortir.setFill('#ff6666'))
        btnSortir.on('pointerdown', () => this._logout())
    }

    _mostrarVictoria() {
        this.fin = true
        this._setBotonesActivos(false)
        const { width, height } = this.scale

        const overlay = this.add.rectangle(width / 2, height / 2, width * 3, height * 3, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0)
        const bg = this.add.rectangle(width / 2, height / 2, 380, 260, 0x0d0a06, 0.95)
            .setDepth(101).setStrokeStyle(2, 0x00ff88).setScrollFactor(0)

        const txt = this.add.text(width / 2, height / 2 - 60, 'VICTORIA', {
            fontSize: '40px', fill: '#00ff88', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0)

        const sub = this.add.text(width / 2, height / 2 - 10, 'Has escapado del casino. Eres libre.', {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0)

        const btnReset = this.add.text(width / 2, height / 2 + 50, 'NUEVA PARTIDA', {
            fontSize: '20px', fill: '#ffd700', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 24, y: 8 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true }).setScrollFactor(0)
        btnReset.on('pointerover', () => btnReset.setFill('#ffffff'))
        btnReset.on('pointerout', () => btnReset.setFill('#ffd700'))
        btnReset.on('pointerdown', () => this._resetRun())

        const btnSortir = this.add.text(width / 2, height / 2 + 100, 'CERRAR SESIÓN', {
            fontSize: '16px', fill: '#ff6666', fontFamily: 'serif',
            backgroundColor: '#1a120888', padding: { x: 20, y: 6 },
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true }).setScrollFactor(0)
        btnSortir.on('pointerover', () => btnSortir.setFill('#ff0000'))
        btnSortir.on('pointerout', () => btnSortir.setFill('#ff6666'))
        btnSortir.on('pointerdown', () => this._logout())
    }

    _resetRun() {
        const uid = localStorage.getItem('uid') || 'anonim'
        localStorage.setItem('irongate_reset', '1')
        localStorage.removeItem(`irongate_save_${uid}`)
        const onCompletat = (ev) => {
            if (ev.detail && ev.detail.ok) localStorage.removeItem('irongate_reset')
            window.removeEventListener('sincronitzacio-completada', onCompletat)
            window.location.reload()
        }
        window.addEventListener('sincronitzacio-completada', onCompletat)
        this.events.once('shutdown', () => window.removeEventListener('sincronitzacio-completada', onCompletat))
        window.dispatchEvent(new CustomEvent('sincronitzar-jugador', {
            detail: { monedes: 400, diaActual: 1, millores: [] }
        }))
        this.time.delayedCall(4000, () => {
            window.removeEventListener('sincronitzacio-completada', onCompletat)
            window.location.reload()
        })
    }

    _logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('uid')
        localStorage.removeItem('jugadorId')
        window.location.reload()
    }

    obrirCheats() {
        const { width, height } = this.scale
        const cx = width / 2, cy = height / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7)
            .setDepth(200).setScrollFactor(0)
        const bg = this.add.rectangle(cx, cy, 300, 250, 0x0d0a06, 0.95).setDepth(201)
            .setStrokeStyle(2, 0x88ff88).setScrollFactor(0)

        const tancar = () => {
            overlay.destroy(); bg.destroy()
            this.children.list.filter(c => c.depth >= 200).forEach(c => c.destroy())
        }

        const addTxt = (x, y, txt, s, c) =>
            this.add.text(x, y, txt, { fontSize: s || '14px', fill: c || '#88ff88', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(203).setScrollFactor(0)

        const addBtn = (x, y, txt, cb) => {
            const t = this.add.text(x, y, txt, { fontSize: '13px', fill: '#ffd700', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1a0a88', padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setDepth(203).setInteractive({ useHandCursor: true }).setScrollFactor(0)
            t.on('pointerover', () => t.setFill('#ffffff'))
            t.on('pointerout', () => t.setFill('#ffd700'))
            t.on('pointerdown', cb)
            return t
        }

        addTxt(cx, cy - 70, 'TRUCOS DUELO FINAL', '15px', '#88ff88')

        const jkKey = 'cheat_joker_final'
        const jkEst = localStorage.getItem(jkKey)
        const jkTxt = addBtn(cx, cy - 30, 'Forzar Joker: ' + (jkEst ? 'SÍ' : 'NO'), () => {
            if (localStorage.getItem(jkKey)) {
                localStorage.removeItem(jkKey)
                jkTxt.setText('Forzar Joker: NO')
            } else {
                localStorage.setItem(jkKey, '1')
                jkTxt.setText('Forzar Joker: SÍ')
            }
        })

        const vKey = 'cheat_valor_final'
        const vEst = localStorage.getItem(vKey)
        const vTxt = addBtn(cx, cy, 'Forzar valor: ' + (vEst || '---'), () => {
            const v = window.prompt('Valor de la próxima carta (2-15):')
            if (v) localStorage.setItem(vKey, v)
            else localStorage.removeItem(vKey)
            vTxt.setText('Forzar valor: ' + (v || '---'))
        })

        const qtKey = 'cheat_quemar_final'
        const qtEst = localStorage.getItem(qtKey)
        const qtTxt = addBtn(cx, cy + 40, 'Forzar Quemar: ' + (qtEst ? 'SÍ' : 'NO'), () => {
            if (localStorage.getItem(qtKey)) {
                localStorage.removeItem(qtKey)
                qtTxt.setText('Forzar Quemar: NO')
            } else {
                localStorage.setItem(qtKey, '1')
                qtTxt.setText('Forzar Quemar: SÍ')
            }
        })

        addBtn(cx, cy + 80, 'CERRAR', tancar)
    }

    getCardX(count, i) {
        const totalW = (count - 1) * CARD_GAP
        return 830 - totalW / 2 + i * CARD_GAP
    }

    flyCardTo(key, tx, ty, dataTag) {
        const img = this.add.image(this.deckX, this.deckY, key)
            .setDisplaySize(CARD_W, CARD_H).setData('carta', true).setAlpha(0.6)
        this.tweens.add({
            targets: img, x: tx, y: ty, alpha: 1, duration: 250, ease: 'Power2'
        })
        if (dataTag) img.setData('tag', dataTag)
        return img
    }

    drawDeckStack() {
        this.children.list
            .filter(c => c.getData && c.getData('deckStack'))
            .forEach(c => c.destroy())
        const n = Math.min(4, this.deck.length)
        for (let i = 0; i < n; i++) {
            this.add.image(this.deckX - i * 2, this.deckY - i * 2, 'bossCardBack')
                .setDisplaySize(CARD_W, CARD_H).setData('deckStack', true).setDepth(0)
        }
    }

    afegirVinyeta() {
        const rt = this.add.renderTexture(0, 0, WORLD_W, WORLD_H).setDepth(1)
        rt.fill(0x000000, 0.55)
        const circ = this.make.graphics({ add: false })
        circ.fillStyle(0xffffff)
        circ.fillCircle(0, 0, 260)
        circ.generateTexture('spot_final', 520, 520)
        circ.destroy()
        const eraser = this.add.image(WORLD_W / 2, WORLD_H / 2 - 40, 'spot_final').setVisible(false)
        rt.erase(eraser, WORLD_W / 2, WORLD_H / 2 - 40)
        eraser.destroy()
    }

    dibuixarEquipats() {
        const items = (this.equipats || []).filter(Boolean)
        if (items.length === 0) return
        const startX = 90
        const y = 90
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const x = startX + i * 90
            const cor = item.raresa === 'legendario' ? '#ff8800'
                : item.raresa === 'épico' ? '#cc44ff'
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
        if (!ef) return 'Sin efecto'
        const m = {
            bonus_guany: `+${Math.round(ef.valor * 100)}% ganancias`,
            reduccio_perdua: `-${Math.round(ef.valor * 100)}% pérdidas`,
            prob_guany_ruleta: `+${Math.round(ef.valor * 100)}% prob ruleta`,
            prob_jackpot_slots: `+${Math.round(ef.valor * 100)}% jackpot`,
            prob_guany_moneda: `+${Math.round(ef.valor * 100)}% prob moneda`,
            prob_joker: `+${Math.round(ef.valor * 100)}% prob comodín`,
            as_seguro: 'As=11 siempre',
            carta_extra: '+1 carta máx',
            ronda_extra: '+1 ronda',
            monedes_extra: `+${ef.valor}$ inicio`,
            revelar_crupier: 'Revela carta',
            anular_perdua: 'Anula 1 pérdida',
            doble_aposta: 'Duplica apuesta',
        }
        return `${item.raresa || '?'}: ${m[ef.tipus] || ef.tipus}`
    }
}
