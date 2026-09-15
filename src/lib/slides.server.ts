let _slides: Transition[];
export function getSlides() {
    ensureCache();
    return _slides!;
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

    if (_slides) return;

    const pages = import.meta.glob("/src/pages/**/*.astro", { eager: true });

    let index = 0;

    _slides = [];

    function addSlide(name: string, type: Transition["type"]) {
        _slides.push({
            type,
            name,
            index: index++,
        });
    }

    const pageMap = new Map<string, SlideModuleExport>();

    Object.values(pages).forEach((_module) => {
        const module = _module as SlideModuleExport;
        const name = normalizePageName(module.url);
        pageMap.set(name, module);
    });

    let currentPage = "index";
    while (true) {
        const module = pageMap.get(currentPage);
        if (!module) {
            break;
        }

        addSlide(currentPage, "page");

        // if transitions isn't an array or it has non-string elements, throw
        if (module.transitions && (!Array.isArray(module.transitions) || module.transitions.some(str => typeof str !== "string"))) {
            throw validationError("transition is not array of strings", "transitions", module);
        }
        
        module.transitions?.forEach(name => {
            addSlide(name, "function");
        });

        // last slide, we're done
        if (module.nextPage === undefined) {
            break;
        }

        // validate it's a string
        if (typeof module.nextPage !== "string") {
            throw validationError("nextPage is not a string", "nextPage", module);
        }

        // validate it's a page that exists
        if (!pageMap.has(module.nextPage)) {
            throw validationError("nextPage is not a valid page", "nextPage", module);
        }

        // validate against infinite loop
        if (_slides.some(s => s.name === module.nextPage)) {
            throw validationError("nextPage is being used twice (infinite loop!)", "nextPage", module);
        }

        currentPage = module.nextPage;
    }
}

function validationError(error: string, prop: keyof SlideModuleExport, module: SlideModuleExport) {
    return new Error(`${error}\n\n\tvalue: ${module![prop]}\n\tfile:  ${module.file}\n`);
}