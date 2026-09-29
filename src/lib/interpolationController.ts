interface InterpolationController {
    current: number;
    target: number;
    step(deltaMS: DOMHighResTimeStamp): number;
    isAtRest(): boolean;
}

interface SpringOptions {
    damping: number;
    stiffness: number;
    mass: number;
}

export class SpringController implements InterpolationController {

    current: number = 0;
    target: number = 0;
    velocity: number = 0;

    options: SpringOptions = {
        mass: 2,
        damping: 20,
        stiffness: 100,
    };

    constructor(options: Partial<SpringOptions> = {}) {
        Object.assign(this.options, options);
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        const springForce = this.options.stiffness * (this.target - this.current);
        const dampingForce = this.options.damping * this.velocity;
        const acceleration = (springForce - dampingForce) / this.options.mass;
        const deltaS = deltaMS / 1000;
        this.velocity += acceleration * deltaS;
        this.current += this.velocity * deltaS;
        return this.current;
    }

    isAtRest(): boolean {
        const tolerance = 0.5;
        return Math.abs(this.velocity) < tolerance && Math.abs(this.target - this.current) < tolerance;
    }
}

export class LerpController implements InterpolationController {

    current: number = 0;
    target: number = 0;

    /**
     * the amount of time (milliseconds) it
     * takes to get halfway to the target
     * */
    halfLife: number = 100;

    constructor(halfLife?: number) {
        if (halfLife !== undefined) {
            this.halfLife = halfLife
        }
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        if (this.halfLife <= 0) {
            this.current = this.target;
        }
        else {
            const lerp = Math.min(1, 0.5 * deltaMS / this.halfLife);
            this.current += (this.target - this.current) * lerp;
        }
        return this.current;
    }

    isAtRest(): boolean {
        const tolerance = 0.1;
        return Math.abs(this.target - this.current) < tolerance;
    }
}

export class AccelerationController implements InterpolationController {
    current: number = 0;
    target: number = 0;
    velocity: number = 0;

    acceleration: number = 100;

    constructor(acceleration?: number) {
        if (acceleration !== undefined) {
            this.acceleration = acceleration
        }
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        
        const deltaS = deltaMS / 1000;
        const right = this.target > this.current;
        this.velocity += this.acceleration * deltaS * (right ? 1 : -1);
        this.current += this.velocity * deltaS;

        // hard stop, need to improve this
        // maybe we have to factor in the distance to travel? idk

        if (right === this.current >= this.target) {
            this.current = this.target;
            this.velocity = 0;
        }

        return this.current;
    }

    isAtRest(): boolean {
        const tolerance = 0.1;
        return Math.abs(this.target - this.current) < tolerance;
    }

}