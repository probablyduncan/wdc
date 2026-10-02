import { registerTransition } from "./slides";

const CONST_CONTROL_OPTION_DEFAULTS = {
    startInlineInputsHidden: false,
    additionalInputSelector: "",
};
export function addConstControl<TValue extends number | string>(constName: string, values: TValue[], options: Partial<typeof CONST_CONTROL_OPTION_DEFAULTS> = {}): {
    get: () => TValue;
    set: (value: TValue) => void;
    reset: () => void;
    show: () => void;
    hide: () => void;
    listen: (callback: (value: TValue) => void) => void;
} {
    const { startInlineInputsHidden, additionalInputSelector } = Object.assign({...CONST_CONTROL_OPTION_DEFAULTS}, options);

    const inlineInputEls: HTMLInputElement[] = [];
    const additionalInputEls = [...document.querySelectorAll<HTMLInputElement>(additionalInputSelector)];
    const valueEls: HTMLElement[] = [];
    let initialIndex = 0;
    let index = Math.floor(values.length / 2);

    const listeners: ((value: TValue) => void)[] = [];
    function addListener(callback: (value: TValue) => void) {
        if (!listeners.includes(callback)) {
            listeners.push(callback);
        }
        callback(values[index]);
    }

    function set(value: TValue) {
        index = values.indexOf(value);
        valueEls.forEach(el => el.innerText = value.toString());
        inlineInputEls.forEach(el => el.value = index.toString());
        additionalInputEls.forEach(el => el.value = index.toString());
        listeners.forEach(callback => callback(value));
    }

    function setHidden(hidden: boolean) {
        inlineInputEls.forEach(el => {
            if (el.classList.contains("const-control")) {
                el.hidden = hidden;
            }
        });
    }

    for (let codeBlock of document.getElementsByClassName("expressive-code")) {

        for (let line of codeBlock.getElementsByClassName("code") as HTMLCollectionOf<HTMLElement>) {

            if (!line.innerText.startsWith("const " + constName)) {
                continue;
            }

            const value = line.innerText.substring(line.innerText.indexOf("=") + 1, line.innerText.indexOf(";")).trim();
            const valueEl = ([...line.children] as HTMLElement[]).find(child => child.innerText === value);
            if (!value || !valueEl) {
                continue;
            }

            // create slider
            const input = document.createElement("input");
            input.type = "range";

            // set value
            const foundValueIndex = values.findIndex(value => valueEl.innerText.trim() === value.toString());
            if (foundValueIndex !== -1) {
                index = foundValueIndex;
            }

            valueEl.innerHTML = values[index].toString();
            input.value = index.toString();

            // set min/max
            input.min = "0";
            input.max = (values.length - 1).toString();

            input.classList.add("const-control");
            input.hidden = startInlineInputsHidden;

            inlineInputEls.push(input);
            valueEls.push(valueEl);
            line.appendChild(input);
            input.addEventListener("input", () => {
                set(values[parseInt(input.value)]);
            });
        }

        initialIndex = index;
        set(values[index]);
    }

    return {
        get: () => values[index],
        set,
        reset: () => {
            set(values[initialIndex]);
        },
        show: () => setHidden(false),
        hide: () => setHidden(false),
        listen: addListener,
    }
}

export function addLiveDisplay<TValue = string | number>(name: string, initialValue: TValue, debounce: number = 100) {

    const token = `{${name}}`;
    const elements: HTMLElement[] = [];
    let value: TValue = initialValue;

    elements.push(...document.querySelectorAll<HTMLElement>(`[data-live-display="${name}"]`));

    for (let codeBlock of document.getElementsByClassName("expressive-code")) {
        for (let line of codeBlock.getElementsByClassName("code") as HTMLCollectionOf<HTMLElement>) {

            const tokenIndex = line.innerText.indexOf(token);
            const commentIndex = line.innerText.indexOf("//");
            if (tokenIndex === -1 || commentIndex === -1 || commentIndex > tokenIndex) {
                continue;
            }

            const commentStartElement = ([...line.children] as HTMLElement[]).find(el => (el as HTMLElement).innerText.startsWith("//"));

            if (!commentStartElement) {
                continue;
            }

            // get color
            const commentColor = commentStartElement.style.getPropertyValue("--0") ?? "";

            // create pre-value span
            const commentBeforeTokenSpan = document.createElement("span");
            commentBeforeTokenSpan.innerText = line.innerText.substring(commentIndex, tokenIndex);
            commentBeforeTokenSpan.style.setProperty("--0", commentColor);

            // crate value span
            const display = document.createElement("span");
            display.innerText = (value as number | string).toString();
            display.style.setProperty("--0", commentColor);
            elements.push(display);

            // create post-value span
            const commentAfterTokenSpan = document.createElement("span");
            commentAfterTokenSpan.innerText = line.innerText.substring(tokenIndex + token.length);
            commentAfterTokenSpan.style.setProperty("--0", commentColor);

            // remove all comment elements, we're gonna overwrite
            while (commentStartElement.nextSibling) {
                commentStartElement.nextSibling.remove();
            }
            commentStartElement.remove();

            // now add new ones
            line.appendChild(commentBeforeTokenSpan);
            line.appendChild(display);
            line.appendChild(commentAfterTokenSpan);
        }
    }

    function updateElements() {
        elements.forEach(el => el.innerText = (value as number | string).toString());
    }

    let debounceTimeoutId: NodeJS.Timeout | undefined = undefined;

    return {
        get() {
            return value;
        },
        set(arg: TValue | ((prev: TValue) => TValue)) {

            if (typeof arg === "function") {
                // @ts-ignore
                value = arg(value);
            }
            else {
                value = arg;
            }

            if (!debounceTimeoutId) {
                debounceTimeoutId = setTimeout(() => {
                    updateElements();
                    debounceTimeoutId = undefined;
                }, debounce);
            }
        },
    }
}

export function getCodeBlockTransitions(wrapperId: string) {
    const wrapperEl = document.getElementById(wrapperId);
    if (!wrapperEl) {
        return {
            next() { },
            hide() { },
            show() { },
        }
    }

    const codeBlockEls = [
        ...wrapperEl.querySelectorAll<HTMLElement>(".expressive-code"),
    ];
    let index = codeBlockEls.findIndex((el) =>
        el.classList.contains("active"),
    );
    function getCurrent() {
        if (index > -1 && index < codeBlockEls.length) {
            return codeBlockEls[index];
        }
    }

    function toggleCurrent(type: "remove" | "add") {
        const currentEl = getCurrent();
        if (!currentEl) return;

        currentEl.classList[type]("active");

        // reset scroll and close collapsible sections
        if (type === "add") {
            currentEl
                .querySelector<HTMLPreElement>(`pre`)
                ?.scrollTo({ behavior: "instant", left: 0 });
            currentEl.querySelectorAll("details").forEach((detail) => {
                detail.open = false;
            });
        }
    }

    function isHidden() {
        if (index > -1 && index < codeBlockEls.length) {
            return !codeBlockEls[index].classList.contains("active");
        }

        return false;
    }

    return {
        next() {
            let hiddenOnBegin = false;
            registerTransition({
                begin() {
                    hiddenOnBegin = isHidden();
                    const atEnd = index >= codeBlockEls.length - 1;

                    if (!hiddenOnBegin && !atEnd) {
                        toggleCurrent("remove");
                    }

                    index++;
                    if (!atEnd) {
                        toggleCurrent("add");
                    }
                },
                revert() {
                    toggleCurrent("remove");
                    index--;
                    if (!hiddenOnBegin) {
                        toggleCurrent("add");
                    }
                },
            });
        },
        hide() {
            let hiddenOnBegin = false;
            registerTransition({
                begin() {
                    hiddenOnBegin = isHidden();
                    toggleCurrent("remove");
                },
                revert() {
                    if (!hiddenOnBegin) {
                        toggleCurrent("add");
                    }
                },
            });
        },
        show() {
            let hiddenOnBegin = false;
            registerTransition({
                begin() {
                    hiddenOnBegin = isHidden();
                    toggleCurrent("add");
                },
                revert() {
                    if (hiddenOnBegin) {
                        toggleCurrent("remove");
                    }
                },
            });
        },
    };
}