import Phaser from 'phaser'

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
    }

    create() {
        this.width = this.scale.width
        this.height = this.scale.height

        // Fons estrellat
        this.stars = []
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Phaser.Math.Between(0, this.width),
                y: Phaser.Math.Between(0, this.height),
                speed: Phaser.Math.FloatBetween(0.5, 2)
            })
        }

        // Jugador
        this.player = this.add.rectangle(
            this.width / 2, this.height - 60,
            40, 40, 0x00ff88
        )
        this.physics.add.existing(this.player)
        this.player.body.setCollideWorldBounds(true)

        // Trets
        this.bullets = this.physics.add.group()

        // Enemics
        this.enemies = this.physics.add.group()
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        })

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        )

        // Score
        this.score = 0
        this.scoreText = this.add.text(16, 16, 'Punts: 0', {
            fontSize: '18px', fill: '#00ff88'
        })

        // Col·lisions
        this.physics.add.overlap(
            this.bullets, this.enemies,
            this.hitEnemy, null, this
        )
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(30, this.width - 30)
        const type = Phaser.Math.Between(0, 2)
        const enemy = this.add.rectangle(x, 20, 36, 36, 0xff4444)
        this.physics.add.existing(enemy)
        enemy.enemyType = type
        enemy.startX = x
        enemy.t = 0
        enemy.body.setVelocityY(type === 0 ? 200 : 120)
        this.enemies.add(enemy)
    }

    shoot() {
        const bullet = this.add.rectangle(
            this.player.x, this.player.y - 30,
            6, 16, 0xffff00
        )
        this.physics.add.existing(bullet)
        bullet.body.setVelocityY(-500)
        this.bullets.add(bullet)
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy()
        enemy.destroy()
        this.score += 10
        this.scoreText.setText('Punts: ' + this.score)
    }

    update() {
        // Moviment jugador
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-300)
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(300)
        } else {
            this.player.body.setVelocityX(0)
        }

        // Tret
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.shoot()
        }

        // Patrons enemics
        this.enemies.getChildren().forEach(enemy => {
            enemy.t += 0.05
            if (enemy.enemyType === 1) {
                // Zig-zag
                enemy.x = enemy.startX + Math.sin(enemy.t * 3) * 80
            } else if (enemy.enemyType === 2) {
                // Caçador
                const dir = this.player.x < enemy.x ? -1 : 1
                enemy.x += dir * 2
            }

            // Eliminar si surt de pantalla
            if (enemy.y > this.height + 20) {
                enemy.destroy()
            }
        })

        // Eliminar bales fora de pantalla
        this.bullets.getChildren().forEach(b => {
            if (b.y < -20) b.destroy()
        })
    }
}