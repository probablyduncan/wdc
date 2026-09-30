type Transition = {
    /**
     * function called when transition should start
     */
    begin(): void;
    /**
     * function called when transition should be reverted
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

// export function registerTransition(transition: (event: "begin" | "revert") => void) {
//     _transitions.push({
//         begin: () => transition("begin"),
//         revert: () => transition("revert"),
//     });
// }

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

export function registerRafTransition<TState extends {}>(
    defaultState: TState,
    callback: (params: { state: TState, timestamp: DOMHighResTimeStamp, delta: DOMHighResTimeStamp }) => boolean,
    cleanup?: (params: { state: TState, event: "revert" | "end" }) => void
) {
    let state: TState = { ...defaultState };
    let prev: DOMHighResTimeStamp | undefined;
    let isAnimating = false;

    function animate(timestamp: DOMHighResTimeStamp) {
        if (!isAnimating) return;

        const delta = timestamp - (prev ?? timestamp);
        prev = timestamp;

        if (callback({ state, timestamp, delta })) {
            requestAnimationFrame(animate);
        }
    }

    function start() {
        if (isAnimating) {
            state = { ...defaultState };
            return;
        }

        isAnimating = true;
        requestAnimationFrame((time) => {
            prev = time;
            requestAnimationFrame(animate);
        })
    }

    function cancel() {
        if (isAnimating) {
            isAnimating = false;
            state = { ...defaultState };
        }
    }

    return {
        state,
        registerStart: () => registerTransition({
            begin() {
                start();
            },
            revert() {
                cancel();
                if (cleanup) {
                    cleanup({ state, event: "revert" });
                }
            },
        }),
        registerEnd: () => registerTransition({
            begin() {
                cancel();
                if (cleanup) {
                    cleanup({ state, event: "end" });
                }
            },
            revert() {
                start();
            },
        }),
        start,
        cancel,
    };
}

export function withPrevious() {
    if (_transitions.length < 2) {
        return;
    }
    const lastTwo = _transitions.splice(_transitions.length - 2);
    _transitions.push({
        begin() {
            lastTwo[0].begin();
            lastTwo[1].begin();
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

const getCurrentTransition = () => _transitions[_transitionIndex];

const INDEX_SEARCH_PARAM_KEY = "s";

function goToPage(pageName: string, slide?: number) {
    let newUrl = window.location.origin;
    if (pageName !== "index") {
        newUrl += "/" + pageName;
    }

    if (slide) {
        newUrl += "?" + INDEX_SEARCH_PARAM_KEY + "=" + slide;
    }

    window.location.href = newUrl;
}

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
            _transitions[i].begin();
        }
    }
    updateIndexInUrl();
}

export function nextTransition() {

    // if we're already done with the last transition, nothing to do
    if (_transitionIndex + 1 >= _transitions.length) {
        return;
    }

    // otherwise, increment and start next transition
    _transitionIndex++;
    getCurrentTransition().begin();
    updateIndexInUrl();
}

export function prevTransition() {

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
        goToPage(document.body.dataset.prevPage, 999);
    }
}

function onReady() {

    fastForwardToUrlIndex();

    // set up buttons and arrow keys
    // document.querySelectorAll("button[data-next-slide]").forEach(b => b.addEventListener("click", nextTransition));
    // document.querySelectorAll("button[data-prev-slide]").forEach(b => b.addEventListener("click", prevTransition));
    document.addEventListener("keydown", ({ code, shiftKey, metaKey, ctrlKey }) => {
        const onInput = document.activeElement?.tagName === "INPUT";
        switch (code) {
            case "ArrowLeft":
                if (shiftKey) {
                    prevPage();
                }
                else if (!onInput) {
                    prevTransition();
                }
                break;
            case "ArrowRight":
                if (shiftKey) {
                    nextPage();
                }
                else if (!onInput) {
                    nextTransition();
                }
                break;
            case "KeyF":
                if (!metaKey && !ctrlKey) {
                    document.body.requestFullscreen();
                }
                break;
            case "KeyR":
                if (shiftKey && (metaKey || ctrlKey)) {
                    removeIndexFromURL();
                }
        }
    });
}

document.addEventListener("DOMContentLoaded", onReady);