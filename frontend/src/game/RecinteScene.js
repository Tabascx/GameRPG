import Phaser from 'phaser'

export default class RecinteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RecinteScene' })
    }

    init(data) {
        this.nickname = data.nickname || 'Presoner'
        this.monedes = data.monedes ?? 400
        this.dia = data.dia ?? 1
        this.millores = data.millores || []
        this.inventari = data.inventari || []
    }

    create() {
        const { width, height } = this.scale
        const T = 32
        const COLS = 13
        const ROWS = 10
        const worldW = COLS * T
        const worldH = ROWS * T

        this.physics.world.setBounds(0, 0, worldW, worldH)

        // ── MAPA (sprites pixel-art) ──
        const portonCol = Math.floor(COLS / 2)   // 6
        const cCol = portonCol
        const cRow = 2

        // 1. Sòl
        this.add.tileSprite(T, T, worldW - T * 2, worldH - T * 2, 'ground')

        // 2. Muralles (tileSprite per trams)
        const addWall = (x, y, w, h) => this.add.tileSprite(x, y, w, h, 'wall')
        addWall(0, 0, worldW, T)
        addWall(0, worldH - T, portonCol * T, T)
        addWall((portonCol + 1) * T, worldH - T, (COLS - portonCol - 1) * T, T)
        addWall(worldW - T, 0, T, worldH)
        addWall(0, 0, T, worldH)

        // 3. Camí central (del portó al casino)
        for (let row = 4; row < ROWS - 1; row++) {
            this.add.tileSprite((portonCol - 1) * T, row * T, T * 3, T, 'path')
        }

        // 4. Edificis
        const casinoX = cCol * T
        const casinoY = cRow * T + 32
        this.add.image(casinoX, casinoY, 'casino').setDepth(5)
        this.add.text(casinoX, casinoY - 32, 'CASINO', {
            fontSize: '9px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10)

        const botigaX = 2 * T
        const botigaY = 5 * T
        this.add.image(botigaX, botigaY, 'botiga').setDepth(5)
        this.add.text(botigaX, botigaY - 28, 'BOTIGA', {
            fontSize: '8px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10)

        const forjaX = (COLS - 3) * T
        const forjaY = 5 * T
        this.add.image(forjaX, forjaY, 'forja').setDepth(5)
        this.add.text(forjaX, forjaY - 28, 'FORJA', {
            fontSize: '8px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10)

        // 5. Arbres (vora les muralles)
        const arbres = [[1, 1], [COLS - 2, 1], [1, ROWS - 2], [COLS - 2, ROWS - 2]]
        for (const [ax, ay] of arbres) {
            this.add.image(ax * T + T / 2, ay * T + T / 2, 'tree').setDepth(5)
        }

        // 6. Portó
        this.add.image(portonCol * T + T / 2, worldH - T / 2, 'gate')

        // ── JUGADOR (sprite animat) ──
        this.player = this.add.sprite(portonCol * T, (ROWS - 2) * T, 'player_0')
        this.player.setDepth(15)

        // Animació de caminar
        if (!this.anims.exists('player_walk')) {
            this.anims.create({
                key: 'player_walk',
                frames: [
                    { key: 'player_0' },
                    { key: 'player_1' },
                    { key: 'player_2' },
                ],
                frameRate: 7,
                repeat: -1
            })
        }

        this.physics.add.existing(this.player)
        this.player.body.setSize(10, 10)
        this.player.body.setOffset(3, 12)
        this.player.body.setCollideWorldBounds(true)

        // ── MURS (zones de col·lisió invisibles) ──
        this.walls = this.physics.add.staticGroup()
        this.walls.add(this.add.zone(worldW / 2, T / 2, worldW, T))
        this.walls.add(this.add.zone(portonCol * T / 2, worldH - T / 2, portonCol * T, T))
        const rightW = (COLS - portonCol - 1) * T
        this.walls.add(this.add.zone((portonCol + 1) * T + rightW / 2, worldH - T / 2, rightW, T))
        this.walls.add(this.add.zone(worldW - T / 2, worldH / 2, T, worldH))
        this.walls.add(this.add.zone(T / 2, worldH / 2, T, worldH))

        this.physics.add.collider(this.player, this.walls)

        // ── CÀMERA (estàtica, mostra tot el món centrat) ──
        this.fitCamera()
        this.scale.on('resize', () => this.fitCamera())

        // ── INPUT ──
        this.cursors = this.input.keyboard.createCursorKeys()
        this.wasd = {
            W: this.input.keyboard.addKey('W'),
            A: this.input.keyboard.addKey('A'),
            S: this.input.keyboard.addKey('S'),
            D: this.input.keyboard.addKey('D'),
            E: this.input.keyboard.addKey('E'),
        }

        // Easter egg: Alt+P → menú de trucs
        this.input.keyboard.on('keydown-P', (event) => {
            if (event.altKey && !this.menuOpen) this.obrirCheats()
        })

        // ── ZONES ──
        this.zones = [
            { x: cCol * T, y: (cRow + 1) * T + 8, label: 'Casino', action: 'casino' },
            { x: 2 * T, y: 6 * T, label: 'Botiga', action: 'shop' },
            { x: (COLS - 3) * T, y: 6 * T, label: 'Forja', action: 'items' },
        ]
        this.activeZone = null
        this.menuOpen = false

        // ── PROMPT ──
        this.promptBg = this.add.rectangle(0, 0, 100, 20, 0x000000, 0.6).setDepth(15).setVisible(false).setScrollFactor(0)
        this.promptText = this.add.text(0, 0, '', {
            fontSize: '15px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(16).setVisible(false).setScrollFactor(0)

        // ── HUD ──
        const hudW = Math.max(width, 800)
        this.add.tileSprite(0, 0, hudW, 44, 'hud_bg').setScrollFactor(0).setDepth(20)

        this.hudTitle = this.add.text(12, 12, 'IRON GATE', {
            fontSize: '14px', fill: '#c9a227', fontFamily: 'serif', fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(21)

        this.hudMon = this.add.text(180, 12, `${this.monedes}$`, {
            fontSize: '14px', fill: '#ffd700', fontFamily: 'serif'
        }).setScrollFactor(0).setDepth(21)

        this.hudDia = this.add.text(320, 12, `Dia ${this.dia}`, {
            fontSize: '14px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setScrollFactor(0).setDepth(21)

        this.hudItems = this.add.text(440, 12, `Millores: ${this.millores.length}`, {
            fontSize: '14px', fill: '#88ff88', fontFamily: 'serif'
        }).setScrollFactor(0).setDepth(21)

        this.hudNom = this.add.text(620, 12, this.nickname, {
            fontSize: '14px', fill: '#c9a227', fontFamily: 'serif'
        }).setScrollFactor(0).setDepth(21)

        // Escoltar actualitzacions de perfil (compres des de la botiga)
        this._perfilHandler = (e) => {
            const p = e.detail
            this.monedes = p.monedes
            this.millores = p.millores || []
            this.inventari = p.inventari || []
            this.hudMon.setText(`${this.monedes}$`)
            this.hudItems.setText(`Millores: ${this.millores.length}`)
        }
        window.addEventListener('perfil-updated', this._perfilHandler)

        this.events.on('shutdown', () => {
            window.removeEventListener('perfil-updated', this._perfilHandler)
            window.removeEventListener('perfil-updated', this._shopUpdateHandler)
        })
    }

    fitCamera() {
        const { width, height } = this.scale
        const worldW = 13 * 32
        const worldH = 10 * 32
        const zoom = Math.min(width / worldW, height / worldH)
        this.cameras.main.setZoom(zoom)
        this.cameras.main.centerOn(worldW / 2, worldH / 2)
    }

    update() {
        if (this.menuOpen) {
            this.player.body.setVelocity(0, 0)
            if (Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
                this._tancarMenu()
            }
            return
        }

        // Evitar reobrir just després de tancar (mateixa pulsació)
        if (this._menuClosedAt && Date.now() - this._menuClosedAt < 200) return

        // MOVIMENT + ANIMACIÓ
        const vx = (this.wasd.A.isDown || this.cursors.left.isDown) ? -1
            : (this.wasd.D.isDown || this.cursors.right.isDown) ? 1 : 0
        const vy = (this.wasd.W.isDown || this.cursors.up.isDown) ? -1
            : (this.wasd.S.isDown || this.cursors.down.isDown) ? 1 : 0
        this.player.body.setVelocity(vx * 160, vy * 160)

        const moving = vx !== 0 || vy !== 0
        if (moving && !this.player.anims.isPlaying) {
            this.player.play('player_walk')
        } else if (!moving && this.player.anims.isPlaying) {
            this.player.stop()
            this.player.setTexture('player_0')
        }

        // PROXIMITAT
        this.activeZone = null
        for (const zone of this.zones) {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y) < 50) {
                this.activeZone = zone
                break
            }
        }

        if (this.activeZone && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
            this.obrirMenu(this.activeZone)
        }

        this.promptText.setVisible(!!this.activeZone)
        this.promptBg.setVisible(!!this.activeZone)
        if (this.activeZone) {
            const cam = this.cameras.main
            const sx = (this.player.x - cam.scrollX) * cam.zoom
            const sy = (this.player.y - cam.scrollY - 26) * cam.zoom
            this.promptText.setPosition(sx, sy)
            this.promptText.setText(`${this.activeZone.label} [E]`)
            this.promptBg.setPosition(sx, sy)
            this.promptBg.setSize(this.promptText.width + 16, 20)
        }
    }

    obrirMenu(zone) {
        this.menuOpen = true
        this.player.body.setVelocity(0, 0)

        if (zone.action === 'casino') {
            this.cameras.main.fade(400, 0, 0, 0)
            this.time.delayedCall(400, () => {
                this.scene.start('CasinoScene', {
                    nickname: this.nickname,
                    monedes: this.monedes,
                    dia: this.dia,
                    millores: this.millores
                })
            })
            return
        }

        // Menú cascada transparent (scrollFactor=0 = sense zoom)
        const { width, height } = this.scale
        const cx = width / 2
        const cy = height / 2
        const SF = 0

        const isShop = zone.action === 'shop'
        const bgW = isShop ? 380 : 280
        const bgH = isShop ? 260 : 220
        const halfW = bgW / 2
        const halfH = bgH / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50).setScrollFactor(SF)
        const bg = this.add.rectangle(cx, cy, bgW, bgH, 0x1a1208, 0.92).setDepth(51)
            .setStrokeStyle(2, 0xc9a227).setScrollFactor(SF)

        const tancarMenu = () => {
            overlay.destroy()
            bg.destroy()
            this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy())
            this.menuContent = null
            this.menuOpen = false
            this._menuClosedAt = Date.now()
            window.removeEventListener('perfil-updated', this._shopUpdateHandler)
        }
        this._tancarMenu = tancarMenu

        // Contenidor per al contingut del menú (per poder fer rebuild)
        this.menuContent = this.add.container(0, 0).setDepth(52)
        const mc = this.menuContent

        // Creu tancar (dreta superior, dins del marc)
        const closeBtn = this.add.text(cx + halfW - 14, cy - halfH + 12, '✕', {
            fontSize: '16px', fill: '#ff6666', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(53).setInteractive({ useHandCursor: true }).setScrollFactor(SF)

        const tipClose = this.add.text(closeBtn.x - 52, closeBtn.y, 'Tancar', {
            fontSize: '12px', fill: '#ffffff', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1208cc',
            padding: { x: 6, y: 2 }
        }).setOrigin(1, 0.5).setDepth(53).setScrollFactor(SF).setAlpha(0)

        closeBtn.on('pointerover', () => { closeBtn.setFill('#ff0000'); tipClose.setAlpha(1) })
        closeBtn.on('pointerout', () => { closeBtn.setFill('#ff6666'); tipClose.setAlpha(0) })
        closeBtn.on('pointerdown', this._tancarMenu)

        // Títol (dalt del menú, alineat esquerra)
        mc.add(this.add.text(cx - halfW + 16, cy - halfH + 14, zone.label, {
            fontSize: '15px', fill: '#c9a227', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 2
        }).setOrigin(0, 0).setScrollFactor(SF))

        if (isShop) {
            const renderShop = () => {
                // Neteja contingut anterior del contenidor
                mc.removeAll(true)

                // Torna a afegir el títol
                mc.add(this.add.text(cx - halfW + 16, cy - halfH + 14, zone.label, {
                    fontSize: '15px', fill: '#c9a227', fontFamily: 'serif',
                    stroke: '#000', strokeThickness: 2
                }).setOrigin(0, 0).setScrollFactor(SF))

                // Compatibilitat: "muralla" → "seguro"
                if (this.millores.some(m => m.nom === 'muralla') && !this.millores.some(m => m.nom === 'seguro')) {
                    this.millores.push({ nom: 'seguro', nivell: 1 })
                }

                const UPGRADES = [
                    {
                        nom: 'seguro', label: 'Assegurança', max: 3,
                        desc: (lvl) => `Cobreix ${[25, 35, 50][lvl - 1] || 0}% de perdues`,
                        cost: (lvl) => 50 + (lvl - 1) * 100,
                        info: (lvl) => {
                            const pct = [25, 35, 50]
                            const txt = [`Nivell 1: 25% cobertura (50$)`, `Nivell 2: 35% cobertura (150$)`, `Nivell 3: 50% cobertura (300$)`]
                            if (lvl === 0) return txt.join('\n')
                            if (lvl >= 3) return `Actual: ${pct[lvl-1]}%\nMàxim assolit!`
                            return `Actual: ${pct[lvl-1]}%\nSegüent: ${pct[lvl]}% (${50 + lvl * 100}$)`
                        }
                    },
                    {
                        nom: 'taberna', label: 'Taberna', max: 10,
                        desc: (lvl) => `+${lvl * 10}% guanys al final`,
                        cost: (lvl) => 50 + (lvl - 1) * 10,
                        info: (lvl) => {
                            if (lvl === 0) return `Nivell 1: +10% guanys (50$)\n...fins a +100% al nivell 10`
                            if (lvl >= 10) return `Actual: +${lvl*10}%\nMàxim assolit!`
                            return `Actual: +${lvl*10}%\nSegüent: +${(lvl+1)*10}% (${50 + lvl * 10}$)`
                        }
                    },
                ]

                UPGRADES.forEach((upg, idx) => {
                    const rowY = cy - halfH + 52 + idx * 85
                    const owned = this.millores.find(m => m.nom === upg.nom)
                    const lvl = owned?.nivell || 0
                    const margin = 20
                    const rowW = bgW - margin * 2

                    // Fons de fila (interactiu per al tooltip)
                    const rowBg = this.add.rectangle(cx, rowY + 10, rowW, 70, 0x000000, 0.3)
                        .setScrollFactor(SF).setInteractive({ useHandCursor: true })
                    mc.add(rowBg)

                    // Tooltip descriptiu (amagat per defecte)
                    const tipW = 170
                    const tip = this.add.text(cx, rowY + 80, upg.info(lvl), {
                        fontSize: '9px', fill: '#e8d5a3', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 2, backgroundColor: '#0d0a06cc',
                        padding: { x: 6, y: 4 }, lineSpacing: 2
                    }).setOrigin(0.5, 0).setScrollFactor(SF).setDepth(55).setAlpha(0)

                    rowBg.on('pointerover', () => {
                        tip.setText(upg.info(lvl))
                        tip.setAlpha(1)
                    })
                    rowBg.on('pointerout', () => tip.setAlpha(0))
                    mc.add(tip)

                    // Nom de la millora
                    mc.add(this.add.text(cx - rowW / 2, rowY, upg.label, {
                        fontSize: '13px', fill: '#c9a227', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 2
                    }).setOrigin(0, 0).setScrollFactor(SF))

                    // Nivell actual / efecte
                    const effectText = lvl > 0 ? upg.desc(lvl) : 'No comprada'
                    mc.add(this.add.text(cx - rowW / 2, rowY + 18, effectText, {
                        fontSize: '10px', fill: lvl > 0 ? '#88ff88' : '#888', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 1
                    }).setOrigin(0, 0).setScrollFactor(SF))

                    // Quadres de nivell
                    const boxSize = 14
                    const gap = 4
                    const boxStartX = cx - rowW / 2
                    for (let i = 0; i < upg.max; i++) {
                        mc.add(this.add.rectangle(boxStartX + boxSize / 2 + i * (boxSize + gap), rowY + 48, boxSize, boxSize,
                            i < lvl ? 0xc9a227 : 0x333333
                        ).setScrollFactor(SF).setStrokeStyle(1, i < lvl ? 0xc9a227 : 0x666666))
                    }

                    // Nivell X/Y text
                    mc.add(this.add.text(boxStartX + upg.max * (boxSize + gap) + 8, rowY + 40, `${lvl}/${upg.max}`, {
                        fontSize: '10px', fill: '#e8d5a3', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 1
                    }).setOrigin(0, 0).setScrollFactor(SF))

                    // Botó compra / MAX
                    if (lvl < upg.max) {
                        const cost = upg.cost(lvl + 1)
                        const btn = this.add.text(cx + rowW / 2, rowY + 10, `+${cost}$`, {
                            fontSize: '12px', fill: '#ffd700', fontFamily: 'serif',
                            stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1208aa',
                            padding: { x: 8, y: 4 }
                        }).setOrigin(1, 0).setScrollFactor(SF).setInteractive({ useHandCursor: true })
                        btn.on('pointerover', () => btn.setFill('#ffffff'))
                        btn.on('pointerout', () => btn.setFill('#ffd700'))
                        btn.on('pointerdown', () => {
                            window.dispatchEvent(new CustomEvent('comprar-millora', {
                                detail: { nom: upg.nom, descripcio: `${upg.label} nivell ${lvl + 1}` }
                            }))
                        })
                        mc.add(btn)
                    } else {
                        mc.add(this.add.text(cx + rowW / 2, rowY + 10, 'MAX', {
                            fontSize: '12px', fill: '#44ff44', fontFamily: 'serif',
                            stroke: '#000', strokeThickness: 2
                        }).setOrigin(1, 0).setScrollFactor(SF))
                    }
                })
            }

            renderShop()

            this._shopUpdateHandler = () => {
                if (this.menuOpen && this.menuContent) renderShop()
            }
            window.addEventListener('perfil-updated', this._shopUpdateHandler)
        }

    }

    obrirCheats() {
        this.menuOpen = true
        this.player.body.setVelocity(0, 0)

        const { width, height } = this.scale
        const cx = width / 2
        const cy = height / 2
        const SF = 0
        const W = 300
        const H = 200

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50).setScrollFactor(SF)
        const bg = this.add.rectangle(cx, cy, W, H, 0x0d0a06, 0.95).setDepth(51)
            .setStrokeStyle(2, 0x88ff88).setScrollFactor(SF)

        const tancar = () => {
            overlay.destroy(); bg.destroy()
            this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy())
            this.menuOpen = false
        }

        const addTxt = (x, y, txt, s, c) =>
            this.add.text(x, y, txt, { fontSize: s || '14px', fill: c || '#88ff88', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(53).setScrollFactor(SF)

        const addBtn = (x, y, txt, cb) => {
            const t = this.add.text(x, y, txt, { fontSize: '13px', fill: '#ffd700', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1a0a88', padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setDepth(53).setScrollFactor(SF).setInteractive({ useHandCursor: true })
            t.on('pointerover', () => t.setFill('#ffffff'))
            t.on('pointerout', () => t.setFill('#ffd700'))
            t.on('pointerdown', cb)
        }

        addTxt(cx, cy - 70, 'MENU DE TRUCS', '15px', '#88ff88')

        const ferEfecteMonedes = (x, y) => {
            const t = this.add.text(x, y - 10, '+1000$', { fontSize: '18px', fill: '#44ff44', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(55).setScrollFactor(SF)
            this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, ease: 'Power2',
                onComplete: () => t.destroy() })
        }

        addBtn(cx, cy - 30, '+1000$', () => {
            this.monedes += 1000
            this.hudMon.setText(`${this.monedes}$`)
            ferEfecteMonedes(cx, cy - 30)
        })

        addBtn(cx, cy + 20, 'AFEGIR OBJECTE', () => {
            const id = window.prompt('ID de l\'objecte (1-3 digits):')
            if (!id) return
            if (!/^\d{1,3}$/.test(id.trim())) {
                window.alert('ID invàlid!')
                return
            }
            window.alert(`Objecte ${id.padStart(3, '0')} afegit! (local)`)
        })

        const closeBtn = addTxt(cx + W / 2 - 14, cy - H / 2 + 14, '✕', '16px', '#ff6666')
        closeBtn.setInteractive({ useHandCursor: true })
        closeBtn.on('pointerdown', tancar)

        this._tancarMenu = tancar
    }

}
