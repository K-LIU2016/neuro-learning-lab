const STORAGE_KEY = 'neuroatlas.language';
const TEXT = {
  '脑科学实验室': 'Neuroscience Learning Lab', '学习模式': 'Learning mode', '学习路线': 'Learning path', '自由探索': 'Explore freely', '专业模式': 'Pro mode',
  '学习进度 3 / 16 个核心概念': 'Learning progress 3 / 16 core concepts', '语言': 'Language', '中': '中文', '双语': 'Bilingual', '🔍 搜索脑区、网络或别名': '🔍 Search brain regions, networks or aliases',
  '学习路线 · 第一次学脑科学 · 4 章 16 个概念': 'Learning path · First steps in neuroscience · 4 chapters, 16 concepts',
  '大脑的四个脑叶': 'The four lobes of the brain', '先认地方，再记功能 ·': 'Learn the places first, then the functions ·',
  '额叶': 'Frontal lobe', '顶叶': 'Parietal lobe', '颞叶': 'Temporal lobe', '枕叶': 'Occipital lobe', '当前': 'Current', '下一个': 'Next',
  '运动与感觉': 'Movement and sensation', '中央沟两边的「行动地图」': 'The action map on both sides of the central sulcus',
  '视觉 · 听觉 · 语言': 'Vision · hearing · language', '信息怎么进来、语言藏在哪里': 'How information comes in, and where language lives',
  '记忆与情绪': 'Memory and emotion', '深处的海马体和杏仁核': 'The hippocampus and amygdala inside the brain',
  '🎯 章节小测 · 边看 3D 边作答': '🎯 Chapter quiz · Answer while viewing the 3D brain',
  '📍 它在哪里？': '📍 Where is it?', '🧠 它做什么？': '🧠 What does it do?', '💡 生活中的例子': '💡 Everyday example',
  '专业信息（分区 · 网络）': 'Pro detail (regions · networks)', '关联皮层': 'Related cortex', '听觉联合皮层 · 颞下视觉区': 'Auditory association cortex · ventral visual areas',
  'Yeo-7 网络': 'Yeo-7 network', '腹侧注意 · 边缘网络': 'Ventral attention · limbic', '深部邻居': 'Deep neighbours',
  '海马体 · 杏仁核（第 4 章详讲）': 'Hippocampus · amygdala (covered in chapter 4)', '来源与证据': 'Sources and evidence',
  '我学会了 · 下一个：枕叶': 'I understand it · Next: occipital lobe', '本章小测 · 3 题': 'Chapter quiz · 3 questions',
  'Chapter 01 · 大脑的四个脑叶': 'Chapter 01 · The four lobes of the brain', '真实皮层数据 · fsaverage5 / Destrieux': 'Real cortical data · fsaverage5 / Destrieux', '脑叶 · 本章第 3 / 4 个': 'Lobe · 3 / 4 in this chapter', '颞叶在哪里？': 'Where is the temporal lobe?',
  '左视': 'Left view', '右视': 'Right view', '俯视': 'Top view', '外侧': 'Outer', '内侧': 'Medial', '↺ 重置': '↺ Reset', '当前脑区': 'Current region',
  '颞叶 · 左右各一个': 'Temporal lobe · one on each side', '拖动旋转 · 滚轮缩放 · 点击视角按钮 —— 像拿着一个真的大脑': 'Drag to rotate · scroll to zoom · use the view buttons — like holding a real brain',
  '大脑最前方的计划与行动中枢。': 'The planning and action centre at the front of the brain.',
  '额头后方，大脑前部的位置，左右各一个。': 'Behind the forehead, at the front of the brain, one on each side.',
  '帮助你计划、做决定、控制冲动，也参与主动运动。': 'Helps you plan, make decisions, control impulses and initiate movement.',
  '写作业时安排先后顺序、忍住先玩手机的冲动。': 'Planning the order of your homework and resisting the urge to check your phone first.',
  '把身体感觉和空间位置拼成一张地图。': 'Builds a map from body sensations and spatial position.',
  '位于额叶后方、枕叶前方，靠近头顶。': 'Behind the frontal lobe and in front of the occipital lobe, near the top of the head.',
  '处理触觉、身体位置和空间关系，让你知道“我在哪里”。': 'Processes touch, body position and spatial relations so you know where you are.',
  '闭着眼也能摸到口袋里的钥匙，靠的是顶叶的空间地图。': 'Finding the keys in your pocket with your eyes closed uses the parietal spatial map.',
  '耳朵上方的大脑「侧面」，主要负责听懂世界。': 'The side of the brain above the ears, central to understanding the world through sound.',
  '耳朵的正上方和前方，大脑两侧靠下的位置，左右各一个。': 'Above and slightly in front of the ears, low on both sides of the brain.',
  '处理声音和语言，帮你听懂别人说什么、认出熟悉的旋律；内侧深处还藏着与记忆有关的结构。': 'Processes sound and language, helping you understand speech and recognise familiar melodies; memory structures lie deeper on its inner surface.',
  '朋友在人群里喊你的名字，你立刻回头，这一瞬间就是颞叶在工作。': 'When a friend calls your name in a crowd and you turn around, your temporal lobe is at work.',
  '把眼睛收到的光线变成你看见的世界。': 'Turns the light received by your eyes into the world you see.',
  '大脑最后方，靠近后脑勺的位置。': 'At the back of the brain, near the back of the head.',
  '处理颜色、边缘、形状和运动等视觉信息。': 'Processes visual information such as colour, edges, shape and motion.',
  '看见红绿灯变绿并认出它是“可以通行”的信号。': 'Seeing a traffic light turn green and recognising that it means you may go.',
  '四个脑叶都认完了，可以进入章节小测。': 'All four lobes are familiar now. You can start the chapter quiz.',
  '学习路线 · 第 4 章 · 深入大脑内部': 'Learning path · Chapter 4 · Inside the brain', '4 / 4 · 已完成': '4 / 4 · Complete',
  '3 / 3 · 已完成': '3 / 3 · Complete', '皮层变透明，看进大脑深处 · 1 / 3': 'Make the cortex transparent and look inside · 1 / 3',
  '🎯 进入章节小测': '🎯 Start the chapter quiz', 'Chapter 04 · 记忆与情绪': 'Chapter 04 · Memory and emotion',
  '把皮层调成半透明，看见海马体': 'Make the cortex translucent to see the hippocampus', '外观': 'Outer view', '透视': 'Deep view',
  '分离两半球': 'Separate hemispheres', '↺ 重置视角': '↺ Reset view', '当前结构': 'Current structure',
  '海马体 · 左右各一个': 'Hippocampus · one on each side', '杏仁核': 'Amygdala', '小脑 · 脑干 · 脊髓': 'Cerebellum · brainstem · spinal cord',
  '皮层（半透明）': 'Cortex (translucent)', '显示设置': 'Display settings', '显示结构名称': 'Show structure names',
  '显示小脑、脑干与脊髓': 'Show cerebellum, brainstem and spinal cord', '显示胼胝体': 'Show corpus callosum',
  '拖动旋转 · 深部结构为教学示意位置': 'Drag to rotate · deep structures are schematic teaching positions',
  '拖动旋转 · 滚轮缩放 —— 半透明皮层下，看清深部结构的空间关系': 'Drag to rotate · scroll to zoom — see spatial relationships beneath the translucent cortex',
  '深部结构 · 本章第 1 / 3 个': 'Deep structure · 1 / 3 in this chapter',
  '把新经历写进长期记忆的「保存键」。': 'The “save button” that writes new experiences into long-term memory.',
  '颞叶内侧深处，因为形状像海马而得名，左右各一个。': 'Deep inside the temporal lobe, named for its seahorse shape, one on each side.',
  '把白天的经历在睡眠中巩固成长期记忆，还负责空间导航，伦敦出租车司机的海马体就格外发达。': 'Consolidates daytime experiences into long-term memories during sleep and supports spatial navigation; London taxi drivers have especially developed hippocampi.',
  '记住今天新同学的姓名、回忆昨晚晚饭吃了什么、在熟悉的城市里找到回家的路。': 'Remembering a new classmate’s name, recalling last night’s dinner and finding your way home in a familiar city.',
  '专业信息（网络 · 证据）': 'Pro detail (networks · evidence)', '边缘网络 Limbic': 'Limbic network', '邻近结构': 'Nearby structures',
  '内嗅皮层 · 杏仁核 · 丘脑': 'Entorhinal cortex · amygdala · thalamus', '经典案例': 'Classic case',
  '病人 H.M. 切除后无法形成新记忆': 'Patient H.M. could not form new memories after resection',
  '透明度和标签可以从 3D 场景右上角的显示设置调整。': 'Adjust opacity and labels from Display settings in the top right of the 3D scene.',
  '我学会了 · 开始章节小测': 'I understand it · Start the chapter quiz', '回看：颞叶在哪里': 'Review: where is the temporal lobe?',
  '学习路线 · 第 4 章小测 · 边看边答': 'Learning path · Chapter 4 quiz · Answer while you look', '第 1–3 章': 'Chapters 1–3',
  '10 / 10 · 已完成': '10 / 10 · Complete', '综合测验 · 12 题': 'Comprehensive quiz · 12 questions', '学完 16 个概念后解锁': 'Unlock after learning all 16 concepts',
  '🎯 每答一题，答对的结构会在 3D 上亮起来': '🎯 Correct structures light up in 3D as you answer',
  'Chapter 04 · 章节小测': 'Chapter 04 · Chapter quiz', '在 3D 大脑上答题': 'Answer on the 3D brain',
  '❓ 哪个结构负责把新经历变成长期记忆？': '❓ Which structure turns new experiences into long-term memories?',
  '请点击图钉或右侧选项': 'Click a pin or choose an option on the right', '点击图钉字母或右侧选项作答': 'Click a pin letter or choose an option on the right',
  '点击图钉字母或右侧选项作答 · 答对的结构会保持高亮': 'Click a pin letter or choose an option · correct structures stay highlighted',
  '第 4 章 · 记忆与情绪': 'Chapter 4 · Memory and emotion', '哪个结构负责把新经历转变成长期记忆？': 'Which structure turns new experiences into long-term memories?',
  '额叶 · 负责计划与自控': 'Frontal lobe · planning and self-control', '杏仁核 · 负责情绪警报': 'Amygdala · emotional alarm',
  '海马体 · 记忆的保存键': 'Hippocampus · the memory save button', '小脑 · 负责动作协调': 'Cerebellum · movement coordination',
  '答对了！': 'Correct!', '海马体像「保存键」，在睡眠中把白天的经历巩固成长期记忆。': 'The hippocampus is like a save button: during sleep it consolidates the day’s experiences into long-term memories.',
  '下一题 · 2 / 3': 'Next question · 2 / 3', '退出小测，继续学习': 'Exit quiz and keep learning',
  '自由探索 · 先熟悉，再深入': 'Explore freely · Get familiar, then go deeper', '自由旋转大脑': 'Rotate the brain freely',
  '选择一种着色方式开始观察': 'Choose a colouring scheme to start observing', '四个脑叶 · ': 'Four lobes · ', '入门': 'Intro', '深部结构': 'Deep structures', '进阶': 'Advanced',
  '回到学习路线': 'Back to learning path', '按 4 章 16 个概念学习': 'Learn through 4 chapters and 16 concepts',
  '💡 没有标准顺序，先观察你感兴趣的地方': '💡 There is no fixed order. Start with what interests you.',
  'Explore · 真实皮层数据': 'Explore · Real cortical data', '自由观察大脑的形状与分区': 'Explore the brain’s shape and divisions',
  '斜视': 'Oblique', '侧视': 'Lateral', '探索模式': 'Explore mode', '四个脑叶 · 双侧皮层': 'Four lobes · both hemispheres',
  '拖动旋转 · 滚轮缩放': 'Drag to rotate · scroll to zoom', '自由探索：先观察形状，再点击学习路线把结构和功能连起来': 'Explore freely: observe the shape first, then use the learning path to connect structure and function',
  '自由探索 · 入门模式': 'Explore freely · Intro mode', '先把大脑看熟': 'Get familiar with the brain',
  '你可以随时旋转、缩放，观察左右半球的对称和脑沟的起伏。': 'Rotate and zoom at any time to observe the symmetry of the hemispheres and the folds of the sulci.',
  '🔎 观察提示': '🔎 Observation tip', '🧭 推荐下一步': '🧭 Suggested next step', '你现在能做什么': 'What you can do now',
  '旋转': 'Rotate', '按住鼠标拖动 3D 模型': 'Click and drag the 3D model', '缩放': 'Zoom', '滚动鼠标滚轮': 'Scroll the mouse wheel',
  '切换视角': 'Change view', '使用上方视角按钮': 'Use the view buttons above', '开始学习路线': 'Start the learning path', '查看深部结构': 'View deep structures',
  '🎉 进阶探索已打开：可以查看 Yeo-7 七网络、双语术语和文献来源。左侧仍可随时回到学习路线复习。': '🎉 Advanced exploration is open: inspect the Yeo-7 networks, bilingual terms and sources. You can always return to the learning path on the left.',
  '解剖': 'Anatomy', '功能区': 'Functional areas', '网络': 'Networks', '日常动作': 'Everyday actions', '学习': 'Learn',
  '搜索脑区、网络或别名': 'Search regions, networks or aliases', 'Yeo 2011 七网络': 'Yeo 2011 seven networks', '视觉网络': 'Visual network',
  '躯体运动网络': 'Somatomotor network', '背侧注意网络': 'Dorsal attention network', '腹侧注意网络': 'Ventral attention network', '边缘网络': 'Limbic network',
  '额顶网络': 'Frontoparietal network', '默认网络': 'Default network', '教学回路专题': 'Teaching circuits', '语言回路': 'Language circuit', '记忆回路': 'Memory circuit',
  '解剖 / 功能区下还有 40+ 皮层条目，全部带来源。': 'There are 40+ more sourced cortical entries under Anatomy / Functional areas.',
  'Networks · Yeo 2011 七网络': 'Networks · Yeo 2011 seven networks', '默认网络在脑内的分布': 'Distribution of the default network',
  '着色方式': 'Colour scheme', 'Yeo-7 网络 · 双侧皮层': 'Yeo-7 networks · both hemispheres', '视觉': 'Visual', '躯体运动': 'Somatomotor',
  '背侧注意': 'Dorsal attention', '腹侧注意': 'Ventral attention', '边缘': 'Limbic', '额顶': 'Frontoparietal', '默认': 'Default',
  'fsaverage5 · Yeo 2011 atlas 着色': 'fsaverage5 · coloured with the Yeo 2011 atlas', '拖动旋转 · 滚轮缩放 · 点击左侧网络查看解释与来源': 'Drag to rotate · scroll to zoom · click a network on the left for its explanation and sources',
  'Yeo-7 网络 · 双侧分布': 'Yeo-7 network · both hemispheres', '解剖视角': 'Anatomical view', '功能视角': 'Functional view',
  '顶叶内侧、前额叶内侧、颞顶内侧': 'Medial parietal, medial prefrontal and medial temporoparietal regions',
  '内部思维与自我相关加工': 'Internal thought and self-related processing', '当前是专业着色，想回到易懂解释可点击顶部“学习路线”。': 'This is the professional colouring view. Click “Learning path” above for a gentler explanation.',
  '回到学习路线复习': 'Return to the learning path', '自由探索 3D 模型': 'Explore the 3D model',
};

let language = 'zh';
const initialNodes = [];

function preserveWhitespace(source, replacement) {
  const leading = source.match(/^\\s*/)?.[0] ?? '';
  const trailing = source.match(/\\s*$/)?.[0] ?? '';
  return leading + replacement + trailing;
}

function hasBuiltInEnglish(node) {
  const parent = node.parentElement;
  return !!parent?.querySelector(':scope > .en, :scope > em');
}

function registerTextNodes(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue?.trim() || node.parentElement?.closest('script,style')) continue;
    if (!initialNodes.some(item => item.node === node)) initialNodes.push({ node, source: node.nodeValue });
  }
}

function renderStaticText() {
  for (const item of initialNodes) {
    if (!item.node.isConnected) continue;
    const key = item.source.trim();
    const english = TEXT[key];
    if (!english) continue;
    const value = language === 'en' ? english : language === 'bi' && !hasBuiltInEnglish(item.node) ? key + ' / ' + english : key;
    item.node.nodeValue = preserveWhitespace(item.source, value);
  }
}

function renderLocalizedElements() {
  document.querySelectorAll('[data-i18n-zh]').forEach(el => {
    const zh = el.dataset.i18nZh ?? '';
    const en = el.dataset.i18nEn ?? zh;
    const bi = el.dataset.i18nBi ?? zh + ' / ' + en;
    el.innerHTML = language === 'en' ? en : language === 'bi' ? bi : zh;
  });
}

export function localized(zh, en) {
  return language === 'en' ? en : language === 'bi' ? zh + ' / ' + en : zh;
}

export function localize(el, zh, en, bi = zh + ' / ' + en) {
  el.dataset.i18nZh = zh;
  el.dataset.i18nEn = en;
  el.dataset.i18nBi = bi;
  renderLocalizedElements();
}

export function getLanguage() {
  return language;
}

export function setLanguage(next) {
  if (!['zh', 'en', 'bi'].includes(next)) return;
  language = next;
  try { localStorage.setItem(STORAGE_KEY, language); } catch { /* private mode */ }
  document.documentElement.dataset.lang = language;
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  renderStaticText();
  renderLocalizedElements();
  document.querySelectorAll('.lang button').forEach((button, index) => {
    button.textContent = ['中', 'EN', '双语'][index];
    button.classList.toggle('on', index === ['zh', 'en', 'bi'].indexOf(language));
    button.setAttribute('aria-pressed', String(index === ['zh', 'en', 'bi'].indexOf(language)));
  });
  window.dispatchEvent(new CustomEvent('neuro-language', { detail: language }));
}

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en' || saved === 'bi') return saved;
  } catch { /* private mode */ }
  return 'zh';
}

registerTextNodes();
language = initialLanguage();
setLanguage(language);
document.querySelectorAll('.lang button').forEach((button, index) => {
  button.addEventListener('click', () => setLanguage(['zh', 'en', 'bi'][index]));
});

