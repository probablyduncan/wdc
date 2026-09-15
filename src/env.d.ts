interface Window {
    transitions: Record<"page" | string, TransitionFunction>;
    initialTransition?: TransitionFunction;
}

type SlideModuleExport = {
    transitions?: string[];
    nextPage?: string;
    url: string;
    file: string;
}

type TransitionFunction = (onComplete: () => void) => {
    revert: () => void;
    fastForward: () => void;
}

type PageInfo = {
    this: string;
    next?: string;
    prev?: string;
    transitions: string[];
    startIndex: number;
    totalCount: number;
}