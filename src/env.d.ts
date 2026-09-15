interface Window {
    transitions: Record<"page" | string, (onComplete: () => void) => {
        revert: () => void;
        fastForward: () => void;
    }>;
}

type SlideModuleExport = {
    transitions?: string[];
    nextPage?: string;
    url: string;
    file: string;
}

type Transition = {
    type: "page" | "function";
    name: string;
    index: number;
}

type PageInfo = {
    thisPage: string;
    transitions: string[];
    nextPage?: string;
    prevPage?: string;
}