export function setTransitions(transitions: typeof window["transitions"]) {
    window.transitions ??= {};
    Object.assign(window.transitions, transitions);
}