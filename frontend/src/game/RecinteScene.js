import Phaser from 'phaser'

export default class RecinteScene extends Phaser.Scene {
    constructor() {
        super({key: 'RecinteScene'})
    }

    init(data) {
        this.nickname = data.nickname || 'Presoner'
        this.monedes = data.monedes || 400
        this.dia = data.dia || 1
        this.millores = data.millores || []
    }

    preload() {
        this.load.spritesheet('town', '/assets/town.png', {
            frameWidth: 16,
            frameHeight: 16
        })
    }

    create() {
        const {width, height} = this.scale
        const TILE = 32
        const COLS = 25
        const ROWS = 20

        // Dibuixa el recinte amb tiles
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

    drawRecinte(TILE, COLS, ROWS) {
        const {width, height} = this.scale

        // ============ CAPA DE SUELO BASE - HIERBA ============
        // Hierba con textura orgánica alternando frames 0, 1, 2, 4, 5
        const grassFrames = [0, 1, 2, 4, 5]
        for (let row = 1; row < ROWS - 1; row++) {
            for (let col = 1; col < COLS - 1; col++) {
                const grassFrame = grassFrames[Phaser.Math.Between(0, grassFrames.length - 1)]
                this.add.image(
                    col * TILE + TILE / 2,
                    row * TILE + TILE / 2,
                    'town',
                    grassFrame
                ).setScale(2).setDepth(0)
            }
        }

        // ============ MURALLAS EXTERIORES - PIEDRA GRIS ============
        // Muros horizontales (norte y sur) - frames 96, 97, 98, 99
        const horWallFrames = [96, 97, 98, 99]
        for (let col = 1; col < COLS - 1; col++) {
            const wallFrame = horWallFrames[Phaser.Math.Between(0, horWallFrames.length - 1)]
            this.add.image(col * TILE + TILE / 2, TILE / 2, 'town', wallFrame).setScale(2).setDepth(5)
            
            // Muro sur con hueco para portón (4 tiles en el centro)
            const portonStart = Math.floor(COLS / 2) - 2
            const portonEnd = Math.floor(COLS / 2) + 2
            if (col < portonStart || col > portonEnd) {
                const wallFrame2 = horWallFrames[Phaser.Math.Between(0, horWallFrames.length - 1)]
                this.add.image(col * TILE + TILE / 2, (ROWS - 1) * TILE + TILE / 2, 'town', wallFrame2).setScale(2).setDepth(5)
            }
        }

        // Muros verticales (este y oeste) - frames 96, 108, 120
        const verWallFrames = [96, 108, 120]
        for (let row = 1; row < ROWS - 1; row++) {
            const wallFrame1 = verWallFrames[Phaser.Math.Between(0, verWallFrames.length - 1)]
            const wallFrame2 = verWallFrames[Phaser.Math.Between(0, verWallFrames.length - 1)]
            this.add.image(TILE / 2, row * TILE + TILE / 2, 'town', wallFrame1).setScale(2).setDepth(5)
            this.add.image((COLS - 1) * TILE + TILE / 2, row * TILE + TILE / 2, 'town', wallFrame2).setScale(2).setDepth(5)
        }

        // Esquinas - usar primer frame de muro horizontal
        this.add.image(TILE / 2, TILE / 2, 'town', 96).setScale(2).setDepth(5)
        this.add.image((COLS - 1) * TILE + TILE / 2, TILE / 2, 'town', 96).setScale(2).setDepth(5)
        this.add.image(TILE / 2, (ROWS - 1) * TILE + TILE / 2, 'town', 96).setScale(2).setDepth(5)
        this.add.image((COLS - 1) * TILE + TILE / 2, (ROWS - 1) * TILE + TILE / 2, 'town', 96).setScale(2).setDepth(5)

        // ============ EDIFICIOS (ESQUINAS SUPERIORES) ============
        // Edificio superior izquierdo (2x2)
        this.drawBuilding(2, 2, TILE, 'Smithy')
        // Edificio superior derecho (2x2)
        this.drawBuilding(COLS - 4, 2, TILE, 'Armory')

        // ============ CAMINO CENTRAL - TIERRA/MARRON ============
        const pathCenterCol = Math.floor(COLS / 2)
        const pathStartRow = 3
        const pathEndRow = ROWS - 2
        const caminoFrames = [25, 36, 37, 38]

        // Camino vertical (tierra marrón)
        for (let row = pathStartRow; row <= pathEndRow; row++) {
            const caminoFrame = caminoFrames[Phaser.Math.Between(0, caminoFrames.length - 1)]
            this.add.image(pathCenterCol * TILE + TILE / 2, row * TILE + TILE / 2, 'town', caminoFrame).setScale(2).setDepth(1)
        }

        // Bordes del camino - hierba en lugar de frames vacíos
        for (let row = pathStartRow; row <= pathEndRow; row++) {
            const grassL = grassFrames[Phaser.Math.Between(0, grassFrames.length - 1)]
            const grassR = grassFrames[Phaser.Math.Between(0, grassFrames.length - 1)]
            this.add.image((pathCenterCol - 1) * TILE + TILE / 2, row * TILE + TILE / 2, 'town', grassL).setScale(2).setDepth(1)
            this.add.image((pathCenterCol + 1) * TILE + TILE / 2, row * TILE + TILE / 2, 'town', grassR).setScale(2).setDepth(1)
        }

        // Cruce central - tierra
        const cruxFrame = caminoFrames[Phaser.Math.Between(0, caminoFrames.length - 1)]
        this.add.image(pathCenterCol * TILE + TILE / 2, Math.floor(ROWS / 2) * TILE + TILE / 2, 'town', cruxFrame).setScale(2).setDepth(2)

        // ============ CASINO (CENTRO) ============
        this.drawCasinoBuilding(TILE, COLS, ROWS)

        // ============ DECORACIÓN: FAROLAS ============
        const farolaFrames = [44, 45, 46]
        const farolaPositions = [
            {x: 2, y: 5},
            {x: COLS - 3, y: 5},
            {x: 2, y: ROWS - 4},
            {x: COLS - 3, y: ROWS - 4}
        ]

        farolaPositions.forEach(pos => {
            const farolaFrame = farolaFrames[Phaser.Math.Between(0, farolaFrames.length - 1)]
            const img = this.add.image(pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2, 'town', farolaFrame).setScale(2).setDepth(6)
            
            // Parpadeo suave
            this.tweens.add({
                targets: img,
                alpha: {from: 1, to: 0.7},
                duration: 800,
                yoyo: true,
                repeat: -1
            })

            // Luz simulada alrededor de farola
            const luz = this.add.circle(pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2, 40, 0xffd700, 0.08).setDepth(0)
            this.tweens.add({
                targets: luz,
                alpha: {from: 0.12, to: 0.04},
                duration: 800,
                yoyo: true,
                repeat: -1
            })
        })

        // ============ DECORACIÓN: HIERBA ADICIONAL (sin frames vacíos) ============
        // Mantener las zonas de hierba pero sin elementos decorativos que usen frames vacíos

        // ============ POZO/BARRIL ============
        const pocoFrames = [80, 81, 82, 83]
        const pozX = 3
        const pozY = Math.floor(ROWS / 2)
        const pozFrame = pocoFrames[Phaser.Math.Between(0, pocoFrames.length - 1)]
        this.add.image(pozX * TILE + TILE / 2, pozY * TILE + TILE / 2, 'town', pozFrame).setScale(2).setDepth(4)

        // ============ PORTÓN PRINCIPAL (CENTRO MURO SUR) ============
        this.drawPorton(pathCenterCol, ROWS - 1, TILE)
    }

    drawBuilding(startCol, startRow, TILE, name) {
        // Base del edificio 2x2 - frames 48, 49, 50, 60, 61, 62
        const baseFrames = [48, 49, 50, 60, 61, 62]
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const frame = baseFrames[Phaser.Math.Between(0, baseFrames.length - 1)]
                this.add.image(
                    (startCol + j) * TILE + TILE / 2,
                    (startRow + i) * TILE + TILE / 2,
                    'town',
                    frame
                ).setScale(2).setDepth(4)
            }
        }

        // Tejado rojo encima - frames 52, 54, 64, 66
        const roofFrames = [52, 54, 64, 66]
        for (let i = 0; i < 2; i++) {
            const frame = roofFrames[Phaser.Math.Between(0, roofFrames.length - 1)]
            this.add.image(
                (startCol + i) * TILE + TILE / 2,
                (startRow - 1) * TILE + TILE / 2,
                'town',
                frame
            ).setScale(2).setDepth(5)
        }

        // Tierra oscura base - frames 27, 39, 40, 41
        const darkEarthFrames = [27, 39, 40, 41]
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const frame = darkEarthFrames[Phaser.Math.Between(0, darkEarthFrames.length - 1)]
                this.add.image(
                    (startCol + j) * TILE + TILE / 2,
                    (startRow + 2) * TILE + TILE / 2,
                    'town',
                    frame
                ).setScale(2).setDepth(3)
            }
        }
    }

    drawCasinoBuilding(TILE, COLS, ROWS) {
        const centerCol = Math.floor(COLS / 2)
        const centerRow = Math.floor(ROWS / 2)

        // Base de tierra oscura - frames 27, 39, 40, 41
        const darkEarthFrames = [27, 39, 40, 41]
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const frame = darkEarthFrames[Phaser.Math.Between(0, darkEarthFrames.length - 1)]
                this.add.image(
                    (centerCol + i) * TILE + TILE / 2,
                    (centerRow + j) * TILE + TILE / 2,
                    'town',
                    frame
                ).setScale(2).setDepth(2)
            }
        }

        // Edificio grande 3x3 - pared frames 48, 49, 50, 60, 61, 62
        const wallFrames = [48, 49, 50, 60, 61, 62]
        for (let i = -1; i <= 1; i++) {
            const frame = wallFrames[Phaser.Math.Between(0, wallFrames.length - 1)]
            this.add.image(
                (centerCol + i) * TILE + TILE / 2,
                (centerRow) * TILE + TILE / 2,
                'town',
                frame
            ).setScale(2).setDepth(3)
        }

        // Tejado rojo (frames 52, 54, 64, 66)
        const roofFrames = [52, 54, 64, 66]
        for (let i = -1; i <= 1; i++) {
            const frame = roofFrames[Phaser.Math.Between(0, roofFrames.length - 1)]
            this.add.image(
                (centerCol + i) * TILE + TILE / 2,
                (centerRow - 1) * TILE + TILE / 2,
                'town',
                frame
            ).setScale(2).setDepth(4)
        }

        // Nivel medio - pared frames
        for (let i = -1; i <= 1; i++) {
            const frame = wallFrames[Phaser.Math.Between(0, wallFrames.length - 1)]
            this.add.image(
                (centerCol + i) * TILE + TILE / 2,
                (centerRow + 1) * TILE + TILE / 2,
                'town',
                frame
            ).setScale(2).setDepth(4)
        }

        // Puerta central - usar frame de pared
        const doorFrame = wallFrames[Phaser.Math.Between(0, wallFrames.length - 1)]
        this.add.image(
            centerCol * TILE + TILE / 2,
            (centerRow + 2) * TILE + TILE / 2,
            'town',
            doorFrame
        ).setScale(2).setDepth(5)

        // Letrero "CASINO" en dorado
        this.add.text(
            centerCol * TILE + TILE / 2,
            (centerRow - 3) * TILE + TILE / 2,
            '🎰 CASINO 🎰',
            {
                fontSize: '16px',
                fill: '#ffd700',
                fontFamily: 'serif',
                stroke: '#000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(6)

        // Elemento decorativo superior - usar frame de farola/pozo
        const pocoFrames = [80, 81, 82, 83]
        const topDecor = pocoFrames[Phaser.Math.Between(0, pocoFrames.length - 1)]
        this.add.image(
            (centerCol + 2) * TILE + TILE / 2,
            (centerRow - 2) * TILE + TILE / 2,
            'town',
            topDecor
        ).setScale(2).setDepth(6)
    }

    drawPorton(col, row, TILE) {
        const x = col * TILE + TILE / 2
        const y = row * TILE + TILE / 2

        // Marco del portón - usar frame de tierra para portón
        const portonFrame = 25
        const porton = this.add.image(x, y, 'town', portonFrame).setScale(2).setDepth(6)
        porton.setInteractive({useHandCursor: true})

        // Animación de brillo/pulso
        this.tweens.add({
            targets: porton,
            alpha: {from: 1, to: 0.7},
            duration: 1000,
            yoyo: true,
            repeat: -1
        })

        // Luz del portón
        const luz = this.add.circle(x, y - TILE, 50, 0xffd700, 0.12).setDepth(5)
        this.tweens.add({
            targets: luz,
            alpha: {from: 0.18, to: 0.06},
            duration: 1000,
            yoyo: true,
            repeat: -1
        })

        // Interacción: fade negro → CasinoScene
        porton.on('pointerover', () => {
            porton.setTint(0xffff88)
        })
        porton.on('pointerout', () => {
            porton.clearTint()
        })
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
    }
}
