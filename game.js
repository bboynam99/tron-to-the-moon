class Scene {
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
        this.centerTextTimeout = 0;

        this.maxEntitiesPerRow = 2;
        this.velocityWeight = 0;
    }

    preload() {
        this.keys = this.input.keyboard.createCursorKeys();
        this.load.image('background', 'assets/background.png');
        this.load.image('player', 'assets/player.png');

        this.load.image('buy', 'assets/buy.png');
        this.load.image('sell', 'assets/sell.png');
        this.load.image('tweet', 'assets/tweet.png');
        this.load.image('whale', 'assets/whale.png');

        this.load.image('litecoin', 'assets/litecoin.png');
        this.load.image('eos', 'assets/eos.png');
        this.load.image('ripple', 'assets/ripple.png');
        this.load.image('ethereum', 'assets/ethereum.png');
        this.load.image('bitcoin', 'assets/bitcoin.png');

        this.load.image('trxcoin', 'assets/trxcoin.png');
    }

    create() {
        this.add.image(400, 300, 'background');
        this.scoreText = this.add.text(8, 576, 'Value: ' + this.score + ' TRX', { fontSize: '16px', fill: '#fff' });
        this.levelText = this.add.text(8, 12, 'Level: ' + this.level, { fontSize: '24px', fill: '#fff' });
        this.bossHealthText = this.add.text(0, 12, '', { fontSize: '24px', fill: '#fff' });
        this.bossHealthText.x = 792 - this.bossHealthText.width;
        this.centerText = this.add.text(300, 100, '', { fontSize: '48px', fill: '#C52F27' });

        this.player = this.physics.add.sprite(400, 530, 'player');
        this.player.setCollideWorldBounds(true);

        this.buys = this.physics.add.group();
        this.sells = this.physics.add.group();
        this.tweets = this.physics.add.group();
        this.whales = this.physics.add.group();
        this.bullets = this.physics.add.group();

        this.boss = null;

        this.physics.add.overlap(this.player, this.buys, this.hitBuy, null, this);
        this.physics.add.overlap(this.player, this.sells, this.hitSell, null, this);
        this.physics.add.overlap(this.player, this.tweets, this.hitTweet, null, this);
        this.physics.add.overlap(this.bullets, this.buys, this.shootEntity, null, this);
        this.physics.add.overlap(this.bullets, this.sells, this.shootEntity, null, this);
    }

    update() {
        this.handleMovement();
        this.handleShooting();
        this.handleGarbage();
        this.handleTweetMovement();
        this.handleWhaleMovement();
        this.handleBossMovement();

        if (this.levelHasEnded())
            if (this.bossFightPending())
                this.startBossFight();
            else
                this.levelUp();

        this.spawnStuff();

        this.checkIfDead();

        if (this.time.now > this.centerTextTimeout)
            this.centerText.setText('');
    }

    handleMovement() {
        if (this.keys.left.isDown)
            this.player.setVelocityX(-400);
        else if (this.keys.right.isDown)
            this.player.setVelocityX(400);
        else
            this.player.setVelocityX(0);
    }

    handleShooting() {
        if (this.keys.space.isDown && this.time.now > this.nextFireTime && this.score > 0) {
            let bullet = this.physics.add.sprite(this.player.x, this.player.y, 'trxcoin');
            this.bullets.add(bullet);
            bullet.body.velocity.y = -750;
            this.nextFireTime = this.time.now + 500;
            this.updateScore(-1);
        }
    }

    handleGarbage() {
        Scene.removePassedItems(this.buys);
        Scene.removePassedItems(this.sells);
        Scene.removePassedItems(this.tweets);
        Scene.removePassedItems(this.whales);
        Scene.removePassedItems(this.bullets);
    }

    handleTweetMovement() {
        for (let i = 0; i < this.tweets.children.entries.length; i++) {
            let tweet = this.tweets.children.entries[i];
            if (this.time.now > tweet.nextSwitchTime ||
                (tweet.body.x <= 30 && tweet.body.velocity.x < 0) ||
                (tweet.body.x >= 770 && tweet.body.velocity.x > 0)) {
                if (tweet.body.velocity.x < 0)
                    tweet.body.velocity.x = 100;
                else
                    tweet.body.velocity.x = -100;
                tweet.scaleX *= -1;
                tweet.nextSwitchTime = this.time.now + Scene.getRandomBetween(20, 40) * 100;
            }
        }
    }

    handleWhaleMovement() {
        for (let i = 0; i < this.whales.children.entries.length; i++) {
            let whale = this.whales.children.entries[i];
            if (whale.body.y >= 200) {
                whale.body.velocity.x = 200;
                whale.body.velocity.y = -200;
                whale.body.rotation = 0;
            }
        }
    }

    handleBossMovement() {
        if (this.boss == null)
            return;

        // Dodge if necessary
        for (let bulletIndex = 0; bulletIndex < this.bullets.children.entries.length; bulletIndex++) {
            let bullet = this.bullets.children.entries[bulletIndex];
            if (bullet.body.y > this.boss.body.y &&
                bullet.body.x > this.boss.body.x - 45 &&
                bullet.body.x < this.boss.body.x + 105) {
                // Dodge
                if ((bullet.body.x < this.boss.body.x + 45 && bullet.body.x <= 650) || bullet.body.x <= 100)
                    this.boss.body.velocity.x = 300;
                else
                    this.boss.body.velocity.x = -300;
                return;
            }
        }
        this.boss.body.velocity.x = 0;
    }

    levelHasEnded() {
        return this.buysForLevel === 0 && this.sellsForLevel === 0 && this.tweetsForLevel === 0 &&
            this.goodNewsForLevel === 0 && this.badNewsForLevel === 0 && this.whalesForLevel === 0 &&
            this.boss === null;
    }

    bossFightPending() {
        return this.level > 0 && this.level % 5 === 0;
    }

    levelUp() {
        this.bossHealthText.setText('');
        this.level++;
        this.velocityWeight = this.level + 9;

        this.levelText.setText('Level: ' + this.level);
        if (this.level !== 1) {
            this.centerText.setText('Level up!');
            this.centerTextTimeout = this.time.now + 2000;
        }

        if (this.level % 5 === 0)
            this.maxEntitiesPerRow++;

        let buysAndSells = 50 + this.level * 15;
        this.buysForLevel = buysAndSells;
        this.sellsForLevel = buysAndSells;

        if (this.level == 1) {
            // For testing purposes
            this.tweetsForLevel = 100;
        }

        if (this.level >= 3)
            this.tweetsForLevel = (this.level - 2) * 2;

        if (this.level >= 8) {
            let goodAndBadNews = (this.level - 7) * 2;
            this.goodNewsForLevel = goodAndBadNews;
            this.badNewsForLevel = goodAndBadNews;
        }

        if (this.level >= 13)
            this.whalesForLevel = (this.level - 12);
    }

    startBossFight() {
        if (this.level === 5) {
            this.boss = this.physics.add.sprite(400, 70, 'litecoin');
            this.boss.health = 100;
            this.boss.fullname = 'Litecoin';
            this.boss.coinname = 'LTC';
        } else if (this.level === 10) {
            this.boss = this.physics.add.sprite(400, 70, 'eos');
            this.boss.health = 100;
            this.boss.fullname = 'EOS';
            this.boss.coinname = 'EOS';
        } else if (this.level === 15) {
            this.boss = this.physics.add.sprite(400, 70, 'ripple');
            this.boss.health = 100;
            this.boss.fullname = 'Ripple';
            this.boss.coinname = 'XRP';
        } else if (this.level === 20) {
            this.boss = this.physics.add.sprite(400, 70, 'ethereum');
            this.boss.health = 100;
            this.boss.fullname = 'Ethereum';
            this.boss.coinname = 'ETH';
        } else if (this.level === 25) {
            this.boss = this.physics.add.sprite(400, 70, 'bitcoin');
            this.boss.health = 100;
            this.boss.fullname = 'Bitcoin';
            this.boss.coinname = 'BTC';
        } else
            return;

        this.physics.add.overlap(this.bullets, this.boss, this.shootBoss, null, this);
        this.levelText.setText('Level: ' + this.boss.fullname);
        this.updateBossHealth(0);
    }

    spawnStuff() {
        if (this.time.now > this.nextSpawnTime) {
            this.spawnAnyEntity();
            this.nextSpawnTime = this.time.now + 850 - (this.velocityWeight * 10);
        }
    }

    spawnAnyEntity() {
        let buysRange = this.buysForLevel / 5;
        let sellsRange = buysRange + this.sellsForLevel / 5;
        let tweetsRange = sellsRange + this.tweetsForLevel;
        let goodNewsRange = tweetsRange + this.goodNewsForLevel;
        let badNewsRange = goodNewsRange + this.badNewsForLevel;
        let whalesRange = badNewsRange + this.whalesForLevel;
        let rangeLimit = whalesRange * 1.1;

        let randomPointInRange = Scene.getRandomBetween(0, rangeLimit);
        if (randomPointInRange < buysRange)
            this.spawnBuySellLine('buy');
        else if (randomPointInRange < sellsRange)
            this.spawnBuySellLine('sell');
        else if (randomPointInRange < tweetsRange)
            this.spawnTweet();
        else if (randomPointInRange < goodNewsRange)
            this.spawnGoodNews();
        else if (randomPointInRange < badNewsRange)
            this.spawnBadNews();
        else if (randomPointInRange < whalesRange)
            this.spawnWhale();
        // else line will be empty
    }

    spawnBuySellLine(initialEntity) {
        let occupiedColumns = [];
        let x = Scene.getRandomColumnForEntity();
        occupiedColumns.push(x);
        if (initialEntity === 'buy')
            this.spawnBuy(x);
        else
            this.spawnSell(x);

        for (let i = 0; i < Scene.getRandomBetween(0, this.maxEntitiesPerRow); i++) {
            let buysRange = this.buysForLevel;
            let sellsRange = buysRange + this.sellsForLevel;
            let rangeLimit = sellsRange * 1.2;

            let randomPointInRange = Scene.getRandomBetween(0, rangeLimit);
            if (randomPointInRange < buysRange) {
                while (Scene.arrayContains(occupiedColumns, x))
                    x = Scene.getRandomColumnForEntity();
                occupiedColumns.push(x);
                this.spawnBuy(x);
            }
            else if (randomPointInRange < sellsRange) {
                while (Scene.arrayContains(occupiedColumns, x))
                    x = Scene.getRandomColumnForEntity();
                occupiedColumns.push(x);
                this.spawnSell(x);
            }
            // else spot will be empty
        }
    }

    spawnBuy(x) {
        let buy = this.physics.add.sprite(x, -30, 'buy');
        this.buys.add(buy);
        buy.body.velocity.y = 15 * this.velocityWeight;
        this.buysForLevel--;
    }

    spawnSell(x) {
        let sell = this.physics.add.sprite(x, -30, 'sell');
        this.sells.add(sell);
        sell.body.velocity.y = 15 * this.velocityWeight;
        this.sellsForLevel--;
    }

    spawnTweet() {
        let tweet = this.physics.add.sprite(Scene.getRandomColumnForEntity(), -30, 'tweet');
        this.tweets.add(tweet);
        tweet.body.velocity.y = 5 * this.velocityWeight;
        tweet.body.velocity.x = 10 * this.velocityWeight;

        if (Scene.getRandomBetween(1, 2) === 1)
            tweet.nextSwitchTime = this.time.now + 3000;
        else
            tweet.nextSwitchTime = this.time.now;
        this.tweetsForLevel--;
    }

    spawnGoodNews() {
        for (let i = 1; i <= 6; i++) {
            let buy = this.physics.add.sprite(128 * i - 45, -30, 'buy');
            this.buys.add(buy);
            buy.body.velocity.y = 15 * this.velocityWeight;
        }
        this.goodNewsForLevel--;
    }

    spawnBadNews() {
        for (let i = 1; i <= 6; i++) {
            let sell = this.physics.add.sprite(128 * i - 45, -30, 'sell');
            this.sells.add(sell);
            sell.body.velocity.y = 15 * this.velocityWeight;
        }
        this.badNewsForLevel--;
    }

    spawnWhale() {
        let position = Scene.getRandomBetween(1, 3) * 200;
        let sellsHeadstart = (Scene.getRandomBetween(1, 2) - 1) * 300;

        // Buys bulk
        for (let i = 1; i <= 5; i++) {
            let buy = this.physics.add.sprite(position - 135 + 45 * i, -30, 'buy');
            this.buys.add(buy);
            buy.body.velocity.y = 15 * this.velocityWeight;
        }

        // Sells bulk
        for (let i = 1; i <= 5; i++) {
            let sell = this.physics.add.sprite(position - 135 + 45 * i, -650 + sellsHeadstart, 'sell');
            this.sells.add(sell);
            sell.body.velocity.y = 30 * this.velocityWeight;
        }

        // Whale
        let whale = this.physics.add.sprite(position, -680 + sellsHeadstart, 'whale');
        this.whales.add(whale);
        whale.body.velocity.y = 30 * this.velocityWeight;
        whale.rotation = 1;
        this.whalesForLevel--;
    }

    checkIfDead() {
        if (this.score < 0) {
            // Todo: die
        }
    }

    shootEntity(bullet, entity) {
        this.bullets.remove(bullet);
        bullet.disableBody(true, true);
        entity.disableBody(true, true);
    }

    shootBoss(boss, bullet) {
        this.bullets.remove(bullet);
        bullet.disableBody(true, true);
        this.updateBossHealth(-10);
        if (boss.health <= 0) {
            boss.disableBody(true, true);
            this.boss = null;
            this.levelUp();
        }
    }

    hitBuy(player, buy) {
        buy.disableBody(true, true);
        this.updateScore(10);
    }

    hitSell(player, sell) {
        sell.disableBody(true, true);
        this.updateScore(-10);
    }

    hitTweet(player, tweet) {
        tweet.disableBody(true, true);
        this.updateScore(25);
    }

    updateScore(amount) {
        this.score += amount;
        this.scoreText.setText('Value: ' + this.score + ' TRX');
    }

    updateBossHealth(amount) {
        this.boss.health += amount;
        this.bossHealthText.setText('Boss\' value: ' + this.boss.health + ' ' + this.boss.coinname);
        this.bossHealthText.x = 792 - this.bossHealthText.width;
    }

    static arrayContains(array, element) {
        for (let i = 0; i < array.length; i++)
            if (array[i] === element)
                return true;
        return false;
    }

    static removePassedItems(collection) {
        for (let i = 0; i < collection.children.entries.length; i++) {
            let item = collection.children.entries[i];
            if (item.body.y >= 600 || item.body.y <= -700) {
                collection.remove(item);
                item.disableBody(true, true);
            }
        }
    }

    static getRandomColumnForEntity() {
        return Scene.getRandomBetween(1, 24) * 32;
    }

    static getRandomBetween(min, max) {
        return Math.floor((Math.random() * max) + min)
    }
}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 0},
            debug: false
        }
    }
};

let game = new Phaser.Game(config);
game.scene.add("main", Scene);
game.scene.start("main");