type ConfettiOptions = {
  duration?: number // in milliseconds
  particleCount?: number
  spread?: number
  startVelocity?: number
  colors?: string[]
  origin?: { x: number; y: number }
  fadeOut?: boolean
  gravity?: number
  ticks?: number
  zIndex?: number
  disableForReducedMotion?: boolean
}

type Particle = {
  color: string
  x: number
  y: number
  diameter: number
  tilt: number
  tiltAngleIncrement: number
  tiltAngle: number
  particleSpeed: number
  velocity: { x: number; y: number }
  alpha: number
  tick: number
}

class ConfettiGenerator {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private particles: Particle[] = []
  private animationId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private options: Required<ConfettiOptions>
  private startTime = 0

  private defaultOptions: Required<ConfettiOptions> = {
    duration: 4000,
    particleCount: 150,
    spread: 70,
    startVelocity: 45,
    colors: ["#FF577F", "#FF884B", "#FFBD59", "#82CD47", "#3EC1D3", "#9336FD"],
    origin: { x: 0.5, y: 0.5 },
    fadeOut: true,
    gravity: 0.9,
    ticks: 200,
    zIndex: 9999,
    disableForReducedMotion: true,
  }

  constructor(options: ConfettiOptions = {}) {
    this.options = { ...this.defaultOptions, ...options }
  }

  public fire(): void {
    // Check for reduced motion preference
    if (this.options.disableForReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    this.setupCanvas()
    this.createParticles()
    this.startTime = Date.now()
    this.animate()
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.canvas) {
      document.body.removeChild(this.canvas)
      this.canvas = null
      this.ctx = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }

  private setupCanvas(): void {
    if (this.canvas) {
      this.stop()
    }

    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")

    if (!this.ctx) {
      console.error("Could not get canvas context")
      return
    }

    this.canvas.style.position = "fixed"
    this.canvas.style.top = "0"
    this.canvas.style.left = "0"
    this.canvas.style.width = "100%"
    this.canvas.style.height = "100%"
    this.canvas.style.pointerEvents = "none"
    this.canvas.style.zIndex = this.options.zIndex.toString()

    this.resizeCanvas()
    document.body.appendChild(this.canvas)

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas()
    })
    this.resizeObserver.observe(document.body)
  }

  private resizeCanvas(): void {
    if (!this.canvas) return

    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  private createParticles(): void {
    this.particles = []
    const { particleCount, colors, spread, startVelocity, origin } = this.options

    for (let i = 0; i < particleCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const angle = Math.random() * Math.PI * 2
      const spreadRadius = Math.random() * spread

      // Calculate velocity based on angle and start velocity
      const velocity = {
        x: Math.cos(angle) * (startVelocity * (0.5 + Math.random() * 0.5)) * (Math.random() < 0.5 ? -1 : 1),
        y: Math.sin(angle) * (startVelocity * (0.5 + Math.random() * 0.5)) * (Math.random() < 0.5 ? -1 : 1),
      }

      // Create particle
      this.particles.push({
        color,
        x: origin.x * window.innerWidth,
        y: origin.y * window.innerHeight,
        diameter: Math.random() * 10 + 5,
        tilt: Math.random() * 10 - 10,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
        particleSpeed: Math.random() * 2 + 2,
        velocity,
        alpha: 1,
        tick: 0,
      })
    }
  }

  private animate(): void {
    if (!this.canvas || !this.ctx) return

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Check if animation should end
    const elapsed = Date.now() - this.startTime
    const shouldEnd = elapsed > this.options.duration

    if (shouldEnd && this.particles.length === 0) {
      this.stop()
      return
    }

    // Update and draw particles
    const remainingParticles: Particle[] = []
    for (const particle of this.particles) {
      // Update particle position
      particle.x += particle.velocity.x
      particle.y += particle.velocity.y

      // Apply gravity
      particle.velocity.y += this.options.gravity

      // Update tilt
      particle.tiltAngle += particle.tiltAngleIncrement
      particle.tilt = Math.sin(particle.tiltAngle) * 15

      // Increment tick
      particle.tick += 1

      // Calculate alpha for fade out
      if (shouldEnd && this.options.fadeOut) {
        particle.alpha = Math.max(0, particle.alpha - 0.02)
      }

      // Draw particle if still visible
      if (particle.alpha > 0) {
        this.drawParticle(particle)
        remainingParticles.push(particle)
      }

      // Remove particles that are off-screen
      if (particle.x > this.canvas.width + 20 || particle.x < -20 || particle.y > this.canvas.height + 20) {
        if (!shouldEnd || !this.options.fadeOut) {
          remainingParticles.push(particle)
        }
      }
    }

    this.particles = remainingParticles
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  private drawParticle(particle: Particle): void {
    if (!this.ctx) return

    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.translate(particle.x, particle.y)
    this.ctx.rotate((particle.tilt * Math.PI) / 180)

    // Draw confetti piece
    this.ctx.fillStyle = particle.color
    this.ctx.globalAlpha = particle.alpha

    // Randomize between rectangle and oval shapes
    if (particle.tick % 2 === 0) {
      this.ctx.fillRect(-particle.diameter / 2, -particle.diameter / 2, particle.diameter, particle.diameter / 2)
    } else {
      this.ctx.ellipse(0, 0, particle.diameter / 2, particle.diameter / 4, 0, 0, Math.PI * 2)
      this.ctx.fill()
    }

    this.ctx.restore()
  }
}

// Singleton instance for easy reuse
let confettiInstance: ConfettiGenerator | null = null

export const fireConfetti = (options: ConfettiOptions = {}): void => {
  if (confettiInstance) {
    confettiInstance.stop()
  }

  confettiInstance = new ConfettiGenerator(options)
  confettiInstance.fire()
}

export const stopConfetti = (): void => {
  if (confettiInstance) {
    confettiInstance.stop()
    confettiInstance = null
  }
}
