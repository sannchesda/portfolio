// SIGNAL — boot-sequence preloader. Only ever shown when the motion gate
// passed (html.has-motion), so a CDN failure can never blank the page.

export function runPreloader(onReveal) {
    const pre = document.getElementById('preloader');
    if (!pre) {
        onReveal();
        return;
    }

    pre.classList.add('is-active');

    // Repeat visit this session → quick fade instead of the full boot.
    if (sessionStorage.getItem('sc-booted')) {
        gsap.to(pre, {
            autoAlpha: 0,
            duration: 0.45,
            delay: 0.15,
            onStart: onReveal,
            onComplete: () => pre.remove(),
        });
        return;
    }
    try {
        sessionStorage.setItem('sc-booted', '1');
    } catch (e) { /* private mode — full boot every time is fine */ }

    const typed = pre.querySelector('.preloader-typed');
    const count = pre.querySelector('.preloader-count');
    const counter = { v: 0 };

    const tl = gsap.timeline({ onComplete: () => pre.remove() });

    tl.to(typed, {
        duration: 1.0,
        scrambleText: { text: 'init --signal', chars: '01<>/\\_-', speed: 0.4 },
    })
        .to(counter, {
            v: 100,
            duration: 1.5,
            ease: 'power2.inOut',
            snap: { v: 1 },
            onUpdate: () => { count.textContent = String(counter.v).padStart(3, '0'); },
        }, 0.15)
        // flicker at 100
        .to(count, { opacity: 0.15, duration: 0.06, yoyo: true, repeat: 3 })
        .to('.preloader-content, .preloader-count', { autoAlpha: 0, duration: 0.25 })
        .add(onReveal, '+=0.05')
        .to('.preloader-half--top', { yPercent: -101, duration: 0.95, ease: 'expo.inOut' }, '<')
        .to('.preloader-half--bottom', { yPercent: 101, duration: 0.95, ease: 'expo.inOut' }, '<');
}
