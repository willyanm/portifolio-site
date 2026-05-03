import { Renderer as OGLRenderer, Program, Mesh, Triangle, Vec2, RenderTarget, Color, Texture } from 'https://cdn.skypack.dev/ogl';
import { animate, scroll, inView } from "https://cdn.jsdelivr.net/npm/motion@12.37.0/+esm";

document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP Plugins (GSAP is loaded via CDN in HTML for simplicity)
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    initClock();
    initGsapReveals();
    initMagneticButtons();
    initBudgetSelection();
    initHeroFade();
    initAuroraBackground();
    initParticleText();
    initFluidHero();
    initMotionAnimations();
    initSectionTransitions();
    initEvilEyeFooter();
});

// --- CLOCK ---
function initClock() {
    function updateClock() {
        const clockEl = document.getElementById('current-time');
        if (!clockEl) return;
        const now = new Date();
        const time = now.toLocaleTimeString('pt-BR', { hour12: false });
        clockEl.textContent = time;
    }
    setInterval(updateClock, 1000);
    updateClock();
}

// --- GSAP REVEALS ---
function initGsapReveals() {
    const reveals = document.querySelectorAll('.gs-reveal, .kinetic-text');
    reveals.forEach((el) => {
        const isKinetic = el.classList.contains('kinetic-text');
        
        ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            once: true,
            onEnter: () => {
                if (isKinetic) {
                    el.classList.add('active');
                } else {
                    gsap.fromTo(el, 
                        { autoAlpha: 0, y: 30, filter: 'blur(10px)' },
                        { 
                            autoAlpha: 1, 
                            y: 0, 
                            filter: 'blur(0px)',
                            duration: 1, 
                            ease: "power2.out",
                            lazy: true
                        }
                    );
                }
            }
        });
    });
}

// --- MAGNETIC BUTTONS ---
function initMagneticButtons() {
    const magneticElements = document.querySelectorAll('.magnetic-wrap');
    magneticElements.forEach(wrap => {
        const trigger = wrap.querySelector('a');
        if (!trigger) return;
        
        wrap.addEventListener('mousemove', (e) => {
            const rect = wrap.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(trigger, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.6,
                ease: "power2.out",
                lazy: true
            });
        });

        wrap.addEventListener('mouseleave', () => {
            gsap.to(trigger, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)",
                lazy: true
            });
        });
    });
}

// --- BUDGET SELECTION ---
function initBudgetSelection() {
    window.selectBudget = function(el) {
        document.querySelectorAll('.budget-option').forEach(opt => opt.classList.remove('active'));
        el.classList.add('active');
    };
}

// --- HERO FADE ---
function initHeroFade() {
    const heroContent = document.querySelector("#hero .hero-content");
    if (heroContent) {
        gsap.to(heroContent, {
            opacity: 0,
            y: -100,
            filter: "blur(10px)",
            ease: "power2.inOut",
            scrollTrigger: {
                trigger: "#hero",
                start: "top top",
                end: "+=200%",
                scrub: true
            }
        });
    }
}

// --- AURORA BACKGROUND (THREE.JS) ---
function initAuroraBackground() {
    const auroraContainer = document.getElementById('aurora-container');
    if (!auroraContainer || !window.THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    auroraContainer.appendChild(renderer.domElement);
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            iTime: { value: 0 },
            iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float iTime;
            uniform vec2 iResolution;

            #define NUM_OCTAVES 2

            float rand(vec2 n) {
                return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 ip = floor(p);
                vec2 u = fract(p);
                u = u*u*(3.0-2.0*u);

                float res = mix(
                    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
                    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
                return res * res;
            }

            float fbm(vec2 x) {
                float v = 0.0;
                float a = 0.3;
                vec2 shift = vec2(100);
                mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
                for (int i = 0; i < NUM_OCTAVES; ++i) {
                    v += a * noise(x);
                    x = rot * x * 2.0 + shift;
                    a *= 0.4;
                }
                return v;
            }

            void main() {
                vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
                vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
                vec2 v;
                vec4 o = vec4(0.0);

                float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;

                for (float i = 0.0; i < 24.0; i++) {
                    v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5 + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
                    float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 24.0));
                    vec4 auroraColors = vec4(
                        0.1 + 0.3 * sin(i * 0.2 + iTime * 0.4),
                        0.3 + 0.5 * cos(i * 0.3 + iTime * 0.5),
                        0.7 + 0.3 * sin(i * 0.4 + iTime * 0.3),
                        1.0
                    );
                    vec4 currentContribution = auroraColors * exp(sin(i * i + iTime * 0.8)) / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
                    float thinnessFactor = smoothstep(0.0, 1.0, i / 24.0) * 0.6;
                    o += currentContribution * (1.0 + tailNoise * 0.8) * thinnessFactor;
                }

                o = tanh(pow(o / 100.0, vec4(1.6)));
                gl_FragColor = o * 1.5;
            }
        `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let lastTime = 0;
    let isAuroraVisible = false;

    const observer = new IntersectionObserver((entries) => {
        isAuroraVisible = entries[0].isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(auroraContainer);

    const animateAurora = (time) => {
        if (isAuroraVisible) {
            const delta = time - lastTime;
            if (delta > 16) {
                material.uniforms.iTime.value += 0.016;
                renderer.render(scene, camera);
                lastTime = time;
            }
        }
        requestAnimationFrame(animateAurora);
    };
    requestAnimationFrame(animateAurora);

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    });
}

// --- PARTICLE TEXT ---
function initParticleText() {
    const textCanvas = document.getElementById("text-particle-canvas");
    if (!textCanvas) return;
    
    const tCtx = textCanvas.getContext("2d", { willReadFrequently: true });
    textCanvas.width = 1000;
    textCanvas.height = 480;

    const particles = [];
    const mouse = { x: 0, y: 0, isPressed: false };
    const pixelSteps = 3;

    class TextParticle {
        constructor(x, y, color) {
            this.pos = { x: Math.random() * textCanvas.width, y: Math.random() * textCanvas.height };
            this.vel = { x: 0, y: 0 };
            this.acc = { x: 0, y: 0 };
            this.target = { x: x, y: y };
            this.color = color;
            this.maxSpeed = Math.random() * 5 + 3;
            this.maxForce = 0.3;
            this.friction = 0.9;
            this.size = Math.random() * 1.5 + 1.5;
        }

        update() {
            const dx = this.target.x - this.pos.x;
            const dy = this.target.y - this.pos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0.5) {
                let force = dist * 0.08;
                const mag = Math.sqrt(dx*dx + dy*dy);
                this.acc.x += (dx/mag) * Math.min(force, this.maxForce);
                this.acc.y += (dy/mag) * Math.min(force, this.maxForce);
            }

            const mdx = this.pos.x - mouse.x;
            const mdy = this.pos.y - mouse.y;
            const mdist = Math.sqrt(mdx*mdx + mdy*mdy);
            if (mdist < 80) {
                const mmag = Math.sqrt(mdx*mdx + mdy*mdy);
                this.acc.x += (mdx/mmag) * 4;
                this.acc.y += (mdy/mmag) * 4;
            }

            this.vel.x += this.acc.x;
            this.vel.y += this.acc.y;
            this.vel.x *= this.friction;
            this.vel.y *= this.friction;
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
            this.acc.x = 0;
            this.acc.y = 0;
        }

        draw() {
            tCtx.fillStyle = this.color;
            tCtx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
        }
    }

    const init = () => {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = textCanvas.width;
        offCanvas.height = textCanvas.height;
        const oCtx = offCanvas.getContext("2d");

        oCtx.fillStyle = "white";
        oCtx.font = "bold 100px 'Space Grotesk', sans-serif";
        oCtx.textAlign = "left";
        
        oCtx.fillText("CÓDIGO QUE", 20, 150);
        oCtx.fillStyle = "#00f2ff"; 
        oCtx.font = "italic bold 110px 'Space Grotesk', sans-serif";
        oCtx.fillText("RESPIRA", 20, 270);
        oCtx.fillStyle = "white";
        oCtx.font = "bold 100px 'Space Grotesk', sans-serif";
        oCtx.fillText("PERFORMANCE.", 20, 390);

        const imgData = oCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const pixels = imgData.data;

        for (let y = 0; y < offCanvas.height; y += pixelSteps) {
            for (let x = 0; x < offCanvas.width; x += pixelSteps) {
                const index = (y * offCanvas.width + x) * 4;
                if (pixels[index + 3] > 128) {
                    particles.push(new TextParticle(x, y, `rgb(${pixels[index]},${pixels[index+1]},${pixels[index+2]})`));
                }
            }
        }
    };

    let isTextVisible = false;
    const textObserver = new IntersectionObserver((entries) => {
        isTextVisible = entries[0].isIntersecting;
    }, { threshold: 0.1 });
    textObserver.observe(textCanvas);

    const animateText = () => {
        if (isTextVisible) {
            tCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
        }
        requestAnimationFrame(animateText);
    };

    textCanvas.addEventListener("mousemove", (e) => {
        const rect = textCanvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) * (textCanvas.width / rect.width);
        mouse.y = (e.clientY - rect.top) * (textCanvas.height / rect.height);
    });

    init();
    animateText();
}

// --- FLUID HERO (OGL) ---
function initFluidHero() {
    const container = document.getElementById('fluid-canvas-container');
    if (!container) return;

    const baseColor = [0.02, 0.02, 0.04];
    const glowColor = [0.0, 1.0, 1.0];
    const dissipation = 0.98;

    const renderer = new OGLRenderer({ alpha: false, dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');

    const simFragment = `
        precision highp float;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uMouseActive;
        uniform vec2 uResolution;
        uniform float uAspect;
        uniform float uDissipation;
        uniform vec3 uBaseColor;
        uniform vec3 uGlowColor;
        varying vec2 vUv;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        vec2 curl(vec2 p) {
            float eps = 0.001;
            float n1, n2, a, b;
            n1 = snoise(p + vec2(0, eps));
            n2 = snoise(p - vec2(0, eps));
            a = (n1 - n2) / (2.0 * eps);
            n1 = snoise(p + vec2(eps, 0));
            n2 = snoise(p - vec2(eps, 0));
            b = (n1 - n2) / (2.0 * eps);
            return vec2(a, -b);
        }

        void main() {
            vec2 uv = vUv;
            vec2 flow = curl(uv * 2.0 + uTime * 0.05);
            vec2 newUv = uv - flow * 0.003; 
            newUv -= 0.5;
            newUv *= 0.995; 
            newUv += 0.5;
            vec4 advected = texture2D(uTexture, newUv);
            vec2 mouse = uMouse;
            mouse.x *= uAspect;
            vec2 curUv = uv;
            curUv.x *= uAspect;
            float dist = length(curUv - mouse);
            float brush = smoothstep(0.05, 0.0, dist) * uMouseActive;
            vec3 injectColor = mix(uGlowColor, vec3(1.0), 0.5) * brush * 3.0;
            vec3 finalColor = advected.rgb + injectColor;
            finalColor *= uDissipation;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    const displayFragment = `
        precision highp float;
        uniform sampler2D uTexture;
        varying vec2 vUv;
        uniform vec3 uBaseColor;

        void main() {
            vec4 color = texture2D(uTexture, vUv);
            vec3 c = color.rgb;
            c += uBaseColor * 0.2;
            c = pow(c, vec3(1.4)); 
            float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
            c += noise * 0.02;
            gl_FragColor = vec4(c, 1.0);
        }
    `;

    const geometry = new Triangle(gl);

    const simProgram = new Program(gl, {
        vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`,
        fragment: simFragment,
        uniforms: {
            uTexture: { value: null },
            uTime: { value: 0 },
            uMouse: { value: new Vec2(0, 0) },
            uMouseActive: { value: 0 },
            uResolution: { value: new Vec2(0, 0) },
            uAspect: { value: 1 },
            uDissipation: { value: dissipation },
            uBaseColor: { value: new Color(baseColor[0], baseColor[1], baseColor[2]) },
            uGlowColor: { value: new Color(glowColor[0], glowColor[1], glowColor[2]) },
        },
    });

    const displayProgram = new Program(gl, {
        vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`,
        fragment: displayFragment,
        uniforms: {
            uTexture: { value: null },
            uBaseColor: { value: new Color(baseColor[0], baseColor[1], baseColor[2]) },
        },
    });

    const simMesh = new Mesh(gl, { geometry, program: simProgram });
    const displayMesh = new Mesh(gl, { geometry, program: displayProgram });

    const fboArgs = {
        width: window.innerWidth >> 1,
        height: window.innerHeight >> 1,
        type: gl.HALF_FLOAT || gl.FLOAT,
        internalFormat: gl.RGBA16F || gl.RGBA,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
    };
    
    let fboRead = new RenderTarget(gl, fboArgs);
    let fboWrite = new RenderTarget(gl, fboArgs);

    const mouse = new Vec2(0, 0);
    const targetMouse = new Vec2(0, 0);
    let isMoving = 0;

    const resize = () => {
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        renderer.setSize(w, h);
        const fboW = w >> 1;
        const fboH = h >> 1;
        fboRead.setSize(fboW, fboH);
        fboWrite.setSize(fboW, fboH);
        simProgram.uniforms.uResolution.value.set(w, h);
        simProgram.uniforms.uAspect.value = w / h;
    }

    window.addEventListener('resize', resize);
    resize();

    function updateMouse(x, y) {
        const rect = container.getBoundingClientRect();
        targetMouse.set((x - rect.left) / rect.width, 1.0 - (y - rect.top) / rect.height);
        isMoving = 1.0;
    }

    window.addEventListener('mousemove', e => updateMouse(e.clientX, e.clientY));

    let isHeroVisible = true;
    const heroObserver = new IntersectionObserver((entries) => {
        isHeroVisible = entries[0].isIntersecting;
    }, { threshold: 0.01 });
    heroObserver.observe(container);

    function update(t) {
        requestAnimationFrame(update);
        if (!isHeroVisible) return;
        
        const time = t * 0.001;
        mouse.lerp(targetMouse, 0.15);
        if (Math.abs(mouse.x - targetMouse.x) < 0.001) isMoving *= 0.9;
        simProgram.uniforms.uTime.value = time;
        simProgram.uniforms.uMouse.value.copy(mouse);
        simProgram.uniforms.uMouseActive.value = isMoving;
        simProgram.uniforms.uTexture.value = fboRead.texture;
        renderer.render({ scene: simMesh, target: fboWrite });
        displayProgram.uniforms.uTexture.value = fboWrite.texture;
        renderer.render({ scene: displayMesh });
        const temp = fboRead;
        fboRead = fboWrite;
        fboWrite = temp;
    }
    requestAnimationFrame(update);
    container.appendChild(gl.canvas);
}

// --- MOTION ANIMATIONS ---
function initMotionAnimations() {
    inView(".motion-animate", ({ target }) => {
        animate(target, 
            { opacity: [0, 1], transform: ["translateY(30px)", "translateY(0px)"] },
            { duration: 0.9, easing: [0.17, 0.55, 0.55, 1] }
        );
    });

    inView("#sobre", () => {
        animate(".galactic-card", 
            { opacity: [0, 1], transform: ["scale(0.9) translateY(20px)", "scale(1) translateY(0px)"] },
            { 
                delay: (i) => i * 0.15,
                duration: 0.8,
                easing: [0.17, 0.55, 0.55, 1]
            }
        );
    });

    document.querySelectorAll('.galactic-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            animate(card, { scale: 1.05, filter: "brightness(1.2)" }, { duration: 0.4 });
        });
        card.addEventListener('mouseleave', () => {
            animate(card, { scale: 1, filter: "brightness(1)" }, { duration: 0.4 });
        });
    });

    const contactForm = document.querySelector('#contact-form-3d');
    const contactWrapper = contactForm ? contactForm.parentElement : null;
    if (contactWrapper && contactForm) {
        contactWrapper.addEventListener('mousemove', (e) => {
            const rect = contactWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -15; 
            const rotateY = ((x - centerX) / centerX) * 15;
            animate(contactForm, { 
                rotateX: rotateX + "deg", 
                rotateY: rotateY + "deg",
                scale: 1.03
            }, { duration: 0.1 });
        });
        contactWrapper.addEventListener('mouseleave', () => {
            animate(contactForm, { rotateX: "0deg", rotateY: "0deg", scale: 1 }, { duration: 0.6, easing: [0.17, 0.55, 0.55, 1] });
        });
    }
}

// --- SECTION TRANSITIONS & DECODE ---
function initSectionTransitions() {
    const sections = document.querySelectorAll('section');
    const dots = document.querySelectorAll('.side-nav-dot');
    
    sections.forEach((section) => {
        if (section.id === 'hero') return;
        gsap.fromTo(section, 
            { scale: 0.95, opacity: 0, filter: 'blur(20px)' },
            {
                scale: 1, opacity: 1, filter: 'blur(0px)',
                duration: 1.5,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        ScrollTrigger.create({
            trigger: section,
            start: "top center",
            end: "bottom center",
            onToggle: self => {
                if (self.isActive) {
                    dots.forEach(dot => {
                        dot.classList.toggle('active', dot.getAttribute('data-section') === section.id);
                    });
                }
            }
        });
    });

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = dot.getAttribute('href');
            gsap.to(window, { duration: 1.2, scrollTo: targetId, ease: "power4.inOut" });
        });
    });

    const decodeElements = document.querySelectorAll('.cyber-decode');
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()_+";
    decodeElements.forEach(el => {
        const originalText = el.innerText;
        ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            onEnter: () => {
                el.classList.add('decoded');
                let iterations = 0;
                const interval = setInterval(() => {
                    el.innerText = originalText.split("")
                        .map((letter, index) => {
                            if (index < iterations) return originalText[index];
                            if (letter === " ") return " ";
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("");
                    if (iterations >= originalText.length) {
                        clearInterval(interval);
                        el.innerText = originalText;
                    }
                    iterations += originalText.length / 40;
                }, 30);
            }
        });
    });
}

// --- EVIL EYE FOOTER ---
function initEvilEyeFooter() {
    const config = {
        primaryColor: '#ff4500',
        accentColor: '#00ffff',
        intensity: 1.0,
        pupilSize: 0.45,
        irisWidth: 0.25,
        glowIntensity: 0.3,
        scale: 0.8,
        noiseScale: 1.0,
        pupilFollow: 0.6,
        flameSpeed: 0.8,
    };

    function hexToVec3(hex) {
        const h = hex.replace('#', '');
        return [
            parseInt(h.slice(0, 2), 16) / 255,
            parseInt(h.slice(2, 4), 16) / 255,
            parseInt(h.slice(4, 6), 16) / 255
        ];
    }

    function generateNoiseTexture(gl, size = 256) {
        const data = new Uint8Array(size * size * 4);
        function hash(x, y, s) {
            let n = x * 374761393 + y * 668265263 + s * 1274126177;
            n = Math.imul(n ^ (n >>> 13), 1274126177);
            return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
        }
        function noise(px, py, freq, seed) {
            const fx = (px / size) * freq;
            const fy = (py / size) * freq;
            const ix = Math.floor(fx);
            const iy = Math.floor(fy);
            const tx = fx - ix;
            const ty = fy - iy;
            const w = freq | 0;
            const v00 = hash(((ix % w) + w) % w, ((iy % w) + w) % w, seed);
            const v10 = hash((((ix + 1) % w) + w) % w, ((iy % w) + w) % w, seed);
            const v01 = hash(((ix % w) + w) % w, (((iy + 1) % w) + w) % w, seed);
            const v11 = hash((((ix + 1) % w) + w) % w, (((iy + 1) % w) + w) % w, seed);
            return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty;
        }
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let v = 0; let amp = 0.4; let totalAmp = 0;
                for (let o = 0; o < 8; o++) {
                    const f = 32 * (1 << o);
                    v += amp * noise(x, y, f, o * 31);
                    totalAmp += amp;
                    amp *= 0.65;
                }
                v /= totalAmp;
                v = (v - 0.5) * 2.2 + 0.5;
                v = Math.max(0, Math.min(1, v));
                const val = Math.round(v * 255);
                const i = (y * size + x) * 4;
                data[i] = data[i+1] = data[i+2] = val; data[i+3] = 255;
            }
        }
        const texture = new Texture(gl, { image: data, width: size, height: size, generateMipmaps: false, flipY: false });
        texture.minFilter = gl.LINEAR; texture.magFilter = gl.LINEAR;
        texture.wrapS = texture.wrapT = gl.REPEAT;
        return texture;
    }

    const fragmentShader = `
        precision highp float;
        uniform float uTime;
        uniform vec3 uResolution;
        uniform sampler2D uNoiseTexture;
        uniform float uPupilSize;
        uniform float uIrisWidth;
        uniform float uGlowIntensity;
        uniform float uIntensity;
        uniform float uScale;
        uniform float uNoiseScale;
        uniform vec2 uMouse;
        uniform float uPupilFollow;
        uniform float uFlameSpeed;
        uniform vec3 uPrimaryColor;
        uniform vec3 uAccentColor;

        void main() {
            vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
            uv /= uScale;
            float ft = uTime * uFlameSpeed;
            float polarRadius = length(uv) * 2.0;
            float polarAngle = (2.0 * atan(uv.x, uv.y)) / 6.28 * 0.3;
            vec2 polarUv = vec2(polarRadius, polarAngle);
            vec4 noiseA = texture2D(uNoiseTexture, polarUv * vec2(0.2, 7.0) * uNoiseScale + vec2(-ft * 0.1, 0.0));
            vec4 noiseB = texture2D(uNoiseTexture, polarUv * vec2(0.3, 4.0) * uNoiseScale + vec2(-ft * 0.2, 0.0));
            vec4 noiseC = texture2D(uNoiseTexture, polarUv * vec2(0.1, 5.0) * uNoiseScale + vec2(-ft * 0.1, 0.0));
            float distanceMask = 1.0 - length(uv);
            float innerRing = clamp(-1.0 * ((distanceMask - 0.7) / uIrisWidth), 0.0, 1.0);
            innerRing = (innerRing * distanceMask - 0.2) / 0.28;
            innerRing += noiseA.r - 0.5;
            innerRing *= 1.3;
            innerRing = clamp(innerRing, 0.0, 1.0);
            float outerRing = clamp(-1.0 * ((distanceMask - 0.5) / 0.2), 0.0, 1.0);
            outerRing = (outerRing * distanceMask - 0.1) / 0.38;
            outerRing += noiseC.r - 0.5;
            outerRing *= 1.3;
            outerRing = clamp(outerRing, 0.0, 1.0);
            innerRing += outerRing;
            float innerEye = distanceMask - 0.1 * 2.0;
            innerEye *= noiseB.r * 2.0;
            vec2 pupilOffset = uMouse * uPupilFollow * 0.15;
            vec2 pupilUv = uv - pupilOffset;
            float pupil = 1.0 - length(pupilUv * vec2(9.0, 2.3));
            pupil *= uPupilSize;
            pupil = clamp(pupil, 0.0, 1.0);
            pupil /= 0.35;
            float outerEyeGlow = 1.0 - length(uv * vec2(0.5, 1.5));
            outerEyeGlow = clamp(outerEyeGlow + 0.5, 0.0, 1.0);
            outerEyeGlow += noiseC.r - 0.5;
            float outerBgGlow = outerEyeGlow;
            outerEyeGlow = pow(outerEyeGlow, 2.0);
            outerEyeGlow += distanceMask;
            outerEyeGlow *= uGlowIntensity;
            outerEyeGlow = clamp(outerEyeGlow, 0.0, 1.0);
            outerEyeGlow *= pow(1.0 - distanceMask, 2.0) * 2.5;
            outerBgGlow += distanceMask;
            outerBgGlow = pow(outerBgGlow, 0.5);
            outerBgGlow *= 0.15;
            vec3 finalColor = mix(uPrimaryColor, uAccentColor, smoothstep(0.2, 0.8, length(uv)));
            vec3 color = finalColor * uIntensity * clamp(max(innerRing + innerEye, outerEyeGlow + outerBgGlow) - pupil, 0.0, 3.0);
            float alpha = clamp(length(color) * 0.8, 0.0, 1.0);
            gl_FragColor = vec4(color, alpha);
        }
    `;

    const container = document.getElementById('evil-eye-footer-container');
    const footer = document.getElementById('footer-eye-section');
    if (!container || !footer) return;

    const renderer = new OGLRenderer({ alpha: true, premultipliedAlpha: true });
    const gl = renderer.gl;
    const noiseTexture = generateNoiseTexture(gl, 256);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let isVisible = false;

    window.addEventListener('mousemove', (e) => {
        const rect = footer.getBoundingClientRect();
        mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    });

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
        vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }`,
        fragment: fragmentShader,
        transparent: true,
        uniforms: {
            uTime: { value: 0 },
            uResolution: { value: [window.innerWidth, window.innerHeight, 1] },
            uNoiseTexture: { value: noiseTexture },
            uPupilSize: { value: config.pupilSize },
            uIrisWidth: { value: config.irisWidth },
            uGlowIntensity: { value: config.glowIntensity },
            uIntensity: { value: config.intensity },
            uScale: { value: config.scale },
            uNoiseScale: { value: config.noiseScale },
            uMouse: { value: [0, 0] },
            uPupilFollow: { value: config.pupilFollow },
            uFlameSpeed: { value: config.flameSpeed },
            uPrimaryColor: { value: hexToVec3(config.primaryColor) },
            uAccentColor: { value: hexToVec3(config.accentColor) }
        }
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    const resize = () => {
        const w = container.offsetWidth || window.innerWidth;
        const h = container.offsetHeight || 600;
        renderer.setSize(w, h);
        program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height];
    }
    window.addEventListener('resize', resize);
    resize();

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    observer.observe(footer);

    function update(time) {
        requestAnimationFrame(update);
        if (!isVisible) return;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        program.uniforms.uMouse.value = [mouse.x, mouse.y];
        program.uniforms.uTime.value = time * 0.001;
        renderer.render({ scene: mesh });
    }
    requestAnimationFrame(update);
}
