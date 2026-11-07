import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  FogExp2,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  WebGLRenderer,
} from 'three';
import { getPointer, subscribeRaf } from '../lib/raf';

const INK = 0x06060c;
const CYAN = 0x5ef2ff;
const VIOLET = 0xa98cf0;
const MAGENTA = 0xff2e88;

/** بافتِ نرمِ دایره‌ای برای ذرات و هاله؛ یک‌بار ساخته و همه‌جا بازاستفاده می‌شود */
function makeGlowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

function ringPoints(count: number, radius: number, spread: number): BufferGeometry {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius + (Math.random() - 0.5) * spread;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = Math.sin(angle) * r;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geo;
}

function fieldPoints(count: number, radius: number): BufferGeometry {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // توزیعِ حجمی حولِ مبدأ با تهی‌شدنِ مرکز تا هسته خلوت بماند
    const u = Math.random();
    const r = radius * (0.35 + 0.65 * Math.cbrt(u));
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.6 - 2;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geo;
}

/**
 * صحنه‌ی غوطه‌ورِ هیرو: هسته‌ی چندوجهیِ ضربان‌دار («نبض») با دو حلقه‌ی ذراتِ
 * کج و میدانِ ذراتِ شناور در مه. نورِ cyan کلید، magenta لبه و violet پرکننده
 * است. رندر روی همان حلقه‌ی rAF مشترکِ صفحه (raf.ts) سوار می‌شود تا کلِ صفحه
 * یک حلقه داشته باشد؛ خارج از دید pause می‌شود و روی «کاهش حرکت» یک فریمِ
 * ایستا می‌زند. اگر WebGL نباشد، به هسته‌ی CSS برمی‌گردد.
 */
export function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFailed(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(INK, 1);

    const scene = new Scene();
    scene.fog = new FogExp2(INK, 0.055);

    const camera = new PerspectiveCamera(45, 1, 0.1, 60);
    camera.position.set(0, 0, 9);

    const world = new Group();
    // هسته در بالای کادر می‌نشیند تا lockupِ تیتر زیرش نفس بکشد
    world.position.y = 1.3;
    scene.add(world);

    const glowTex = makeGlowTexture();

    // --- هسته‌ی چندوجهیِ نفس‌کش ---
    const coreGeo = new IcosahedronGeometry(1.55, 0);
    const coreMat = new MeshStandardMaterial({
      color: 0x0e1420,
      metalness: 0.86,
      roughness: 0.28,
      emissive: new Color(CYAN),
      emissiveIntensity: 0.22,
      flatShading: true,
    });
    const core = new Mesh(coreGeo, coreMat);
    world.add(core);

    const wireMat = new MeshBasicMaterial({
      color: CYAN,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wire = new Mesh(coreGeo, wireMat);
    wire.scale.setScalar(1.012);
    core.add(wire);

    // مغزِ نورانیِ داخلی
    const innerMat = new MeshBasicMaterial({
      color: VIOLET,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const inner = new Mesh(new IcosahedronGeometry(0.62, 1), innerMat);
    core.add(inner);

    // هاله‌ی bloom-مانند پشت هسته (ارزان‌تر از postprocessing)
    const haloMat = new SpriteMaterial({
      map: glowTex,
      color: CYAN,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const halo = new Sprite(haloMat);
    halo.scale.setScalar(7.5);
    halo.position.z = -1.2;
    world.add(halo);

    const halo2Mat = new SpriteMaterial({
      map: glowTex,
      color: MAGENTA,
      transparent: true,
      opacity: 0.26,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const halo2 = new Sprite(halo2Mat);
    halo2.scale.setScalar(11);
    halo2.position.set(2.4, -1.6, -3);
    world.add(halo2);

    // --- دو حلقه‌ی ذراتِ کج ---
    const ring1Mat = new PointsMaterial({
      size: 0.07,
      map: glowTex,
      color: CYAN,
      transparent: true,
      opacity: 0.95,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const ring1 = new Points(ringPoints(240, 2.9, 0.22), ring1Mat);
    const ring1Group = new Group();
    ring1Group.rotation.set(Math.PI / 2.35, 0.3, 0);
    ring1Group.add(ring1);
    world.add(ring1Group);

    const ring2Mat = new PointsMaterial({
      size: 0.06,
      map: glowTex,
      color: MAGENTA,
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const ring2 = new Points(ringPoints(200, 3.5, 0.26), ring2Mat);
    const ring2Group = new Group();
    ring2Group.rotation.set(Math.PI / 1.8, -0.5, 0.4);
    ring2Group.add(ring2);
    world.add(ring2Group);

    // --- میدانِ ذراتِ محیطی (ریز + بوکه) ---
    const dustMat = new PointsMaterial({
      size: 0.05,
      map: glowTex,
      color: VIOLET,
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const dust = new Points(fieldPoints(320, 13), dustMat);
    scene.add(dust);

    const bokehMat = new PointsMaterial({
      size: 0.2,
      map: glowTex,
      color: CYAN,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const bokeh = new Points(fieldPoints(70, 11), bokehMat);
    scene.add(bokeh);

    // --- نورپردازیِ دراماتیک (بدون shadow-mapِ هر-فریم) ---
    scene.add(new AmbientLight(0x1a1a2e, 0.7));
    const key = new DirectionalLight(0x9fe8ff, 2.2);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    const rim = new DirectionalLight(MAGENTA, 2.6);
    rim.position.set(-3, 1.2, -4);
    scene.add(rim);
    const fill = new PointLight(VIOLET, 1.4, 30);
    fill.position.set(-3.5, -2, 2.5);
    scene.add(fill);

    // --- اندازه‌گیری ---
    const size = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      world.scale.setScalar(MathUtils.clamp(w / 1100, 0.62, 1));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);

    // --- وضعیتِ اشاره‌گر با همگراییِ زمان‌مبنا ---
    let px = 0;
    let py = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(wrap);

    const renderFrame = (t: number, delta: number) => {
      const dt = Number.isFinite(delta) && delta > 0 ? Math.min(delta, 100) : 16;
      const breath = (Math.sin(t * 0.0011) + 1) / 2;

      core.scale.setScalar(1 + breath * 0.06);
      core.rotation.y += dt * 0.00012;
      core.rotation.x = Math.sin(t * 0.0004) * 0.12;
      coreMat.emissiveIntensity = 0.18 + breath * 0.5;
      innerMat.opacity = 0.55 + breath * 0.45;
      inner.rotation.y -= dt * 0.0004;
      haloMat.opacity = 0.36 + breath * 0.3;
      halo.scale.setScalar(7 + breath * 1.2);
      wireMat.opacity = 0.2 + breath * 0.18;

      ring1.rotation.z += dt * 0.00022;
      ring2.rotation.z -= dt * 0.00017;
      dust.rotation.y += dt * 0.00002;
      bokeh.rotation.y -= dt * 0.000015;

      const p = getPointer();
      const k = 1 - Math.exp(-dt / 220);
      const targetX = p.active ? p.nx * 0.28 : 0;
      const targetY = p.active ? -p.ny * 0.2 : 0;
      px += (targetX - px) * k;
      py += (targetY - py) * k;
      world.rotation.y = px + Math.sin(t * 0.00008) * 0.12;
      world.rotation.x = py + Math.cos(t * 0.00006) * 0.06;

      camera.position.x = Math.sin(t * 0.00007) * 0.35;
      camera.position.y = Math.cos(t * 0.00005) * 0.22;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    let unsubRaf: () => void;
    if (reduced) {
      renderFrame(1200, 16);
      unsubRaf = () => {};
    } else {
      unsubRaf = subscribeRaf((t, delta) => {
        if (!visible) return;
        renderFrame(t, delta);
      });
    }

    return () => {
      unsubRaf();
      ro.disconnect();
      io.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof Mesh || obj instanceof Points) {
          obj.geometry.dispose();
        }
      });
      [coreMat, wireMat, innerMat, haloMat, halo2Mat, ring1Mat, ring2Mat, dustMat, bokehMat].forEach((m) => m.dispose());
      glowTex.dispose();
      renderer.dispose();
    };
  }, [reduced]);

  if (failed) {
    return (
      <div className="v2-stage v2-stage--flat" aria-hidden="true">
        <div className="v2-core-fallback" />
      </div>
    );
  }

  return (
    <div className="v2-stage" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="v2-stage__canvas" />
      <div className="v2-stage__glow" />
      <div className="v2-stage__fade" />
    </div>
  );
}