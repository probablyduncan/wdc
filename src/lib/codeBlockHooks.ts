export function addConstControl<TValue extends number | string>(constName: string, values: TValue[], hidden: boolean = false): {
    get: () => TValue;
    set: (value: TValue) => void;
    reset: () => void;
    show: () => void;
    hide: () => void;
    listen: (callback: (value: TValue) => void) => void;
} {
    const inputEls: HTMLInputElement[] = [];
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
        inputEls.forEach(el => el.value = index.toString());
        listeners.forEach(callback => callback(value));
    }

    function show() {
        inputEls.forEach(el => el.hidden = false);
    }

    function hide() {
        inputEls.forEach(el => el.hidden = true);
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
            input.hidden = hidden;

            inputEls.push(input);
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
        show,
        hide,
        listen: addListener,
    }
}

export function trackNumberVariable(name: string) {

    const token = `{${name}}`;
    const elements: HTMLElement[] = [];
    let value: number;

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

            // get start value
            value ??= parseFloat(line.innerText.substring(line.innerText.indexOf("=") + 1, line.innerText.indexOf(";")).trim());

            // create pre-value span
            const commentBeforeTokenSpan = document.createElement("span");
            commentBeforeTokenSpan.innerText = line.innerText.substring(commentIndex, tokenIndex);
            commentBeforeTokenSpan.style.setProperty("--0", commentColor);

            // crate value span
            const display = document.createElement("span");
            display.innerText = value.toString();
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

    return {
        get() {
            return value;
        },
        set(arg: number | ((prev: number) => number)) {

            if (typeof arg === "function") {
                value = arg(value);
            }
            else {
                value = arg;
            }

            elements.forEach(el => el.innerText = value.toString());
        },
    }
}