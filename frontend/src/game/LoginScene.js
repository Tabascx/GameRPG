import Phaser from 'phaser'

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' })
    }

    create() {
        const { width, height } = this.scale
        this.enterHandler = () => this.entrar()

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
        this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this)

        // Fons
        this.add.rectangle(width/2, height/2, width, height, 0x1a1208)

        // Títol
        this.add.text(width/2, height/3, 'IRON GATE', {
            fontSize: '48px',
            fill: '#c9a227',
            fontFamily: 'serif',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5)

        this.add.text(width/2, height/3 + 60, 'El teu destí t\'espera...', {
            fontSize: '18px',
            fill: '#e8d5a3',
            fontFamily: 'serif',
            fontStyle: 'italic'
        }).setOrigin(0.5)

        // Input de nom (HTML)
        this.input_el = document.createElement('input')
        this.input_el.type = 'text'
        this.input_el.placeholder = 'Nom del presoner...'
        this.input_el.style.cssText = `
      position: absolute;
      left: 50%;
      top: 55%;
      transform: translate(-50%, -50%);
      width: 300px;
      padding: 12px;
      font-size: 18px;
      font-family: serif;
      background: #0d0a04;
      border: 2px solid #c9a227;
      color: #e8d5a3;
      text-align: center;
      outline: none;
    `
        document.body.appendChild(this.input_el)
        this.input_el.focus()

        // Botó entrar
        const btn = this.add.text(width/2, height/2 + 80, '[ ENTRAR ]', {
            fontSize: '24px',
            fill: '#c9a227',
            fontFamily: 'serif',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })

        btn.on('pointerover', () => btn.setFill('#ffd700'))
        btn.on('pointerout', () => btn.setFill('#c9a227'))
        btn.on('pointerdown', () => this.entrar())

        // Enter key
        this.input.keyboard.on('keydown-ENTER', this.enterHandler)
    }

    entrar() {
        const nom = this.input_el.value.trim()
        if (!nom) return
        this.shutdown()
        this.scene.start('RecinteScene', { nickname: nom })
    }

    shutdown() {
        if (this.input_el && document.body.contains(this.input_el)) {
            document.body.removeChild(this.input_el)
        }
        if (this.input?.keyboard && this.enterHandler) {
            this.input.keyboard.off('keydown-ENTER', this.enterHandler)
        }
    }

}