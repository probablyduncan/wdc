import { SpringController, type SpringOptions } from "./src/lib/interpolationController";
import "/src/style.css";

function init() {
    window.addEventListener("keypress", ({ code }) => {
        if (document.fullscreenEnabled && code === "KeyF") {
            document.fullscreenElement ? document.exitFullscreen() : document.body.requestFullscreen();
        }
    })

    window.addEventListener("mousemove", ({ clientX, clientY }) => {
        mouse.x = clientX;
        mouse.y = clientY;
    });

    type Position = {
        x: number, y: number
    }

    function getCenter(rect: DOMRect) {
        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
        };
    }

    const actI = [...document.querySelectorAll<HTMLElement>("div")].map(el => {
        const springOptions: SpringOptions = {
            mass: 2,
            damping: 10,
            stiffness: 50,
        };
        const x = new SpringController(springOptions);
        const y = new SpringController(springOptions);
        const r = new SpringController(springOptions);
        return {
            setup(mousePos: Position) {
                const thisPos = getCenter(el.getBoundingClientRect());
                const angleFromMouse = Math.atan2(thisPos.y - mousePos.y, thisPos.x - mousePos.x);
                x.target = Math.cos(angleFromMouse) * window.innerWidth * Math.SQRT2;
                y.target = Math.sin(angleFromMouse) * window.innerHeight * Math.SQRT2;
                r.velocity = Math.random() * 4 - 2;
            },
            step(delta: number) {
                x.step(delta);
                y.step(delta);
                r.step(delta);
                el.style.setProperty("--x", x.current + "px");
                el.style.setProperty("--y", y.current + "px");
                el.style.setProperty("--r", r.current + "rad");
            },
        }
    });

    const actII = (() => {

        const h1 = document.querySelector("h1")!;
        const h1SpringOptions: Partial<SpringOptions> = {
            mass: 4,
            damping: 10,
        };
        const h1x = new SpringController(h1SpringOptions);
        const h1y = new SpringController(h1SpringOptions);
        const h1r = new SpringController();
        function setH1Props() {
            h1.style.setProperty("--x", h1x.current + "px");
            h1.style.setProperty("--y", h1y.current + "px");
            h1.style.setProperty("--r", h1r.current + "rad");
        }

        const h2 = document.querySelector("h2")!;
        const h2SpringOptions: SpringOptions = {
            mass: 2,
            damping: 8,
            stiffness: 50,
        };
        const h2x = new SpringController(h2SpringOptions);
        const h2y = new SpringController(h2SpringOptions);
        const h2r = new SpringController();
        function setH2Props() {
            h2.style.setProperty("--x", h2x.current + "px");
            h2.style.setProperty("--y", h2y.current + "px");
            h2.style.setProperty("--r", h2r.current + "rad");
        }

        return {
            setup(mouse: Position, mouseDelta: Position) {
                const center = getCenter(h1.parentElement!.getBoundingClientRect());
                const mouseToCenterAngle = Math.atan2(mouse.y - center.y, mouse.x - center.x);
                const mouseDeltaAngle = Math.atan2(mouseDelta.y, mouseDelta.x);

                const mouseDirectionVector = {
                    x: Math.cos(mouseDeltaAngle),
                    y: Math.sin(mouseDeltaAngle),
                }

                const mouseToCenterVector = {
                    x: Math.cos(mouseToCenterAngle),
                    y: Math.sin(mouseToCenterAngle),
                }

                h1x.current = mouseToCenterVector.x * window.innerWidth;
                h1y.current = mouseToCenterVector.y * window.innerHeight;
                h1x.velocity = mouseDirectionVector.x * 5000;
                h1y.velocity = mouseDirectionVector.y * 5000 / 4;
                h1r.velocity = mouseDeltaAngle;
                setH1Props();
                h1.classList.add("active");

                setTimeout(() => {
                    h2x.current = mouseToCenterVector.x * window.innerWidth;
                    h2y.current = mouseToCenterVector.y * window.innerHeight;
                    h2x.velocity = mouseDirectionVector.x * 5000;
                    h2y.velocity = mouseDirectionVector.y * 5000 / 2;
                    h2r.velocity = mouseDeltaAngle * 2;
                    setH2Props();
                    h2.classList.add("active");
                }, 2000);
            },
            step(delta: number) {
                h1x.step(delta);
                h1y.step(delta);
                h1r.step(delta);

                h2x.step(delta);
                h2y.step(delta);
                h2r.step(delta);

                setH1Props();
                setH2Props();
            },
        }
    })();

    const mouse: Position = { x: 0, y: 0 };
    const prevMouse: Position = { ...mouse };

    let prevTime: number = 0;

    const threshold = {
        distance: 40,
        pxPerMs: 0.2,
    };

    let ACT = false;

    requestAnimationFrame(function update(time: number) {

        const timeDelta = time - prevTime;
        prevTime = time;

        if (ACT) {
            actII.step(timeDelta / 2);
            actI.forEach(el => el.step(timeDelta / 2));
        }
        else {
            const mouseDelta = {
                x: mouse.x - prevMouse.x,
                y: mouse.y - prevMouse.y,
            }

            prevMouse.x = mouse.x;
            prevMouse.y = mouse.y;

            if (prevMouse.x > (window.innerWidth - threshold.distance) && mouseDelta.x < 0 && Math.abs(mouseDelta.x / timeDelta) > threshold.pxPerMs) {
                ACT = true;
                actII.setup(mouse, mouseDelta);
                actI.forEach(el => el.setup(mouse));
            }
        }

        requestAnimationFrame(update);
    });
}

window.addEventListener("DOMContentLoaded", init);