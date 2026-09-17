type AnimationFrameCallback = (deltaMS: DOMHighResTimeStamp) => boolean;

export default class AnimationFrameController {
    private _animating: boolean = false;
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
        if (!this._animating) {
            this._begin();
        }
    }

    /**
     * stops animation
     */
    stopAnimation() {
        if (this._animating) {
            this._end();
        }
    }

    /**
     * begins animation if not running, otherwise stops it
     */
    toggleAnimation() {
        this._animating ? this._end() : this._begin();
    }

    isAnimating() {
        return this._animating;
    }

    private _begin() {
        this._animating = true;
        this._queueFrame();
    }

    private _end() {
        this._animating = false;
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
        if (!this._animating) {
            return;
        }

        const deltaMS = this._prevTimestampMS ? timestampMS - this._prevTimestampMS : 0;
        this._prevTimestampMS = timestampMS;

        if (deltaMS <= 0 || this._onFrame(deltaMS)) {
            this._queueFrame();
        } else {
            this._end();
        }
    }
}