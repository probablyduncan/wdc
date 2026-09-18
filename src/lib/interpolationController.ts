interface InterpolationController<Options> {
    options: Options;
    current: number;
    target: number;
    step(deltaMS: DOMHighResTimeStamp): number;
}

interface SpringOptions {
    damping: number;
    stiffness: number;
    mass: number;
}

export class SpringController implements InterpolationController<SpringOptions> {

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
}

interface LerpOptions {
    /**
     * will travel this amount of the distance towards the target per millisecond.
     * 1 means it will cover the whole distance instantly.
     * */
    lerpValue: 0.0030625 | 0.006125 | 0.0125 | 0.025 | 1;
}

export class LerpController implements InterpolationController<LerpOptions> {

    current: number = 0;
    target: number = 0;

    options: LerpOptions = {
        lerpValue: 0.0125,
    };

    constructor(options: Partial<LerpOptions> = {}) {
        Object.assign(this.options, options);
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        const lerp = Math.min(1, deltaMS * this.options.lerpValue);
        this.current += lerp * (this.target - this.current);
        return this.current;
    }
}

interface AccelerationOptions {
    /** px/s/s */
    acceleration: number;
}

export class AccelerationController implements InterpolationController<AccelerationOptions> {
    current: number = 0;
    target: number = 0;
    velocity: number = 0;

    options: AccelerationOptions = {
        acceleration: 200,
    };

    constructor(options: Partial<AccelerationOptions> = {}) {
        Object.assign(this.options, options)
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        
        const deltaS = deltaMS / 1000;
        const right = this.target > this.current;
        this.velocity += this.options.acceleration * deltaS * (right ? 1 : -1);
        this.current += this.velocity * deltaS;

        // hard stop, need to improve this
        // maybe we have to factor in the distance to travel? idk

        if (right === this.current >= this.target) {
            this.current = this.target;
            this.velocity = 0;
        }

        return this.current;
    }

}