export class SpringLerp {
    
    current = 0;
    target = 0;
    velocity = 0;

    mass = 2;
    damping = 20;
    stiffness = 100;

    step(deltaMS: number) {
        const springForce = (this.target - this.current) * this.stiffness;
        const dampingForce = this.velocity * this.damping;
        const acceleration = (springForce - dampingForce) * this.mass;
        const seconds = deltaMS / 1000;
        this.velocity += acceleration * seconds;
        this.current += this.velocity * seconds;
    }
}

export class HalfLerp {
    current = 0;
    target = 0;
    HALF_LIFE_MS = 100;

    step(deltaMS: number) {
        const halfDelta = 0.5 * deltaMS;
        if (this.HALF_LIFE_MS > halfDelta) {
            this.current += (this.target - this.current) * halfDelta / this.HALF_LIFE_MS;
        }
        else {
            this.current = this.target;
        }
    }
}