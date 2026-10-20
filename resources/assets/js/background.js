/**
 * three.js 背景动效 —— 星空 Starfield
 * 星点从深处缓缓向镜头飘近（越近越大越亮、掠过后回到深处循环），
 * 带透视纵深与鼠标视差，安静耐看；配色以近白为主、点缀靛蓝/粉。
 * 具备：明暗主题联动（MutationObserver）、prefers-reduced-motion 静态降级、
 * WebGL 不可用时静默移除容器并回退为 CSS 静态渐变。
 */
import * as THREE from 'three';

const container = document.getElementById('bg');
if (container) {
    try {
        const w = () => window.innerWidth || 1;
        const h = () => window.innerHeight || 1;
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w(), h());
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, w() / h(), 0.1, 2200);
        camera.position.z = 0;

        const COUNT = w() < 600 ? 650 : 1400;
        const SPREAD = 1000, RANGE = 1300;
        const positions = new Float32Array(COUNT * 3);
        const scales = new Float32Array(COUNT);
        const speeds = new Float32Array(COUNT);
        const phases = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * SPREAD * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 2;
            positions[i * 3 + 2] = Math.random() * RANGE;   // 初始深度（着色器内映射到 [-RANGE,0)）
            scales[i] = Math.random() * 1.2 + 1.1;
            speeds[i] = Math.random() * 22 + 8;            // 前进速度（单位/秒，大幅放慢）
            phases[i] = Math.random();
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

        const uniforms = {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
            uRange: { value: RANGE },
            uColorA: { value: new THREE.Color(0xc7d2fe) },
            uColorB: { value: new THREE.Color(0xfbcfe8) },
            uOpacity: { value: 1.0 }
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: [
                'uniform float uTime;',
                'uniform float uPixelRatio;',
                'uniform float uRange;',
                'attribute float aScale;',
                'attribute float aSpeed;',
                'attribute float aPhase;',
                'varying float vT;',
                'varying float vA;',
                'void main() {',
                '  vec3 p = position;',
                // 向镜头飘近并循环
                '  p.z = -uRange + mod(position.z + uTime * aSpeed, uRange);',
                '  vT = aPhase;',
                // 越近（深度越小）越亮
                '  vA = smoothstep(uRange, 0.0, -p.z);',
                '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
                '  gl_PointSize = clamp(aScale * uPixelRatio * (520.0 / -mv.z), 3.0, 52.0);',
                '  gl_Position = projectionMatrix * mv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform vec3 uColorA;',
                'uniform vec3 uColorB;',
                'uniform float uOpacity;',
                'varying float vT;',
                'varying float vA;',
                'void main() {',
                '  float d = length(gl_PointCoord - 0.5);',
                '  float a = smoothstep(0.5, 0.05, d);',
                '  vec3 c = mix(uColorA, uColorB, vT);',
                '  gl_FragColor = vec4(c, a * (0.45 + 0.55 * vA) * uOpacity);',
                '}'
            ].join('\n')
        });

        const points = new THREE.Points(geo, material);
        scene.add(points);

        // 主题联动：深色用发光近白星，浅色用较实的靛蓝/粉点（保证在淡底上可见）
        function applyTheme(theme) {
            if (theme === 'dark') {
                uniforms.uColorA.value.set(0xc7d2fe);
                uniforms.uColorB.value.set(0xfbcfe8);
                uniforms.uOpacity.value = 1.0;
                material.blending = THREE.AdditiveBlending;
            } else {
                uniforms.uColorA.value.set(0x4f46e5);
                uniforms.uColorB.value.set(0xdb2777);
                uniforms.uOpacity.value = 0.85;
                material.blending = THREE.NormalBlending;
            }
            material.needsUpdate = true;
        }

        const root = document.documentElement;
        applyTheme(root.getAttribute('data-theme') || 'light');
        const mo = new MutationObserver(function () {
            applyTheme(root.getAttribute('data-theme') || 'light');
        });
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

        // 鼠标视差（轻微旋转星群）
        const pointer = { x: 0, y: 0 };
        window.addEventListener('pointermove', function (e) {
            pointer.x = (e.clientX / w()) - 0.5;
            pointer.y = (e.clientY / h()) - 0.5;
        }, { passive: true });

        const clock = new THREE.Clock();
        function renderFrame(delta) {
            uniforms.uTime.value += delta;
            points.rotation.x += ((-pointer.y * 0.25) - points.rotation.x) * 0.03;
            points.rotation.y += ((-pointer.x * 0.25) - points.rotation.y) * 0.03;
            renderer.render(scene, camera);
        }

        window.addEventListener('resize', function () {
            renderer.setSize(w(), h());
            camera.aspect = w() / h();
            camera.updateProjectionMatrix();
            uniforms.uPixelRatio.value = renderer.getPixelRatio();
        });

        if (reduceMotion) {
            renderFrame(0);
        } else {
            (function tick() {
                requestAnimationFrame(tick);
                renderFrame(Math.min(clock.getDelta(), 0.05));
            })();
        }
    } catch (err) {
        console.warn('three.js background unavailable:', err);
        container.remove();
    }
}
