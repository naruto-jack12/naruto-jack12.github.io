// ==================== three.js WebGL 星空背景 ====================
// 参考 three.js 经典 Starfield：数千颗星星分布在透视空间中，缓慢向
// 镜头飘近并回绕，顶点着色器按相位做闪烁；鼠标移动带动镜头视差。
// 画布透明，叠加 CSS 星云径向渐变（见 style #bg），星座 SVG 直接浮于其上。
// 遵循项目动效规范：主题联动 / 鼠标视差 / prefers-reduced-motion 静态降级 /
// WebGL 不可用时静默回退为纯 CSS 背景。
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
    renderer.setClearColor(0x000000, 0); // 透明画布，露出 CSS 星云渐变
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w() / h(), 0.1, 1000);
    camera.position.z = 600;

    // ---------- 星场点云 ----------
    const COUNT = w() < 600 ? 1100 : 2400;
    const SPREAD = 1300;   // X/Y 分布范围
    const DEPTH = 1200;    // Z 深度范围

    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD;        // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;    // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * DEPTH;     // z
      scales[i] = Math.random() * 1.6 + 0.4;
      phases[i] = Math.random();
      speeds[i] = Math.random() * 0.5 + 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uColorA: { value: new THREE.Color(0xd8f1ff) }, // 主体星光：冷白偏蓝
      uColorB: { value: new THREE.Color(0xa5b4fc) }, // 远景星光：淡紫
      uOpacity: { value: 1 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float aScale;
        attribute float aPhase;
        varying float vAlpha;
        varying float vPhase;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // 闪烁：按相位错开的正弦调制亮度
          vAlpha = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 1.6) + aPhase * 6.2831);
          vPhase = aPhase;
          gl_PointSize = clamp(aScale * uPixelRatio * (1700.0 / -mv.z), 1.0, 26.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uOpacity;
        varying float vAlpha;
        varying float vPhase;
        void main() {
          // 柔和圆形光点
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.08, d);
          vec3 col = mix(uColorA, uColorB, vPhase);
          gl_FragColor = vec4(col, a * vAlpha * uOpacity);
        }
      `,
    });

    const starGroup = new THREE.Group();
    starGroup.add(new THREE.Points(geometry, material));
    scene.add(starGroup);

    // ---------- 主题配色联动 ----------
    function applyTheme(theme) {
      if (theme === 'light') {
        uniforms.uColorA.value.set(0x0ea5e9);
        uniforms.uColorB.value.set(0x7c3aed);
        uniforms.uOpacity.value = 0.4;
        material.blending = THREE.NormalBlending;
      } else {
        uniforms.uColorA.value.set(0xd8f1ff);
        uniforms.uColorB.value.set(0xa5b4fc);
        uniforms.uOpacity.value = 1;
        material.blending = THREE.AdditiveBlending;
      }
      material.needsUpdate = true;
    }
    applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    const observer = new MutationObserver(function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ---------- 鼠标视差（镜头位移） ----------
    const pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX / w() - 0.5;
      pointer.y = e.clientY / h() - 0.5;
    });

    // ---------- 自适应尺寸 ----------
    window.addEventListener('resize', function () {
      renderer.setSize(w(), h());
      camera.aspect = w() / h();
      camera.updateProjectionMatrix();
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
    });

    // ---------- 渲染循环 ----------
    const posAttr = geometry.getAttribute('position');
    const clock = new THREE.Clock();

    function renderFrame(delta) {
      uniforms.uTime.value += delta;
      if (!reduceMotion) {
        // 星星向镜头飘近，越过近端后回绕到远处，形成缓慢穿越感
        const arr = posAttr.array;
        for (let i = 0; i < COUNT; i++) {
          arr[i * 3 + 2] += speeds[i] * delta * 60;
          if (arr[i * 3 + 2] > 600) arr[i * 3 + 2] -= DEPTH;
        }
        posAttr.needsUpdate = true;
      }
      // 视差：镜头跟随鼠标轻微平移，注视原点
      camera.position.x += (pointer.x * -80 - camera.position.x) * 0.04;
      camera.position.y += (pointer.y * -50 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      renderFrame(0); // 单帧静态星空
    } else {
      (function tick() {
        requestAnimationFrame(tick);
        renderFrame(Math.min(clock.getDelta(), 0.05));
      })();
    }
  } catch (err) {
    // WebGL 不可用时静默降级为 CSS 星云渐变
    console.warn('WebGL background unavailable:', err);
    container.remove();
  }
}
