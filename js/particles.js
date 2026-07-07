// SIGNAL — hero particle flow-field. Canvas 2D, zero dependencies.
// A layered-sine vector field drives a few thousand dots; the cursor
// repels them and Lenis scroll velocity streaks them vertically.

export function initParticles() {
    const canvas = document.querySelector('.hero-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    const small = window.matchMedia('(max-width: 767px)').matches;
    const COUNT = small ? 900 : 3200;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let particles = [];
    let running = false;
    let rafId = 0;
    let t = 0;
    let scrollVel = 0;

    const mouse = { x: -9999, y: -9999, radius: small ? 90 : 150 };

    function resize() {
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * DPR);
        canvas.height = Math.round(h * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = '#060609';
        ctx.fillRect(0, 0, w, h);
    }

    function spawn() {
        particles = [];
        for (let i = 0; i < COUNT; i++) {
            const band = i % 3; // 3 depth bands: slower/smaller … faster/bigger
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: 0,
                vy: 0,
                band,
                size: 0.6 + band * 0.45,
                accent: Math.random() < 0.07,
                alpha: 0.25 + band * 0.2 + Math.random() * 0.15,
            });
        }
    }

    // Cheap smooth vector field: two layered sine octaves per axis.
    function fieldAngle(x, y) {
        return (
            Math.sin(x * 0.0016 + t * 0.00045) * 1.6 +
            Math.cos(y * 0.0013 - t * 0.00032) * 1.6 +
            Math.sin((x + y) * 0.0007 + t * 0.0002) * 1.2
        );
    }

    function step() {
        // Translucent background fill = motion trails.
        ctx.fillStyle = 'rgba(6, 6, 9, 0.26)';
        ctx.fillRect(0, 0, w, h);

        const streak = Math.max(-6, Math.min(6, scrollVel * 0.25));
        scrollVel *= 0.92;

        for (const p of particles) {
            const a = fieldAngle(p.x, p.y);
            const speed = 0.05 + p.band * 0.04;
            p.vx += Math.cos(a) * speed;
            p.vy += Math.sin(a) * speed + streak * (0.3 + p.band * 0.35) * 0.1;

            // cursor repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const d2 = dx * dx + dy * dy;
            const r = mouse.radius;
            if (d2 < r * r && d2 > 0.01) {
                const d = Math.sqrt(d2);
                const f = ((r - d) / r) * 1.1;
                p.vx += (dx / d) * f;
                p.vy += (dy / d) * f;
            }

            p.vx *= 0.93;
            p.vy *= 0.93;
            p.x += p.vx;
            p.y += p.vy;

            // wrap edges
            if (p.x < -4) p.x = w + 4;
            else if (p.x > w + 4) p.x = -4;
            if (p.y < -4) p.y = h + 4;
            else if (p.y > h + 4) p.y = -4;

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.accent ? '#00e5a0' : '#eae8e3';
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        t += 16.7;
        rafId = requestAnimationFrame(step);
    }

    function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(step);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(rafId);
    }

    resize();
    spawn();
    start();

    window.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resize();
            spawn();
        }, 200);
    });

    // Only burn frames while the hero is actually visible.
    const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
    });
    io.observe(canvas);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (canvas.getBoundingClientRect().bottom > 0) start();
    });

    return {
        setVelocity(v) { scrollVel = v; },
        pause: stop,
        resume: start,
    };
}
