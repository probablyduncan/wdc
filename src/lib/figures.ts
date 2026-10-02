import AnimationFrameController from "../lib/animationFrameController";
import { LerpController } from "../lib/interpolationController";

// type FigureCombinationCallback = (context: {
//     clientX: number,
//     clientY: number,
//     primaryId: string,
//     elements: Record<string, HTMLElement>,
// }) => void;

// export function registerFigureCombination(options: {
//     ids: string[];
//     callback: FigureCombinationCallback;
//     once?: boolean;
// }) {
//     _figureCombinations.push({
//         once: false,
//         ...options,
//     });
// }

// const _figureCombinations: {
//     ids: string[];
//     callback: FigureCombinationCallback;
//     once: boolean;
// }[] = [];

// function executeFigureCombinations(primaryId: string, clientX: number, clientY: number) {
//     if (!_figureCombinations.length) {
//         return;
//     }

//     const elementsUnderPoint = document.elementsFromPoint(clientX, clientY).reduce((map, el) => {
//         map.set(el.id, el as HTMLElement);
//         return map;
//     }, new Map<string, HTMLElement>());
//     console.log(elementsUnderPoint);

//     for (let i = _figureCombinations.length - 1; i > -1; i--) {
//         const { ids: requiredIds, callback, once } = _figureCombinations[i];

//         // if primaryId isn't a part of this, no need to continue
//         if (!requiredIds.includes(primaryId)) {
//             console.log("no primary id", primaryId, requiredIds);
//             continue;
//         }

//         // loop through required ids and make sure each one is under point
//         const matches: Parameters<FigureCombinationCallback>[0]["elements"] = {};
//         if (requiredIds.some(requiredId => {
//             const element = elementsUnderPoint.get(requiredId);
//             if (element !== undefined) {
//                 matches[requiredId] = element;
//             }
//             return element === undefined;
//         })) {
//             console.log("missing el", requiredIds);
//             continue;
//         }

//         callback({
//             clientX,
//             clientY,
//             primaryId,
//             elements: matches,
//         });

//         if (once) {
//             _figureCombinations.splice(i, 1);
//         }
//     }
// }

const prefersReducedMotion = (() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");;
    return () => query.matches;
})();

export function initFigures() {
    const figures = [
        ...document.querySelectorAll<HTMLElement>(
            "[data-grabbable-figure]",
        ),
    ];

    const noDragTags = ["input", "a"];

    const zIndexing = (() => {
        const baseZIndex = 100;
        const baseInvisibleZIndex = 1000;
        return {
            setup() {
                figures.forEach((figure, i) => {
                    let zIndex = baseZIndex + i;
                    if (!figure.checkVisibility()) {
                        zIndex += baseInvisibleZIndex;
                    }
                    figure.style.zIndex = zIndex.toString();
                });
            },
            reorder(newTopIndex: number) {
                const zIndexOfNewTop = parseInt(
                    figures[newTopIndex].style.zIndex,
                );
                figures.forEach((figure) => {
                    let zIndex = parseInt(figure.style.zIndex);
                    if (zIndex >= zIndexOfNewTop) {
                        zIndex--;
                    }
                    if (
                        zIndex > baseInvisibleZIndex &&
                        figure.checkVisibility()
                    ) {
                        zIndex -= baseInvisibleZIndex;
                    } else if (
                        zIndex < baseInvisibleZIndex &&
                        !figure.checkVisibility()
                    ) {
                        zIndex += baseInvisibleZIndex;
                    }
                    figure.style.zIndex = zIndex.toString();
                });
                figures[newTopIndex].style.zIndex = (
                    baseZIndex +
                    figures.length -
                    1
                ).toString();
            },
        };
    })();

    zIndexing.setup();

    figures.forEach((figure, i) => {
        let grabbing = false;
        figure.style.cursor = "grab";

        const x = new LerpController();
        const y = new LerpController();
        const a = new AnimationFrameController(({ deltaMS }) => {
            if (!grabbing && x.isAtRest() && y.isAtRest()) {
                return false;
            }

            figure.style.setProperty(
                "--drag-x",
                x.step(deltaMS).toFixed(2) + "px",
            );
            figure.style.setProperty(
                "--drag-y",
                y.step(deltaMS).toFixed(2) + "px",
            );
            return true;
        });

        const grabStartClientPos = [0, 0];
        const grabStartElPos = [0, 0];

        figure.addEventListener("mousedown", (e) => {
            if (e.button !== 0 || noDragTags.some(noDragTag => (e.target as HTMLElement)?.closest(noDragTag))) {
                return;
            }

            grabbing = true;
            figure.style.cursor = "grabbing";
            zIndexing.reorder(i);

            grabStartClientPos[0] = e.clientX;
            grabStartClientPos[1] = e.clientY;

            grabStartElPos[0] = x.target = x.current;
            grabStartElPos[1] = y.target = y.current;

            if (!prefersReducedMotion()) {
                // convoluted scaling based on size idk
                const scale =
                    1 +
                    figure.clientWidth / 1000000 +
                    10 / Math.sqrt(figure.clientWidth * figure.clientHeight);

                figure.style.setProperty("--s", scale.toString());
            }

            const abortController = new AbortController();

            window.addEventListener(
                "mousemove",
                (e) => {
                    x.target =
                        grabStartElPos[0] +
                        e.clientX -
                        grabStartClientPos[0];
                    y.target =
                        grabStartElPos[1] +
                        e.clientY -
                        grabStartClientPos[1];

                    if (prefersReducedMotion()) {
                        x.current = x.target;
                        y.current = y.target;
                    }
                },
                { signal: abortController.signal },
            );

            window.addEventListener(
                "mouseup",
                ({ clientX, clientY }) => {
                    grabbing = false;
                    figure.style.cursor = "grab";
                    figure.style.removeProperty("--s");
                    abortController.abort();
                    // executeFigureCombinations(figure.id, clientX, clientY);
                },
                { once: true },
            );

            a.playIfPaused();
        });
    });
}