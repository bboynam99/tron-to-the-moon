
class Scene {

    constructor() {
        console.log("asdfasf");
    }

    create() {

        console.log("create")

        this.add.image(400, 300, 'background');
        this.scoreText = this.add.text(8, 576, 'Value: ' + score + ' TRX', { fontSize: '16px', fill: '#fff' });
        this.levelText = this.add.text(8, 12, 'Level: ' + level, { fontSize: '24px', fill: '#fff' });
        this.centerText = this.add.text(300, 100, '', { fontSize: '48px', fill: '#C52F27' });

        this.player = this.physics.add.sprite(400, 530, 'player');
        this.player.setCollideWorldBounds(true);

        this.buys = this.physics.add.group({
            velocityY: 150
        });
        this.sells = this.physics.add.group({
            velocityY: 150
        });
        this.bullets = this.physics.add.group({
            velocityY: -750
        });

        this.physics.add.overlap(this.player, this.buys, this.hitBuy, null, this);
        this.physics.add.overlap(this.player, this.sells, this.hitSell, null, this);
        this.physics.add.overlap(this.bullets, this.buys, this.shootEntity, null, this);
        this.physics.add.overlap(this.bullets, this.sells, this.shootEntity, null, this);
    }

    update() {
        // Movement
        if (this.keys.left.isDown)
            this.player.setVelocityX(-400);
        else if (this.keys.right.isDown)
            this.player.setVelocityX(400);
        else
            this.player.setVelocityX(0);

        // Shooting
        if (this.keys.space.isDown && this.time.now > nextFireTime && score > 0) {
            this.bullets.add(this.physics.add.sprite(this.player.x, this.player.y, 'trxcoin'));
            nextFireTime = this.time.now + 500;
            this.updateScore(-1);
        }

        // Center text reset
        if (this.time.now > centerTextTimeout)
            this.centerText.setText('');

        // Level up
        if (this.buysForLevel === 0 && this.sellsForLevel === 0 && this.tweetsForLevel === 0 && this.goodNewsForLevel === 0 &&
            this.badNewsForLevel === 0 && this.whalesForLevel === 0) {
            level++;
            this.levelText.setText('Level: ' + level);
            if (this.level != 1) {
                this.centerText.setText('Level up!');
                this.centerTextTimeout = this.time.now + 2000;
            }
            // Todo: increase buys and sells speed
            this.buys.velocityY += 500;

            var buysAndSells = 10 + level * 5;
            buysForLevel = buysAndSells;
            sellsForLevel = buysAndSells;
        }

        // Spawning stuff
        if (this.time.now > nextSpawnTime) {
            console.log(this);
            for (var i = 0; i < this.getRandomBetween(0, maxEntitiesPerRow + 1); i++) {
                var usedX = [];
                var x = this.getRandomX();
                while (this.arrayContains(usedX, x))
                    x = this.getRandomX();

                if (buysForLevel > 0 && sellsForLevel > 0) {
                    if (this.getRandomBetween(1, 2) == 1) {
                        buys.add(this.physics.add.sprite(x, -30, 'buy'));
                        buysForLevel--;
                    } else {
                        sells.add(this.physics.add.sprite(x, -30, 'sell'));
                        sellsForLevel--;
                    }
                } else if(buysForLevel > 0) {
                    buys.add(this.physics.add.sprite(x, -30, 'buy'));
                    buysForLevel--;
                } else if(sellsForLevel > 0) {
                    sells.add(this.physics.add.sprite(x, -30, 'sell'));
                    sellsForLevel--;
                }
                usedX.push(x);
            }
            nextSpawnTime = this.time.now + 1000;
        }
    }

    preload() {
        console.log("preload");
        this.keys = this.input.keyboard.createCursorKeys();
        this.load.image('background', 'assets/background.png');
        this.load.image('player', 'assets/player.png');
        this.load.image('buy', 'assets/buy.png');
        this.load.image('sell', 'assets/sell.png');
        this.load.image('trxcoin', 'assets/trxcoin.png');
    }

    init() {
        this.level = 0;
        this.score = 0;
        this.buysForLevel = 0;
        this.sellsForLevel = 0;
        this.tweetsForLevel = 0;
        this.goodNewsForLevel = 0;
        this.badNewsForLevel = 0;
        this.whalesForLevel = 0;
        this.nextFireTime = 0;
        this.nextSpawnTime = 0;
        this.maxEntitiesPerRow = 3;
        this.centerTextTimeout = 0;
    }

    getRandomX() {
        return getRandomBetween(1, 24) * 32;
    }

    shootEntity(bullet, entity) {
        this.bullet.disableBody(true, true);
        this.entity.disableBody(true, true);
    }

    hitBuy(player, buy) {
        this.buy.disableBody(true, true);
        this.updateScore(10);
    }

    hitSell(player, sell) {
        this.sell.disableBody(true, true);
        this.updateScore(-10);
    }

    updateScore(amount) {
        this.score += amount;
        this.scoreText.setText('Value: ' + score + ' TRX');
    }

    arrayContains(array, element) {
        for (var i = 0; i < array.length; i++)
            if (array[i] === element)
                return true;
        return false;
    }

    getRandomBetween(min, max) {
        return Math.floor((Math.random() * max) + min)
    }
}



var config = {
    type: Phaser.AUTO,
    width: 800,
    parent: 'phaser-game',
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        },
    },
};

var game = new Phaser.Game(config);

setTimeout(() => {
    console.log("game", game);
    game.state.add("main", Scene);
    game.state.start("main");
}, 500);


