export function addConstControl(constName: string, values: string[], hidden: boolean = false): {
    get: () => string;
    set: (value: string) => void;
    reset: () => void;
    show: () => void;
    hide: () => void;
    listen: (callback: (value: string) => void) => void;
} {
    const inputEls: HTMLInputElement[] = [];
    const valueEls: HTMLElement[] = [];
    let initialIndex = 0;
    let index = 0;

    const listeners: ((value: string) => void)[] = [];
    function addListener(callback: (value: string) => void) {
        if (!listeners.includes(callback)) {
            listeners.push(callback);
        }
        callback(values[index]);
    }

    function set(value: string) {
        index = values.indexOf(value);
        valueEls.forEach(el => el.innerText = value);
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
            index = values.indexOf(valueEl.innerText);
            if (index === -1) {
                index = Math.floor(values.length / 2);
                valueEl.innerHTML = values[index];
            }
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