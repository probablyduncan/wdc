type Transition = {
    /**
     * function called when transition should start
     * optionally returns a function which, if called, will fast forward the transition
     * if function isn't returned, transition is assumed to be instantaneous
     * complete should be called when a non-instantaneous transition is complete
     */
    begin(complete: () => void): (() => void) | void;
    /**
     * function called when transition should be reverted
     * should be instant
     */
    revert(): void;
}

type TransitionInit = () => Transition;
type TransitionSetup = Transition | TransitionInit;

export function registerTransition(key: string, transition: TransitionSetup) {
    if (typeof transition === "function") {
        transition = transition();
    }
    _transitions[key] = { ...transition };
    if (!_pageInfo.transitions.includes(key)) {
        console.error(`transition "${key} is registered on the client but not on the server"`);
    }
}

export function registerTransitions(transitions?: Record<string, TransitionSetup>) {
    if (!transitions) return;
    Object.entries(transitions).forEach(([key, transition]) => registerTransition(key, transition));
}

// ------------------------

const QUERY_PARAMS_STATE_KEY = "end";

const _transitions: Record<string, Transition> = {};
const _pageInfo = getPageInfo();

/**
 * if transitioning, this is the currently transitioning transition
 * if not transitioning, this is the transition that was just played
 * */
let _transitionIndex = getInitialTransitionIndex();

let _fastForwardFunction: (() => void) | void = undefined;

const getTransition = (index: number) => _transitions[_pageInfo.transitions[index]];

function getPageInfo() {
    const pageInfo = JSON.parse(document.body.dataset.pageInfo ?? "{}") as PageInfo;
    if (!pageInfo || !pageInfo.this) {
        console.error("page info not set!");
    }

    return pageInfo;
}

function getInitialTransitionIndex() {
    return -1;
    const start = -1;
    if (new URLSearchParams(window.location.search).get(QUERY_PARAMS_STATE_KEY) === null) {
        return start;
    }

    history.replaceState(null, "", window.location.origin + window.location.pathname);
    return start + _pageInfo.transitions.length;
}

function getUrl(pageName: string) {
    let newUrl = window.location.origin;
    if (pageName !== "index") {
        newUrl += "/" + pageName;
    }
    return newUrl;
}

export function next() {

    // if transitioning, fast forward
    if (_fastForwardFunction) {
        _fastForwardFunction();
        _fastForwardFunction = undefined;
        return;
    }

    // if we're already on the last transition, go to next page
    if (_transitionIndex + 1 >= _pageInfo.transitions.length) {
        if (_pageInfo.next) {
            window.location.href = getUrl(_pageInfo.next);
        }
        return;
    }

    // otherwise, increment and start next transition
    _transitionIndex++;
    _fastForwardFunction = getTransition(_transitionIndex).begin(() => { _fastForwardFunction = undefined; });
}

export function prev() {

    // if currently transitioning, revert it
    if (_fastForwardFunction) {
        _fastForwardFunction();
        _fastForwardFunction = undefined;
        getTransition(_transitionIndex).revert();
        _transitionIndex--;
        return;
    }

    // if no transitions are active, go to prev page
    if (_transitionIndex < 0) {
        if (_pageInfo.prev) {
            window.location.href = getUrl(_pageInfo.prev)// + "?" + QUERY_PARAMS_STATE_KEY;
        }
        return;
    }

    // otherwise, revert last transition and decrement
    getTransition(_transitionIndex).revert();
    _transitionIndex--;

}

function onReady() {

    // validate
    _pageInfo.transitions.forEach(key => {
        if (!_transitions[key]) {
            console.error(`transition "key" was declared but never registered`);
        }
    })

    // fast forward all prev transitions
    for (let i = 0; i <= _transitionIndex; i++) {
        const ff = getTransition(i).begin(() => { });
        if (ff) ff();
    }

    // set up buttons and arrow keys
    document.querySelectorAll("button[data-next-slide]").forEach(b => b.addEventListener("click", next));
    document.querySelectorAll("button[data-prev-slide]").forEach(b => b.addEventListener("click", prev));
    document.addEventListener("keydown", ({ code, shiftKey }) => {
        switch (code) {
            case "ArrowLeft":
                if (shiftKey) {
                    _fastForwardFunction = undefined;
                    _transitionIndex = -1;
                }
                prev();
                break;
            case "ArrowRight":
                if (shiftKey) _transitionIndex = _pageInfo.transitions.length;
                next();
                break;
            case "KeyF":
                document.body.requestFullscreen();
                break;
        }
    });
}

document.addEventListener("DOMContentLoaded", onReady);