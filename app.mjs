import './brain-view.mjs';
import { localize, localized } from './i18n.mjs';

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
  const progress = route === 'pro' ? localized('学习路线 16 / 16 ✓ · 专业条目 18 / 62', 'Learning path 16 / 16 ✓ · Pro entries 18 / 62') : route === 'quiz' ? localized('学习进度 12 / 16 个核心概念', 'Learning progress 12 / 16 core concepts') : route === 'deep' ? localized('学习进度 10 / 16 个核心概念', 'Learning progress 10 / 16 core concepts') : localized('学习进度 3 / 16 个核心概念', 'Learning progress 3 / 16 core concepts');
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
  { name: '额叶', en: 'Frontal Lobe', one: '大脑最前方的计划与行动中枢。', oneEn: 'The planning and action centre at the front of the brain.', where: '额头后方，大脑前部的位置，左右各一个。', whereEn: 'Behind the forehead, at the front of the brain, one on each side.', does: '帮助你计划、做决定、控制冲动，也参与主动运动。', doesEn: 'Helps you plan, make decisions, control impulses and initiate movement.', example: '写作业时安排先后顺序、忍住先玩手机的冲动。', exampleEn: 'Planning the order of your homework and resisting the urge to check your phone first.' },
  { name: '顶叶', en: 'Parietal Lobe', one: '把身体感觉和空间位置拼成一张地图。', oneEn: 'Builds a map from body sensations and spatial position.', where: '位于额叶后方、枕叶前方，靠近头顶。', whereEn: 'Behind the frontal lobe and in front of the occipital lobe, near the top of the head.', does: '处理触觉、身体位置和空间关系，让你知道“我在哪里”。', doesEn: 'Processes touch, body position and spatial relations so you know where you are.', example: '闭着眼也能摸到口袋里的钥匙，靠的是顶叶的空间地图。', exampleEn: 'Finding the keys in your pocket with your eyes closed uses the parietal spatial map.' },
  { name: '颞叶', en: 'Temporal Lobe', one: '耳朵上方的大脑「侧面」，主要负责听懂世界。', oneEn: 'The side of the brain above the ears, central to understanding the world through sound.', where: '耳朵的正上方和前方，大脑两侧靠下的位置，左右各一个。', whereEn: 'Above and slightly in front of the ears, low on both sides of the brain.', does: '处理声音和语言，帮你听懂别人说什么、认出熟悉的旋律；内侧深处还藏着与记忆有关的结构。', doesEn: 'Processes sound and language, helping you understand speech and recognise familiar melodies; memory structures lie deeper on its inner surface.', example: '朋友在人群里喊你的名字，你立刻回头，这一瞬间就是颞叶在工作。', exampleEn: 'When a friend calls your name in a crowd and you turn around, your temporal lobe is at work.' },
  { name: '枕叶', en: 'Occipital Lobe', one: '把眼睛收到的光线变成你看见的世界。', oneEn: 'Turns the light received by your eyes into the world you see.', where: '大脑最后方，靠近后脑勺的位置。', whereEn: 'At the back of the brain, near the back of the head.', does: '处理颜色、边缘、形状和运动等视觉信息。', doesEn: 'Processes visual information such as colour, edges, shape and motion.', example: '看见红绿灯变绿并认出它是“可以通行”的信号。', exampleEn: 'Seeing a traffic light turn green and recognising that it means you may go.' },
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
function answerQuizLocalized(answer) {
  quizAnswer = answer;
  const correct = answer === 'C';
  $$('#quizRoute [data-answer]').forEach(el => el.classList.toggle('selected', el.dataset.answer === answer));
  const feedback = $('#quizFeedback');
  feedback.hidden = false;
  feedback.classList.toggle('bad', !correct);
  $('#quizFeedbackTitle').textContent = localized(correct ? '答对了！' : '先别急，再想一想。', correct ? 'Correct!' : 'Not quite yet.');
  $('#quizFeedbackText').textContent = localized(correct ? '海马体像“保存键”，在睡眠中把白天的经历巩固成长期记忆。' : '提示：额叶管计划、杏仁核管情绪、小脑管协调。负责把新经历写进长期记忆的是海马体。', correct ? 'The hippocampus is like a save button: during sleep it consolidates the day’s experiences into long-term memories.' : 'Hint: the frontal lobe plans, the amygdala handles emotional alarms and the cerebellum coordinates movement. The hippocampus writes new experiences into long-term memory.');
  $('#quizMeta').textContent = localized('1 / 3 · ' + (correct ? '已答对' : '已作答'), '1 / 3 · ' + (correct ? 'Correct' : 'Answered'));
  $('#quizHudAnswer').textContent = localized(correct ? 'C · 海马体 ✓' : answer + ' · 再观察一下结构的位置', correct ? 'C · Hippocampus ✓' : answer + ' · Look again at the structure’s location');
  notify(localized(correct ? '答对了，海马体已点亮' : '答案已记录，看看提示再试一次', correct ? 'Correct, the hippocampus is lit' : 'Answer recorded. Check the hint and try again'));
}
$$('[data-answer]').forEach(el => el.addEventListener('click', () => answerQuizLocalized(el.dataset.answer)));
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

$('#quiz-stage').addEventListener('brain-pin', event => answerQuizLocalized(event.detail.k));

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
  localize($('#proOne'), d[2], networkEnglish[item.dataset.network][1]);
  $('#proDoes').textContent = `${d[2]} 这是专业模式里的快速解释，后续可以继续展开完整文献和脑区清单。`;
  localize($('#proAnatomy'), d[3], networkEnglish[item.dataset.network][2]);
  localize($('#proFunction'), d[4], networkEnglish[item.dataset.network][3]);
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

const networkEnglish = {
  visual: ['Visual Network', 'Processes visual information from the occipital lobe to higher visual areas.', 'Occipital lobe and posterior temporal lobe', 'Visual processing'],
  somato: ['Somatomotor Network', 'Keeps body sensation and voluntary movement in real-time contact.', 'Precentral and postcentral gyri', 'Action and body sensation'],
  dorsal: ['Dorsal Attention Network', 'Helps direct attention to a chosen target.', 'Parietal lobe and frontal eye fields', 'Goal-directed attention'],
  ventral: ['Ventral Attention Network', 'Pulls attention toward important new stimuli in the environment.', 'Temporoparietal junction and inferior frontal gyrus', 'Stimulus-driven attention'],
  limbic: ['Limbic Network', 'Supports memory, value and emotion; the hippocampus is an important node.', 'Medial temporal and orbitofrontal regions', 'Memory and emotion'],
  fronto: ['Frontoparietal Network', 'Coordinates rules, working memory and decisions during complex tasks.', 'Lateral frontal and parietal regions', 'Cognitive control'],
  default: ['Default Mode Network', 'The brain’s “daydream network”, more active when attention turns inward.', 'Medial parietal, medial prefrontal and medial temporoparietal regions', 'Internal thought and self-related processing'],
};

function refreshDynamicLanguage() {
  const d = lobeData[lobeIndex];
  localize($('#learnName'), d.name + ' <span class="en">' + d.en + '</span>', d.en, d.name + ' <span class="en">' + d.en + '</span>');
  localize($('#learnOne'), d.one, d.oneEn);
  localize($('#learnWhere'), d.where, d.whereEn);
  localize($('#learnDoes'), d.does, d.doesEn);
  localize($('#learnExample'), d.example, d.exampleEn);
  $('#learnStageTitle').textContent = localized(d.name + '在哪里？', 'Where is the ' + d.en.replace(' Lobe', '').toLowerCase() + '?');
  $('#learnStatus').textContent = lobeIndex === 3 ? localized('四个脑叶都认完了，可以进入章节小测。', 'All four lobes are familiar now. You can start the chapter quiz.') : localized('已定位到' + d.name + '，下一步把“在哪里”与“做什么”连起来。', 'Located ' + d.en + '. Next, connect where it is with what it does.');
  const selected = document.querySelector('[data-network].on');
  const network = selected && networkData[selected.dataset.network];
  if (network) {
    const en = networkEnglish[selected.dataset.network];
    $('#proName').innerHTML = localized(network[0], en[0]) + (getLanguage() === 'bi' ? '' : '');
    localize($('#proOne'), network[2], en[1]);
    localize($('#proDoes'), network[2] + ' 这是专业模式里的快速解释，后续可以继续展开完整文献和脑区清单。', en[1] + ' This is a quick explanation in Pro mode; the full evidence and region list can be expanded later.');
    localize($('#proAnatomy'), network[3], en[2]);
    localize($('#proFunction'), network[4], en[3]);
    $('#proStageTitle').textContent = localized(network[0] + '在脑内的分布', 'Distribution of ' + en[0]);
  }
  showRoute(location.hash.slice(1) || 'learn');
}

window.addEventListener('neuro-language', refreshDynamicLanguage);
window.addEventListener('neuro-language', () => {
  const key = document.querySelector('[data-network].on')?.dataset.network ?? 'default';
  const network = networkData[key];
  const en = networkEnglish[key];
  if (!network || !en) return;
  localize($('#proOne'), network[2], en[1]);
  localize($('#proDoes'), network[2] + ' 这是专业模式里的快速解释，后续可以继续展开完整文献和脑区清单。', en[1] + ' This is a quick explanation in Pro mode; the full evidence and region list can be expanded later.');
  localize($('#proAnatomy'), network[3], en[2]);
  localize($('#proFunction'), network[4], en[3]);
});
window.addEventListener('neuro-language', event => {
  const route = location.hash.slice(1) || 'learn';
  const progress = route === 'pro' ? ['学习路线 16 / 16 ✓ · 专业条目 18 / 62', 'Learning path 16 / 16 ✓ · Pro entries 18 / 62'] : route === 'quiz' ? ['学习进度 12 / 16 个核心概念', 'Learning progress 12 / 16 core concepts'] : route === 'deep' ? ['学习进度 10 / 16 个核心概念', 'Learning progress 10 / 16 core concepts'] : ['学习进度 3 / 16 个核心概念', 'Learning progress 3 / 16 core concepts'];
  $('#progressText').textContent = event.detail === 'en' ? progress[1] : event.detail === 'bi' ? progress[0] + ' / ' + progress[1] : progress[0];
});
showRoute(location.hash.slice(1) || 'learn');
