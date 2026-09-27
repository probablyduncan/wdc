type Transition = {
    /**
     * function called when transition should start
     * optionally returns a function which, if called, will fast forward the transition
     * if function isn't returned, transition is assumed to be instantaneous
     * complete should be called when a non-instantaneous transition is complete
     * @param complete should be called when a transition with fast-forward is complete
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

export function registerTransition(transition: TransitionSetup) {
    if (typeof transition === "function") {
        transition = transition();
    }
    _transitions.push(transition);
}

export function registerElementTransition<T extends HTMLElement>(
    query: string,
    onTransition: (el: T, op: keyof Transition) => void,
) {
    const els = document.querySelectorAll<T>(query);
    function doTransition(op: keyof Transition) {
        els.forEach((el) => onTransition(el, op));
    }

    registerTransition({
        begin() {
            doTransition("begin");
        },
        revert() {
            doTransition("revert");
        },
    })
}

export function registerClassTransition(
    query: string,
    classname: string = "active",
    op: "add" | "remove" = "add",
) {
    registerElementTransition<HTMLElement>(query, (el, transitionType) => {
        el.classList.toggle(classname, (transitionType === "begin") === (op === "add"));
    });
}

export function registerHiddenTransition(query: string, hideOnBegin = false) {
    registerElementTransition<HTMLElement>(query, (el, op) => el.hidden = ((op === "begin") === hideOnBegin));
}

export function registerWaapiTransition(
    query: string,
    ...animateParams: Parameters<HTMLElement["animate"]>
) {
    const els = document.querySelectorAll(query);
    let animations: Animation[] = [];

    registerTransition({
        begin() {
            if (!animations.length) {
                els.forEach(el => animations.push(el.animate(...animateParams)));
            }
        },
        revert() {
            if (animations.length) {
                animations.forEach(a => a.cancel());
                animations.splice(0, animations.length);
            }
        },
    });
}

export function registerRafTransition<TState extends {}>(callback: (timestamp: DOMHighResTimeStamp, state: TState) => boolean, state: TState, revert?: (event: "revert" | "cancel") => void) {
    let frameId: number | undefined;
    let trackedState = { ...state };
    function cancel() {
        if (frameId !== undefined) {
            cancelAnimationFrame(frameId);
            trackedState = { ...state };
        }
    }

    function start() {
        frameId = requestAnimationFrame(function update(timestamp: DOMHighResTimeStamp) {
            if (callback(timestamp, trackedState)) {
                frameId = requestAnimationFrame(update);
            }
        });
    }

    registerTransition({
        begin() {
            cancel();
            start();
        },
        revert() {
            cancel();
            if (revert) revert("revert");
        },
    });

    return () => {
        registerTransition({
            begin() {
                cancel();
                if (revert) revert("cancel");
            },
            revert() {
                start();
            },
        })
    }
}

export function withPrevious() {
    if (_transitions.length < 2) {
        return;
    }
    const lastTwo = _transitions.splice(_transitions.length - 2);
    _transitions.push({
        begin() {
            lastTwo[0].begin(() => { });
            lastTwo[1].begin(() => { });
        },
        revert() {
            lastTwo[0].revert();
            lastTwo[1].revert();
        },
    })
}

// ------------------------

/**
 * if transitioning, this is the currently transitioning transition
 * if not transitioning, this is the transition that was just played
 * */
let _transitionIndex = -1;
const _transitions: Transition[] = [];

let _fastForwardFunction: (() => void) | void = undefined;

const getCurrentTransition = () => _transitions[_transitionIndex];

function goToPage(pageName: string) {
    let newUrl = window.location.origin;
    if (pageName !== "index") {
        newUrl += "/" + pageName;
    }
    window.location.href = newUrl;
}

const INDEX_SEARCH_PARAM_KEY = "s";

function updateIndexInUrl() {
    const url = new URL(window.location.href);
    if (_transitionIndex < 0) {
        removeIndexFromURL();
        return;
    }

    url.searchParams.set(INDEX_SEARCH_PARAM_KEY, (_transitionIndex + 1).toString());
    history.pushState(null, "", url.href);
}

function removeIndexFromURL() {
    const url = new URL(window.location.href);
    url.searchParams.delete(INDEX_SEARCH_PARAM_KEY);
    history.pushState(null, "", url.href);
}

function fastForwardToUrlIndex() {
    // s=1 will load after the first transition, s=2 will load after the second transition, etc
    const start = parseInt(new URLSearchParams(window.location.search).get(INDEX_SEARCH_PARAM_KEY) ?? "");
    if (start && !isNaN(start) && start > 0) {
        _transitionIndex = Math.min(start, _transitions.length) - 1;
        for (let i = 0; i <= _transitionIndex; i++) {
            _transitions[i].begin(() => { });
        }
    }
}

export function nextTransition() {

    // if transitioning, fast forward
    if (_fastForwardFunction) {
        _fastForwardFunction();
        _fastForwardFunction = undefined;
        return;
    }

    // if we're already done with the last transition, nothing to do
    if (_transitionIndex + 1 >= _transitions.length) {
        return;
    }

    // otherwise, increment and start next transition
    _transitionIndex++;
    _fastForwardFunction = getCurrentTransition().begin(() => { _fastForwardFunction = undefined; });
    updateIndexInUrl();
}

export function prevTransition() {

    // if currently transitioning, revert it
    if (_fastForwardFunction) {
        _fastForwardFunction();
        _fastForwardFunction = undefined;
        getCurrentTransition().revert();
        _transitionIndex--;
        updateIndexInUrl();
        return;
    }

    // if no transitions are active, do nothing
    if (_transitionIndex < 0) {
        return;
    }

    // otherwise, revert last transition and decrement
    getCurrentTransition().revert();
    _transitionIndex--;
    updateIndexInUrl();
}

export function nextPage() {
    if (document.body.dataset.nextPage) {
        goToPage(document.body.dataset.nextPage);
    }
}

export function prevPage() {
    if (document.body.dataset.prevPage) {
        goToPage(document.body.dataset.prevPage);
    }
}

function onReady() {

    fastForwardToUrlIndex();

    // set up buttons and arrow keys
    // document.querySelectorAll("button[data-next-slide]").forEach(b => b.addEventListener("click", nextTransition));
    // document.querySelectorAll("button[data-prev-slide]").forEach(b => b.addEventListener("click", prevTransition));
    document.addEventListener("keydown", ({ code, shiftKey, metaKey, ctrlKey }) => {
        switch (code) {
            case "ArrowLeft":
                if (shiftKey) {
                    prevPage();
                }
                else {
                    prevTransition();
                }
                break;
            case "ArrowRight":
                if (shiftKey) {
                    nextPage();
                }
                else {
                    nextTransition();
                }
                break;
            case "KeyF":
                document.body.requestFullscreen();
                break;
            case "KeyR":
                if (shiftKey && (metaKey || ctrlKey)) {
                    removeIndexFromURL();
                }
        }
    });
}

document.addEventListener("DOMContentLoaded", onReady);