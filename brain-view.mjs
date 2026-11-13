// Real-atlas 3D brain renderer for the design mockups.
// Geometry, colours and lighting follow neuroatlas (src/scene/*, src/atlas/regions.ts).
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

const IVORY = new THREE.Color('#E9E2D3');
const TINT = '#F2B441';
const LOBES = ['frontal', 'parietal', 'temporal', 'occipital', 'insula', 'cingulate'];
const LOBES_EN = ['Frontal lobe', 'Parietal lobe', 'Temporal lobe', 'Occipital lobe', 'Insula', 'Cingulate cortex'];
const LOBE_COLORS = { frontal: '#E98A7C', parietal: '#E0BA68', temporal: '#66B5A5', occipital: '#889DDC', insula: '#C88BB6', cingulate: '#A9A2C9' };
const NET_HEX = ['#781286', '#4682B4', '#00760E', '#C43AFA', '#DCF8A4', '#E69422', '#CD3E4E'];
const LOBE_LABELS = {
  frontal: ['G_and_S_frontomargin', 'G_and_S_transv_frontopol', 'G_front_inf-Opercular', 'G_front_inf-Orbital', 'G_front_inf-Triangul', 'G_front_middle', 'G_front_sup', 'G_orbital', 'G_precentral', 'G_rectus', 'Lat_Fis-ant-Horizont', 'Lat_Fis-ant-Vertical', 'S_front_inf', 'S_front_middle', 'S_front_sup', 'S_orbital_lateral', 'S_orbital_med-olfact', 'S_orbital-H_Shaped', 'S_precentral-inf-part', 'S_precentral-sup-part', 'S_suborbital'],
  parietal: ['G_pariet_inf-Angular', 'G_pariet_inf-Supramar', 'G_parietal_sup', 'G_postcentral', 'G_precuneus', 'S_interm_prim-Jensen', 'S_intrapariet_and_P_trans', 'S_postcentral', 'S_subparietal', 'S_cingul-Marginalis', 'S_parieto_occipital'],
  temporal: ['G_oc-temp_lat-fusifor', 'G_oc-temp_med-Parahip', 'G_temp_sup-G_T_transv', 'G_temp_sup-Lateral', 'G_temp_sup-Plan_polar', 'G_temp_sup-Plan_tempo', 'G_temporal_inf', 'G_temporal_middle', 'Pole_temporal', 'S_collat_transv_ant', 'S_oc-temp_lat', 'S_oc-temp_med_and_Lingual', 'S_temporal_inf', 'S_temporal_sup', 'S_temporal_transverse'],
  occipital: ['G_and_S_occipital_inf', 'G_cuneus', 'G_occipital_middle', 'G_occipital_sup', 'G_oc-temp_med-Lingual', 'Pole_occipital', 'S_calcarine', 'S_collat_transv_post', 'S_oc_middle_and_Lunatus', 'S_oc_sup_and_transversal', 'S_occipital_ant'],
  insula: ['G_Ins_lg_and_S_cent_ins', 'G_insular_short', 'S_circular_insula_ant', 'S_circular_insula_inf', 'S_circular_insula_sup'],
  cingulate: ['G_and_S_cingul-Ant', 'G_and_S_cingul-Mid-Ant', 'G_and_S_cingul-Mid-Post', 'G_cingul-Post-dorsal', 'G_cingul-Post-ventral', 'S_pericallosal', 'G_subcallosal'],
};
const PIN_EN = { 额叶: 'Frontal lobe', 杏仁核: 'Amygdala', 海马体: 'Hippocampus', 小脑: 'Cerebellum' };
const CENTER = new THREE.Vector3(0, -18, 12); // FreeSurfer RAS
const VIEWS = {
  lateral: [-1, 0.1, 0.16], oblique: [-0.9, 0.3, 0.32], superior: [0, -0.14, 1],
  anterior: [0, 1, 0.1], posterior: [0, -1, 0.08], deep: [-0.74, -0.3, -0.59],
};
const toWorld = p => new THREE.Vector3(p.x, p.z, -p.y);

let atlasPromise;
function loadAtlas() {
  if (!atlasPromise) {
    atlasPromise = (async () => {
      const meta = await (await fetch('./atlas.json')).json();
      const buf = await (await fetch('./atlas.bin')).arrayBuffer();
      const hemi = s => {
        const [pial, , faces, sulc, dest, yeo] = meta.hemis[s].offsets;
        return {
          pial: new Float32Array(buf, pial, meta.nVert * 3), faces: new Uint16Array(buf, faces, meta.nFace * 3),
          sulc: new Uint8Array(buf, sulc, meta.nVert), dest: new Uint8Array(buf, dest, meta.nVert), yeo: new Uint8Array(buf, yeo, meta.nVert),
        };
      };
      return { nVert: meta.nVert, destrieux: meta.destrieux, hemis: { L: hemi('L'), R: hemi('R') } };
    })();
  }
  return atlasPromise;
}

function csY(h, names) {
  const cs = names.indexOf('S_central');
  let top = 0, nTop = 0, bot = 0, nBot = 0;
  for (let i = 0; i < h.dest.length; i++) {
    if (h.dest[i] !== cs) continue;
    const y = h.pial[i * 3 + 1], z = h.pial[i * 3 + 2];
    if (z > 55) { top += y; nTop++; } else if (z < 30) { bot += y; nBot++; }
  }
  return { top: top / nTop, bot: bot / nBot };
}

function buildLobeMasks(atlas) {
  const names = atlas.destrieux, out = {};
  const sets = Object.fromEntries(Object.entries(LOBE_LABELS).map(([k, v]) => [k, new Set(v)]));
  for (const side of ['L', 'R']) {
    const h = atlas.hemis[side], m = new Uint8Array(atlas.nVert).fill(255), cs = csY(h, names);
    for (let i = 0; i < m.length; i++) {
      const lab = h.dest[i] === 255 ? '' : names[h.dest[i]], y = h.pial[i * 3 + 1];
      const fh = (lab === 'G_and_S_paracentral' && y > cs.top) || (lab === 'G_and_S_subcentral' && y > cs.bot);
      const bh = (lab === 'G_and_S_paracentral' && y <= cs.top) || (lab === 'G_and_S_subcentral' && y <= cs.bot);
      if (sets.frontal.has(lab) || fh) m[i] = 0;
      else if (sets.parietal.has(lab) || bh) m[i] = 1;
      else if (sets.temporal.has(lab)) m[i] = 2;
      else if (sets.occipital.has(lab)) m[i] = 3;
      else if (sets.insula.has(lab)) m[i] = 4;
      else if (sets.cingulate.has(lab)) m[i] = 5;
    }
    out[side] = m;
  }
  return out;
}

// Schematic deep structures (positions follow neuroatlas src/scene/deep.ts).
const ell = (c, r) => new THREE.SphereGeometry(1, 28, 20).scale(r[0], r[1], r[2]).translate(c[0], c[1], c[2]);
const tube = (pts, radius) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 48, radius, 14);
function cerebellumGeo() {
  const g = new THREE.SphereGeometry(1, 48, 56), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 1 + 0.022 * Math.sin(p.getZ(i) * 46);
    p.setXYZ(i, p.getX(i) * 49 * k, p.getY(i) * 30 * k, p.getZ(i) * 23);
  }
  g.computeVertexNormals();
  return g.translate(0, -58, -37);
}
const DEEP_CENTER = { thalamus: [11, -18, 7], hypothalamus: [4.5, -3, -11], amygdala: [23, -5, -19], hippocampus: [25, -28, -9], cerebellum: [0, -58, -37], brainstem: [0, -32, -40], spinalCord: [0, -58, -84], callosum: [0, 0, 10] };
const DEFS = [
  { key: 'thalamus', mid: false, make: s => ell([11 * s, -18, 7], [9, 14, 9]) },
  { key: 'hypothalamus', mid: false, make: s => ell([4.5 * s, -3, -11], [4, 6, 5]) },
  { key: 'amygdala', mid: false, make: s => ell([23 * s, -5, -19], [8, 8, 8]) },
  { key: 'hippocampus', mid: false, make: s => tube([[25 * s, -12, -20], [29 * s, -24, -13], [27 * s, -34, -5], [20 * s, -40, 2]], 5.5) },
  { key: 'cerebellum', mid: true, make: () => cerebellumGeo() },
  { key: 'brainstem', mid: true, make: () => [tube([[0, -22, -6], [0, -27, -24], [0, -33, -42], [0, -40, -64]], 10), ell([0, -20, -30], [14, 10, 11])] },
  { key: 'spinalCord', mid: true, make: () => tube([[0, -37, -48], [0, -47, -66], [0, -59, -86], [0, -72, -106]], 4.8) },
  { key: 'callosum', mid: true, make: () => tube([[0, 22, -2], [0, 30, 8], [0, 22, 20], [0, 2, 26], [0, -22, 24], [0, -40, 15], [0, -42, 6]], 4).scale(3.5, 1, 1) },
];

function languageCopy(zh, en) {
  const lang = document.documentElement.dataset.lang ?? 'zh';
  return lang === 'en' ? en : lang === 'bi' ? zh + ' / ' + en : zh;
}

export function mountStage(host, cfg) {
  const labels = [];
  host.style.position = 'relative';
  const canvas = document.createElement('canvas');
  const layer = document.createElement('div');
  layer.className = 'stage-labels';
  host.append(canvas, layer);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 3000);
  const root = new THREE.Group();
  const selectableMeshes = [];
  let selectedLobe = -1;
  let selectedPoint = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  root.rotation.x = -Math.PI / 2;
  root.updateMatrixWorld(true);
  scene.add(root, camera);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x1a2233, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-0.55, 0.85, 1);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.55); fill.position.set(0.9, -0.3, 0.5);
  camera.add(key, fill);

  const marker = new THREE.Group();
  const markerCore = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 16), new THREE.MeshStandardMaterial({ color: TINT, emissive: TINT, emissiveIntensity: 1.7, roughness: .28 }));
  const markerHalo = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: TINT, transparent: true, opacity: .25, depthWrite: false, blending: THREE.AdditiveBlending }));
  const markerRing = new THREE.Mesh(new THREE.TorusGeometry(10, 1.25, 10, 36), new THREE.MeshBasicMaterial({ color: '#FFE29A', transparent: true, opacity: .95, depthWrite: false }));
  const markerLight = new THREE.PointLight(TINT, 5, 110, 2);
  marker.add(markerCore, markerHalo, markerRing, markerLight);
  marker.visible = false;
  scene.add(marker);
  const callout = document.createElement('div');
  callout.className = 'selection-callout';
  callout.hidden = true;
  host.appendChild(callout);

  function recolorCortex(nextLobe) {
    selectedLobe = nextLobe;
    for (const mesh of selectableMeshes) {
      if (mesh.userData.kind !== 'cortex') continue;
      const col = mesh.geometry.attributes.color;
      const base = mesh.userData.baseColors ?? new Float32Array(col.array);
      mesh.userData.baseColors = base;
      for (let i = 0; i < mesh.userData.mask.length; i++) {
        const lobe = mesh.userData.mask[i];
        let r = base[i * 3], g = base[i * 3 + 1], b = base[i * 3 + 2];
        if (nextLobe >= 0) {
          if (lobe === nextLobe) {
            r = Math.min(1, (r * .42 + 1 * .58) * 1.22);
            g = Math.min(1, (g * .42 + .816 * .58) * 1.22);
            b = Math.min(1, (b * .42 + .35 * .58) * 1.22);
          } else {
            r = (r * .42 + IVORY.r * .58) * .72;
            g = (g * .42 + IVORY.g * .58) * .72;
            b = (b * .42 + IVORY.b * .58) * .72;
          }
        }
        const shade = 1 - 0.44 * (mesh.userData.sulc[i] / 255);
        col.setXYZ(i, Math.min(1, r * shade), Math.min(1, g * shade), Math.min(1, b * shade));
      }
      col.needsUpdate = true;
    }
  }

  function showSelection(title, subtitle, point, normal) {
    selectedPoint = point.clone();
    marker.position.copy(point);
    markerRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal ?? new THREE.Vector3(0, 1, 0));
    marker.visible = true;
    callout.innerHTML = `<b>${title}</b><span>${subtitle}</span>`;
    callout.hidden = false;
    host.dispatchEvent(new CustomEvent('brain-select', { detail: { title, subtitle, lobe: selectedLobe } }));
  }

  canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(selectableMeshes, false)[0];
    if (!hit) return;
    const normal = hit.face?.normal?.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();
    if (hit.object.userData.kind === 'cortex') {
      const vertex = hit.object.userData.faces[hit.faceIndex * 3];
      const lobe = hit.object.userData.mask[vertex];
      if (lobe === 255) return;
      recolorCortex(lobe);
      const region = hit.object.userData.names[hit.object.userData.dest[vertex]] ?? '皮层表面';
      showSelection(`${LOBES[lobe]} · 已点亮`, `${region} · 点击位置`, hit.point, normal);
    } else {
      recolorCortex(-1);
      const labels = { hippocampus: '海马体', amygdala: '杏仁核', thalamus: '丘脑', cerebellum: '小脑', brainstem: '脑干', spinalCord: '脊髓', callosum: '胼胝体', hypothalamus: '下丘脑' };
      showSelection(`${labels[hit.object.userData.key] ?? hit.object.userData.key} · 已选中`, '深部结构 · 点击位置', hit.point, normal);
    }
  });

  loadAtlas().then(atlas => {
    const lobeMasks = buildLobeMasks(atlas);
    const worldCenter = toWorld(CENTER);
    const dirOf = v => toWorld(new THREE.Vector3(...(Array.isArray(v) ? v : VIEWS[v ?? 'oblique']))).normalize();
    camera.position.copy(worldCenter).addScaledVector(dirOf(cfg.view), cfg.distance ?? 405);
    camera.lookAt(worldCenter);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.12;
    controls.minDistance = 200; controls.maxDistance = 800;
    controls.target.copy(worldCenter);

    const setView = name => {
      const distance = camera.position.distanceTo(controls.target);
      camera.position.copy(worldCenter).addScaledVector(dirOf(name), distance);
      camera.lookAt(worldCenter);
      controls.target.copy(worldCenter);
      controls.update();
    };
    const reset = () => setView(cfg.view ?? 'oblique');
    host.__stage = { setView, reset, controls, camera };
    host.dispatchEvent(new CustomEvent('stage-ready', { detail: host.__stage }));

    const hlLobe = cfg.highlight && LOBES.includes(cfg.highlight) ? LOBES.indexOf(cfg.highlight) : -1;
    const cortexMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0 });
    if (cfg.ghost) { cortexMat.transparent = true; cortexMat.opacity = 0.15; cortexMat.depthWrite = false; }
    for (const side of ['L', 'R']) {
      const h = atlas.hemis[side];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(h.pial), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(atlas.nVert * 3), 3));
      geo.setIndex(new THREE.BufferAttribute(h.faces, 1));
      geo.computeVertexNormals();
      const col = geo.attributes.color;
      for (let i = 0; i < atlas.nVert; i++) {
        const lobe = lobeMasks[side][i];
        let base = cfg.paint === 'yeo' ? new THREE.Color(NET_HEX[h.yeo[i] - 1] ?? '#E9E2D3')
          : cfg.paint === 'plain' ? IVORY
          : lobe === 255 ? IVORY : new THREE.Color(LOBE_COLORS[LOBES[lobe]]);
        if (hlLobe >= 0) base = lobe === hlLobe ? base.clone().lerp(new THREE.Color(cfg.highlightColor ?? TINT), 0.5) : base.clone().lerp(IVORY, cfg.fade ?? 0.38);
        const shade = 1 - 0.44 * (h.sulc[i] / 255);
        col.setXYZ(i, base.r * shade, base.g * shade, base.b * shade);
      }
      const mesh = new THREE.Mesh(geo, cortexMat);
      mesh.userData = { kind: 'cortex', side, faces: h.faces, mask: lobeMasks[side], sulc: h.sulc, dest: h.dest, names: atlas.destrieux };
      selectableMeshes.push(mesh);
      if (cfg.ghost) mesh.renderOrder = 2;
      root.add(mesh);
    }

    const wantDeep = cfg.deep === 'all' || (!!cfg.highlight && !LOBES.includes(cfg.highlight));
    if (wantDeep) {
      for (const d of DEFS) {
        for (const s of d.mid ? [1] : [-1, 1]) {
          for (const g of [].concat(d.make(s))) {
            const isHl = cfg.highlight === d.key;
            const color = isHl ? (cfg.highlightColor ?? TINT) : (cfg.deepColors?.[d.key] ?? '#CFC7B6');
            const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 }));
            mesh.userData = { kind: 'deep', key: d.key };
            selectableMeshes.push(mesh);
            root.add(mesh);
          }
        }
      }
    }

    // The initial appearance is already painted above; click interactions recolor it on demand.

    for (const l of cfg.labels ?? []) addLabel(l, 'lblchip');
    for (const p of cfg.pins ?? []) addLabel(p, 'pin');
    const renderStageLabel = (el, l, cls) => {
      if (cls === 'pin') {
        el.innerHTML = '<b>' + l.k + '</b><span>' + languageCopy(l.t, l.te ?? PIN_EN[l.t] ?? l.t) + (l.ok ? ' ✓' : '') + '</span>';
      } else {
        el.innerHTML = (l.b ? '<b>' + languageCopy(l.b, l.be ?? l.b) + '</b>' : '') + (l.s ? '<span>' + l.s + '</span>' : '');
      }
    };
    function addLabel(l, cls) {
      const el = document.createElement('div');
      el.className = cls + (l.on ? ' on' : '') + (l.ok ? ' ok' : '');
      renderStageLabel(el, l, cls);
      layer.append(el);
      if (cls === 'pin') {
        el.dataset.answer = l.k;
        el.addEventListener('click', () => host.dispatchEvent(new CustomEvent('brain-pin', { detail: l })));
      }
      labels.push({ el, at: l.at, item: l, kind: cls });
    }
    window.addEventListener('neuro-language', () => labels.forEach(item => renderStageLabel(item.el, item.item, item.kind)));
    function anchorWorld(at) {
      if (Array.isArray(at)) return toWorld(new THREE.Vector3(...at));
      if (at.startsWith('lobe:')) {
        const lobe = LOBES.indexOf(at.slice(5));
        const camDir = camera.position.clone().sub(worldCenter).normalize();
        let best = null, bestDot = -Infinity;
        for (const side of ['L', 'R']) {
          const h = atlas.hemis[side];
          for (let i = 0; i < atlas.nVert; i++) {
            if (lobeMasks[side][i] !== lobe) continue;
            const w = toWorld(new THREE.Vector3(h.pial[i * 3], h.pial[i * 3 + 1], h.pial[i * 3 + 2]));
            const dot = w.clone().sub(worldCenter).normalize().dot(camDir);
            if (dot > bestDot) { bestDot = dot; best = w; }
          }
        }
        return best ?? worldCenter;
      }
      if (at.startsWith('deep:')) {
        const [, k, side] = at.split(':');
        const s = side === 'L' ? -1 : 1;
        const c = DEEP_CENTER[k];
        return toWorld(new THREE.Vector3(c[0] * s, c[1], c[2]));
      }
      return worldCenter;
    }
    const anchors = new Map();
    function place() {
      const rect = host.getBoundingClientRect();
      for (const l of labels) {
        if (!anchors.has(l.at)) anchors.set(l.at, anchorWorld(l.at));
        const w = anchors.get(l.at).clone().project(camera);
        l.el.style.left = ((w.x + 1) / 2 * rect.width) + 'px';
        l.el.style.top = ((1 - w.y) / 2 * rect.height) + 'px';
      }
      if (selectedPoint && marker.visible) {
        const w = selectedPoint.clone().project(camera);
        callout.style.left = `${((w.x + 1) / 2 * rect.width)}px`;
        callout.style.top = `${((1 - w.y) / 2 * rect.height)}px`;
      }
    }
    function resize() {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(host);
    resize();
    renderer.setAnimationLoop(() => {
      controls.update();
      if (marker.visible) {
        const pulse = 1 + Math.sin(performance.now() * .006) * .12;
        markerHalo.scale.setScalar(pulse);
        markerRing.rotation.z += .014;
      }
      renderer.render(scene, camera);
      place();
    });
  });
}

const mountedStages = new WeakSet();
function mountVisibleRoute(routeRoot) {
  for (const el of routeRoot?.querySelectorAll('[data-stage]') ?? []) {
    if (mountedStages.has(el)) continue;
    mountedStages.add(el);
    mountStage(el, JSON.parse(el.dataset.stage));
  }
}
const initialRoute = location.hash.slice(1);
mountVisibleRoute(document.querySelector(`[data-route-panel="${initialRoute}"]`) ?? document.querySelector('[data-route-panel].active') ?? document);
window.addEventListener('neuro-route', event => {
  const routeRoot = document.querySelector(`[data-route-panel="${event.detail}"]`);
  mountVisibleRoute(routeRoot);
});

