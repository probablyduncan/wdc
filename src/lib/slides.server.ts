export function getSlides() {
    ensureCache();
    return _cache!;
}

export function getPageInfo(name: string): PageInfo {
    ensureCache();
    const page = _cache.pages[name];
    return {
        this: name,
        next: page.next,
        prev: page.prev,
        transitions: page.transitions,
        startIndex: page.startNumber,
        totalCount: _cache.length,
    }
}

let _cache: {
    length: number;
    pages: Record<string, {
        prev?: string;
        next?: string;
        transitions: string[];
        startNumber: number;
    }>;
}

/**
 * returns normalized url pathname
 * use with (for example) Astro.url
 */
export function getPageName(url: URL) {
    return normalizePageName(url.pathname);
}

/**
 * "/one" => "one"
 * "/two/" => "two"
 * "" => "index"
 */
export function normalizePageName(pageName: string) {
    const normalized = pageName.replace(/^\/*|\/*$/gm, "").trim();
    return normalized ? normalized : "index";
}

function ensureCache() {
    if (_cache) return;

    _cache = {
        length: 0,
        pages: {},
    };


    const moduleMap = new Map<string, SlideModuleExport>();
    Object.values(import.meta.glob("/src/pages/**/*.astro", { eager: true })).forEach((_module) => {
        const module = _module as SlideModuleExport;
        const name = normalizePageName(module.url);
        moduleMap.set(name, module);
    });

    let currentPage: string = "index";
    let prevPage: string | undefined = undefined;

    while (true) {
        const module = moduleMap.get(currentPage);
        if (!module) break;

        _cache.pages[currentPage] = {
            startNumber: ++_cache.length,
            transitions: [],
        };

        if (prevPage) {
            _cache.pages[currentPage].prev = prevPage;
        }

        if (module.transitions) {

            // if transitions isn't an array or it has non-string elements, throw
            if (!Array.isArray(module.transitions) || module.transitions.some(str => typeof str !== "string")) {
                throw validationError("transition is not array of strings", "transitions", module);
            }

            _cache.pages[currentPage].transitions = module.transitions;
            _cache.length += module.transitions.length;
        }

        // last slide, we're done
        if (module.nextPage === undefined) {
            break;
        }

        // validate next page is a string
        if (typeof module.nextPage !== "string") {
            throw validationError("nextPage is not a string", "nextPage", module);
        }

        // validate next page is a page that exists
        if (!moduleMap.has(module.nextPage)) {
            throw validationError("nextPage is not a valid page", "nextPage", module);
        }

        // validate against infinite loop
        if (module.nextPage in _cache.pages) {
            throw validationError("nextPage is being used twice (infinite loop!)", "nextPage", module);
        }

        _cache.pages[currentPage].next = module.nextPage;
        prevPage = currentPage;
        currentPage = module.nextPage;
    }
}

function validationError(error: string, prop: keyof SlideModuleExport, module: SlideModuleExport) {
    return new Error(`${error}\n\n\tvalue: ${module![prop]}\n\tfile:  ${module.file}\n`);
}