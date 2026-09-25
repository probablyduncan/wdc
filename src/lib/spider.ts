type Vec2 = [number, number];

type PointTransform = {
    angle: number;
    length: number;
}

export class SpiderController {
    readonly target: Vec2 = [0, 0];
    readonly current: Vec2 = [0, 0];
    angle: number = 0;

    private readonly _legs: PointTransform[];
    readonly feet: Vec2[] = [];

    private readonly _color: string;

    constructor() {

        // improve this?
        this._legs = [[45, 12], [60, 15], [90, 15], [120, 15]].flatMap(l => {
            const angle = toRads(l[0]);
            const length = l[1];
            return [{ angle, length }, { angle: -angle, length }];
        });

        this._color = "black";
    }

    step(deltaMS: DOMHighResTimeStamp) {

        // distance between current and target
        const distance = [
            this.target[0] - this.current[0],
            this.target[1] - this.current[1],
        ]

        const isAtRest = Math.abs(distance[0]) < 0.5 && Math.abs(distance[1]) < 0.5;

        // face target
        this.angle = Math.atan2(-distance[1], distance[0]);

        // lerp towards target
        const lerp = Math.min(1, deltaMS * 0.0030625);
        this.current[0] = lerp * distance[0] + this.current[0];
        this.current[1] = lerp * distance[1] + this.current[1];

        // walk legs
        for (let i = 0; i < this._legs.length; i++) {

            const ideal = this._legs[i];
            // this.feet[i] = getPointAt(this.current, ideal.length, this.angle + ideal.angle);

            // if no foot, set to ideal
            if (this.feet.length <= i || !this.feet[i] || (isAtRest && Math.random() > 0.95)) {
                this.feet[i] = getPointAt(this.current, ideal.length, this.angle + ideal.angle);
                continue;
            }

            const currentLegVector: Vec2 = [
                this.feet[i][0] - this.current[0],
                this.feet[i][1] - this.current[1],
            ];

            // get length, but avoid sqrt unless we're stepping, I guess
            const legLengthSquared = Math.pow(currentLegVector[0], 2) + Math.pow(currentLegVector[1], 2);

            // if leg is double ideal length, need to step
            if (legLengthSquared > Math.pow(ideal.length * 1.5, 2)) {
                this.feet[i] = getPointAt(this.current, ideal.length, this.angle + ideal.angle);
            }
        }
    }

    draw(context: CanvasRenderingContext2D) {
        drawSpider(context, this.current, this.angle, this.feet, this._color);
    }

    isAtRest() {
        return Math.abs(this.current[0] - this.target[0]) < 0.5 && Math.abs(this.current[1] - this.target[1]) < 0.5;
    }
}

function drawSpider(context: CanvasRenderingContext2D, pos: Vec2, angle: number, feet: Vec2[], color: string = "black") {

    // legs
    for (let foot of feet) {
        const legAngle = Math.atan2(pos[1] - foot[1], foot[0] - pos[0]);
        const hip = getPointAt(pos, 3, legAngle)
        drawLine(context, hip, foot, color);
    }

    // body
    drawCircle(context, pos, 3, color);

    // head
    const headPos = getPointAt(pos, 5, angle);
    drawCircle(context, headPos, 3, color);

    // thorax
    const thoraxPos = getPointAt(pos, -6, angle);
    drawCircle(context, thoraxPos, 6, color);
    context.fill();

    // eyes
    const eyeAngle = toRads(25);
    const leftEyePos = getPointAt(pos, 5, angle - eyeAngle);
    const rightEyePos = getPointAt(pos, 5, angle + eyeAngle);

    // whites, with black outlines
    drawCircle(context, leftEyePos, 2, "white", color);
    drawCircle(context, rightEyePos, 2, "white", color);

    // pupils
    drawCircle(context, leftEyePos, 1, color);
    drawCircle(context, rightEyePos, 1, color);
}

function drawCircle(context: CanvasRenderingContext2D, center: Vec2, radius: number, fillColor?: string, strokeColor?: string) {

    context.beginPath();
    context.arc(...center, radius, 0, 2 * Math.PI);

    if (fillColor) {
        context.fillStyle = fillColor;
        context.fill();
    }

    if (strokeColor) {
        context.strokeStyle = strokeColor;
        context.stroke();
    }

    context.closePath();
}

function drawLine(context: CanvasRenderingContext2D, from: Vec2, to: Vec2 | PointTransform, color: string) {

    if (!Array.isArray(to)) {
        to = getPointAt(from, to.length, to.angle);
    }

    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    context.stroke();
    context.closePath();
}

function getPointAt(start: Vec2, length: number, angle: number): Vec2 {
    return [
        start[0] + Math.cos(angle) * length,
        start[1] - Math.sin(angle) * length,
    ]
}

function toRads(degrees: number) {
    return degrees * Math.PI / 180;
}