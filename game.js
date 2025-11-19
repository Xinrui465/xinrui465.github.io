// 游戏画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置画布尺寸
function resizeCanvas() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight - 200; // 为控制区域留出空间
    
    // 游戏区域固定为 800x600，按比例缩放
    const gameWidth = 800;
    const gameHeight = 600;
    
    const scale = Math.min(maxWidth / gameWidth, maxHeight / gameHeight, 1);
    
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    canvas.style.width = (gameWidth * scale) + 'px';
    canvas.style.height = (gameHeight * scale) + 'px';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 游戏状态
const gameState = {
    running: false,
    score: 0,
    lives: 3,
    level: 1
};

// 方向常量
const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// 坦克类
class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = isPlayer ? 45 : 30;  // 玩家坦克更大
        this.height = isPlayer ? 45 : 30;
        this.speed = isPlayer ? 3 : 1.5;
        this.color = color;
        this.direction = DIRECTIONS.UP;
        this.isPlayer = isPlayer;
        this.health = isPlayer ? 3 : 1;
        this.shootCooldown = 0;
        this.maxCooldown = isPlayer ? 20 : 60;
    }
    
    update() {
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }
    
    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // 边界检测
        if (newX >= 0 && newX + this.width <= canvas.width &&
            newY >= 0 && newY + this.height <= canvas.height) {
            // 障碍物碰撞检测
            if (!this.checkCollision(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        }
    }
    
    checkCollision(x, y) {
        // 检查与障碍物的碰撞
        for (let wall of walls) {
            if (x < wall.x + wall.width &&
                x + this.width > wall.x &&
                y < wall.y + wall.height &&
                y + this.height > wall.y) {
                return true;
            }
        }
        return false;
    }
    
    shoot() {
        if (this.shootCooldown > 0) return null;
        
        this.shootCooldown = this.maxCooldown;
        
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;
        
        let dx = 0, dy = 0;
        // 玩家子弹速度较慢，敌人子弹速度正常
        const bulletSpeed = this.isPlayer ? 3 : 5;
        switch (this.direction) {
            case DIRECTIONS.UP:
                dy = -bulletSpeed;
                bulletY = this.y;
                break;
            case DIRECTIONS.DOWN:
                dy = bulletSpeed;
                bulletY = this.y + this.height;
                break;
            case DIRECTIONS.LEFT:
                dx = -bulletSpeed;
                bulletX = this.x;
                break;
            case DIRECTIONS.RIGHT:
                dx = bulletSpeed;
                bulletX = this.x + this.width;
                break;
        }
        
        return new Bullet(bulletX, bulletY, dx, dy, this.isPlayer);
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.direction * Math.PI / 2);
        
        // 绘制坦克主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 绘制坦克炮管
        ctx.fillStyle = '#333';
        const barrelWidth = this.isPlayer ? 5 : 3;
        const barrelLength = this.isPlayer ? 18 : 15;
        ctx.fillRect(-barrelWidth / 2, -this.height / 2 - barrelLength, barrelWidth, barrelLength);
        
        // 绘制坦克细节
        ctx.fillStyle = this.isPlayer ? '#ffb3d9' : '#555';
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height - 10);
        
        // 如果是玩家坦克，绘制文字"熊竹筠"
        if (this.isPlayer) {
            ctx.rotate(-this.direction * Math.PI / 2);  // 恢复文字方向
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('熊竹筠', 0, 0);
        }
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// 子弹类
class Bullet {
    constructor(x, y, dx, dy, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = isPlayerBullet ? 8 : 4;  // 玩家子弹更大
        this.isPlayerBullet = isPlayerBullet;
        this.active = true;
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
        
        // 边界检测
        if (this.x < 0 || this.x > canvas.width ||
            this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }
        
        // 障碍物碰撞
        for (let wall of walls) {
            if (this.x >= wall.x && this.x <= wall.x + wall.width &&
                this.y >= wall.y && this.y <= wall.y + wall.height) {
                this.active = false;
                return;
            }
        }
    }
    
    draw() {
        ctx.save();
        
        // 玩家子弹为红色，敌人子弹为红色
        ctx.fillStyle = this.isPlayerBullet ? '#ff0000' : '#ff6b6b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.isPlayerBullet ? '#ff0000' : '#ff6b6b';
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // 如果是玩家子弹，绘制文字"怒气" - 更清晰可见
        if (this.isPlayerBullet) {
            // 绘制文字背景（半透明黑色圆角矩形）
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const bgWidth = 40;
            const bgHeight = 22;
            const bgX = this.x - bgWidth / 2;
            const bgY = this.y - bgHeight / 2;
            const radius = 5;
            
            // 绘制圆角矩形背景
            ctx.beginPath();
            ctx.moveTo(bgX + radius, bgY);
            ctx.lineTo(bgX + bgWidth - radius, bgY);
            ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
            ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
            ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
            ctx.lineTo(bgX + radius, bgY + bgHeight);
            ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
            ctx.lineTo(bgX, bgY + radius);
            ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
            ctx.closePath();
            ctx.fill();
            
            // 绘制文字描边（白色描边让文字更清晰）
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeText('怒气', this.x, this.y);
            
            // 绘制文字主体（红色，更醒目）
            ctx.fillStyle = '#ff0000';
            ctx.fillText('怒气', this.x, this.y);
        }
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

// 障碍物类
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 砖块纹理
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + this.height);
            ctx.stroke();
        }
        for (let i = 0; i < this.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }
    }
}

// 游戏对象
let player = null;
let enemies = [];
let bullets = [];
let walls = [];

// 初始化游戏
function initGame() {
    player = new Tank(400, 500, '#ff69b4', true);  // 粉色坦克
    enemies = [];
    bullets = [];
    walls = [];
    
    // 创建障碍物
    createWalls();
    
    // 创建敌人
    spawnEnemies(3 + gameState.level);
    
    // 重新初始化雪花
    initSnowflakes();
    
    gameState.score = 0;
    gameState.lives = 3;
    updateUI();
}

// 创建障碍物
function createWalls() {
    // 边界墙
    walls.push(new Wall(0, 0, canvas.width, 20));
    walls.push(new Wall(0, canvas.height - 20, canvas.width, 20));
    walls.push(new Wall(0, 0, 20, canvas.height));
    walls.push(new Wall(canvas.width - 20, 0, 20, canvas.height));
    
    // 内部障碍物
    const wallPositions = [
        {x: 200, y: 150, w: 80, h: 20},
        {x: 500, y: 150, w: 80, h: 20},
        {x: 200, y: 400, w: 80, h: 20},
        {x: 500, y: 400, w: 80, h: 20},
        {x: 350, y: 250, w: 20, h: 100},
        {x: 150, y: 250, w: 100, h: 20},
        {x: 550, y: 250, w: 100, h: 20},
    ];
    
    for (let pos of wallPositions) {
        walls.push(new Wall(pos.x, pos.y, pos.w, pos.h));
    }
}

// 生成敌人
function spawnEnemies(count) {
    const spawnPoints = [
        {x: 100, y: 100},
        {x: 700, y: 100},
        {x: 100, y: 200},
        {x: 700, y: 200},
        {x: 400, y: 100},
    ];
    
    for (let i = 0; i < count && i < spawnPoints.length; i++) {
        const point = spawnPoints[i];
        enemies.push(new Tank(point.x, point.y, '#f44336', false));
    }
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 更新游戏
function update() {
    if (!gameState.running) return;
    
    // 更新玩家
    player.update();
    
    // 更新敌人
    for (let enemy of enemies) {
        enemy.update();
        updateEnemyAI(enemy);
    }
    
    // 更新子弹
    for (let bullet of bullets) {
        bullet.update();
    }
    
    // 移除无效子弹
    bullets = bullets.filter(b => b.active);
    
    // 子弹与坦克碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const bulletBounds = bullet.getBounds();
        
        if (bullet.isPlayerBullet) {
            // 玩家子弹击中敌人
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (checkCollision(bulletBounds, enemy.getBounds())) {
                    bullet.active = false;
                    enemy.health--;
                    if (enemy.health <= 0) {
                        enemies.splice(j, 1);
                        gameState.score += 100;
                        updateUI();
                    }
                    break;
                }
            }
        } else {
            // 敌人子弹击中玩家
            if (checkCollision(bulletBounds, player.getBounds())) {
                bullet.active = false;
                player.health--;
                gameState.lives = player.health;
                updateUI();
                if (player.health <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // 检查胜利条件
    if (enemies.length === 0) {
        gameState.level++;
        spawnEnemies(3 + gameState.level);
    }
}

// 敌人AI
function updateEnemyAI(enemy) {
    // 简单的AI：随机移动和射击
    if (Math.random() < 0.02) {
        enemy.direction = Math.floor(Math.random() * 4);
    }
    
    let dx = 0, dy = 0;
    switch (enemy.direction) {
        case DIRECTIONS.UP:
            dy = -enemy.speed;
            break;
        case DIRECTIONS.DOWN:
            dy = enemy.speed;
            break;
        case DIRECTIONS.LEFT:
            dx = -enemy.speed;
            break;
        case DIRECTIONS.RIGHT:
            dx = enemy.speed;
            break;
    }
    
    enemy.move(dx, dy);
    
    // 随机射击 - 增加射击频率
    if (Math.random() < 0.03) {
        const bullet = enemy.shoot();
        if (bullet) {
            bullets.push(bullet);
        }
    }
}

// 雪花效果
let snowflakes = [];
function initSnowflakes() {
    snowflakes = [];
    for (let i = 0; i < 50; i++) {
        snowflakes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5
        });
    }
}

function updateSnowflakes() {
    for (let flake of snowflakes) {
        flake.y += flake.speed;
        if (flake.y > canvas.height) {
            flake.y = 0;
            flake.x = Math.random() * canvas.width;
        }
        flake.x += Math.sin(flake.y * 0.01) * 0.5;
    }
}

function drawSnowflakes() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let flake of snowflakes) {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制游戏
function draw() {
    // 清空画布 - 雪景背景
    ctx.fillStyle = '#e8f4f8';  // 淡蓝色雪景背景
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制雪地效果
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // 绘制雪花
    updateSnowflakes();
    drawSnowflakes();
    
    // 绘制障碍物
    for (let wall of walls) {
        wall.draw();
    }
    
    // 绘制玩家
    if (player) {
        player.draw();
    }
    
    // 绘制敌人
    for (let enemy of enemies) {
        enemy.draw();
    }
    
    // 绘制子弹
    for (let bullet of bullets) {
        bullet.draw();
    }
}

// 游戏循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 初始化雪花
initSnowflakes();

// 触摸控制
let joystickActive = false;
let joystickCenter = {x: 0, y: 0};
let joystickHandle = document.getElementById('joystickHandle');
let joystickBase = document.getElementById('joystick');

// 虚拟摇杆
const joystick = document.getElementById('joystick');
const joystickBaseRect = joystick.getBoundingClientRect();
const joystickRadius = 50;

let touchId = null;
let joystickOffset = {x: 0, y: 0};

joystick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (touchId === null) {
        touchId = e.touches[0].identifier;
        const rect = joystick.getBoundingClientRect();
        joystickCenter.x = rect.left + rect.width / 2;
        joystickCenter.y = rect.top + rect.height / 2;
        joystickActive = true;
        joystickHandle.classList.add('active');
    }
});

joystick.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!joystickActive || touchId === null) return;
    
    let touch = null;
    for (let t of e.touches) {
        if (t.identifier === touchId) {
            touch = t;
            break;
        }
    }
    if (!touch) return;
    
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > joystickRadius) {
        dx = (dx / distance) * joystickRadius;
        dy = (dy / distance) * joystickRadius;
    }
    
    joystickOffset.x = dx;
    joystickOffset.y = dy;
    
    joystickHandle.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // 控制玩家移动
    if (player && gameState.running) {
        const moveX = dx / joystickRadius;
        const moveY = dy / joystickRadius;
        
        // 确定方向
        if (Math.abs(moveX) > Math.abs(moveY)) {
            player.direction = moveX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else {
            player.direction = moveY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
        }
        
        // 移动
        const speed = player.speed;
        player.move(moveX * speed, moveY * speed);
    }
});

joystick.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (touchId !== null) {
        let found = false;
        for (let t of e.changedTouches) {
            if (t.identifier === touchId) {
                found = true;
                break;
            }
        }
        if (found) {
            touchId = null;
            joystickActive = false;
            joystickOffset = {x: 0, y: 0};
            joystickHandle.style.transform = 'translate(0, 0)';
            joystickHandle.classList.remove('active');
        }
    }
});

// 射击按钮
const shootBtn = document.getElementById('shootBtn');
shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player && gameState.running) {
        const bullet = player.shoot();
        if (bullet) {
            bullets.push(bullet);
        }
    }
});

// 键盘控制（可选，用于测试）
let keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (player && gameState.running) {
            const bullet = player.shoot();
            if (bullet) {
                bullets.push(bullet);
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handleKeyboardInput() {
    if (!player || !gameState.running) return;
    
    let dx = 0, dy = 0;
    
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        dy = -player.speed;
        player.direction = DIRECTIONS.UP;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        dy = player.speed;
        player.direction = DIRECTIONS.DOWN;
    }
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        dx = -player.speed;
        player.direction = DIRECTIONS.LEFT;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        dx = player.speed;
        player.direction = DIRECTIONS.RIGHT;
    }
    
    if (dx !== 0 || dy !== 0) {
        player.move(dx, dy);
    }
}

// 更新键盘输入处理
setInterval(handleKeyboardInput, 16);

// UI更新
function updateUI() {
    document.getElementById('score').textContent = `得分: ${gameState.score}`;
    document.getElementById('lives').textContent = `生命: ${gameState.lives}`;
}

// 游戏开始
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');
    
    gameState.running = true;
    initGame();
}

// 游戏结束
function gameOver() {
    gameState.running = false;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('gameOverTitle').textContent = '游戏结束';
    document.getElementById('gameOverScore').textContent = `得分: ${gameState.score}`;
    document.getElementById('controls').classList.add('hidden');
}

// 重新开始
function restartGame() {
    gameState.level = 1;
    startGame();
}

// 事件监听
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);

// 启动游戏循环
gameLoop();


