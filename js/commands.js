// SIGNAL — chesda-sh command registry.
// Pure data + logic; terminal.js owns the DOM. `run(args, ctx)` may return
// a string, an array of strings, an HTMLElement, or nothing (side effects).
// ctx = { print, printEl, clear, close, startMatrix }

const DATA = {
    name: 'Sann Chesda',
    title: 'A Curious Software Developer',
    email: 'sannchesda8981@gmail.com',
    location: 'Phnom Penh, Cambodia',
    linkedin: 'https://www.linkedin.com/in/chesda-sann-105992181/',
    telegram: 'https://t.me/sannchesda',
    cv: './assets/Sann Chesda CV.pdf',
    bio: 'Software developer with curiosity to learn and build real-world applications. ' +
        'Government & telecom sectors — payment gateways, SIM management, eLearning. ' +
        'Flutter for mobile, Laravel for backend; APIs, payment integrations, CI/CD.',
    experience: [
        {
            role: 'Backend Developer',
            org: 'Ministry of Posts & Telecommunications (MPTC)',
            when: 'JAN 2026 — CURRENT',
            note: 'Returned to MPTC in a new capacity — backend development and broader platform work.',
            tech: 'backend · platform · government',
        },
        {
            role: 'Junior Application Developer — Backend',
            org: 'Smart Axiata',
            when: 'DEC 2023 — MAY 2025',
            note: 'SIM Ordering System and ePayment Service.',
            tech: 'Laravel · Vue.js · MySQL · SQL Server · Docker · Kubernetes · Redis · SOAP',
        },
        {
            role: 'Mobile Developer',
            org: 'Pointer Property Co., Ltd.',
            when: 'FEB 2023 — JUL 2023',
            note: 'Built and maintained multiple mobile apps with a UI/UX designer.',
            tech: 'Flutter · Firebase · ABA Payway · Mixpanel · Sentry',
        },
        {
            role: 'Mobile Developer',
            org: 'Ministry of Posts & Telecommunications (MPTC)',
            when: 'JUL 2021 — FEB 2023',
            note: 'Developed 3 mobile apps; contributed to nationwide eLearning platforms.',
            tech: 'Flutter · REST APIs · WordPress · Moodle',
        },
    ],
    projects: [
        {
            name: 'Property Management Mobile App',
            note: 'Flutter & GetX · Firebase · ABA Payway · Mixpanel · Sentry',
            links: [
                ['App Store', 'https://apps.apple.com/app/id1464117948'],
                ['Google Play', 'https://play.google.com/store/apps/details?id=com.pointerestate.app'],
            ],
        },
        {
            name: 'HRMIS Mobile App',
            note: 'HR services for government officials — attendance, digital ID card.',
            links: [
                ['App Store', 'https://apps.apple.com/app/id1633193841'],
                ['Google Play', 'https://play.google.com/store/apps/details?id=gov.kh.mptc.hrmis'],
            ],
        },
        {
            name: 'Nationwide eLearning Platform',
            note: 'Free nationwide platform — CMS + LMS connected by SSO.',
            links: [
                ['CMS', 'https://ebc.edu.kh'],
                ['LMS', 'https://elearning.ebc.edu.kh'],
            ],
        },
        {
            name: 'Meeting Doc Mobile App',
            note: 'Secure access to meeting documents for officials.',
            links: [
                ['App Store', 'https://apps.apple.com/app/id1660198245'],
                ['Google Play', 'https://play.google.com/store/apps/details?id=gov.kh.mptc.emeeting.e_meeting'],
            ],
        },
    ],
    skills: 'Flutter & Dart · Firebase · Laravel · Bootstrap · WordPress · WHMCS · Moodle · Mixpanel · Linux · Docker',
    skillsAlso: 'Vue.js · MySQL · SQL Server · Redis · Kubernetes · SOAP · ABA Payway · Sentry · CI/CD',
    education: [
        {
            name: 'Limkokwing University of Phnom Penh',
            when: '2017 — 2021',
            note: 'B.Sc. Software Engineering with Multimedia. Final project: e-commerce app (iOS + Android, Firebase).',
        },
        {
            name: 'Arrow Dot — Hardware Programming (short course)',
            when: 'JUL — OCT 2019',
            note: 'Arduino + Processing IDE. Traffic-light system, LCD display, app-controlled robot.',
        },
    ],
};

// Build a DOM line that contains clickable links, never via innerHTML.
function linkLine(prefix, links) {
    const el = document.createElement('div');
    el.className = 'term-line';
    el.append(document.createTextNode(prefix));
    links.forEach(([label, href], i) => {
        if (i > 0) el.append(document.createTextNode('  ·  '));
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = label;
        el.append(a);
    });
    return el;
}

export const registry = {
    help: {
        desc: 'list available commands',
        run(args) {
            const all = args.includes('-a');
            const lines = ['available commands:', ''];
            for (const [name, cmd] of Object.entries(registry)) {
                if (cmd.hidden && !all) continue;
                lines.push(`  ${name.padEnd(12)} ${cmd.desc || ''}`);
            }
            lines.push('');
            lines.push(all ? 'you found the hidden ones. nice.' : "psst — try 'help -a'.");
            return lines;
        },
    },

    whoami: {
        desc: 'about Sann Chesda',
        run() {
            return [
                `${DATA.name} — ${DATA.title}`,
                `${DATA.location}`,
                '',
                DATA.bio,
            ];
        },
    },

    experience: {
        desc: 'work history',
        run() {
            const lines = [];
            DATA.experience.forEach((e, i) => {
                lines.push(`▸ 0${i + 1}  ${e.role.toUpperCase()}`);
                lines.push(`      ${e.org}   [${e.when}]`);
                lines.push(`      ${e.note}`);
                lines.push(`      ${e.tech}`);
                lines.push('');
            });
            return lines;
        },
    },

    projects: {
        desc: 'selected work (with store links)',
        run(args, ctx) {
            DATA.projects.forEach((p, i) => {
                ctx.print(`▸ 0${i + 1}  ${p.name.toUpperCase()}`);
                ctx.print(`      ${p.note}`, 'muted');
                ctx.printEl(linkLine('      ', p.links));
                ctx.print('');
            });
        },
    },

    skills: {
        desc: 'tech stack',
        run() {
            return [
                `core:  ${DATA.skills}`,
                `also:  ${DATA.skillsAlso}`,
            ];
        },
    },

    education: {
        desc: 'where I studied',
        run() {
            const lines = [];
            DATA.education.forEach((e) => {
                lines.push(`▸ ${e.name}   [${e.when}]`);
                lines.push(`      ${e.note}`);
                lines.push('');
            });
            return lines;
        },
    },

    contact: {
        desc: 'how to reach me',
        run(args, ctx) {
            ctx.printEl(linkLine('email:     ', [[DATA.email, `mailto:${DATA.email}`]]));
            ctx.printEl(linkLine('linkedin:  ', [['chesda-sann', DATA.linkedin]]));
            ctx.printEl(linkLine('telegram:  ', [['@sannchesda', DATA.telegram]]));
        },
    },

    cv: {
        desc: 'open my resume (PDF)',
        run() {
            window.open(DATA.cv, '_blank', 'noopener');
            return 'opening CV…';
        },
    },

    clear: {
        desc: 'clear the screen',
        run(args, ctx) {
            ctx.clear();
        },
    },

    exit: {
        desc: 'return to the rendered layer',
        run(args, ctx) {
            ctx.close();
        },
    },

    // ── hidden ──────────────────────────────────────────────────

    sudo: {
        hidden: true,
        desc: 'absolutely not',
        run() {
            return 'sann is not in the sudoers file. This incident will be reported.';
        },
    },

    matrix: {
        hidden: true,
        desc: 'follow the white rabbit',
        run(args, ctx) {
            ctx.startMatrix();
        },
    },

    neofetch: {
        hidden: true,
        desc: 'system info',
        run(args, ctx) {
            const years = new Date().getFullYear() - 2021;
            const art = [
                '███████╗ ██████╗',
                '██╔════╝██╔════╝',
                '███████╗██║     ',
                '╚════██║██║     ',
                '███████║╚██████╗',
                '╚══════╝ ╚═════╝',
            ];
            const info = [
                `${'chesda'}@${'portfolio'}`,
                '─────────────────',
                'OS:      Portfolio v3.0 "Signal"',
                'Host:    Phnom Penh, Cambodia',
                'Shell:   chesda-sh',
                `Uptime:  ${years} years in production`,
                'Mobile:  Flutter & Dart',
                'Backend: Laravel',
                'Deploy:  git push',
            ];
            const wrap = document.createElement('div');
            wrap.className = 'term-cols';
            const pre = document.createElement('pre');
            pre.textContent = art.join('\n');
            const right = document.createElement('pre');
            right.textContent = info.join('\n');
            right.style.color = '#cfe9dd';
            wrap.append(pre, right);
            ctx.printEl(wrap);
        },
    },
};

export const commandNames = Object.keys(registry);
