export type Slide = {
    /**
     * server: this slide is a navigable page route
     * client: this slide is an on-page transition
     */
    type: "server" | "client";
    /**
     * index in slides array
     */
    index: number;
    /**
     * if "server", this is the name of the page route
     * if "client", this is the name of the slide function
     */
    name: string;
    /**
     * display number
     */
    number: number;
}

export type ServerSlide = {
    /** navigable route name */
    name: string;
    /** defaults to true */
    numbered?: boolean;
    /** list of client-side transition functions */
    clientSlides?: ClientSlide[];
}

export type ClientSlide = {
    /** function name to be called */
    name: string;
    /** defaults to false */
    numbered?: boolean;
}

const slideTree: ServerSlide[] = [
    {
        name: "one",
        numbered: true,
        clientSlides: [
            {
                name: "fadeIn",
                numbered: false,
            },
        ],
    },
    {
        name: "two",
    },
];

/**
 * array of all slides/transitions/etc.
 */
export const slides: Slide[] = [];

/**
 * number of numbered slides, not counting unnumbered transitions.
 */
export let numSlides = 0;

/**
 * returns slide for a given page pathname.
 * strips leading/trailing slashes.
 */
export function getSlideByPathname(pathname: string) {
    const normalized = pathname.replace(/^\/*|\/*$/gm, "");
    return slides.find(s => s.type === "server" && s.name === normalized);
}

/**
 * returns a string showing the current slide, given a pattern.
 * {n} is replaced by the current number, {i} is replaced by the current index, and {t} is replaced by the total num.
 * default pattern is "{c}/{t}"
 */
export function getSlideCounter(current: Slide, pattern?: string) {
    if (!pattern) {
        pattern = "{n}/{t}";
    }
    return pattern
        .replaceAll("{i}", (current.index + 1).toString())
        .replaceAll("{n}", current.number.toString())
        .replaceAll("{t}", numSlides.toString());
}

function incrementSlideNumber(numbered: boolean) {
    if (numbered) {
        numSlides++;
    }
    return numSlides;
}

for (let serverSlide of slideTree) {
    slides.push({
        type: "server",
        index: slides.length,
        name: serverSlide.name,
        number: incrementSlideNumber(serverSlide.numbered ?? true),
    });

    if (!serverSlide.clientSlides) {
        continue;
    }

    for (let clientSlide of serverSlide.clientSlides) {
        slides.push({
            type: "client",
            index: slides.length,
            name: clientSlide.name,
            number: incrementSlideNumber(clientSlide.numbered ?? false),
        })
    }
}