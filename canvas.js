const canvas = document.querySelector('#element')
const scoreEl = document.querySelector('#score')
const startGameEl = document.querySelector('#startGame')
const modalEl = document.querySelector('#modal')
const modalScoreEl = document.querySelector('#modalScore')
const ctx = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight

class Player {
  constructor(x, y, radius, color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }
  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }
}
class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }
  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }
  update() {
    this.draw()
    this.x = this.x + this.velocity.x
    this.y = this.y + this.velocity.y
  }
}
class Explosive{
  constructor(x, y, radius, color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }
  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }
}
class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }
  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill()
  }
  update() {
    this.draw()
    this.x = this.x + this.velocity.x
    this.y = this.y + this.velocity.y
  }
}
const friction = 0.99
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.alpha = 1
  }
  draw() {
    ctx.save()
    ctx.globalAlpha = this.alpha
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.restore()
  }
  update() {
    this.draw()
    this.velocity.x *= friction
    this.velocity.y *= friction
    this.x = this.x + this.velocity.x
    this.y = this.y + this.velocity.y
    this.alpha -= 0.01
  }
}

let x
let y
let player
let projectiles
let enemies
let explosives
let particles
let animationId
let score
let enemySpawnInterval
let explosiveSpawnInterval
function init() {
  x = canvas.width / 2
  y = canvas.height / 2
  player = new Player(x, y, 15, '#fff')
  projectiles = []
  enemies = []
  explosives = []
  particles = []
  score = 0
  modalScoreEl.textContent = '0'
  scoreEl.textContent = '0'
  player.draw()
}

function spawnEnemies() {
  return setInterval(() => {
    const {width, height} = canvas
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`
    const radius = Math.random() * (35 - 4) + 4
    let xPos
    let yPos
    if (Math.random() < 0.5) {
      xPos = Math.random() < 0.5 ? 0 - radius : width + radius
      yPos = Math.random() * height
    } else {
      xPos = Math.random() * width
      yPos = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }
    const angle = Math.atan2(y - yPos, x - xPos)
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    }
    const enemy = new Enemy(xPos, yPos, radius, color, velocity)
    enemies.push(enemy)
  }, 1000)
}
function spawnExplosives() {
	return setInterval(() => {
		const {width, height} = canvas
		let xPos = Math.random() * width
		let yPos = Math.random() * height
		const explosive = new Explosive(xPos, yPos, 10, 'hsl(180), 50%, 50%')
		explosives.push(explosive)
	}, 6000)
}
function animate() {
  animationId = requestAnimationFrame(animate)
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  ctx.fillRect(0,0, canvas.width, canvas.height)
  player.draw()
  particles.forEach((particle, index) => {
    if(particle.alpha <= 0) {
      particles.splice(index, 1)
    } else {
      particle.update()
    }
  })
  projectiles.forEach((projectile, index) => {
    projectile.update()
    // remove from edges of screen
    if(
        projectile.x + projectile.radius < 0 ||
        projectile.x - projectile.radius > canvas.width ||
        projectile.y + projectile.radius < 0 ||
        projectile.y - projectile.radius > canvas.width
      ) {
      setTimeout(() => {
        projectiles.splice(index, 1)
      }, 0)
    }
  })
  enemies.forEach((enemy, enemyIndex) => {
    enemy.update()
    
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y)
    if(distance - enemy.radius - player.radius < 1) {
      // end game
	  clearInterval(enemySpawnInterval)
	  clearInterval(explosiveSpawnInterval)
      cancelAnimationFrame(animationId)
      modalEl.style.display = 'flex'
      modalScoreEl.textContent = score
    }

    projectiles.forEach((projectile, projectileIndex) => {
      const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
      // projectile touch enemy
      if(distance - enemy.radius - projectile.radius < 1) {
        
        // create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          const particle = new Particle(
            projectile.x,
            projectile.y,
            Math.random() * 2,
            enemy.color, {
            x: Math.random() - 0.5 * (Math.random() * 6),
            y: Math.random() - 0.5 * (Math.random() * 6)
          })
          particles.push(particle)
        }
        // increase score
        if(enemy.radius - 10 > 5) {
          score += 125
          scoreEl.textContent = score
          gsap.to(enemy, {
            radius: enemy.radius - 10
          })
          setTimeout(() => {
            projectiles.splice(projectileIndex, 1)
          }, 0)
        } else {
          score += 250
          scoreEl.textContent = score
          setTimeout(() => {
            enemies.splice(enemyIndex, 1)
            projectiles.splice(projectileIndex, 1)
          }, 0)
        }
      }
    })
  })
  explosives.forEach((explosive, explosiveIndex) => {
	explosive.draw()
    projectiles.forEach((projectile, projectileIndex) => {
      const distance = Math.hypot(projectile.x - explosive.x, projectile.y - explosive.y)
      // projectile touch explosive
      if(distance - explosive.radius - projectile.radius < 1) {
        
        // create explosions
        for (let i = 0; i < explosive.radius * 2; i++) {
          const particle = new Particle(
            projectile.x,
            projectile.y,
            Math.random() * 2,
            explosive.color, {
            x: Math.random() - 0.5 * (Math.random() * 6),
            y: Math.random() - 0.5 * (Math.random() * 6)
          })
          particles.push(particle)
        }

		for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
		  const velocity = {
		    x: Math.cos(angle) * 5,
			y: Math.sin(angle) * 5
		  }
		  let interval = setInterval(() => {
			const projectile = new Projectile(explosive.x, explosive.y, 5, '#fff', velocity)
			projectiles.push(projectile)
		  }, 200)
		  setTimeout(() => {
			  clearInterval(interval)
		  }, 600)
		}

		setTimeout(() => {
      	  explosives.splice(explosiveIndex, 1)
		  projectiles.splice(projectileIndex, 1)
		}, 0)
	  }
    })
  })
}

addEventListener('click', (event) => {
  const {clientX, clientY} = event
  const angle = Math.atan2(clientY - y, clientX - x)
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  }
  const projectile = new Projectile(x, y, 5, '#fff', velocity)
  projectiles.push(projectile)
})
startGameEl.addEventListener('click', () => {
  init()
  animate()
  enemySpawnInterval = spawnEnemies()
  explosiveSpawnInterval = spawnExplosives()
  modalEl.style.display = 'none'
})
