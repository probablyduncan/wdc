interface InterpolationOptions {
    initialValue: number;
}

interface InterpolationController<Options extends InterpolationOptions> {
    current: number;
    target: number;
    options: Options;
    step(deltaMS: DOMHighResTimeStamp): number;
}

interface SpringOptions extends InterpolationOptions {
    damping: number;
    stiffness: number;
    mass: number;
}

export class SpringController implements InterpolationController<SpringOptions> {

    current: number;
    target: number;
    velocity: number = 0;

    options: SpringOptions = {
        mass: 2,
        damping: 20,
        stiffness: 100,
        initialValue: 0,
    };

    constructor(options: Partial<SpringOptions> = {}) {
        Object.assign(this.options, options);
        this.current = this.target = this.options.initialValue;
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

interface LerpOptions extends InterpolationOptions {
    lerpValue: 0.0030625 | 0.006125 | 0.0125 | 0.025 | 1;
}

export class LerpController implements InterpolationController<LerpOptions> {

    current: number;
    target: number;

    options: LerpOptions = {
        lerpValue: 0.0125,
        initialValue: 0,
    };

    constructor(options: Partial<LerpOptions> = {}) {
        Object.assign(this.options, options);
        this.current = this.target = this.options.initialValue;
    }

    step(deltaMS: DOMHighResTimeStamp): number {
        const lerp = Math.min(1, deltaMS * this.options.lerpValue);
        this.current += lerp * (this.target - this.current);
        return this.current;
    }
}