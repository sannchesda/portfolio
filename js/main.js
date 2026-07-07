// SIGNAL — boot gate + init order.
// Content must remain fully readable if any of this fails: nothing below
// hides content unless the motion gate passes first.

import { initSmoothScroll, initScenes, heroIntro } from './scroll.js';
import { initCursor } from './cursor.js';
import { initParticles } from './particles.js';
import { runPreloader } from './preloader.js';
import { initTerminal } from './terminal.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const libsOK = !!(window.gsap && window.ScrollTrigger && window.SplitText &&
    window.ScrambleTextPlugin && window.Lenis);

if (libsOK) {
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
}

let lenis = null;
let particles = null;

if (libsOK && !reduceMotion.matches) {
    document.documentElement.classList.add('has-motion');

    // scrollRestoration was claimed as 'manual' in <head> so a mid-scroll
    // refresh can't restore a deep position under ScrollTrigger's pin math.
    // Start clean at the top (hash anchors still work).
    if (!location.hash) window.scrollTo(0, 0);

    lenis = initSmoothScroll();
    initCursor();
    particles = initParticles();
    if (particles) {
        lenis.on('scroll', (e) => particles.setVelocity(e.velocity));
    }

    // Wait for fonts before splitting text so line/char breaks are final.
    const fontsReady = Promise.race([
        document.fonts.ready,
        new Promise((res) => setTimeout(res, 1500)),
    ]);

    runPreloader(() => {
        fontsReady.then(() => heroIntro());
    });
    fontsReady.then(() => {
        initScenes(lenis);
        ScrollTrigger.refresh();
    });

    // If the OS setting flips to "reduce" mid-session, restart into the
    // static experience rather than trying to unwind every tween.
    reduceMotion.addEventListener('change', (e) => {
        if (e.matches) window.location.reload();
    });
} else {
    // Static experience has no pins — native scroll restoration is safe.
    history.scrollRestoration = 'auto';
}

initTerminal({ lenis, motionOK: libsOK && !reduceMotion.matches, particles });
initClock();

function initClock() {
    const el = document.querySelector('[data-clock]');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 30000);
}
