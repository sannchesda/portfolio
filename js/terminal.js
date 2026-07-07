// SIGNAL — dev-mode terminal overlay. Works even when GSAP is missing
// (plain toggle instead of the glitch transition); requires only itself.

import { registry, commandNames } from './commands.js';

export function initTerminal({ lenis = null, motionOK = false, particles = null } = {}) {
    const term = document.getElementById('terminal');
    if (!term) return;

    const output = term.querySelector('.term-output');
    const form = term.querySelector('.term-form');
    const input = term.querySelector('#term-input');
    const echo = term.querySelector('.term-echo-text');
    const matrixCanvas = term.querySelector('.term-matrix');
    const glitch = document.querySelector('.glitch');
    const screen = term.querySelector('.term-screen');
    const pageChrome = [document.querySelector('main'), document.querySelector('.site-header')];

    const hasGsap = !!window.gsap;

    let isOpen = false;
    let animating = false;
    let booted = false;
    let lastFocused = null;
    const history = [];
    let histIdx = -1;
    let matrixStop = null;

    // ── output helpers ──────────────────────────────────────────

    function print(text = '', flavor = '') {
        const el = document.createElement('div');
        el.className = 'term-line' + (flavor ? ` term-line--${flavor}` : '');
        el.textContent = text;
        output.append(el);
        scrollToEnd();
        return el;
    }

    function printEl(el) {
        output.append(el);
        scrollToEnd();
    }

    function scrollToEnd() {
        output.scrollTop = output.scrollHeight;
    }

    const ctx = {
        print,
        printEl,
        clear: () => { output.textContent = ''; },
        close: () => close(),
        startMatrix: () => startMatrix(),
    };

    // ── command execution ───────────────────────────────────────

    function exec(raw) {
        const line = raw.trim();
        const cmdEl = document.createElement('div');
        cmdEl.className = 'term-line term-line--cmd';
        const promptSpan = document.createElement('span');
        promptSpan.className = 'term-line-prompt';
        promptSpan.textContent = 'chesda@portfolio:~$ ';
        cmdEl.append(promptSpan, document.createTextNode(line));
        output.append(cmdEl);

        if (!line) {
            scrollToEnd();
            return;
        }

        history.push(line);
        histIdx = history.length;

        const [name, ...args] = line.split(/\s+/);
        const cmd = registry[name.toLowerCase()];
        if (!cmd) {
            print(`command not found: ${name} — try 'help'`, 'error');
            return;
        }
        const result = cmd.run(args, ctx);
        if (typeof result === 'string') print(result);
        else if (Array.isArray(result)) result.forEach((l) => print(l));
        else if (result instanceof HTMLElement) printEl(result);
        scrollToEnd();
    }

    // ── input wiring ────────────────────────────────────────────

    input.addEventListener('input', () => {
        echo.textContent = input.value;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        exec(input.value);
        input.value = '';
        echo.textContent = '';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            exec(input.value);
            input.value = '';
            echo.textContent = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx > 0) {
                histIdx--;
                input.value = history[histIdx];
                echo.textContent = input.value;
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx < history.length - 1) {
                histIdx++;
                input.value = history[histIdx];
            } else {
                histIdx = history.length;
                input.value = '';
            }
            echo.textContent = input.value;
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const cur = input.value.trim().toLowerCase();
            if (!cur) return;
            const matches = commandNames.filter((c) => c.startsWith(cur));
            if (matches.length === 1) {
                input.value = matches[0];
                echo.textContent = input.value;
            } else if (matches.length > 1) {
                print(matches.join('   '), 'muted');
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            ctx.clear();
        }
    });

    term.addEventListener('pointerdown', (e) => {
        // keep the keyboard up / caret alive unless tapping a link or chip
        if (!e.target.closest('a, button')) {
            requestAnimationFrame(() => input.focus());
        }
    });

    // quick-command chips (touch devices)
    term.querySelectorAll('[data-chip]').forEach((btn) => {
        btn.addEventListener('click', () => exec(btn.dataset.chip));
    });

    // ── global toggling ─────────────────────────────────────────

    document.querySelectorAll('[data-term-toggle]').forEach((btn) => {
        btn.addEventListener('click', () => (isOpen ? close() : open(btn)));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const inField = e.target.closest('input, textarea, [contenteditable]');
            if (inField && e.target !== input) return;
            e.preventDefault();
            isOpen ? close() : open();
        } else if (e.key === 'Escape' && isOpen) {
            if (matrixStop) {
                matrixStop();
                return;
            }
            close();
        } else if (e.key === 'Tab' && isOpen) {
            trapFocus(e);
        }
    });

    function trapFocus(e) {
        const focusables = term.querySelectorAll('a, button, input');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    // ── open / close ────────────────────────────────────────────

    function lockPage(lock) {
        document.body.classList.toggle('terminal-open', lock);
        pageChrome.forEach((el) => {
            if (!el) return;
            if ('inert' in el) el.inert = lock;
            else el.setAttribute('aria-hidden', lock ? 'true' : 'false');
        });
        if (lenis) lock ? lenis.stop() : lenis.start();
        if (particles) lock ? particles.pause() : particles.resume();
    }

    function open(trigger = null) {
        if (isOpen || animating) return;
        isOpen = true;
        lastFocused = trigger || document.activeElement;
        lockPage(true);

        const reveal = () => {
            term.hidden = false;
            input.focus({ preventScroll: true });
            if (!booted) {
                booted = true;
                banner();
            }
        };

        if (hasGsap && motionOK && glitch) {
            animating = true;
            glitchTransition(reveal, () => { animating = false; });
        } else if (hasGsap) {
            reveal();
            gsap.fromTo(term, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
        } else {
            reveal();
        }
    }

    function close() {
        if (!isOpen || animating) return;
        isOpen = false;
        if (matrixStop) matrixStop();

        const conceal = () => {
            term.hidden = true;
            lockPage(false);
            if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
        };

        if (hasGsap && motionOK && glitch) {
            animating = true;
            glitchTransition(conceal, () => { animating = false; }, true);
        } else if (hasGsap) {
            gsap.to(term, {
                autoAlpha: 1,
                duration: 0.15,
                onComplete: () => {
                    gsap.set(term, { clearProps: 'opacity,visibility' });
                    conceal();
                },
            });
        } else {
            conceal();
        }
    }

    // ── glitch transition ───────────────────────────────────────

    function randomBands() {
        const top = gsap.utils.random(0, 70);
        const bottom = gsap.utils.random(0, Math.max(0, 90 - top));
        return `inset(${top}% 0% ${bottom}% 0%)`;
    }

    function glitchTransition(midpoint, done, fast = false) {
        const slices = glitch.querySelectorAll('.glitch-slice');
        const flash = glitch.querySelector('.glitch-flash');
        const dur = fast ? 0.32 : 0.55;
        glitch.classList.add('is-active');

        const tl = gsap.timeline({
            onComplete: () => {
                glitch.classList.remove('is-active');
                gsap.set(slices, { clearProps: 'all' });
                gsap.set(flash, { opacity: 0 });
                done();
            },
        });

        slices.forEach((slice, i) => {
            gsap.set(slice, { clipPath: randomBands(), x: 0 });
            tl.to(slice, {
                clipPath: () => randomBands(),
                x: () => gsap.utils.random(-36, 36),
                duration: dur / 5,
                ease: 'steps(1)',
                repeat: 4,
                repeatRefresh: true,
            }, i * 0.02);
        });

        tl.to(flash, { opacity: 0.85, duration: 0.05, yoyo: true, repeat: 1 }, dur * 0.55)
            .add(() => {
                midpoint();
                if (screen && !term.hidden) {
                    gsap.fromTo(screen,
                        { scaleY: 0.02, transformOrigin: '50% 50%' },
                        { scaleY: 1, duration: 0.22, ease: 'power2.out', clearProps: 'transform' });
                }
            }, dur * 0.6)
            .to(slices, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.12, stagger: 0.02 }, dur * 0.8);
    }

    // ── first-open banner ───────────────────────────────────────

    function banner() {
        const text = "Welcome to chesda-sh v3.0 — type 'help' to begin.";
        const el = print('', 'banner');
        if (hasGsap && window.ScrambleTextPlugin && motionOK) {
            gsap.to(el, {
                duration: 1.1,
                scrambleText: { text, chars: '01<>/\\_—▓░', speed: 0.5 },
                onComplete: scrollToEnd,
            });
        } else {
            el.textContent = text;
        }
        print('');
    }

    // ── matrix rain easter egg ──────────────────────────────────

    function startMatrix() {
        if (matrixStop) return;
        const mCtx = matrixCanvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = term.clientWidth;
        const h = term.clientHeight;
        matrixCanvas.width = w * dpr;
        matrixCanvas.height = h * dpr;
        mCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        matrixCanvas.hidden = false;

        const glyphs = 'アイウエオカキクケコサシスセソ0123456789ABCDEF<>/\\_';
        const size = 15;
        const cols = Math.ceil(w / size);
        const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40));
        let raf = 0;

        mCtx.fillStyle = '#04040a';
        mCtx.fillRect(0, 0, w, h);

        function fall() {
            mCtx.fillStyle = 'rgba(4, 4, 10, 0.12)';
            mCtx.fillRect(0, 0, w, h);
            mCtx.font = `${size}px "JetBrains Mono", monospace`;
            for (let i = 0; i < cols; i++) {
                const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
                mCtx.fillStyle = Math.random() < 0.08 ? '#eae8e3' : '#00e5a0';
                mCtx.fillText(ch, i * size, drops[i] * size);
                if (drops[i] * size > h && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            raf = requestAnimationFrame(fall);
        }
        raf = requestAnimationFrame(fall);

        const stop = () => {
            cancelAnimationFrame(raf);
            matrixCanvas.hidden = true;
            matrixStop = null;
            window.removeEventListener('keydown', onKey, true);
            matrixCanvas.removeEventListener('pointerdown', stop);
            input.focus({ preventScroll: true });
            print('…you took the blue pill.', 'muted');
        };
        const onKey = (e) => {
            e.preventDefault();
            e.stopPropagation();
            stop();
        };
        window.addEventListener('keydown', onKey, true);
        matrixCanvas.addEventListener('pointerdown', stop);
        matrixStop = stop;
        print('entering the matrix… press any key to wake up.', 'accent');
    }

    // ── keep prompt above the mobile keyboard ───────────────────

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            if (!isOpen) return;
            term.style.height = `${window.visualViewport.height}px`;
            scrollToEnd();
        });
    }
}
