import Phaser from 'phaser'

// Mida de graella del spritesheet (32×32 per cel·la)
const S = 32

// Definició de frames: [nom, col, row, ample, alt] (en píxels dins la graella)
// El teu spritesheet ha de tenir aquests sprites en aquestes posicions:
const SPRITES = [
    ['ground',   0, 0, S, S],     // fila 0: tiles (32×32)
    ['wall',     1, 0, S, S],
    ['path',     2, 0, S, S],
    ['tree',     3, 0, S, 40],    // 32×40
    ['gate',     4, 0, S, S],
    ['hud_bg',   5, 0, 1, 44],
    ['player_0', 0, 1, 16, 24],   // fila 1: jugador (16×24)
    ['player_1', 1, 1, 16, 24],
    ['player_2', 2, 1, 16, 24],
    ['casino',   0, 2, 48, 48],   // fila 2: edificis (48×48)
    ['botiga',   1, 2, 48, 48],
    ['forja',    2, 2, 48, 48],
]

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' })
    }

    preload() {
        this.load.image('sprites', 'assets/sprites.png')
        const SUITS = ['Clubs', 'Diamonds', 'Hearts', 'Spades']
        const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.load.image(`card_${suit}_${rank}`, `assets/cards/card${suit}${rank}.png`)
            }
        }
        this.load.image('cardBack', 'assets/cards/cardBack_green4.png')
        this.load.image('cardJoker', 'assets/cards/cardJoker.png')
        this.load.image('casinoBg', 'assets/casino_matt.png')
        this.load.image('recinteBg', 'assets/background.png')
        for (let n = 1; n <= 6; n++) {
            this.load.image(`dau_${n}`, `assets/dice/dieWhite${n}.png`)
        }
    }

    create() {
        const data = this.scene.settings.data || {}
        const NEAREST = Phaser.Textures.FilterMode.NEAREST

        if (this.textures.exists('sprites')) {
            // Copiar cada frame del spritesheet a una textura individual
            const sheetImg = this.textures.get('sprites').getSourceImage()
            for (const [nom, cx, cy, w, h] of SPRITES) {
                if (cx * S + w > sheetImg.width || cy * S + h > sheetImg.height) continue
                const canvas = document.createElement('canvas')
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext('2d')
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(sheetImg, cx * S, cy * S, w, h, 0, 0, w, h)
                this.textures.addCanvas(nom, canvas)
                this.textures.get(nom).setFilter(NEAREST)
            }
        } else {
            // Fallback procedural
            this.genFallback()
            for (const key of ['ground', 'wall', 'path', 'player_0', 'player_1', 'player_2',
                'casino', 'botiga', 'forja', 'tree', 'gate', 'hud_bg']) {
                if (this.textures.exists(key)) this.textures.get(key).setFilter(NEAREST)
            }
        }

        this.scene.start('RecinteScene', data)
    }

    genFallback() {
        // Tiles
        const mt = (n, c1, c2) => {
            const g = this.make.graphics()
            g.fillStyle(c1); g.fillRect(0, 0, S, S)
            g.fillStyle(c2, 0.4)
            for (const [x, y, w, h] of [[2,2,12,10],[18,4,10,8],[6,16,14,10],[24,18,6,8],[0,24,8,6],[14,26,10,4]]) g.fillRect(x,y,w,h)
            g.generateTexture(n, S, S); g.destroy()
        }
        mt('ground', 0x1a3a0a, 0x224f10)
        mt('wall', 0x555555, 0x666666)
        mt('path', 0x6b5a3a, 0x7a694a)

        // Jugador
        for (let f = 0; f < 3; f++) {
            const g = this.make.graphics()
            const ofs = f === 1 ? 1 : f === 2 ? -1 : 0
            g.fillStyle(0x000000,0.2); g.fillEllipse(8,23,14,4)
            g.fillStyle(0x334433); g.fillRect(4,15,3,5+ofs); g.fillRect(9,15,3,5-ofs)
            g.fillStyle(0x553322); g.fillRect(3,19+ofs,4,2); g.fillRect(9,19-ofs,4,2)
            g.fillStyle(0x2255aa); g.fillRect(3,7,10,9); g.fillRect(1,8,2,6); g.fillRect(13,8,2,6)
            g.fillStyle(0xf5cba7); g.fillRect(6,6,4,2); g.fillRect(4,0,8,7)
            g.fillStyle(0x6b3a1a); g.fillRect(4,0,8,3); g.fillRect(3,2,10,2)
            g.fillStyle(0xffffff); g.fillRect(5,3,2,2); g.fillRect(9,3,2,2)
            g.fillStyle(0x000000); g.fillRect(6,4,1,1); g.fillRect(10,4,1,1)
            g.fillStyle(0x000000,0.3); g.fillRect(7,5,2,1)
            g.generateTexture('player_'+f,16,24); g.destroy()
        }

        // Edificis
        const mb = (n, r, w) => {
            const g = this.make.graphics()
            g.fillStyle(w); g.fillRect(2,20,44,28)
            g.fillStyle(0xffffff,0.06); g.fillRect(4,22,14,8); g.fillRect(22,22,12,8); g.fillRect(38,24,6,6)
            g.fillStyle(r); g.fillTriangle(0,24,24,0,48,24); g.fillRect(0,20,48,6)
            g.fillStyle(0xcccccc,0.5); g.fillRect(0,20,48,2)
            g.fillStyle(0x000000,0.2); g.fillTriangle(4,22,24,4,44,22)
            g.fillStyle(0x1a0a00); g.fillRect(18,36,12,12)
            g.fillStyle(0xffd700); g.fillCircle(27,42,1.5)
            g.fillStyle(0xffff88,0.6); g.fillRect(6,26,10,8); g.fillRect(32,26,10,8)
            g.lineStyle(1,0x000000,0.4); g.strokeRect(6,26,10,8).strokeRect(32,26,10,8)
            g.lineBetween(11,26,11,34).lineBetween(37,26,37,34)
            g.lineBetween(6,30,16,30).lineBetween(32,30,42,30)
            g.fillStyle(0xffff00,0.15); g.fillRect(7,27,8,6); g.fillRect(33,27,8,6)
            g.generateTexture(n,48,48); g.destroy()
        }
        mb('casino', 0x8b2020, 0x4a1a1a)
        mb('botiga', 0x2a5a2a, 0x1a3a1a)
        mb('forja', 0x2a2a5a, 0x1a1a3a)

        // Arbre
        const t = this.make.graphics()
        t.fillStyle(0x5a3a1a); t.fillRect(13,26,6,14)
        t.fillStyle(0x1a5a0a); t.fillCircle(16,14,12)
        t.fillStyle(0x2a7a1a); t.fillCircle(12,10,8); t.fillCircle(20,10,8); t.fillCircle(16,6,6)
        t.generateTexture('tree',32,40); t.destroy()

        // Portó (reixes)
        const p = this.make.graphics()
        p.fillStyle(0x1a1208); p.fillRect(4, 2, 24, 28)
        p.fillStyle(0x666666)
        for (let bx = 6; bx < 28; bx += 6) {
            p.fillRect(bx, 4, 3, 24)
        }
        p.fillStyle(0x888888); p.fillRect(4, 6, 24, 3)
        p.fillStyle(0x888888); p.fillRect(4, 24, 24, 3)
        p.generateTexture('gate', S, S); p.destroy()

        // HUD
        const h = this.make.graphics()
        h.fillStyle(0x000000,0.75); h.fillRect(0,0,1,44)
        h.lineStyle(1,0xc9a227,0.5); h.lineBetween(0,44,1,44)
        h.generateTexture('hud_bg',1,44); h.destroy()
    }
}
