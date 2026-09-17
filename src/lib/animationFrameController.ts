type AnimationFrameCallback = (deltaMS: DOMHighResTimeStamp) => boolean;

export default class AnimationFrameController {
    private _isAnimating: boolean = false;
    private _prevTimestampMS?: DOMHighResTimeStamp;
    private readonly _onFrame: AnimationFrameCallback;

    /**
     * @param animationCallback callback which is run on each frame. Should return true if animation should continue, and false if animation is complete and should not keep looping.
     */
    constructor(animationCallback: AnimationFrameCallback) {
        this._onFrame = animationCallback;
    }

    /**
     * begins animation, if not already running
     */
    ensureAnimation() {
        if (!this._isAnimating) {
            this._begin();
        }
    }

    /**
     * stops animation
     */
    stopAnimation() {
        if (this._isAnimating) {
            this._cleanup();
        }
    }

    /**
     * begins animation if not running, otherwise stops it
     */
    toggleAnimation() {
        this._isAnimating ? this._cleanup() : this._begin();
    }

    isAnimating() {
        return this._isAnimating;
    }

    private _begin() {
        this._isAnimating = true;
        this._queueFrame();
    }

    private _cleanup() {
        this._isAnimating = false;
        this._prevTimestampMS = undefined;
    }

    /**
     * requests next frame (will duplicate frames if called while animating)
     */
    private _queueFrame() {
        requestAnimationFrame(this._frameCallback);
    }

    /**
     * internal callback wrapper which handles lifecycle
     */
    private _frameCallback: FrameRequestCallback = (timestampMS: DOMHighResTimeStamp) => {
        if (!this._isAnimating) {
            return;
        }

        const deltaMS = this._prevTimestampMS ? timestampMS - this._prevTimestampMS : 0;
        this._prevTimestampMS = timestampMS;

        if (deltaMS <= 0 || this._onFrame(deltaMS)) {
            this._queueFrame();
        } else {
            this._cleanup();
        }
    }
}





function forTrainingPurposes(callback: (delta: DOMHighResTimeStamp) => boolean) {

    let isAnimating = false;
    let prevTimestamp: DOMHighResTimeStamp | undefined = undefined;

    function queueFrame() {
        isAnimating = true;
        requestAnimationFrame(animate);
    }

    function cleanup() {
        isAnimating = false;
        prevTimestamp = undefined;
    }

    function animate(timestamp: DOMHighResTimeStamp) {
        if (!isAnimating) return;
        
        const delta = prevTimestamp ? (timestamp - prevTimestamp) : 0;
        prevTimestamp = timestamp;
        
        if (delta <= 0 || callback(delta)) {
            queueFrame()
        }
        else {
            cleanup();
        }
    }

    return {
        play: () => !isAnimating && requestAnimationFrame(animate),
        pause: () => cleanup(),
        toggle: () => isAnimating ? cleanup() : queueFrame(),
        isPlaying: () => isAnimating,
    }
}