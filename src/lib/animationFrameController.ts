type AnimationFrameCallback = (state: { deltaMS: DOMHighResTimeStamp, timestampMS: DOMHighResTimeStamp }) => boolean;

export default class AnimationFrameController {
    
    private _prevTimestampMS?: DOMHighResTimeStamp;
    private readonly _animationCallback: AnimationFrameCallback;
    
    /**
     * @param animationCallback callback which is run on each frame. Should return true if animation should continue, and false if animation is complete and should not keep looping.
    */
   constructor(animationCallback: AnimationFrameCallback) {
       this._animationCallback = animationCallback;
    }
    
    isRunning: boolean = false;

    playIfPaused() {
        if (!this.isRunning) {
            this._queueFrame();
        }
    }

    pause() {
        if (this.isRunning) {
            this._cleanup();
        }
    }

    toggle() {
        this.isRunning ? this._cleanup() : this._queueFrame();
    }

    private _queueFrame() {
        this.isRunning = true;
        requestAnimationFrame(this._frameCallback);
    }

    private _cleanup() {
        this.isRunning = false;
        this._prevTimestampMS = undefined;
    }

    private _frameCallback: FrameRequestCallback = (timestampMS: DOMHighResTimeStamp) => {
        if (!this.isRunning) {
            return;
        }

        const deltaMS = this._prevTimestampMS ? timestampMS - this._prevTimestampMS : 0;
        this._prevTimestampMS = timestampMS;

        if (deltaMS <= 0 || this._animationCallback({ deltaMS, timestampMS })) {
            this._queueFrame();
        } else {
            this._cleanup();
        }
    }
}