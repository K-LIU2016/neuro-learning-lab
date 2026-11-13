import './brain-view.mjs';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const toast = $('#toast');
let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function showRoute(route) {
  const panel = $(`[data-route-panel="${route}"]`);
  if (!panel) return;
  if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
  $$('[data-route-panel]').forEach(el => el.classList.toggle('active', el === panel));
  $$('[data-route-link]').forEach(el => el.classList.toggle('on', el.dataset.routeLink === route));
  const progress = route === 'pro' ? '学习路线 16 / 16 ✓ · 专业条目 18 / 62' : route === 'quiz' ? '学习进度 12 / 16 个核心概念' : route === 'deep' ? '学习进度 10 / 16 个核心概念' : '学习进度 3 / 16 个核心概念';
  $('#progressText').textContent = progress;
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

const lobeData = [
  { name: '额叶', en: 'Frontal Lobe', one: '大脑最前方的计划与行动中枢。', where: '额头后方，大脑前部的位置，左右各一个。', does: '帮助你计划、做决定、控制冲动，也参与主动运动。', example: '写作业时安排先后顺序、忍住先玩手机的冲动。' },
  { name: '顶叶', en: 'Parietal Lobe', one: '把身体感觉和空间位置拼成一张地图。', where: '位于额叶后方、枕叶前方，靠近头顶。', does: '处理触觉、身体位置和空间关系，让你知道“我在哪里”。', example: '闭着眼也能摸到口袋里的钥匙，靠的是顶叶的空间地图。' },
  { name: '颞叶', en: 'Temporal Lobe', one: '耳朵上方的大脑「侧面」，主要负责听懂世界。', where: '耳朵的正上方和前方，大脑两侧靠下的位置，左右各一个。', does: '处理声音和语言，帮你听懂别人说什么、认出熟悉的旋律；内侧深处还藏着与记忆有关的结构。', example: '朋友在人群里喊你的名字，你立刻回头，这一瞬间就是颞叶在工作。' },
  { name: '枕叶', en: 'Occipital Lobe', one: '把眼睛收到的光线变成你看见的世界。', where: '大脑最后方，靠近后脑勺的位置。', does: '处理颜色、边缘、形状和运动等视觉信息。', example: '看见红绿灯变绿并认出它是“可以通行”的信号。' },
];
let lobeIndex = 2;

function renderLobe(index) {
  lobeIndex = index;
  const d = lobeData[index];
  $('#learnName').innerHTML = `${d.name} <span class="en">${d.en}</span>`;
  $('#learnOne').textContent = d.one;
  $('#learnWhere').textContent = d.where;
  $('#learnDoes').textContent = d.does;
  $('#learnExample').textContent = d.example;
  $('#learnStageTitle').textContent = `${d.name}在哪里？`;
  $('#lobeCount').textContent = `${index + 1} / 4`;
  $$('#learnRoute [data-learn-step]').forEach((el, i) => {
    el.classList.toggle('done', i < index);
    el.classList.toggle('now', i === index);
  });
  $('#learnStatus').textContent = index === 3 ? '四个脑叶都认完了，可以进入章节小测。' : `已定位到${d.name}，下一步把“在哪里”与“做什么”连起来。`;
  notify(`现在学习：${d.name}`);
}

$$('[data-learn-step]').forEach(el => el.addEventListener('click', () => renderLobe(Number(el.dataset.learnStep))));
$('[data-next-lobe]').addEventListener('click', () => {
  if (lobeIndex < 3) renderLobe(lobeIndex + 1);
  else showRoute('quiz');
});

$$('[data-settings-toggle]').forEach(button => button.addEventListener('click', () => {
  const settings = $('#deepSettings');
  settings.classList.toggle('deep-hidden');
  notify(settings.classList.contains('deep-hidden') ? '显示设置已收起' : '显示设置已打开');
}));

const labelToggle = $('[data-toggle-labels]');
if (labelToggle) labelToggle.addEventListener('change', () => {
  const labels = $('#deep-stage .stage-labels');
  labels?.classList.toggle('deep-hidden', !labelToggle.checked);
});

let quizAnswer = null;
function answerQuiz(answer) {
  quizAnswer = answer;
  const correct = answer === 'C';
  $$('#quizRoute [data-answer]').forEach(el => el.classList.toggle('selected', el.dataset.answer === answer));
  const feedback = $('#quizFeedback');
  feedback.hidden = false;
  feedback.classList.toggle('bad', !correct);
  $('#quizFeedbackTitle').textContent = correct ? '答对了！' : '先别急，再想一想。';
  $('#quizFeedbackText').textContent = correct ? '海马体像“保存键”，在睡眠中把白天的经历巩固成长期记忆。' : '提示：额叶管计划、杏仁核管情绪、小脑管协调。负责把新经历写进长期记忆的是海马体。';
  $('#quizMeta').textContent = `1 / 3 · ${correct ? '已答对' : '已作答'}`;
  $('#quizHudAnswer').textContent = correct ? 'C · 海马体 ✓' : `${answer} · 再观察一下结构的位置`;
  notify(correct ? '答对了，海马体已点亮' : '答案已记录，看看提示再试一次');
}
$$('[data-answer]').forEach(el => el.addEventListener('click', () => answerQuiz(el.dataset.answer)));
$$('[data-next-question]').forEach(button => button.addEventListener('click', () => {
  if (!quizAnswer) {
    notify('先选择一个答案');
    return;
  }
  $('#quizCount').textContent = '2';
  $('#quizHudCount').textContent = '2';
  button.textContent = '已进入下一题 · 2 / 3';
  notify('下一题示例已准备好，后续可以继续扩展题库');
}));

$('#quiz-stage').addEventListener('brain-pin', event => answerQuiz(event.detail.k));

$$('.stage-host').forEach(stage => stage.addEventListener('brain-select', event => {
  const { title, subtitle, lobe } = event.detail;
  const status = $('#learnStatus');
  if (status && lobe >= 0) status.textContent = `已点亮${title.split(' · ')[0]}，模型中的琥珀色区域就是你刚刚点击的位置。`;
  notify(`${title} · ${subtitle}`);
}));

const networkData = {
  visual: ['视觉网络', 'Visual Network', '处理视觉信息，从枕叶向更高层视觉区域传递。', '枕叶与颞叶后部', '视觉加工'],
  somato: ['躯体运动网络', 'Somatomotor Network', '让身体感觉和主动运动保持实时联系。', '中央前回与中央后回', '动作与身体感觉'],
  dorsal: ['背侧注意网络', 'Dorsal Attention Network', '帮助你把注意力主动放到目标上。', '顶叶与额叶眼区', '目标导向注意'],
  ventral: ['腹侧注意网络', 'Ventral Attention Network', '当环境里出现重要的新刺激时，把注意力拉过去。', '颞顶交界与额下回', '刺激驱动注意'],
  limbic: ['边缘网络', 'Limbic Network', '与记忆、价值和情绪有关，海马体是重要节点。', '颞叶内侧与眶额区域', '记忆与情绪'],
  fronto: ['额顶网络', 'Frontoparietal Network', '在复杂任务中协调规则、工作记忆和决策。', '额叶与顶叶外侧', '认知控制'],
  default: ['默认网络', 'Default Mode Network', '大脑的“白日梦网络”，不专注外界时更活跃。', '顶叶内侧、前额叶内侧、颞顶内侧', '内部思维与自我相关加工'],
};
$$('[data-network]').forEach(item => item.addEventListener('click', () => {
  const d = networkData[item.dataset.network];
  if (!d) return;
  $$('[data-network]').forEach(el => el.classList.toggle('on', el === item));
  $('#proName').innerHTML = `${d[0]} <span class="en">${d[1]}</span>`;
  $('#proOne').textContent = d[2];
  $('#proDoes').textContent = `${d[2]} 这是专业模式里的快速解释，后续可以继续展开完整文献和脑区清单。`;
  $('#proAnatomy').textContent = d[3];
  $('#proFunction').textContent = d[4];
  $('#proStageTitle').textContent = `${d[0]}在脑内的分布`;
  notify(`已切换到${d[0]}`);
}));

function bindStageControls() {
  $$('[data-stage-view]').forEach(button => button.addEventListener('click', () => {
    const stage = button.closest('.stage-wrap')?.querySelector('.stage-host');
    stage?.__stage?.setView(button.dataset.stageView);
    button.parentElement.querySelectorAll('button').forEach(el => el.classList.toggle('on', el === button));
  }));
  $$('[data-stage-reset]').forEach(button => button.addEventListener('click', () => {
    button.closest('.stage-wrap')?.querySelector('.stage-host')?.__stage?.reset();
    notify('视角已重置');
  }));
}
bindStageControls();

showRoute(location.hash.slice(1) || 'learn');
