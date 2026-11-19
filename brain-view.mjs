// Real-atlas 3D brain renderer for the design mockups.
// Geometry, colours and lighting follow neuroatlas (src/scene/*, src/atlas/regions.ts).
import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

const IVORY = new THREE.Color('#E9E2D3');
const TINT = '#F2B441';
const LOBES = ['frontal', 'parietal', 'temporal', 'occipital', 'insula', 'cingulate'];
const NET_HEX = ['#781286', '#4682B4', '#00760E', '#C43AFA', '#DCF8A4', '#E69422', '#CD3E4E'];
const NET_COLORS = NET_HEX.map(hex => new THREE.Color(hex));
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
  lateral: [-1, 0.1, 0.16], right: [1, 0.1, 0.16], oblique: [-0.9, 0.3, 0.32], superior: [0, -0.14, 1],
  anterior: [0, 1, 0.1], posterior: [0, -1, 0.08], deep: [-0.74, -0.3, -0.59],
};
const toWorld = p => new THREE.Vector3(p.x, p.z, -p.y);

let atlasPromise;
function loadAtlas() {
  if (!atlasPromise) {
    atlasPromise = (async () => {
      const get = async file => {
        const response = await fetch(new URL(file, import.meta.url));
        if (!response.ok) throw new Error(file + ': HTTP ' + response.status);
        return response;
      };
      const [meta, buf] = await Promise.all([
        get('./atlas.json').then(response => response.json()),
        get('./atlas.bin').then(response => response.arrayBuffer()),
      ]);
      const hemi = s => {
        const [pial, , faces, sulc, dest, yeo] = meta.hemis[s].offsets;
        return {
          pial: new Float32Array(buf, pial, meta.nVert * 3), faces: new Uint16Array(buf, faces, meta.nFace * 3),
          sulc: new Uint8Array(buf, sulc, meta.nVert), dest: new Uint8Array(buf, dest, meta.nVert), yeo: new Uint8Array(buf, yeo, meta.nVert),
        };
      };
      return { nVert: meta.nVert, destrieux: meta.destrieux, hemis: { L: hemi('L'), R: hemi('R') } };
    })().catch(error => {
      atlasPromise = undefined;
      throw error;
    });
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

export async function mountStage(host, cfg) {
  const atlas = await loadAtlas();
  const labels = [];
  host.style.position = 'relative';
  const canvas = document.createElement('canvas');
  const layer = document.createElement('div');
  layer.className = 'stage-labels';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  host.append(canvas, layer);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 3000);
  const root = new THREE.Group();
  const selectableMeshes = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  root.rotation.x = -Math.PI / 2;
  root.updateMatrixWorld(true);
  scene.add(root, camera);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x1a2233, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-0.55, 0.85, 1);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.55); fill.position.set(0.9, -0.3, 0.5);
  camera.add(key, fill);

  const styles = getComputedStyle(host);
  const regionColor = key => new THREE.Color(styles.getPropertyValue('--' + key).trim() || '#CFC7B6');
  const lobeColors = LOBES.map(regionColor);
  const white = new THREE.Color('#ffffff');
  const nextColor = new THREE.Color();
  let litRegions = new Set();
  let highlight = cfg.highlight;
  const highlightColor = new THREE.Color(cfg.highlightColor ?? TINT);
  let networkIndex = -1;

  function paintRegions() {
    for (const mesh of selectableMeshes) {
      const data = mesh.userData;
      if (data.kind === 'deep') {
        const base = data.baseColor;
        const lit = litRegions.has(data.key);
        mesh.material.color.copy(data.key === highlight ? highlightColor : base);
        if (lit) mesh.material.color.lerp(white, .3);
        mesh.material.emissive.copy(data.key === highlight ? highlightColor : base);
        mesh.material.emissiveIntensity = data.key === highlight ? .45 : lit ? .18 : 0;
        continue;
      }
      const col = mesh.geometry.attributes.color;
      for (let i = 0; i < data.mask.length; i++) {
        const lobe = data.mask[i];
        const key = LOBES[lobe];
        if (cfg.paint === 'yeo') {
          const network = data.yeo[i] - 1;
          nextColor.copy(NET_COLORS[network] ?? IVORY);
          if (networkIndex >= 0 && network !== networkIndex) nextColor.lerp(IVORY, .38).multiplyScalar(.72);
        } else {
          nextColor.copy(cfg.paint === 'plain' ? IVORY : lobeColors[lobe] ?? IVORY);
          if (key && key === highlight) nextColor.lerp(highlightColor, .5);
          if (litRegions.has(key)) nextColor.lerp(white, .28);
        }
        const shade = 1 - .44 * (data.sulc[i] / 255);
        col.setXYZ(i, nextColor.r * shade, nextColor.g * shade, nextColor.b * shade);
      }
      col.needsUpdate = true;
    }
  }

  if (cfg.selectable) {
    let press;
    let dragged = false;
    canvas.addEventListener('pointerdown', event => {
      press = [event.clientX, event.clientY];
      dragged = !event.isPrimary;
    });
    canvas.addEventListener('pointermove', event => {
      if (event.buttons && press && Math.hypot(event.clientX - press[0], event.clientY - press[1]) > 5) dragged = true;
    });
    canvas.addEventListener('click', event => {
      if (dragged) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(selectableMeshes.filter(mesh => mesh.visible), false);
      const hit = (cfg.ghost && hits.find(hit => hit.object.userData.kind === 'deep')) || hits[0];
      if (!hit) return;
      const data = hit.object.userData;
      const key = data.kind === 'deep' ? data.key : LOBES[data.mask[hit.face.a]];
      if (key) host.dispatchEvent(new CustomEvent('brain-select', { detail: { key } }));
    });
  }

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
  const setHighlight = (key, color = TINT) => {
    highlight = key;
    highlightColor.set(color);
    paintRegions();
  };
  const setNetworkHighlight = netIndex => {
    networkIndex = netIndex;
    paintRegions();
    for (const label of labels) label.el.classList.toggle('on', label.item.networkIndex === netIndex);
  };
  const setLitRegions = keys => {
    litRegions = new Set(keys);
    paintRegions();
  };
  const setGhostOpacity = value => {
    cortexMat.transparent = value < 1;
    cortexMat.opacity = value;
    cortexMat.needsUpdate = true;
  };
  const setDeepVisible = (keys, visible) => {
    const set = new Set([].concat(keys));
    for (const mesh of selectableMeshes) if (mesh.userData.kind === 'deep' && set.has(mesh.userData.key)) mesh.visible = visible;
    for (const label of labels) {
      if (typeof label.at === 'string' && label.at.startsWith('deep:') && set.has(label.at.split(':')[1])) {
        label.el.style.display = visible ? '' : 'none';
      }
    }
  };
  const setPins = pins => {
    for (let i = labels.length - 1; i >= 0; i--) {
      if (labels[i].kind !== 'pin') continue;
      labels[i].el.remove();
      anchors.delete(labels[i].at);
      labels.splice(i, 1);
    }
    for (const p of pins ?? []) addLabel(p, 'pin');
  };
  const cortexMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0 });
  if (cfg.ghost) { cortexMat.transparent = true; cortexMat.opacity = 0.15; cortexMat.depthWrite = false; }
  for (const side of ['L', 'R']) {
    const h = atlas.hemis[side];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(h.pial), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(atlas.nVert * 3), 3));
    geo.setIndex(new THREE.BufferAttribute(h.faces, 1));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, cortexMat);
    mesh.userData = { kind: 'cortex', mask: lobeMasks[side], sulc: h.sulc, yeo: h.yeo };
    selectableMeshes.push(mesh);
    if (cfg.ghost) mesh.renderOrder = 2;
    root.add(mesh);
  }

  const wantDeep = cfg.deep === 'all' || (!!cfg.highlight && !LOBES.includes(cfg.highlight));
  if (wantDeep) {
    for (const d of DEFS) {
      for (const s of d.mid ? [1] : [-1, 1]) {
        for (const g of [].concat(d.make(s))) {
          const baseColor = cfg.deepColors?.[d.key] ? new THREE.Color(cfg.deepColors[d.key]) : regionColor(d.key);
          const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 }));
          mesh.userData = { kind: 'deep', key: d.key, baseColor };
          selectableMeshes.push(mesh);
          root.add(mesh);
        }
      }
    }
  }

  paintRegions();

  const renderStageLabel = (el, l, cls) => {
    if (cls === 'pin') {
      el.innerHTML = '<b>' + l.k + '</b><span>' + languageCopy(l.t, l.te ?? PIN_EN[l.t] ?? l.t) + (l.ok ? ' ✓' : '') + '</span>';
    } else {
      el.innerHTML = (l.b ? '<b>' + languageCopy(l.b, l.be ?? l.b) + '</b>' : '') + (l.s ? '<span>' + languageCopy(l.s, l.se ?? l.s) + '</span>' : '');
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
  for (const l of cfg.labels ?? []) addLabel(l, 'lblchip');
  for (const p of cfg.pins ?? []) addLabel(p, 'pin');
  window.addEventListener('neuro-language', () => labels.forEach(item => renderStageLabel(item.el, item.item, item.kind)));
  function anchorWorld(at, side) {
    if (Array.isArray(at)) return toWorld(new THREE.Vector3(...at));
    if (at.startsWith('lobe:')) {
      const lobe = LOBES.indexOf(at.slice(5));
      const h = atlas.hemis[side];
      const centroid = new THREE.Vector3();
      let count = 0;
      for (let i = 0; i < atlas.nVert; i++) {
        if (lobeMasks[side][i] !== lobe) continue;
        centroid.x += h.pial[i * 3];
        centroid.y += h.pial[i * 3 + 1];
        centroid.z += h.pial[i * 3 + 2];
        count++;
      }
      return count ? toWorld(centroid.divideScalar(count)) : worldCenter;
    }
    if (at.startsWith('deep:')) {
      const [, k, hemisphere] = at.split(':');
      const s = hemisphere === 'L' ? -1 : 1;
      const c = DEEP_CENTER[k];
      return toWorld(new THREE.Vector3(c[0] * s, c[1], c[2]));
    }
    return worldCenter;
  }
  const anchors = new Map();
  let anchorSide;
  function place() {
    const rect = host.getBoundingClientRect();
    const side = camera.position.x > worldCenter.x ? 'R' : 'L';
    if (side !== anchorSide) {
      anchors.clear();
      anchorSide = side;
    }
    for (const l of labels) {
      if (!anchors.has(l.at)) anchors.set(l.at, anchorWorld(l.at, anchorSide));
      const w = anchors.get(l.at).clone().project(camera);
      l.el.style.left = ((w.x + 1) / 2 * rect.width) + 'px';
      l.el.style.top = ((1 - w.y) / 2 * rect.height) + 'px';
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
  const route = host.closest('[data-route-panel]');
  renderer.setAnimationLoop(() => {
    if (route && !route.classList.contains('active')) return;
    controls.update();
    renderer.render(scene, camera);
    place();
  });
  host.__stage = { setView, reset, setHighlight, setNetworkHighlight, setLitRegions, setGhostOpacity, setDeepVisible, setPins };
  host.dispatchEvent(new CustomEvent('stage-ready', { detail: host.__stage }));
}

// The archived single-view pages load this module directly.
if (!document.querySelector('[data-route-panel]')) {
  for (const host of document.querySelectorAll('[data-stage]')) {
    mountStage(host, JSON.parse(host.dataset.stage)).catch(error => {
      console.error('NeuroAtlas:', error);
      const notice = document.createElement('p');
      notice.className = 'stage-status';
      notice.textContent = '3D 模型暂时无法加载。';
      host.append(notice);
    });
  }
}

