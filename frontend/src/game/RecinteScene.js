import Phaser from 'phaser'

export default class RecinteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RecinteScene' })
    }

    init(data) {
        this.nickname = data.nickname || 'Presoner'
        this.monedes = data.monedes ?? 400
        this.dia = data.dia ?? 1
        this.millores = [...(data.millores || [])]
        this.inventari = [...(data.inventari || [])]
        this.equipats = [...(data.equipats || Array.from({ length: 4 }, () => null))]
        this.capsulaPreu = data.capsulaPreu ?? 50
    }

    create() {
        const { width, height } = this.scale
        const worldW = 1672
        const worldH = 941

        this.physics.world.setBounds(0, 0, worldW, worldH)

        // ── FONS (imatge background.png) ──
        this.add.image(0, 0, 'recinteBg').setOrigin(0, 0).setDepth(0)

        // ── MURS (collisió) ──
        // Rectangle: (420,210) → (1250,810)
        const wx1 = 420, wy1 = 210, wx2 = 1250, wy2 = 810
        const wallW = wx2 - wx1  // 830
        const wallH = wy2 - wy1  // 600
        const thick = 8

        this.walls = this.physics.add.staticGroup()
        // Top
        this.walls.add(this.add.zone(wx1 + wallW / 2, wy1, wallW, thick))
        // Bottom
        this.walls.add(this.add.zone(wx1 + wallW / 2, wy2, wallW, thick))
        // Left
        this.walls.add(this.add.zone(wx1, wy1 + wallH / 2, thick, wallH))
        // Right
        this.walls.add(this.add.zone(wx2, wy1 + wallH / 2, thick, wallH))

        // ── JUGADOR ──
        this.player = this.add.sprite(835, 780, 'player_0')
        this.player.setDepth(15).setScale(2)

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
        this.player.body.setSize(14, 14)
        this.player.body.setOffset(9, 17)
        this.player.body.setCollideWorldBounds(true)

        this.physics.add.collider(this.player, this.walls)

        // ── CÀMERA ──
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
            { x: 830, y: 560, label: 'Casino', action: 'casino' },
            { x: 550, y: 580, label: 'Taberna', action: 'shop' },
            { x: 1115, y: 600, label: 'Puesto ONCE', action: 'items' },
        ]
        this.activeZone = null
        this.menuOpen = false
        this._menuTipus = null

        // Auto-carregar partida guardada si existeix
        const uid = localStorage.getItem('uid') || 'anonim'
        const save = localStorage.getItem(`irongate_save_${uid}`)
        if (save) {
            try {
                const d = JSON.parse(save)
                this.nickname = d.nickname || this.nickname
                this.monedes = d.monedes ?? this.monedes
                this.dia = d.dia ?? this.dia
                this.millores = d.millores || this.millores
                this.inventari = d.inventari || this.inventari
                this.equipats = d.equipats || this.equipats
                this.capsulaPreu = d.capsulaPreu ?? this.capsulaPreu
            } catch (e) { /* ignora */ }
        }

        // ── PROMPT ──
        this.promptBg = this.add.rectangle(0, 0, 100, 20, 0x000000, 0.6).setDepth(15).setVisible(false).setScrollFactor(0)
        this.promptText = this.add.text(0, 0, '', {
            fontSize: '15px', fill: '#ffd700', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(16).setVisible(false).setScrollFactor(0)

        // Inventari amb B (toggle)
        this.input.keyboard.on('keydown-B', () => {
            if (this._menuTipus === 'inventari') { this._tancarMenu(); return }
            if (!this.menuOpen) this.obrirInventari()
        })

        // Escape → menú de pausa (Guardar / Carregar)
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.menuOpen) { this._tancarMenu(); return }
            this.obrirMenuPausa()
        })
    }

    fitCamera() {
        const { width, height } = this.scale
        const worldW = 1672
        const worldH = 941
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
        this._menuTipus = zone.action === 'shop' ? 'botiga' : 'items'
        this.player.body.setVelocity(0, 0)

        if (zone.action === 'casino') {
            this.cameras.main.fade(400, 0, 0, 0)
            this.time.delayedCall(400, () => {
                this.scene.start('CasinoScene', {
                    nickname: this.nickname,
                    monedes: this.monedes,
                    dia: this.dia,
                    millores: this.millores,
                    equipats: this.equipats,
                    inventari: this.inventari,
                    capsulaPreu: this.capsulaPreu
                })
            })
            return
        }

        // Menú en pantalla amb scrollFactor(0) — TOT directe a l'escena, res de contenidor
        const { width, height } = this.scale
        const cx = width / 2
        const cy = height / 2

        const isShop = zone.action === 'shop'
        const bgW = isShop ? 380 : 280
        const bgH = isShop ? 260 : 220
        const halfW = bgW / 2
        const halfH = bgH / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7)
            .setDepth(50).setScrollFactor(0)
        const bg = this.add.rectangle(cx, cy, bgW, bgH, 0x1a1208, 0.92).setDepth(51)
            .setStrokeStyle(2, 0xc9a227).setScrollFactor(0)

        // Llista d'elements del menú (per neteja i rebuild)
        const menuItems = [overlay, bg]
        const addItem = (obj) => { obj.setScrollFactor(0); menuItems.push(obj); return obj }

        const destroyMenu = () => {
            menuItems.forEach(c => c.destroy())
            this.menuOpen = false; this._menuTipus = null
            this._menuClosedAt = Date.now()
        }
        this._tancarMenu = destroyMenu

        // Creu tancar
        const closeBtn = addItem(this.add.text(cx + halfW - 14, cy - halfH + 14, 'X', {
            fontSize: '16px', fill: '#d4c5a0', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setInteractive({ useHandCursor: true }))
        closeBtn.on('pointerover', () => { closeBtn.setFill('#ff4444'); closeBtn.setScale(1.15) })
        closeBtn.on('pointerout', () => { closeBtn.setFill('#d4c5a0'); closeBtn.setScale(1) })
        closeBtn.on('pointerdown', destroyMenu)

        if (isShop) {
            const renderShop = () => {
                for (let i = menuItems.length - 1; i >= 0; i--) {
                    const c = menuItems[i]
                    if (c !== overlay && c !== bg && c !== closeBtn) {
                        menuItems.splice(i, 1)
                        c.destroy()
                    }
                }

                addItem(this.add.text(cx - halfW + 16, cy - halfH + 14, `${zone.label}  ·  ${this.monedes}$`, {
                    fontSize: '15px', fill: '#ffd700', fontFamily: 'serif',
                    stroke: '#000', strokeThickness: 2
                }).setOrigin(0, 0).setDepth(52))

                if (this.millores.some(m => m.nom === 'muralla') && !this.millores.some(m => m.nom === 'seguro')) {
                    this.millores.push({ nom: 'seguro', nivell: 1 })
                }

                const UPGRADES = [
                    {
                        nom: 'seguro', label: 'Assegurança', max: 3,
                        desc: (lvl) => `Cobreix ${[25, 35, 50][lvl - 1] || 0}% de perdues`,
                        cost: (lvl) => [100, 400, 1000][lvl - 1] || 0,
                        info: (lvl) => {
                            const pct = [25, 35, 50]
                            const costs = [100, 400, 1000]
                            const txt = [`Nivell 1: 25% cobertura (100$)`, `Nivell 2: 35% cobertura (400$)`, `Nivell 3: 50% cobertura (1000$)`]
                            if (lvl === 0) return txt.join('\n')
                            if (lvl >= 3) return `Actual: ${pct[lvl-1]}%\nMàxim assolit!`
                            return `Actual: ${pct[lvl-1]}%\nSegüent: ${pct[lvl]}% (${costs[lvl]}$)`
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

                    // Fons de fila (interactiu)
                    const rowBg = addItem(this.add.rectangle(cx, rowY + 10, rowW, 70, 0x000000, 0.3)
                        .setInteractive({ useHandCursor: true }).setDepth(52))

                    // Tooltip descriptiu
                    const tip = addItem(this.add.text(cx, rowY + 80, upg.info(lvl), {
                        fontSize: '9px', fill: '#e8d5a3', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 2, backgroundColor: '#0d0a06cc',
                        padding: { x: 6, y: 4 }, lineSpacing: 2
                    }).setOrigin(0.5, 0).setDepth(55).setAlpha(0))
                    rowBg.on('pointerover', () => { tip.setText(upg.info(lvl)); tip.setAlpha(1) })
                    rowBg.on('pointerout', () => tip.setAlpha(0))

                    // Nom
                    addItem(this.add.text(cx - rowW / 2, rowY, upg.label, {
                        fontSize: '13px', fill: '#c9a227', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 2
                    }).setOrigin(0, 0).setDepth(52))

                    // Efecte
                    const effectText = lvl > 0 ? upg.desc(lvl) : 'No comprada'
                    addItem(this.add.text(cx - rowW / 2, rowY + 18, effectText, {
                        fontSize: '10px', fill: lvl > 0 ? '#88ff88' : '#888', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 1
                    }).setOrigin(0, 0).setDepth(52))

                    // Quadres de nivell
                    const boxSize = 14
                    const gap = 4
                    const boxStartX = cx - rowW / 2
                    for (let i = 0; i < upg.max; i++) {
                        addItem(this.add.rectangle(boxStartX + boxSize / 2 + i * (boxSize + gap), rowY + 48, boxSize, boxSize,
                            i < lvl ? 0xc9a227 : 0x333333
                        ).setStrokeStyle(1, i < lvl ? 0xc9a227 : 0x666666).setDepth(52))
                    }

                    // Nivell X/Y
                    addItem(this.add.text(boxStartX + upg.max * (boxSize + gap) + 8, rowY + 40, `${lvl}/${upg.max}`, {
                        fontSize: '10px', fill: '#e8d5a3', fontFamily: 'serif',
                        stroke: '#000', strokeThickness: 1
                    }).setOrigin(0, 0).setDepth(52))

                    // Botó compra / MAX
                    if (lvl < upg.max) {
                        const cost = upg.cost(lvl + 1)
                        const btn = addItem(this.add.text(cx + rowW / 2, rowY + 10, `+${cost}$`, {
                            fontSize: '12px', fill: '#ffd700', fontFamily: 'serif',
                            stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1208aa',
                            padding: { x: 8, y: 4 }
                        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(52))
                        btn.on('pointerover', () => btn.setFill('#ffffff'))
                        btn.on('pointerout', () => btn.setFill('#ffd700'))
                        btn.on('pointerdown', () => {
                            const cost = upg.cost(lvl + 1)
                            if (this.monedes < cost) {
                                // Botó insuficient: tremolor + missatge
                                const origX = btn.x
                                this.tweens.add({
                                    targets: btn, x: origX - 3, duration: 40, yoyo: true,
                                    repeat: 5, ease: 'Sine.easeInOut',
                                    onComplete: () => btn.x = origX
                                })
                                btn.setFill('#ff4444')
                                this.time.delayedCall(400, () => btn.setFill('#ffd700'))
                                const msg = this.add.text(cx + rowW / 2, rowY + 35, 'FONS INSUFICIENTS!', {
                                    fontSize: '10px', fill: '#ff4444', fontFamily: 'serif',
                                    stroke: '#000', strokeThickness: 2
                                }).setOrigin(0.5).setDepth(59).setScrollFactor(0)
                                this.tweens.add({
                                    targets: msg, alpha: 0, y: msg.y + 20, duration: 1500,
                                    delay: 300, ease: 'Power2',
                                    onComplete: () => msg.destroy()
                                })
                                return
                            }
                            this.monedes -= cost
                            const existing = this.millores.find(m => m.nom === upg.nom)
                            if (existing) {
                                existing.nivell++
                            } else {
                                this.millores.push({ nom: upg.nom, nivell: 1, descripcio: `${upg.label} nivell 1` })
                            }
                            // Forcar re-render immediat
                            renderShop()
                            // Animacio -cost$
                            const ef = this.add.text(cx + rowW / 2, rowY + 10, `-${cost}$`, {
                                fontSize: '16px', fill: '#ff4444', fontFamily: 'serif',
                                stroke: '#000', strokeThickness: 3
                            }).setOrigin(0.5).setDepth(59).setScrollFactor(0)
                            this.tweens.add({ targets: ef, y: ef.y + 30, alpha: 0, duration: 800, ease: 'Power2',
                                onComplete: () => ef.destroy() })
                        })
                    } else {
                        addItem(this.add.text(cx + rowW / 2, rowY + 10, 'MAX', {
                            fontSize: '12px', fill: '#44ff44', fontFamily: 'serif',
                            stroke: '#000', strokeThickness: 2
                        }).setOrigin(1, 0).setDepth(52))
                    }
                })
            }

            renderShop()

        } else {
            const renderOnce = () => {
                for (let i = menuItems.length - 1; i >= 0; i--) {
                    const c = menuItems[i]
                    if (c !== overlay && c !== bg && c !== closeBtn) {
                        menuItems.splice(i, 1)
                        c.destroy()
                    }
                }

                const preu = Math.min(this.capsulaPreu, 300)
                const txt = (x, y, s, c, o) => addItem(this.add.text(x, y, s,
                    { fontSize: o?.size || '13px', fill: c || '#e8d5a3', fontFamily: 'serif',
                      stroke: '#000', strokeThickness: 2 }).setOrigin(o?.ox ?? 0, o?.oy ?? 0.5).setDepth(52))

                txt(cx, cy - 60, 'Capsula Aleatoria', '#c9a227', { size: '18px', ox: 0.5 })
                txt(cx, cy - 30, `Preu: ${preu}$`, '#ffd700', { size: '15px', ox: 0.5 })
                txt(cx, cy, '50% comu | 25% raro | 15% epic | 5% legendari', '#888', { size: '11px', ox: 0.5 })

                const btn = addItem(this.add.rectangle(cx, cy + 35, 160, 38, 0x1a3d06)
                    .setDepth(52).setStrokeStyle(2, 0xc9a227).setInteractive({ useHandCursor: true }))
                const btnTxt = addItem(this.add.text(cx, cy + 35, 'COMPRAR', {
                    fontSize: '16px', fill: '#c9a227', fontFamily: 'serif'
                }).setOrigin(0.5).setDepth(53))

                btn.on('pointerover', () => btn.setStrokeStyle(3, 0xffd700))
                btn.on('pointerout', () => btn.setStrokeStyle(2, 0xc9a227))
                btn.on('pointerdown', () => {
                    if (this.monedes < preu) {
                        const f = addItem(this.add.text(cx, cy + 70, 'FONS INSUFICIENTS!', {
                            fontSize: '13px', fill: '#ff4444', fontFamily: 'serif',
                            stroke: '#000', strokeThickness: 2
                        }).setOrigin(0.5).setDepth(53))
                        this.tweens.add({ targets: f, alpha: 0, y: cy + 90, duration: 1500, onComplete: () => f.destroy() })
                        return
                    }
                    if (this.inventari.length >= 24) {
                        const f = addItem(this.add.text(cx, cy + 70, 'INVENTARI PLE!', {
                            fontSize: '13px', fill: '#ff4444', fontFamily: 'serif',
                            stroke: '#000', strokeThickness: 2
                        }).setOrigin(0.5).setDepth(53))
                        this.tweens.add({ targets: f, alpha: 0, y: cy + 90, duration: 1500, onComplete: () => f.destroy() })
                        return
                    }
                    this.monedes -= preu
                    const item = this.generarCapsula()
                    this.inventari.push(item)
                    renderOnce()

                    const { width, height } = this.scale
                    const cap = this.add.text(width / 2, height / 2, '💊', {
                        fontSize: '50px'
                    }).setOrigin(0.5).setDepth(90).setScrollFactor(0)
                    this.tweens.add({
                        targets: cap, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true, repeat: 3,
                        onComplete: () => {
                            this.tweens.add({ targets: cap, alpha: 0, duration: 300, onComplete: () => cap.destroy() })
                        }
                    })
                    const cor = item.raresa === 'legendari' ? '#ff8800' : item.raresa === 'epic' ? '#cc44ff' : item.raresa === 'raro' ? '#44aaff' : '#ffffff'
                    const notif = this.add.text(width - 12, height - 40, `${item.nomItem}`, {
                        fontSize: '13px', fill: cor, fontFamily: 'serif',
                        backgroundColor: '#1a120888', padding: { x: 10, y: 5 },
                        stroke: '#000', strokeThickness: 2
                    }).setOrigin(1, 0.5).setDepth(90).setScrollFactor(0).setAlpha(0)
                    this.tweens.add({ targets: notif, alpha: 1, duration: 300, delay: 600 })
                    this.tweens.add({ targets: notif, alpha: 0, duration: 600, delay: 2500, onComplete: () => notif.destroy() })
                })
            }
            renderOnce()
        }

    }

    POOL_ITEMS = [
        { nomItem: 'Dado del Condenado', efecte: { tipus: 'prob_jackpot_slots', valor: 0.08 }, raresa: 'raro', itemId: '001' },
        { nomItem: 'Anillo del Tahur', efecte: { tipus: 'prob_guany_ruleta', valor: 0.05 }, raresa: 'comu', itemId: '002' },
        { nomItem: 'Moneda del Verdugo', efecte: { tipus: 'prob_guany_moneda', valor: 0.10 }, raresa: 'raro', itemId: '003' },
        { nomItem: 'Capucha del Tramposo', efecte: { tipus: 'reduccio_perdua', valor: 0.15 }, raresa: 'epic', itemId: '004' },
        { nomItem: 'Reliquia del Bufon', efecte: { tipus: 'prob_joker', valor: 0.07 }, raresa: 'raro', itemId: '005' },
        { nomItem: 'Jarabe del Carceler', efecte: { tipus: 'anular_perdua', valor: 1 }, raresa: 'comu', itemId: '006' },
        { nomItem: 'Mapa del Crupier Ciego', efecte: { tipus: 'revelar_crupier', valor: 1 }, raresa: 'epic', itemId: '007' },
        { nomItem: 'Bota de Hierro', efecte: { tipus: 'ronda_extra', valor: 1 }, raresa: 'raro', itemId: '008' },
        { nomItem: 'Amuleto del Ahorcado', efecte: { tipus: 'bonus_guany', valor: 0.20 }, raresa: 'legendari', itemId: '009' },
        { nomItem: 'Caliz del Rey Preso', efecte: { tipus: 'monedes_extra', valor: 50 }, raresa: 'epic', itemId: '010' },
        { nomItem: 'Guantes del Prestidigitador', efecte: { tipus: 'carta_extra', valor: 1 }, raresa: 'raro', itemId: '011' },
        { nomItem: 'Pergamino Doble Apuesta', efecte: { tipus: 'doble_aposta', valor: 1 }, raresa: 'epic', itemId: '012' },
        { nomItem: 'Candado de la Fortuna', efecte: { tipus: 'prob_guany_ruleta', valor: 0.03 }, raresa: 'comu', itemId: '013' },
        { nomItem: 'Rosario del Loco', efecte: { tipus: 'as_seguro', valor: 1 }, raresa: 'legendari', itemId: '014' },
        { nomItem: 'Dados de Hueso', efecte: { tipus: 'prob_jackpot_slots', valor: 0.12 }, raresa: 'epic', itemId: '015' },
        { nomItem: 'Llave del Calabozo', efecte: { tipus: 'monedes_extra', valor: 15 }, raresa: 'comu', itemId: '016' },
        { nomItem: 'Pocion de Sangre y Oro', efecte: { tipus: 'reduccio_perdua', valor: 0.25 }, raresa: 'raro', itemId: '017' },
        { nomItem: 'Corona del Emperador', efecte: { tipus: 'bonus_guany', valor: 0.15 }, raresa: 'epic', itemId: '018' },
        { nomItem: 'Totem Moneda Rota', efecte: { tipus: 'prob_guany_moneda', valor: 0.18 }, raresa: 'legendari', itemId: '019' },
        { nomItem: 'Ojo del Vigilante', efecte: { tipus: 'ronda_extra', valor: 1 }, raresa: 'legendari', itemId: '020' },
    ]

    generarCapsula() {
        const r = Math.random()
        let raresa
        if (r < 0.05) raresa = 'legendari'
        else if (r < 0.20) raresa = 'epic'
        else if (r < 0.45) raresa = 'raro'
        else raresa = 'comu'
        const pool = this.POOL_ITEMS.filter(i => i.raresa === raresa)
        return { ...Phaser.Utils.Array.GetRandom(pool), tipus: 'equipable' }
    }

    obrirInventari() {
        this.menuOpen = true
        this._menuTipus = 'inventari'
        const { width, height } = this.scale
        const cx = width / 2
        const cy = height / 2
        const SF = 0
        const cols = 6
        const rows = 2
        const slots = cols * rows
        let pagina = 0

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50).setScrollFactor(SF)

        const total = this.inventari.length || 0
        const maxPag = Math.max(0, Math.ceil(total / slots) - 1)

        const tancar = () => {
            overlay.destroy(); this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy())
            this.menuOpen = false; this._menuTipus = null
        }

        const equipar = (item, idx) => {
            if (!item) return
            if (item.tipus === 'consumible') {
                this.usarConsumible(item, idx)
                render()
                return
            }
            const slot = this.equipats.findIndex(e => !e)
            if (slot < 0) return
            this.inventari.splice(idx, 1)
            this.equipats[slot] = item
            render()
        }

        const desequipar = (slotIdx) => {
            const item = this.equipats[slotIdx]
            if (!item) return
            this.equipats[slotIdx] = null
            this.inventari.push(item)
            render()
        }

        const render = () => {
            this.children.list.filter(c => c.depth >= 50 && c !== overlay).forEach(c => c.destroy())

            const panelW = Math.min(460, width * 0.85)
            const panelH = Math.min(250, height * 0.55)
            const px = cx - panelW / 2
            const py = cy - panelH / 2

            const bg = this.add.rectangle(cx, cy, panelW, panelH, 0x0d0a06, 0.95).setDepth(51)
                .setStrokeStyle(2, 0xc9a227).setScrollFactor(SF)

            const txt = (x, y, s, c, o) => this.add.text(x, y, s,
                { fontSize: o?.size || '13px', fill: c || '#e8d5a3', fontFamily: 'serif',
                  stroke: '#000', strokeThickness: 2 }).setOrigin(o?.ox ?? 0, o?.oy ?? 0.5).setDepth(53).setScrollFactor(SF)

            txt(px + 12, py + 14, `${this.nickname}  ·  Dia ${this.dia}  ·  ${this.monedes}$`, '#ffd700', { size: '13px' })

            const gx = px + 12
            const gy = py + 40
            const cellW = (panelW - 20) / cols
            const cellH = 42

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const idx = pagina * slots + r * cols + c
                    const cellX = gx + c * cellW
                    const cellY = gy + r * (cellH + 2)
                    const item = this.inventari[idx]

                    const cell = this.add.rectangle(cellX + cellW / 2, cellY + cellH / 2, cellW - 3, cellH - 2, 0x1a1208, 0.5)
                        .setDepth(52).setScrollFactor(SF).setStrokeStyle(1, item ? 0xc9a227 : 0x333333)

                    if (item) {
                        cell.setInteractive({ useHandCursor: true })
                        cell.on('pointerdown', () => equipar(item, idx))
                        const cor = item.raresa === 'legendari' ? '#ff8800'
                            : item.raresa === 'epic' ? '#cc44ff'
                            : item.raresa === 'raro' ? '#44aaff'
                            : '#ffffff'
                        const tipusIcon = item.tipus === 'consumible' ? ' C' : ''
                        txt(cellX + 4, cellY + cellH / 2, `${item.nomItem}${tipusIcon}`, cor, { size: '10px' })
                    }
                }
            }

            const eqY = gy + rows * (cellH + 2) + 10
            txt(gx, eqY - 2, 'EQUIPATS', '#c9a227', { size: '10px' })
            const slotW = (panelW - 20) / 4
            for (let i = 0; i < 4; i++) {
                const sx = gx + i * slotW + slotW / 2
                const sItem = this.equipats[i]
                const slotBg = this.add.rectangle(sx, eqY + 20, slotW - 4, 32, 0x1a1208, 0.5)
                    .setDepth(52).setScrollFactor(SF).setStrokeStyle(1, sItem ? 0x44aaff : 0x333333)
                if (sItem) {
                    slotBg.setInteractive({ useHandCursor: true })
                    slotBg.on('pointerdown', () => desequipar(i))
                    const sc = sItem.raresa === 'legendari' ? '#ff8800' : sItem.raresa === 'epic' ? '#cc44ff' : sItem.raresa === 'raro' ? '#44aaff' : '#ffffff'
                    txt(sx, eqY + 20, `${sItem.nomItem}`, sc, { size: '8px', ox: 0.5 })
                } else {
                    txt(sx, eqY + 20, `Slot ${i + 1}`, '#444', { size: '8px', ox: 0.5 })
                }
            }

            if (total > slots) {
                const pagY = py + panelH - 20
                const ant = txt(cx - 70, pagY, '<', '#ffd700', { size: '14px', ox: 0.5 })
                ant.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (pagina > 0) { pagina--; render() } })
                ant.setAlpha(pagina > 0 ? 1 : 0.3)

                const seg = txt(cx + 70, pagY, '>', '#ffd700', { size: '14px', ox: 0.5 })
                seg.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (pagina < maxPag) { pagina++; render() } })
                seg.setAlpha(pagina < maxPag ? 1 : 0.3)

                txt(cx, pagY, `${pagina + 1}/${maxPag + 1}`, '#888', { size: '10px', ox: 0.5 })
            }

            const cBtn = this.add.text(cx + panelW / 2 - 14, py + 14, 'X', {
                fontSize: '16px', fill: '#d4c5a0', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(53).setScrollFactor(SF).setInteractive({ useHandCursor: true })
            cBtn.on('pointerover', () => { cBtn.setFill('#ff4444'); cBtn.setScale(1.15) })
            cBtn.on('pointerout', () => { cBtn.setFill('#d4c5a0'); cBtn.setScale(1) })
            cBtn.on('pointerdown', tancar)
        }

        render()
        this._tancarMenu = tancar
    }

    usarConsumible(item, idx) {
        if (!item || !item.efecte) return
        const ef = item.efecte
        if (ef.tipus === 'monedes_extra') {
            this.monedes += ef.valor
        }
        this.inventari.splice(idx, 1)
    }

    obrirCheats() {
        this.menuOpen = true
        this._menuTipus = 'cheats'
        this.player.body.setVelocity(0, 0)

        const { width, height } = this.scale
        const cx = width / 2
        const cy = height / 2
        const SF = 0
        const W = 340
        const H = 390

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7).setDepth(50).setScrollFactor(SF)
        const bg = this.add.rectangle(cx, cy, W, H, 0x0d0a06, 0.95).setDepth(51)
            .setStrokeStyle(2, 0xc9a227).setScrollFactor(SF)

        const tancar = () => {
            overlay.destroy(); bg.destroy()
            this.children.list.filter(c => c.depth >= 50).forEach(c => c.destroy())
            this.menuOpen = false; this._menuTipus = null
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
            return t
        }

        addTxt(cx, cy - 70, 'MENU DE TRUCS', '15px', '#88ff88')

        const ferEfecteMonedes = (x, y) => {
            const t = this.add.text(x, y - 10, '+1000$', { fontSize: '18px', fill: '#44ff44', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(55).setScrollFactor(SF)
            this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 800, ease: 'Power2',
                onComplete: () => t.destroy() })
        }

        addBtn(cx, cy - 38, '+1000$', () => {
            this.monedes += 1000
            ferEfecteMonedes(cx, cy - 38)
        })

        addBtn(cx, cy - 8, 'AFEGIR OBJECTE', () => {
            const id = window.prompt('ID de l\'objecte (1-3 digits):')
            if (!id) return
            if (!/^\d{1,3}$/.test(id.trim())) {
                window.alert('ID invàlid!')
                return
            }
            window.alert(`Objecte ${id.padStart(3, '0')} afegit! (local)`)
        })

        // Selector de joc forçat
        const jocsOpcs = [
            { label: 'Joc: --- Cap ---', value: '' },
            { label: 'Joc: Blackjack', value: 'BlackjackScene' },
            { label: 'Joc: Ruleta', value: 'RuletaScene' },
            { label: 'Joc: Slots', value: 'SlotsScene' },
            { label: 'Joc: Cara o Creu', value: 'MonedaScene' },
            { label: 'Joc: Daus (Boss)', value: 'DausScene' },
        ]
        let idxJoc = Math.max(0, jocsOpcs.findIndex(j => j.value === localStorage.getItem('cheat_joc')))
        const jocTxt = addBtn(cx, cy + 22, jocsOpcs[idxJoc].label, () => {
            idxJoc = (idxJoc + 1) % jocsOpcs.length
            localStorage.setItem('cheat_joc', jocsOpcs[idxJoc].value)
            jocTxt.setText(jocsOpcs[idxJoc].label)
        })

        // Botons perillosos (vermells, vibren, contrasenya admin)
        const btnPerillos = (y, label, cb) => {
            const t = this.add.text(cx, y, label, {
                fontSize: '13px', fill: '#ff4444', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2, backgroundColor: '#1a1a0a88', padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setDepth(53).setScrollFactor(0).setInteractive({ useHandCursor: true })
            let shaking = false
            t.on('pointerover', () => {
                if (shaking) return
                shaking = true
                this.tweens.add({
                    targets: t, x: t.x + 4, duration: 35, yoyo: true, repeat: 6,
                    onComplete: () => { shaking = false; t.x = cx }
                })
            })
            t.on('pointerout', () => { t.x = cx; shaking = false })
            t.on('pointerdown', () => {
                t.x = cx; shaking = false
                const pwd = window.prompt('Contrasenya admin:')
                if (pwd !== 'admin123') { window.alert('Contrasenya incorrecta'); return }
                cb()
            })
            return t
        }

        btnPerillos(cy + 52, 'BORRAR PERFIL', () => {
            if (!window.confirm('SEGUR? Tornaras al menu principal.')) return
            const uid = localStorage.getItem('uid') || 'anonim'
            localStorage.removeItem('token')
            localStorage.removeItem('uid')
            localStorage.removeItem('jugadorId')
            localStorage.removeItem('nickname')
            localStorage.removeItem(`irongate_save_${uid}`)
            window.location.reload()
        })

        btnPerillos(cy + 82, 'WIPE GLOBAL', () => {
            if (!window.confirm('SEGUR QUE VOLS NETEGAR TOTA LA BASE DE DADES?\nAquesta accio es irreversible.')) return
            window.dispatchEvent(new CustomEvent('netejar-base-dades', { detail: { password: 'admin123' } }))
        })

        const wipeResultHandler = (e) => {
            const r = e.detail
            window.alert(r.missatge || 'Error desconegut')
            if (r.documentsEliminats >= 0) {
                const uid = localStorage.getItem('uid') || 'anonim'
                localStorage.removeItem('token')
                localStorage.removeItem('uid')
                localStorage.removeItem('jugadorId')
                localStorage.removeItem('nickname')
                localStorage.removeItem(`irongate_save_${uid}`)
                window.location.reload()
            }
        }
        window.addEventListener('neteja-resultat', wipeResultHandler)
        this.events.on('shutdown', () => window.removeEventListener('neteja-resultat', wipeResultHandler))

        const cBtn = this.add.text(cx + W / 2 - 14, cy - H / 2 + 14, 'X', {
            fontSize: '16px', fill: '#d4c5a0', fontFamily: 'serif',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(53).setScrollFactor(SF).setInteractive({ useHandCursor: true })
        cBtn.on('pointerover', () => { cBtn.setFill('#ff4444'); cBtn.setScale(1.15) })
        cBtn.on('pointerout', () => { cBtn.setFill('#d4c5a0'); cBtn.setScale(1) })
        cBtn.on('pointerdown', tancar)

        this._tancarMenu = tancar
    }

    obrirMenuPausa() {
        this.menuOpen = true
        this._menuTipus = 'pausa'
        this.player.body.setVelocity(0, 0)

        const { width, height } = this.scale
        const cx = width / 2, cy = height / 2

        const overlay = this.add.rectangle(cx, cy, width * 3, height * 3, 0x000000, 0.7)
            .setDepth(100).setScrollFactor(0)
        const bg = this.add.rectangle(cx, cy, 340, 310, 0x0d0a06, 0.95).setDepth(101)
            .setStrokeStyle(2, 0xc9a227).setScrollFactor(0)

        const tancar = () => {
            overlay.destroy(); bg.destroy()
            this.children.list.filter(c => c.depth >= 100).forEach(c => c.destroy())
            this.menuOpen = false; this._menuTipus = null
        }

        const txt = (x, y, s, c, o) =>
            this.add.text(x, y, s, {
                fontSize: o?.size || '14px', fill: c || '#e8d5a3', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 2
            }).setOrigin(o?.ox ?? 0.5, o?.oy ?? 0.5).setDepth(103).setScrollFactor(0)

        const btn = (y, label, cb) => {
            const t = txt(cx, y, label, '#c9a227', { size: '16px', ox: 0.5 })
            t.setBackgroundColor('#1a120888').setPadding(14, 7)
            t.setInteractive({ useHandCursor: true })
            t.on('pointerover', () => t.setFill('#ffffff'))
            t.on('pointerout', () => t.setFill('#c9a227'))
            t.on('pointerdown', cb)
            return t
        }

        const feedback = (msg, color) => {
            const f = txt(cx, cy + 90, msg, color || '#00ff88', { size: '13px', ox: 0.5 })
            this.tweens.add({ targets: f, alpha: 0, delay: 1200, duration: 600, onComplete: () => f.destroy() })
        }

        txt(cx, cy - 85, 'MENU', '#c9a227', { size: '22px', ox: 0.5 })

        const mkCloseBtn = (x, y, cb) => {
            const c = this.add.text(x, y, 'X', {
                fontSize: '16px', fill: '#d4c5a0', fontFamily: 'serif',
                stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setDepth(103).setScrollFactor(0).setInteractive({ useHandCursor: true })
            c.on('pointerover', () => { c.setFill('#ff4444'); c.setScale(1.15) })
            c.on('pointerout', () => { c.setFill('#d4c5a0'); c.setScale(1) })
            c.on('pointerdown', cb)
            return c
        }
        mkCloseBtn(cx + 155, cy - 140, tancar)

        btn(cy - 35, 'Guardar partida', () => {
            const save = {
                nickname: this.nickname,
                monedes: this.monedes,
                dia: this.dia,
                millores: this.millores,
                inventari: this.inventari,
                equipats: this.equipats,
                capsulaPreu: this.capsulaPreu
            }
            try {
                const uid = localStorage.getItem('uid') || 'anonim'
                localStorage.setItem(`irongate_save_${uid}`, JSON.stringify(save))
                window.dispatchEvent(new CustomEvent('sincronitzar-jugador', {
                    detail: {
                        monedes: this.monedes,
                        diaActual: this.dia,
                        millores: this.millores.map(m => ({
                            nom: m.nom,
                            descripcio: m.descripcio || '',
                            nivell: m.nivell
                        }))
                    }
                }))
                feedback('Partida guardada!', '#00ff88')
            } catch (e) {
                feedback('Error en guardar!', '#ff4444')
            }
        })

        const uid = localStorage.getItem('uid') || 'anonim'
        const teCarga = localStorage.getItem(`irongate_save_${uid}`)
        if (teCarga) {
            btn(cy + 0, 'Carregar partida', () => {
                try {
                    const d = JSON.parse(teCarga)
                    this.nickname = d.nickname
                    this.monedes = d.monedes
                    this.dia = d.dia
                    this.millores = [...(d.millores || [])]
                    this.inventari = [...(d.inventari || [])]
                    this.equipats = [...(d.equipats || Array.from({ length: 4 }, () => null))]
                    this.capsulaPreu = d.capsulaPreu ?? 50
                    feedback('Partida carregada!', '#ffd700')
                } catch (e) {
                    feedback('Error en carregar!', '#ff4444')
                }
            })
        } else {
            txt(cx, cy + 0, 'Carregar partida', '#555', { size: '14px', ox: 0.5 })
        }

        btn(cy + 35, 'Continuar', tancar)

        // RESET RUN (vermell, vibra, doble click)
        let resetClicks = 0
        let resetExecutat = false
        const btnReset = txt(cx, cy + 70, 'RESET RUN', '#ff4444', { size: '13px', ox: 0.5 })
        btnReset.setBackgroundColor('#1a120888').setPadding(14, 7)
            .setInteractive({ useHandCursor: true })
        let rshaking = false
        btnReset.on('pointerover', () => {
            if (rshaking) return
            rshaking = true
            this.tweens.add({
                targets: btnReset, x: btnReset.x + 4, duration: 35, yoyo: true, repeat: 6,
                onComplete: () => { rshaking = false; btnReset.x = cx }
            })
        })
        btnReset.on('pointerout', () => { btnReset.x = cx; rshaking = false })
        btnReset.on('pointerdown', () => {
            if (resetExecutat) return
            resetClicks++
            if (resetClicks === 1) {
                btnReset.setText('CONFIRMAR RESET')
                btnReset.setFill('#ff0000')
                this.time.delayedCall(2000, () => {
                    if (resetClicks === 1) { resetClicks = 0; btnReset.setText('RESET RUN'); btnReset.setFill('#ff4444') }
                })
            } else {
                resetExecutat = true
                btnReset.setText('Reiniciant...')
                btnReset.setFill('#888888')
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
        })

        const btnSortir = txt(cx, cy + 105, 'Tancar sessio', '#ff6666', { size: '16px', ox: 0.5 })
        btnSortir.setBackgroundColor('#1a120888').setPadding(14, 7)
            .setInteractive({ useHandCursor: true })
        btnSortir.on('pointerover', () => btnSortir.setFill('#ff0000'))
        btnSortir.on('pointerout', () => btnSortir.setFill('#ff6666'))
        btnSortir.on('pointerdown', () => {
            localStorage.removeItem('token')
            localStorage.removeItem('uid')
            localStorage.removeItem('jugadorId')
            window.location.reload()
        })

        this._tancarMenu = tancar
    }

}
