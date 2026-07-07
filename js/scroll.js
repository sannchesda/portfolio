// SIGNAL — Lenis smooth scroll + every scroll-driven scene.

export function initSmoothScroll() {
    const lenis = new Lenis({ autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            lenis.scrollTo(target, { duration: 1.4 });
        });
    });

    return lenis;
}

// ── Hero intro (called when the preloader parts) ────────────────

// SplitText's default aria-label lands on generic spans (prohibited ARIA);
// instead hide the split fragments and give screen readers a plain copy.
function srCopy(el, text) {
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.parentNode.insertBefore(sr, el);
}

export function heroIntro() {
    srCopy(document.querySelector('.hero-line'), 'Sann Chesda');
    const split = new SplitText('.hero-line-inner', { type: 'chars', aria: 'hidden' });
    const tagline = document.querySelector('.hero-tagline');
    const taglineText = tagline.textContent;

    gsap.set(split.chars, { yPercent: 115, rotateX: -45, transformPerspective: 600 });
    gsap.set(tagline, { opacity: 1 });
    tagline.textContent = '';

    const tl = gsap.timeline();
    tl.to(split.chars, {
        yPercent: 0,
        rotateX: 0,
        duration: 1.15,
        ease: 'power4.out',
        stagger: 0.035,
    })
        .to(tagline, {
            duration: 1.4,
            scrambleText: { text: taglineText, chars: '01<>/\\_—', speed: 0.5 },
        }, '-=0.7')
        .from('.hero-corner, .site-header', {
            autoAlpha: 0,
            duration: 0.9,
            ease: 'power2.out',
            stagger: 0.06,
        }, '-=1.0');

    gsap.to('.hero-scroll-arrow', {
        y: 5,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 2,
    });

    return tl;
}

// ── All scroll scenes ───────────────────────────────────────────

export function initScenes(lenis) {
    heroScrub();
    marquee(lenis);
    sectionHeads();
    about();
    experience();
    projects();
    skills();
    education();
    contact();
}

function heroScrub() {
    const lines = gsap.utils.toArray('.hero-line-inner');
    gsap.timeline({
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
    })
        .to(lines[0], { xPercent: -14, ease: 'none' }, 0)
        .to(lines[1], { xPercent: 14, ease: 'none' }, 0)
        .to('.hero-tagline', { yPercent: 260, autoAlpha: 0, ease: 'none' }, 0)
        .to('.hero-corners', { autoAlpha: 0, ease: 'none' }, 0);
}

function marquee(lenis) {
    const loop = gsap.to('.marquee-track', {
        xPercent: -50,
        duration: 24,
        ease: 'none',
        repeat: -1,
    });

    // Scroll velocity nudges the loop's speed and direction.
    let target = 1;
    lenis.on('scroll', (e) => {
        target = gsap.utils.clamp(-4, 4, 1 + e.velocity / 6);
    });
    gsap.ticker.add(() => {
        loop.timeScale(gsap.utils.interpolate(loop.timeScale(), target, 0.06));
        target = gsap.utils.interpolate(target, 1, 0.02);
    });
}

function sectionHeads() {
    gsap.utils.toArray('.section-head').forEach((head) => {
        gsap.timeline({
            scrollTrigger: { trigger: head, start: 'top 82%' },
        })
            .from(head.querySelector('.section-rule'), {
                scaleX: 0,
                duration: 1.1,
                ease: 'expo.out',
            })
            .from([head.querySelector('.section-index'), head.querySelector('.section-title')], {
                autoAlpha: 0,
                y: 26,
                duration: 0.8,
                ease: 'power4.out',
                stagger: 0.08,
            }, 0.1);
    });
}

function about() {
    const bio = document.querySelector('.about-bio');
    srCopy(bio, bio.textContent);
    const split = new SplitText(bio, { type: 'lines', mask: 'lines', aria: 'hidden' });
    gsap.from(split.lines, {
        yPercent: 115,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.09,
        scrollTrigger: { trigger: bio, start: 'top 78%' },
    });

    const frame = document.querySelector('.about-portrait-frame');
    const img = frame.querySelector('img');
    gsap.from(frame, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.3,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: frame, start: 'top 80%' },
    });
    gsap.fromTo(img,
        { yPercent: -3, scale: 1.06 },
        {
            yPercent: 3,
            scale: 1.06,
            ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
        });

    gsap.utils.toArray('.stat').forEach((stat, i) => {
        const num = stat.querySelector('.stat-num');
        const end = parseInt(num.dataset.count, 10);
        const obj = { v: 0 };
        gsap.from(stat, {
            autoAlpha: 0,
            y: 24,
            duration: 0.7,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.about-stats', start: 'top 85%' },
        });
        gsap.to(obj, {
            v: end,
            duration: 1.4,
            delay: i * 0.1,
            ease: 'power2.out',
            snap: { v: 1 },
            onUpdate: () => { num.textContent = obj.v; },
            scrollTrigger: { trigger: '.about-stats', start: 'top 85%' },
        });
    });
}

function experience() {
    const mm = gsap.matchMedia();
    const panels = gsap.utils.toArray('.xp-panel');
    const dots = gsap.utils.toArray('.xp-dot');

    mm.add('(min-width: 1024px)', () => {
        const track = document.querySelector('.xp-track');
        const viewport = document.querySelector('.xp-viewport');
        const distance = () => -(track.scrollWidth - viewport.clientWidth);

        const setActive = (idx) => {
            panels.forEach((p, i) => p.classList.toggle('is-active', i === idx));
            dots.forEach((d, i) => d.classList.toggle('is-active', i <= idx));
        };
        setActive(0);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.experience',
                start: 'top top',
                end: '+=280%',
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => setActive(Math.round(self.progress * (panels.length - 1))),
            },
        });
        tl.to(track, { x: distance, ease: 'none' }, 0)
            // giant year numerals drift slower than the cards → depth
            .to('.xp-year', { x: () => -distance() * 0.22, ease: 'none' }, 0)
            .to('.xp-progress-fill', { scaleX: 1, ease: 'none' }, 0);

        return () => setActive(-1);
    });

    mm.add('(max-width: 1023px)', () => {
        const track = document.querySelector('.xp-track');
        gsap.to(track, {
            '--rail': 1,
            ease: 'none',
            scrollTrigger: {
                trigger: track,
                start: 'top 70%',
                end: 'bottom 60%',
                scrub: true,
            },
        });
        panels.forEach((p) => {
            gsap.from(p.querySelector('.xp-card'), {
                autoAlpha: 0,
                x: -28,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: { trigger: p, start: 'top 80%' },
            });
        });
    });
}

function projects() {
    // Clean full-page cover: each project stays put at full size while the
    // next one slides up over it (sticky stacking handles the cover).
    const cards = gsap.utils.toArray('.project');
    cards.forEach((card) => {
        gsap.from(card.querySelectorAll('.project-logo, .project-title, .project-desc, .project-tags, .project-links'), {
            autoAlpha: 0,
            y: 34,
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.07,
            scrollTrigger: { trigger: card, start: 'top 62%' },
        });
    });
}

function skills() {
    gsap.from('.skill', {
        autoAlpha: 0,
        scale: 0.9,
        y: 18,
        duration: 0.7,
        ease: 'power3.out',
        stagger: { each: 0.05, from: 'center', grid: 'auto' },
        scrollTrigger: { trigger: '.skills-grid', start: 'top 80%' },
    });
    gsap.from('.skills-also', {
        autoAlpha: 0,
        duration: 0.9,
        delay: 0.4,
        scrollTrigger: { trigger: '.skills-grid', start: 'top 80%' },
    });
}

function education() {
    gsap.utils.toArray('.edu-card').forEach((card, i) => {
        gsap.from(card, {
            clipPath: 'inset(0% 100% 0% 0%)',
            duration: 1.1,
            delay: i * 0.15,
            ease: 'expo.inOut',
            scrollTrigger: { trigger: '.edu-grid', start: 'top 78%' },
        });
        gsap.from(card.children, {
            autoAlpha: 0,
            y: 20,
            duration: 0.7,
            delay: 0.45 + i * 0.15,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: { trigger: '.edu-grid', start: 'top 78%' },
        });
    });
}

function contact() {
    gsap.from('.contact-huge', {
        autoAlpha: 0,
        y: 90,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.contact', start: 'top 70%' },
    });
    gsap.from(['.contact-email', '.contact-pills .pill'], {
        autoAlpha: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.contact', start: 'top 60%' },
    });
}
