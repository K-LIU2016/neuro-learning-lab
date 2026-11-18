 import './brain-view.mjs';
 import { localize, localized } from './i18n.mjs';

 const $ = (s, root = document) => root.querySelector(s);
 const $$ = (s, root = document) => [...root.querySelectorAll(s)];

 const OK_GREEN = '#2FA06A';
 const LETTERS = ['A', 'B', 'C', 'D'];
 const LOBE_KEYS = ['frontal', 'parietal', 'temporal', 'occipital'];
 const DEEP_KEYS = ['hippocampus', 'amygdala', 'thalamus'];
 const NET_ORDER = ['visual', 'somato', 'dorsal', 'ventral', 'limbic', 'fronto', 'default'];
 const LOBE_BY_NAME = { '额叶': 'frontal', '顶叶': 'parietal', '颞叶': 'temporal', '枕叶': 'occipital' };
 const DEEP_BY_NAME = { '海马体': 0, '杏仁核': 1, '丘脑': 2 };
 const PIN_AT = { frontal: [-45, 38, 40], hippocampus: 'deep:hippocampus:L', amygdala: 'deep:amygdala:L', cerebellum: 'deep:cerebellum', thalamus: 'deep:thalamus:L' };
 const STORAGE_KEY = 'neuroatlas.progress.v1';

 const toast = $('#toast');
 let toastTimer;
 function notify(message) {
   toast.textContent = message;
   toast.classList.add('show');
   clearTimeout(toastTimer);
   toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
 }

 function withStage(selector, fn) {
   const host = $(selector);
   if (!host) return;
   if (host.__stage) { fn(host.__stage); return; }
   host.addEventListener('stage-ready', event => fn(event.detail), { once: true });
 }

 const pair = item => localized(item[0], item[1]);
 const nameHtml = item => item[0] + ' <span class="en">' + item[1] + '</span>';
 const nameLine = (el, item) => localize(el, nameHtml(item), item[1], item[0] + ' ' + item[1]);

 /* ---------- persisted learning progress ---------- */

 function sanitizeState(raw) {
   const clean = { route: 'learn', lobe: 2, deep: 0, network: 6, lobesVisited: [], deepVisited: [], networksVisited: [], quizBest: null };
   if (!raw || typeof raw !== 'object') return clean;
   if (['learn', 'explore', 'deep', 'quiz', 'pro'].includes(raw.route)) clean.route = raw.route;
   if (Number.isInteger(raw.lobe) && raw.lobe >= 0 && raw.lobe < LOBE_KEYS.length) clean.lobe = raw.lobe;
   if (Number.isInteger(raw.deep) && raw.deep >= 0 && raw.deep < DEEP_KEYS.length) clean.deep = raw.deep;
   if (Number.isInteger(raw.network) && raw.network >= 0 && raw.network < NET_ORDER.length) clean.network = raw.network;
   const keepList = (value, valid) => (Array.isArray(value) ? [...new Set(value.filter(key => valid.includes(key)))] : []);
   clean.lobesVisited = keepList(raw.lobesVisited, LOBE_KEYS);
   clean.deepVisited = keepList(raw.deepVisited, DEEP_KEYS);
   clean.networksVisited = keepList(raw.networksVisited, NET_ORDER);
   if (raw.quizBest === null || (Number.isInteger(raw.quizBest) && raw.quizBest >= 0 && raw.quizBest <= 3)) clean.quizBest = raw.quizBest;
   return clean;
 }

 function loadState() {
   try {
     return sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
   } catch {
     return sanitizeState(null);
   }
 }

 const state = loadState();

 function saveState() {
   try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify({
       route: state.route,
       lobe: state.lobe,
       deep: state.deep,
       network: state.network,
       lobesVisited: [...state.lobesVisited],
       deepVisited: [...state.deepVisited],
       networksVisited: [...state.networksVisited],
       quizBest: state.quizBest,
     }));
   } catch { /* private mode */ }
 }

 function markVisit(route) {
   const map = {
     learn: [state.lobesVisited, LOBE_KEYS[state.lobe]],
     deep: [state.deepVisited, DEEP_KEYS[state.deep]],
     pro: [state.networksVisited, NET_ORDER[state.network]],
   };
   const entry = map[route];
   if (!entry || entry[1] == null || entry[0].includes(entry[1])) return;
   entry[0].push(entry[1]);
   saveState();
 }

 function currentRoute() {
   return location.hash.slice(1) || state.route || 'learn';
 }

 /* ---------- route switching with real progress counting ---------- */

 let quizIndex = 0;
 let quizPicked = [null, null, null];
 let quizLog = [null, null, null];
 let quizFinished = false;
 let quizFinalScore = 0;

 function updateChapterLines() {
   const done = state.lobesVisited.length;
   const zh = done + ' / 4 · ' + (done === 4 ? '已完成' : '进行中');
   const en = done + ' / 4 · ' + (done === 4 ? 'Complete' : 'in progress');
   localize($('#deepChapterProgress'), zh, en);
   localize($('#quizChapterProgress'), zh, en);
 }

 function updateProgress(route) {
   const concepts = state.lobesVisited.length + state.deepVisited.length;
   const quizScore = quizLog.filter(entry => entry === true).length;
   let text;
   if (route === 'pro') {
     text = localized('Yeo-7 网络 ' + state.networksVisited.length + ' / 7', 'Yeo-7 networks ' + state.networksVisited.length + ' / 7');
   } else if (route === 'quiz') {
     text = quizFinished
       ? localized('小测完成 · ' + quizFinalScore + ' / 3', 'Quiz complete · ' + quizFinalScore + ' / 3')
       : localized('章节小测 · 第 ' + (quizIndex + 1) + ' / 3 题 · 已答对 ' + quizScore, 'Chapter quiz · question ' + (quizIndex + 1) + ' of 3 · ' + quizScore + ' correct');
   } else {
     const best = state.quizBest == null ? '' : localized(' · 小测最佳 ' + state.quizBest + ' / 3', ' · quiz best ' + state.quizBest + ' / 3');
     text = localized('学习进度 ' + concepts + ' / 7 个核心概念', 'Learning progress ' + concepts + ' / 7 core concepts') + best;
   }
   $('#progressText').textContent = text;
   updateChapterLines();
 }

 function showRoute(route) {
   const panel = $('[data-route-panel="' + route + '"]');
   if (!panel) return;
   if (location.hash !== '#' + route) history.replaceState(null, '', '#' + route);
   $$('[data-route-panel]').forEach(el => el.classList.toggle('active', el === panel));
   $$('[data-route-link]').forEach(el => el.classList.toggle('on', el.dataset.routeLink === route));
   state.route = route;
   saveState();
   markVisit(route);
   updateProgress(route);
   window.dispatchEvent(new CustomEvent('neuro-route', { detail: route }));
   requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
 }

 document.addEventListener('click', event => {
   const routeLink = event.target.closest('[data-route-link]');
   if (routeLink) {
     event.preventDefault();
     showRoute(routeLink.dataset.routeLink);
   }
 });
 window.addEventListener('hashchange', () => showRoute(location.hash.slice(1) || state.route || 'learn'));

 /* ---------- chapter 1 · four lobes ---------- */

 const lobeData = [
   {
     key: 'frontal',
     name: ['额叶', 'Frontal Lobe'],
     one: ['大脑最前方的<b>计划与行动</b>中枢。', 'The <b>planning and action</b> centre at the front of the brain.'],
     where: ['额头后方，大脑前部的位置，左右各一个。', 'Behind the forehead, at the front of the brain, one on each side.'],
     does: ['帮助你计划、做决定、控制冲动，也参与主动运动。', 'Helps you plan, make decisions, control impulses and initiate movement.'],
     example: ['写作业时安排先后顺序、忍住先玩手机的冲动。', 'Planning the order of your homework and resisting the urge to check your phone first.'],
     cortex: ['运动前区 · 前额叶皮层', 'Premotor cortex · prefrontal cortex'],
     net: ['额顶 · 背侧注意（跨网络）', 'Frontoparietal · dorsal attention (across networks)'],
     near: ['胼胝体 · 基底核（示意）', 'Corpus callosum · basal ganglia (schematic)'],
     hud: ['额叶 · 左右各一个', 'Frontal lobe · one on each side'],
   },
   {
     key: 'parietal',
     name: ['顶叶', 'Parietal Lobe'],
     one: ['把身体感觉和空间位置拼成一张<b>地图</b>。', 'Builds a <b>map</b> from body sensations and spatial position.'],
     where: ['位于额叶后方、枕叶前方，靠近头顶。', 'Behind the frontal lobe and in front of the occipital lobe, near the top of the head.'],
     does: ['处理触觉、身体位置和空间关系，让你知道“我在哪里”。', 'Processes touch, body position and spatial relations so you know where you are.'],
     example: ['闭着眼也能摸到口袋里的钥匙，靠的是顶叶的空间地图。', 'Finding the keys in your pocket with your eyes closed uses the parietal spatial map.'],
     cortex: ['躯体感觉皮层 · 顶下小叶', 'Somatosensory cortex · inferior parietal lobule'],
     net: ['背侧注意 · 额顶', 'Dorsal attention · frontoparietal'],
     near: ['丘脑（第 4 章详讲）', 'Thalamus (covered in chapter 4)'],
     hud: ['顶叶 · 左右各一个', 'Parietal lobe · one on each side'],
   },
   {
     key: 'temporal',
     name: ['颞叶', 'Temporal Lobe'],
     one: ['耳朵上方的大脑「侧面」，主要负责<b>听懂世界</b>。', 'The side of the brain above the ears, central to <b>understanding the world through sound</b>.'],
     where: ['耳朵的正上方和前方，大脑两侧靠下的位置，左右各一个。', 'Above and slightly in front of the ears, low on both sides of the brain.'],
     does: ['处理声音和语言，帮你听懂别人说什么、认出熟悉的旋律；内侧深处还藏着与记忆有关的结构。', 'Processes sound and language, helping you understand speech and recognise familiar melodies; memory structures lie deeper on its inner surface.'],
     example: ['朋友在人群里喊你的名字，你立刻回头，这一瞬间就是颞叶在工作。', 'When a friend calls your name in a crowd and you turn around, your temporal lobe is at work.'],
     cortex: ['听觉联合皮层 · 颞下视觉区', 'Auditory association cortex · ventral visual areas'],
     net: ['视觉 · 腹侧注意 · 边缘（跨网络）', 'Visual · ventral attention · limbic (across networks)'],
     near: ['海马体 · 杏仁核（第 4 章详讲）', 'Hippocampus · amygdala (covered in chapter 4)'],
     hud: ['颞叶 · 左右各一个', 'Temporal lobe · one on each side'],
   },
   {
     key: 'occipital',
     name: ['枕叶', 'Occipital Lobe'],
     one: ['把眼睛收到的光线变成<b>你看见的世界</b>。', 'Turns the light received by your eyes into <b>the world you see</b>.'],
     where: ['大脑最后方，靠近后脑勺的位置。', 'At the back of the brain, near the back of the head.'],
     does: ['处理颜色、边缘、形状和运动等视觉信息。', 'Processes visual information such as colour, edges, shape and motion.'],
     example: ['看见红绿灯变绿并认出它是“可以通行”的信号。', 'Seeing a traffic light turn green and recognising that it means you may go.'],
     cortex: ['初级视皮层 · 纹状皮层', 'Primary visual cortex · striate cortex'],
     net: ['视觉网络', 'Visual network'],
     near: ['小脑（后方相邻）', 'Cerebellum (posterior neighbour)'],
     hud: ['枕叶 · 左右各一个', 'Occipital lobe · one on each side'],
   },
 ];

 function renderLobe(index, silent) {
   state.lobe = index;
   const d = lobeData[index];
   nameLine($('#learnName'), d.name);
   localize($('#learnOne'), d.one[0], d.one[1]);
   localize($('#learnWhere'), d.where[0], d.where[1]);
   localize($('#learnDoes'), d.does[0], d.does[1]);
   localize($('#learnExample'), d.example[0], d.example[1]);
   localize($('#learnCortexLine'), d.cortex[0], d.cortex[1]);
   localize($('#learnNetLine'), d.net[0], d.net[1]);
   localize($('#learnNeighborLine'), d.near[0], d.near[1]);
   localize($('#learnStageTitle'), d.name[0] + '在哪里？', 'Where is the ' + d.name[1].toLowerCase() + '?');
   localize($('#learnTag'), '脑叶 · 本章第 ' + (index + 1) + ' / 4 个', 'Lobe · ' + (index + 1) + ' / 4 in this chapter');
   localize($('#learnHudCurrent'), d.hud[0], d.hud[1]);
   $('#lobeCount').textContent = (index + 1) + ' / 4';
   const status = index === 3
     ? pair(['四个脑叶都认完了，可以进入章节小测。', 'All four lobes are familiar now. You can start the chapter quiz.'])
     : localized('已定位到' + d.name[0] + '，下一步把“在哪里”与“做什么”连起来。', 'Located ' + d.name[1] + '. Next, connect where it is with what it does.');
   localize($('#learnStatus'), status, status);
   const next = lobeData[Math.min(index + 1, 3)];
   localize($('#learnNextBtn'),
     index === 3 ? '我学会了 · 开始章节小测' : '我学会了 · 下一个：' + next.name[0],
     index === 3 ? 'I understand it · Start the chapter quiz' : 'I understand it · Next: ' + next.name[1]);
   $$('#learnRoute [data-learn-step]').forEach((el, i) => {
     el.classList.toggle('done', state.lobesVisited.includes(LOBE_KEYS[i]));
     el.classList.toggle('now', i === index);
   });
   withStage('#learn-stage', s => s.setHighlight(d.key));
   saveState();
   updateProgress(currentRoute());
   if (!silent) notify(localized('现在学习：' + d.name[0], 'Now studying: ' + d.name[1]));
 }

 /* ---------- chapter 4 · deep structures ---------- */

 const deepData = [
   {
     key: 'hippocampus',
     name: ['海马体', 'Hippocampus'],
     one: ['把新经历写进长期记忆的<b>「保存键」</b>。', 'The <b>“save button”</b> that writes new experiences into long-term memory.'],
     where: ['颞叶内侧深处，因为形状像海马而得名，左右各一个。', 'Deep inside the temporal lobe, named for its seahorse shape, one on each side.'],
     does: ['把白天的经历在睡眠中巩固成长期记忆，还负责空间导航，伦敦出租车司机的海马体就格外发达。', 'Consolidates daytime experiences into long-term memories during sleep and supports spatial navigation; London taxi drivers have especially developed hippocampi.'],
     example: ['记住今天新同学的姓名、回忆昨晚晚饭吃了什么、在熟悉的城市里找到回家的路。', 'Remembering a new classmate’s name, recalling last night’s dinner and finding your way home in a familiar city.'],
     pro: [
       [['所属网络', 'Network'], ['边缘网络 Limbic', 'Limbic network']],
       [['邻近结构', 'Nearby structures'], ['内嗅皮层 · 杏仁核 · 丘脑', 'Entorhinal cortex · amygdala · thalamus']],
       [['经典案例', 'Classic case'], ['病人 H.M. 切除后无法形成新记忆', 'Patient H.M. could not form new memories after resection']],
     ],
     source: ['Scoville & Milner 1957 · 深部结构为教学示意', 'Scoville & Milner 1957 · deep structures are schematic'],
     stageTitle: ['把皮层调成半透明，看见海马体', 'Make the cortex translucent to see the hippocampus'],
     hud: ['海马体 · 左右各一个', 'Hippocampus · one on each side'],
     status: ['透明度和标签可以从 3D 场景右上角的显示设置调整。', 'Adjust opacity and labels from Display settings in the top right of the 3D scene.'],
   },
   {
     key: 'amygdala',
     name: ['杏仁核', 'Amygdala'],
     one: ['拉响情绪<b>「警报」</b>的小核团。', 'The small nucleus that raises the mind’s <b>emotional alarm</b>.'],
     where: ['颞叶前端内侧、海马体前方，左右各一个。', 'At the front of the temporal lobe, ahead of the hippocampus, one on each side.'],
     does: ['快速评估眼前的情景是否危险，触发恐惧和紧张等情绪反应。', 'Rapidly evaluates whether a scene is dangerous and triggers fear and tension.'],
     example: ['夜里听到奇怪的声音立刻警觉、心跳加快，这是杏仁核在报警。', 'Feeling instantly alert, heart racing, at a strange sound at night — that is the amygdala signalling.'],
     pro: [
       [['所属网络', 'Network'], ['边缘网络 Limbic', 'Limbic network']],
       [['邻近结构', 'Nearby structures'], ['海马体 · 内嗅皮层', 'Hippocampus · entorhinal cortex']],
       [['经典案例', 'Classic case'], ['病人 S.M. 双侧受损后难以识别恐惧', 'Patient S.M. could not recognise fear after bilateral damage']],
     ],
     source: ['Adolphs et al. 1994, Nature · 深部结构为教学示意', 'Adolphs et al. 1994, Nature · deep structures are schematic'],
     stageTitle: ['看见杏仁核：比海马体更靠前', 'See the amygdala: slightly ahead of the hippocampus'],
     hud: ['杏仁核 · 左右各一个', 'Amygdala · one on each side'],
     status: ['杏仁核比海马体更靠前，试着在 3D 里对比两个位置。', 'The amygdala sits ahead of the hippocampus. Compare the two positions in 3D.'],
   },
   {
     key: 'thalamus',
     name: ['丘脑', 'Thalamus'],
     one: ['大脑的<b>「中继站」</b>：感觉信息先经过它，再传向皮层。', 'The brain’s <b>relay station</b>: sensory signals pass through it on the way to the cortex.'],
     where: ['两侧脑室之间、脑的正中位置，左右各一个。', 'At the brain’s centre between the ventricles, one on each side.'],
     does: ['把视觉、听觉、触觉等信号分拣后转发给对应的皮层区域，也参与觉醒与注意。', 'Sorts visual, auditory and touch signals and forwards them to the right cortical areas; also involved in arousal and attention.'],
     example: ['看球赛时，画面的亮度和观众的呐喊几乎同时到达，丘脑让它们各就各位。', 'At a match, the bright picture and the roar of the crowd arrive almost together; the thalamus routes each to its place.'],
     pro: [
       [['所属网络', 'Network'], ['跨网络 · 与多数皮层区域相连', 'Across networks · connected to most cortical areas']],
       [['邻近结构', 'Nearby structures'], ['基底核 · 下丘脑（示意）', 'Basal ganglia · hypothalamus (schematic)']],
       [['经典案例', 'Classic case'], ['丘脑损伤可改变意识与注意', 'Thalamic damage can alter consciousness and attention']],
     ],
     source: ['Jones 2009, The Thalamus · 深部结构为教学示意', 'Jones 2009, The Thalamus · deep structures are schematic'],
     stageTitle: ['丘脑在正中：感觉信号的中继站', 'The thalamus at centre: relay for sensory signals'],
     hud: ['丘脑 · 脑的中心，左右各一个', 'Thalamus · at the brain’s centre, one on each side'],
     status: ['三个深部结构都看完了，去章节小测检验一下。', 'All three deep structures covered. Check them with the chapter quiz.'],
   },
 ];

 function renderDeep(index, silent) {
   state.deep = index;
   const d = deepData[index];
   nameLine($('#deepName'), d.name);
   localize($('#deepOne'), d.one[0], d.one[1]);
   localize($('#deepWhere'), d.where[0], d.where[1]);
   localize($('#deepDoes'), d.does[0], d.does[1]);
   localize($('#deepExample'), d.example[0], d.example[1]);
   localize($('#deepStageTitle'), d.stageTitle[0], d.stageTitle[1]);
   localize($('#deepTag'), '深部结构 · 本章第 ' + (index + 1) + ' / 3 个', 'Deep structure · ' + (index + 1) + ' / 3 in this chapter');
   localize($('#deepHudCurrent'), d.hud[0], d.hud[1]);
   localize($('#deepSource'), d.source[0], d.source[1]);
   localize($('#deepStatus'), d.status[0], d.status[1]);
   $('#deepProInfo').innerHTML = d.pro.map(row => '<div class="kv"><b>' + pair(row[0]) + '</b><span>' + pair(row[1]) + '</span></div>').join('');
   $('#deepCount').textContent = (index + 1) + ' / 3';
   const next = deepData[Math.min(index + 1, 2)];
   localize($('#deepNextBtn'),
     index === 2 ? '我学会了 · 开始章节小测' : '我学会了 · 下一个：' + next.name[0],
     index === 2 ? 'I understand it · Start the chapter quiz' : 'I understand it · Next: ' + next.name[1]);
   $$('#deepRoute [data-deep-step]').forEach((el, i) => {
     el.classList.toggle('done', state.deepVisited.includes(DEEP_KEYS[i]));
     el.classList.toggle('now', i === index);
   });
   withStage('#deep-stage', s => s.setHighlight(d.key));
   saveState();
   updateProgress(currentRoute());
   if (!silent) notify(localized('现在学习：' + d.name[0], 'Now studying: ' + d.name[1]));
 }

 /* ---------- chapter quiz · closed loop with three questions ---------- */

 const quizBank = [
   {
     q: ['哪个结构负责把新经历转变成长期记忆？', 'Which structure turns new experiences into long-term memories?'],
     options: [
       { k: 'A', key: 'frontal', t: '额叶', te: 'Frontal lobe', d: ['负责计划与自控', 'planning and self-control'] },
       { k: 'B', key: 'amygdala', t: '杏仁核', te: 'Amygdala', d: ['负责情绪警报', 'emotional alarm'] },
       { k: 'C', key: 'hippocampus', t: '海马体', te: 'Hippocampus', d: ['记忆的保存键', 'the memory save button'] },
       { k: 'D', key: 'cerebellum', t: '小脑', te: 'Cerebellum', d: ['负责动作协调', 'movement coordination'] },
     ],
     ok: 'C',
     reveal: 'hippocampus',
     rightText: ['海马体像「保存键」，在睡眠中把白天的经历巩固成长期记忆。', 'The hippocampus is like a save button: during sleep it consolidates the day’s experiences into long-term memories.'],
     hintText: ['额叶管计划、杏仁核管情绪警报、小脑管协调。负责把新经历写进长期记忆的是海马体。', 'The frontal lobe plans, the amygdala raises alarms and the cerebellum coordinates. The hippocampus writes new experiences into long-term memory.'],
   },
   {
     q: ['哪个结构在感知到危险时快速拉响情绪警报？', 'Which structure rapidly raises the emotional alarm when danger appears?'],
     options: [
       { k: 'A', key: 'hippocampus', t: '海马体', te: 'Hippocampus', d: ['记忆的保存键', 'the memory save button'] },
       { k: 'B', key: 'amygdala', t: '杏仁核', te: 'Amygdala', d: ['负责情绪警报', 'emotional alarm'] },
       { k: 'C', key: 'thalamus', t: '丘脑', te: 'Thalamus', d: ['感觉中继站', 'sensory relay station'] },
       { k: 'D', key: 'frontal', t: '额叶', te: 'Frontal lobe', d: ['负责计划与自控', 'planning and self-control'] },
     ],
     ok: 'B',
     reveal: 'amygdala',
     rightText: ['杏仁核把危险信号快速放大，让你在想清楚之前就已经警觉。', 'The amygdala amplifies danger signals quickly, making you alert before you have time to think.'],
     hintText: ['问自己：夜里听到怪声立刻心跳加快，是哪个结构在报警？', 'Ask yourself: which structure makes your heart race at a strange sound at night?'],
   },
   {
     q: ['感觉信息进入皮层之前，先经过哪个「中继站」？', 'Which relay station do sensory signals pass through before reaching the cortex?'],
     options: [
       { k: 'A', key: 'thalamus', t: '丘脑', te: 'Thalamus', d: ['感觉中继站', 'sensory relay'] },
       { k: 'B', key: 'cerebellum', t: '小脑', te: 'Cerebellum', d: ['负责动作协调', 'movement coordination'] },
       { k: 'C', key: 'hippocampus', t: '海马体', te: 'Hippocampus', d: ['记忆保存键', 'memory save button'] },
       { k: 'D', key: 'amygdala', t: '杏仁核', te: 'Amygdala', d: ['负责情绪警报', 'emotional alarm'] },
     ],
     ok: 'A',
     reveal: 'thalamus',
     rightText: ['丘脑把视觉、听觉和触觉信号分拣转发到对应皮层，像大脑的交换机。', 'The thalamus sorts visual, auditory and touch signals and forwards them to the right cortex, like the brain’s switchboard.'],
     hintText: ['它位于脑的正中，分工就是「中继」：先收到，再转发。', 'It sits at the brain’s centre and its job is relay: receive first, then forward.'],
   },
 ];

 const pinsFor = (d, answered) => d.options.map(o => ({ k: o.k, t: o.t, te: o.te, at: PIN_AT[o.key], ok: answered && o.k === d.ok }));

 function buildOptions(d, answered) {
   const box = $('#quizOptions');
   box.classList.toggle('done', !!answered);
   box.innerHTML = d.options.map(o =>
     '<button class="option' + (answered && o.k === d.ok ? ' right' : '') + (answered === o.k ? ' selected' : '') + '" data-answer="' + o.k + '"><b>' + o.k + '</b>' + localized(o.t + ' · ' + o.d[0], o.te + ' · ' + o.d[1]) + '</button>'
   ).join('');
 }

 function applyAnswerVisual(d, answer) {
   const ok = answer === d.ok;
   const okOption = d.options.find(o => o.k === d.ok);
   $$('#quizOptions .option').forEach(btn => {
     btn.classList.toggle('selected', btn.dataset.answer === answer);
     btn.classList.toggle('right', btn.dataset.answer === d.ok);
   });
   $('#quizOptions').classList.add('done');
   const feedback = $('#quizFeedback');
   feedback.hidden = false;
   feedback.classList.toggle('bad', !ok);
   localize($('#quizFeedbackTitle'), ok ? '答对了！' : '先别急，再想一想。', ok ? 'Correct!' : 'Not quite yet.');
   localize($('#quizFeedbackText'), (ok ? d.rightText : d.hintText)[0], (ok ? d.rightText : d.hintText)[1]);
   localize($('#quizMeta'), '第 ' + (quizIndex + 1) + ' / 3 题 · ' + (ok ? '已答对' : '已作答'), 'Question ' + (quizIndex + 1) + ' of 3 · ' + (ok ? 'correct' : 'answered'));
   localize($('#quizHudAnswer'),
     ok ? d.ok + ' · ' + okOption.t + ' ✓' : answer + ' · 再观察一下结构的位置',
     ok ? d.ok + ' · ' + okOption.te + ' ✓' : answer + ' · look again at the structure’s location');
   withStage('#quiz-stage', s => {
     s.setHighlight(ok ? d.reveal : 'none', OK_GREEN);
     s.setPins(pinsFor(d, true));
   });
 }

 function renderQuestion(index, silent) {
   quizIndex = index;
   const d = quizBank[index];
   const answered = quizPicked[index];
   $('#quizQband').textContent = '❓ ' + pair(d.q);
   localize($('#quizTitle'), d.q[0], d.q[1]);
   buildOptions(d, answered);
   $('#quizCount').textContent = index + 1;
   $('#quizHudCount').textContent = index + 1;
   localize($('#quizMeta'), '第 ' + (index + 1) + ' / 3 题 · ' + (answered ? (quizLog[index] ? '已答对' : '已作答') : '未作答'), 'Question ' + (index + 1) + ' of 3 · ' + (answered ? (quizLog[index] ? 'correct' : 'answered') : 'not answered'));
   localize($('#quizHudAnswer'), '请点击图钉或右侧选项', 'Click a pin or choose an option on the right');
   const nextLabels = [['下一题 · 2 / 3', 'Next question · 2 / 3'], ['下一题 · 3 / 3', 'Next question · 3 / 3'], ['查看成绩', 'See your score']];
   localize($('#quizNextBtn'), nextLabels[index][0], nextLabels[index][1]);
   $$('#quizRoute [data-quiz-step]').forEach((el, i) => {
     el.classList.toggle('done', quizPicked[i] != null);
     el.classList.toggle('now', i === index);
   });
   const feedback = $('#quizFeedback');
   if (answered) {
     applyAnswerVisual(d, answered);
   } else {
     feedback.hidden = true;
     withStage('#quiz-stage', s => { s.setHighlight('none'); s.setPins(pinsFor(d, false)); });
   }
   saveState();
   updateProgress(currentRoute());
   if (!silent) notify(localized('第 ' + (index + 1) + ' / 3 题', 'Question ' + (index + 1) + ' of 3'));
 }

 function answerQuiz(answer) {
   if (quizFinished) {
     notify(localized('本节小测已完成，可点击重做小测', 'This quiz is complete. You can retake it.'));
     return;
   }
   if (quizPicked[quizIndex]) {
     notify(localized('本题已作答，看看解析后进入下一题', 'Already answered. Read the explanation, then continue.'));
     return;
   }
   const d = quizBank[quizIndex];
   const ok = answer === d.ok;
   quizPicked[quizIndex] = answer;
   quizLog[quizIndex] = ok;
   applyAnswerVisual(d, answer);
   updateProgress(currentRoute());
   const okOption = d.options.find(o => o.k === d.ok);
   notify(ok
     ? localized('答对了，' + okOption.t + '已点亮', 'Correct — the ' + okOption.te.toLowerCase() + ' is lit')
     : localized('答案已记录，看看提示再进入下一题', 'Answer recorded. Read the hint, then continue'));
 }

 function finishQuiz(silent) {
   quizFinished = true;
   quizFinalScore = quizLog.filter(entry => entry === true).length;
   if (state.quizBest == null || quizFinalScore > state.quizBest) {
     state.quizBest = quizFinalScore;
     saveState();
   }
   $('#quizNextBtn').hidden = true;
   $('#quizRestartBtn').hidden = false;
   $$('#quizRoute [data-quiz-step]').forEach(el => el.classList.add('done'));
   localize($('#quizQband'), '🎉 小测完成 · ' + quizFinalScore + ' / 3', '🎉 Quiz complete · ' + quizFinalScore + ' / 3');
   localize($('#quizMeta'), quizFinalScore + ' / 3 · 已完成', quizFinalScore + ' / 3 · complete');
   const summary = quizFinalScore === 3
     ? ['全部答对，三个深部结构的关系已经串起来了。', 'All correct — the three deep structures are now connected in your map.']
     : quizFinalScore >= 2
       ? ['不错的成绩，回到第 4 章把答错的一题再看一遍。', 'Good score — return to chapter 4 and review the one you missed.']
       : ['别灰心，回到第 4 章把三个结构再看一遍，再来重测。', 'Head back to chapter 4, look through the three structures again, then retake the quiz.'];
   const feedback = $('#quizFeedback');
   feedback.hidden = false;
   feedback.classList.remove('bad');
   localize($('#quizFeedbackTitle'), '小测完成', 'Quiz complete');
   localize($('#quizFeedbackText'), summary[0], summary[1]);
   updateProgress(currentRoute());
   if (!silent) notify(localized('小测完成：' + quizFinalScore + ' / 3', 'Quiz complete: ' + quizFinalScore + ' / 3'));
 }

 function restartQuiz() {
   quizPicked = [null, null, null];
   quizLog = [null, null, null];
   quizFinished = false;
   quizFinalScore = 0;
   $('#quizNextBtn').hidden = false;
   $('#quizRestartBtn').hidden = true;
   renderQuestion(0);
   notify(localized('小测已重置，重新开始', 'Quiz reset. Starting again'));
 }

 $('#quizOptions').addEventListener('click', event => {
   const button = event.target.closest('[data-answer]');
   if (button) answerQuiz(button.dataset.answer);
 });
 $('#quiz-stage').addEventListener('brain-pin', event => answerQuiz(event.detail.k));
 $('#quizNextBtn').addEventListener('click', () => {
   if (!quizPicked[quizIndex]) {
     notify(localized('先选择一个答案', 'Choose an answer first'));
     return;
   }
   if (quizIndex < 2) renderQuestion(quizIndex + 1);
   else finishQuiz();
 });
 $('#quizRestartBtn').addEventListener('click', restartQuiz);

 /* ---------- pro mode · Yeo-7 networks ---------- */

 const networkData = {
   visual: {
     name: ['视觉网络', 'Visual Network'],
     one: ['从枕叶出发，把光线变成<b>看见的世界</b>。', 'Starting in the occipital lobe, turning light into <b>the world you see</b>.'],
     does: ['处理视觉信息，从枕叶向更高层视觉区域传递，构建形状、颜色与运动。', 'Processes visual information from the occipital lobe to higher visual areas, building shape, colour and motion.'],
     anatomy: ['枕叶与颞叶后部', 'Occipital lobe and posterior temporal lobe'],
     func: ['视觉加工', 'Visual processing'],
   },
   somato: {
     name: ['躯体运动网络', 'Somatomotor Network'],
     one: ['让<b>身体感觉与运动</b>实时相连。', 'Keeping <b>body sensation and movement</b> in real-time contact.'],
     does: ['让身体感觉和主动运动保持实时联系，中央沟两侧是它的核心。', 'Keeps body sensation and voluntary movement in real-time contact; the two banks of the central sulcus are its core.'],
     anatomy: ['中央前回与中央后回', 'Precentral and postcentral gyri'],
     func: ['动作与身体感觉', 'Action and body sensation'],
   },
   dorsal: {
     name: ['背侧注意网络', 'Dorsal Attention Network'],
     one: ['把注意力<b>主动放到目标</b>上。', 'Directing attention <b>to a chosen target</b>.'],
     does: ['帮助你把注意力主动放到目标上，阅读时盯住一行字就是它在工作。', 'Helps direct attention to a chosen target, such as keeping your eyes on one line while reading.'],
     anatomy: ['顶叶与额叶眼区', 'Parietal lobe and frontal eye fields'],
     func: ['目标导向注意', 'Goal-directed attention'],
   },
   ventral: {
     name: ['腹侧注意网络', 'Ventral Attention Network'],
     one: ['出现重要的新刺激时，把注意力<b>拉过去</b>。', 'Pulling attention <b>toward important new stimuli</b>.'],
     does: ['当环境里出现重要的新刺激时，把注意力拉过去，例如身后突然有人喊你。', 'Pulls attention toward important new stimuli, such as someone calling you from behind.'],
     anatomy: ['颞顶交界与额下回', 'Temporoparietal junction and inferior frontal gyrus'],
     func: ['刺激驱动注意', 'Stimulus-driven attention'],
   },
   limbic: {
     name: ['边缘网络', 'Limbic Network'],
     one: ['支撑<b>记忆、价值与情绪</b>的评估。', 'Supporting <b>memory, value and emotional</b> processing.'],
     does: ['与记忆、价值和情绪有关；皮层部分属于 Yeo-7 边缘网络，海马体等深部结构为教学示意。', 'Supports memory, value and emotion; the cortical part belongs to the Yeo-7 limbic network, while deep structures such as the hippocampus are schematic.'],
     anatomy: ['颞叶内侧与眶额区域（皮层部分）', 'Medial temporal and orbitofrontal cortex'],
     func: ['记忆与情绪', 'Memory and emotion'],
   },
   fronto: {
     name: ['额顶网络', 'Frontoparietal Network'],
     one: ['复杂任务中的<b>总协调</b>：规则、工作记忆与决策。', 'The <b>coordinator</b> in complex tasks: rules, working memory and decisions.'],
     does: ['在复杂任务中协调规则、工作记忆和决策，像任务的「总指挥」。', 'Coordinates rules, working memory and decisions in complex tasks, like a task commander.'],
     anatomy: ['额叶与顶叶外侧', 'Lateral frontal and parietal regions'],
     func: ['认知控制', 'Cognitive control'],
   },
   default: {
     name: ['默认网络', 'Default Mode Network'],
     one: ['大脑的<b>「白日梦网络」</b>：不专注外界时最活跃。', 'The brain’s <b>“daydream network”</b>: most active when attention turns inward.'],
     does: ['自传体记忆、设想未来、理解他人的想法；专注做事时安静，走神时活跃。', 'Autobiographical memory, imagining the future and understanding others; quiet when focused, active when the mind wanders.'],
     anatomy: ['顶叶内侧、前额叶内侧、颞顶内侧', 'Medial parietal, medial prefrontal and medial temporoparietal regions'],
     func: ['内部思维与自我相关加工', 'Internal thought and self-related processing'],
   },
 };

 function renderNetwork(index, silent) {
   state.network = index;
   const key = NET_ORDER[index];
   const d = networkData[key];
   $$('[data-network]').forEach(el => el.classList.toggle('on', el.dataset.network === key));
   nameLine($('#proName'), d.name);
   localize($('#proOne'), d.one[0], d.one[1]);
   localize($('#proDoes'), d.does[0], d.does[1]);
   localize($('#proAnatomy'), d.anatomy[0], d.anatomy[1]);
   localize($('#proFunction'), d.func[0], d.func[1]);
   localize($('#proStageTitle'), d.name[0] + '在脑内的分布', 'Distribution of the ' + d.name[1]);
   withStage('#pro-stage', s => s.setNetworkHighlight(index));
   saveState();
   updateProgress(currentRoute());
   if (!silent) notify(localized('已切换到' + d.name[0], 'Switched to the ' + d.name[1]));
 }

 $$('[data-network]').forEach(item => item.addEventListener('click', () => renderNetwork(NET_ORDER.indexOf(item.dataset.network))));

 /* ---------- deep-stage display settings ---------- */

 $$('[data-settings-toggle]').forEach(button => button.addEventListener('click', () => {
   const settings = $('#deepSettings');
   settings.classList.toggle('deep-hidden');
   notify(settings.classList.contains('deep-hidden') ? localized('显示设置已收起', 'Display settings collapsed') : localized('显示设置已打开', 'Display settings open'));
 }));

 const labelToggle = $('[data-toggle-labels]');
 if (labelToggle) labelToggle.addEventListener('change', () => {
   const labels = $('#deep-stage .stage-labels');
   labels?.classList.toggle('deep-hidden', !labelToggle.checked);
 });

 const opacityRange = $('[data-deep-opacity]');
 if (opacityRange) opacityRange.addEventListener('input', () => {
   withStage('#deep-stage', s => s.setGhostOpacity(Number(opacityRange.value)));
 });

 $$('[data-deep-toggle]').forEach(box => box.addEventListener('change', () => {
   withStage('#deep-stage', s => s.setDeepVisible(box.dataset.deepToggle.split(','), box.checked));
 }));

 /* ---------- stage interactions ---------- */

 function bindStageControls() {
   $$('[data-stage-view]').forEach(button => button.addEventListener('click', () => {
     const stage = button.closest('.stage-wrap')?.querySelector('.stage-host');
     stage?.__stage?.setView(button.dataset.stageView);
     button.parentElement.querySelectorAll('button').forEach(el => el.classList.toggle('on', el === button));
   }));
   $$('[data-stage-reset]').forEach(button => button.addEventListener('click', () => {
     button.closest('.stage-wrap')?.querySelector('.stage-host')?.__stage?.reset();
     notify(localized('视角已重置', 'View reset'));
   }));
 }
 bindStageControls();

 $$('.stage-host').forEach(stage => stage.addEventListener('brain-select', event => {
   const { title, subtitle, lobe } = event.detail;
   const name = title.split(' · ')[0];
   if (stage.id === 'learn-stage' && lobe >= 0) {
     const index = LOBE_KEYS.indexOf(LOBE_BY_NAME[name]);
     if (index >= 0) renderLobe(index, true);
   } else if (stage.id === 'deep-stage') {
     const index = DEEP_BY_NAME[name];
     if (index !== undefined) renderDeep(index, true);
   } else if (stage.id === 'pro-stage') {
     withStage('#pro-stage', s => s.setNetworkHighlight(state.network));
   }
   notify(title + ' · ' + subtitle);
 }));

 /* ---------- wiring ---------- */

 $$('[data-learn-step]').forEach(el => el.addEventListener('click', () => renderLobe(Number(el.dataset.learnStep))));
 $('[data-next-lobe]').addEventListener('click', () => {
   if (state.lobe < 3) renderLobe(state.lobe + 1);
   else showRoute('quiz');
 });
 $$('[data-deep-step]').forEach(el => el.addEventListener('click', () => renderDeep(Number(el.dataset.deepStep))));
 $('[data-next-deep]').addEventListener('click', () => {
   if (state.deep < 2) renderDeep(state.deep + 1);
   else showRoute('quiz');
 });
 $$('[data-quiz-step]').forEach(el => el.addEventListener('click', () => {
   if (!quizFinished) renderQuestion(Number(el.dataset.quizStep));
 }));

 window.addEventListener('neuro-language', () => {
   renderLobe(state.lobe, true);
   renderDeep(state.deep, true);
   renderNetwork(state.network, true);
   if (quizFinished) finishQuiz(true);
   else renderQuestion(quizIndex, true);
   updateProgress(currentRoute());
 });

 /* ---------- init: silent renders, then restore the route ---------- */

 renderLobe(state.lobe, true);
 renderDeep(state.deep, true);
 renderNetwork(state.network, true);
 renderQuestion(0, true);
 withStage('#deep-stage', s => s.setDeepVisible(['callosum'], false));
 showRoute(location.hash.slice(1) || state.route || 'learn');
