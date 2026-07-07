// SIGNAL — custom cursor + magnetic elements. Pointer:fine devices only;
// the OS cursor is replaced visually but all elements stay real links/buttons.

export function initCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('has-cursor');

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    gsap.set([dot, ring], { x: -100, y: -100 });

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });

    window.addEventListener('pointermove', (e) => {
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
    }, { passive: true });

    // Grow the ring over anything interactive.
    document.addEventListener('pointerover', (e) => {
        if (e.target.closest('a, button, .skill')) ring.classList.add('is-hover');
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
        if (e.target.closest('a, button, .skill')) ring.classList.remove('is-hover');
    }, { passive: true });

    magnetize('[data-magnetic]', 0.35);
    magnetize('[data-magnetic-lite]', 0.12);
}

function magnetize(selector, strength) {
    document.querySelectorAll(selector).forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            xTo((e.clientX - r.left - r.width / 2) * strength);
            yTo((e.clientY - r.top - r.height / 2) * strength);
        }, { passive: true });
        el.addEventListener('pointerleave', () => {
            xTo(0);
            yTo(0);
        }, { passive: true });
    });
}
