import Phaser from 'phaser'

export default class RecinteScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RecinteScene' })
    }

    init(data) {
        this.nickname = data.nickname || 'Presoner'
        this.monedes = data.monedes || 400
        this.dia = data.dia || 1
        this.millores = data.millores || []
    }

    preload() {
        // SIN spacing — el tileset es 12x11 tiles contiguos de 16x16
        this.load.spritesheet('town', '/assets/town.png', {
            frameWidth: 16,
            frameHeight: 16
        })
    }

    create() {
        const { width, height } = this.scale
        const TILE = 32
        const COLS = 25
        const ROWS = 20

        this.drawRecinte(TILE, COLS, ROWS)

        // HUD
        this.add.rectangle(width / 2, 24, width, 48, 0x1a0f00, 0.9).setScrollFactor(0)
        this.add.text(16, 12, `⚔ ${this.nickname}`, {
            fontSize: '16px', fill: '#c9a227', fontFamily: 'serif'
        }).setScrollFactor(0)
        this.add.text(width / 2, 12, `Dia ${this.dia}`, {
            fontSize: '16px', fill: '#e8d5a3', fontFamily: 'serif'
        }).setOrigin(0.5, 0).setScrollFactor(0)
        this.monText = this.add.text(width - 16, 12, `${this.monedes}$`, {
            fontSize: '16px', fill: '#ffd700', fontFamily: 'serif'
        }).setOrigin(1, 0).setScrollFactor(0)
    }

    t(col, row, frame, depth = 0) {
        // Helper: pinta un tile en posición de grid
        const TILE = 32
        return this.add.image(
            col * TILE + TILE / 2,
            row * TILE + TILE / 2,
            'town',
            frame
        ).setScale(2).setDepth(depth)
    }

    drawRecinte(TILE, COLS, ROWS) {
        // ── FRAMES VERIFICADOS PIXEL A PIXEL ──
        // Hierba:        0, 1, 2
        // Tierra/arena:  12, 13, 14, 36, 37, 38, 39, 40, 41, 42
        // Piedra gris:   48, 49, 50, 51, 60, 61, 62, 63
        // Tejado rojo:   52, 53, 54, 64, 65, 66
        // Muro piedra:   96, 97, 98, 99, 100, 101, 102, 108, 109, 110, 120, 121, 122
        // NUNCA usar:    3,4,5,6,7,8,9,10,11,15,16,17,18,20,21,23,27..35,44..47,56,58,59,68..71,74,78,80..83

        const GRASS = [0, 1, 2]
        const PATH  = [36, 37, 38]   // tierra/arena para camino
        const WALL  = [96, 97, 98]   // muro piedra gris horizontal
        const WALLV = [120, 121, 122] // muro piedra gris vertical
        const WALLT = [108, 109, 110] // muro piedra top (más claro)

        // ── 1. SUELO HIERBA (interior) ──
        for (let row = 1; row < ROWS - 1; row++) {
            for (let col = 1; col < COLS - 1; col++) {
                const f = GRASS[(col + row) % 3]
                this.t(col, row, f, 0)
            }
        }

        // ── 2. MURALLAS EXTERIORES ──
        const portonCol = Math.floor(COLS / 2)

        // Muro norte (fila 0)
        for (let col = 0; col < COLS; col++) {
            this.t(col, 0, WALLT[col % 3], 5)
        }
        // Muro sur (fila ROWS-1) con hueco de 1 tile para portón
        for (let col = 0; col < COLS; col++) {
            if (col !== portonCol) {
                this.t(col, ROWS - 1, WALL[col % 3], 5)
            }
        }
        // Muros este y oeste
        for (let row = 1; row < ROWS - 1; row++) {
            this.t(0, row, WALLV[row % 3], 5)
            this.t(COLS - 1, row, WALLV[row % 3], 5)
        }

        // ── 3. CAMINO CENTRAL (tierra) ──
        const pathStart = 3
        const pathEnd = ROWS - 2
        for (let row = pathStart; row <= pathEnd; row++) {
            // 3 tiles de ancho: col-1, col, col+1
            this.t(portonCol - 1, row, PATH[0], 1)
            this.t(portonCol,     row, PATH[1], 1)
            this.t(portonCol + 1, row, PATH[2], 1)
        }

        // ── 4. CASINO (centro, 3x2 tiles) ──
        const cCol = Math.floor(COLS / 2)
        const cRow = Math.floor(ROWS / 2) - 1

        // Tejado (fila superior): frames rojos 52, 53, 54
        this.t(cCol - 1, cRow,     52, 4)
        this.t(cCol,     cRow,     53, 4)
        this.t(cCol + 1, cRow,     54, 4)

        // Pared (fila inferior): piedra gris 60, 61, 62
        this.t(cCol - 1, cRow + 1, 60, 4)
        this.t(cCol,     cRow + 1, 61, 4)
        this.t(cCol + 1, cRow + 1, 62, 4)

        // Tejado segunda fila: 64, 65, 66
        this.t(cCol - 1, cRow + 2, 64, 4)
        this.t(cCol,     cRow + 2, 65, 4)
        this.t(cCol + 1, cRow + 2, 66, 4)

        // Letrero
        this.add.text(
            cCol * TILE + TILE / 2,
            (cRow - 1) * TILE + TILE / 2,
            'CASINO',
            { fontSize: '14px', fill: '#ffd700', fontFamily: 'serif', stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(6)

        // Zona interactiva casino
        const casinoZone = this.add.zone(
            cCol * TILE + TILE / 2,
            (cRow + 1) * TILE + TILE / 2,
            TILE * 3, TILE * 3
        ).setInteractive({ useHandCursor: true }).setDepth(6)

        casinoZone.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('CasinoScene', {
                    nickname: this.nickname,
                    monedes: this.monedes,
                    dia: this.dia,
                    millores: this.millores
                })
            })
        })

        // ── 5. EDIFICIOS LATERALES (2x2) ──
        // Izquierdo
        const lCol = 4, lRow = Math.floor(ROWS / 2) - 1
        this.t(lCol,     lRow,     52, 4)
        this.t(lCol + 1, lRow,     54, 4)
        this.t(lCol,     lRow + 1, 60, 4)
        this.t(lCol + 1, lRow + 1, 62, 4)

        // Derecho
        const rCol = COLS - 6, rRow = Math.floor(ROWS / 2) - 1
        this.t(rCol,     rRow,     52, 4)
        this.t(rCol + 1, rRow,     54, 4)
        this.t(rCol,     rRow + 1, 60, 4)
        this.t(rCol + 1, rRow + 1, 62, 4)

        // ── 6. PORTÓN (centro muro sur) ──
        const porton = this.t(portonCol, ROWS - 1, 99, 6)
        porton.setInteractive({ useHandCursor: true })
        this.tweens.add({ targets: porton, alpha: { from: 1, to: 0.7 }, duration: 900, yoyo: true, repeat: -1 })
        porton.on('pointerover', () => porton.setTint(0xffff88))
        porton.on('pointerout', () => porton.clearTint())
        porton.on('pointerdown', () => {
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('CasinoScene', {
                    nickname: this.nickname,
                    monedes: this.monedes,
                    dia: this.dia,
                    millores: this.millores
                })
            })
        })

        // ── 7. ÁRBOLES EN ESQUINAS (frame 19 = verde sólido, sin negro) ──
        const treeFrame = 19 // verde sólido verificado, dark=0.04
        this.t(2,         2,         treeFrame, 3)
        this.t(COLS - 3,  2,         treeFrame, 3)
        this.t(2,         ROWS - 3,  treeFrame, 3)
        this.t(COLS - 3,  ROWS - 3,  treeFrame, 3)
    }
}
