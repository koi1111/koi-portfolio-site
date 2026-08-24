const $ = (selector) => document.querySelector(selector);

const steps = [
  ['DISCOVER', '发现岗位'],
  ['ANALYZE', '理解 JD'],
  ['REVIEW', '人工确认'],
  ['ACT', '模拟执行']
];

const jobs = [
  {id:'northstar',company:'北辰零售科技',title:'AI 产品经理｜企业智能',location:'上海 · 25–35K',score:86,confidence:'High',summary:'负责企业 AI 产品从业务发现、Workflow 设计到上线评估，强调治理与跨部门落地。',evidence:['需要业务流程重构经验','要求 AI Workflow 与评估体系','零售或企业软件经验加分'],risk:'岗位要求 3 年以上独立平台经验；需要在面试中说明项目成熟度边界。'},
  {id:'morrow',company:'远景消费品牌',title:'商品数字化产品经理',location:'杭州 · 22–32K',score:78,confidence:'Medium',summary:'连接商品企划、供应链和经营数据，推进规划系统与智能分析能力。',evidence:['商品企划与 OTB 经验匹配','需要跨数据与业务协作','AI 为辅助能力而非岗位主体'],risk:'AI 产品比重不明确，需要先确认团队是否有真实模型与工程资源。'},
  {id:'loom',company:'织点企业服务',title:'Agent 产品经理',location:'远程 · 28–38K',score:72,confidence:'Medium',summary:'设计多 Agent 协作工具，负责产品策略、提示词、工具调用与效果评测。',evidence:['Agent Workflow 经验匹配','重视可观测与人工闸门','需要高频面向开发者用户'],risk:'偏通用开发者工具，与零售业务优势连接较弱。'}
];

let stage = 0;
let selectedId = null;
let accepted = false;
let events = [['Workflow 初始化','现在 · SIM-RUN-0821']];
let toastTimer;

function selectedJob(){return jobs.find(job=>job.id===selectedId)||jobs[0]}
function now(){return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
function addEvent(title,detail){events.unshift([title,now()+' · '+detail]);events=events.slice(0,6)}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}

function renderProgress(){
  $('#workflowProgress').innerHTML=steps.map((item,index)=>{
    const cls=index<stage?'done':index===stage?'active':'';
    return `<div class="progress-step ${cls}"><i>${index<stage?'✓':String(index+1).padStart(2,'0')}</i><span><b>${item[0]}</b><small>${item[1]}</small></span></div>`;
  }).join('');
}

function renderSetup(){
  return `<div class="panel-head"><div><span class="eyebrow">SEARCH CONFIG</span><h2>先定义什么机会值得被发现</h2><p>职业画像与搜索条件是本次 Agent Run 的受控输入。</p></div><span class="tag">STEP 01</span></div>
  <div class="config-grid">
    <label class="field"><span>目标岗位</span><input value="AI 产品经理 / 业务 AI"></label>
    <label class="field"><span>工作城市</span><select><option>上海 / 杭州 / 远程</option><option>上海</option></select></label>
    <label class="field"><span>优先方向</span><select><option>企业 AI · 零售数字化</option><option>Agent 产品</option></select></label>
    <label class="field"><span>最低匹配门槛</span><select><option>70 分以上</option><option>80 分以上</option></select></label>
    <label class="field wide"><span>职业画像摘要</span><textarea>商品业务、数据治理、流程产品与 AI Workflow；重视真实落地、人工闸门、可观测和结果验证。</textarea></label>
  </div>
  <div class="profile-snapshot"><div><span>核心优势</span><b>业务 × 数据 × AI</b></div><div><span>代表证据</span><b>权限治理 / CTC / Career Agent</b></div><div><span>排除条件</span><b>纯销售岗 · 无真实业务场景</b></div></div>`;
}

function renderJobs(){
  return `<div class="panel-head"><div><span class="eyebrow">3 JOBS DISCOVERED</span><h2>Agent 找到三个候选机会</h2><p>先选择岗位，再让 AI 阅读完整 JD 并给出可核查的匹配依据。</p></div><span class="tag">虚构岗位</span></div>
  <div class="job-list">${jobs.map(job=>`<button class="job-card ${selectedId===job.id?'selected':''}" data-job="${job.id}"><div><span>${job.company.toUpperCase()}</span><h3>${job.title}</h3><p>${job.location} · 来源页面已保存为模拟证据</p></div><em>${job.score}</em></button>`).join('')}</div>`;
}

function renderAnalysis(review=false){
  const job=selectedJob();
  return `<div class="analysis-hero"><div><span class="eyebrow">${review?'HUMAN REVIEW':'AI ANALYSIS'}</span><h2>${job.title}</h2><p>${job.company} · ${job.location}</p></div><div class="score-ring" style="--score:${job.score}"><b>${job.score}</b><span>MATCH</span></div></div>
  <div class="evidence-grid"><article class="evidence-card"><span>EVIDENCE</span><h3>${job.summary}</h3><p>${job.evidence.join('；')}。</p></article><article class="evidence-card risk"><span>RISK / MISSING</span><h3>需要人工判断的边界</h3><p>${job.risk}</p></article></div>
  <div class="confidence"><span class="${job.confidence.toLowerCase()}">${job.confidence} confidence</span><span>来源：模拟完整 JD</span><span>分析版本：career-fit-v3</span></div>
  ${review?`<div class="draft-message"><label>AI 生成的沟通草稿 · 可编辑</label><textarea id="messageDraft">您好，我关注到贵司正在招聘${job.title}。我有商品业务、数据治理与 AI Workflow 的实际项目经验，尤其重视把 AI 放进可审计、有人审的真实流程。希望进一步了解团队当前最需要解决的业务问题。</textarea></div><label class="review-check"><input id="reviewConfirm" type="checkbox" ${accepted?'checked':''}><span>我已查看岗位来源、匹配依据、风险和沟通内容；确认后只执行模拟沟通。</span></label>`:''}`;
}

function renderSuccess(){
  const job=selectedJob();
  return `<div class="success"><div><i>✓</i><h2>模拟沟通已完成</h2><p>${job.company} · ${job.title}<br>真实产品会在人工确认后调用浏览器执行；本 Demo 没有连接招聘平台。</p><div class="result-log"><div><span>人工决策</span><b>已确认岗位与沟通草稿</b></div><div><span>执行结果</span><b>SIMULATED / NO MESSAGE SENT</b></div><div><span>审计编号</span><b>SIM-RUN-0821-ACT-01</b></div></div></div></div>`;
}

function renderWork(){
  const area=$('#workArea');
  if(stage===0) area.innerHTML=renderSetup();
  else if(stage===1) area.innerHTML=renderJobs();
  else if(stage===2) area.innerHTML=renderAnalysis(false);
  else if(stage===3) area.innerHTML=renderAnalysis(true);
  else area.innerHTML=renderSuccess();
}

function sideAction(){
  if(stage===0)return['运行岗位发现','discover','读取模拟岗位页面并建立候选列表'];
  if(stage===1)return['分析所选 JD','analyze',selectedId?'读取完整 JD 并生成依据':'请先选择一个候选岗位'];
  if(stage===2)return['进入人工确认','review','先看证据、风险与置信等级'];
  if(stage===3)return['确认并模拟沟通','act','不会发送真实消息'];
  return['重新运行','reset','回到职业画像与搜索配置'];
}

function renderSide(){
  const action=sideAction(),job=selectedId?selectedJob():null;
  $('#decisionPanel').innerHTML=`<div class="side-title"><span>HUMAN CONTROL</span><h3>${stage<3?'下一步由你决定':'发送前人工闸门'}</h3><p>AI 输出是建议，不是职业事实。</p></div>
  <div class="side-section"><span>CURRENT RUN</span><div><span>状态</span><b>${steps[Math.min(stage,3)][1]}</b></div><div><span>候选岗位</span><b>${stage?jobs.length:'尚未搜索'}</b></div><div><span>当前选择</span><b>${job?job.company:'—'}</b></div></div>
  <button class="primary" data-action="${action[1]}" ${stage===1&&!selectedId?'disabled':''}>${action[0]}</button><p class="action-help">${action[2]}</p>
  <div class="side-section"><span>RECENT ACTIVITY</span><div class="audit-list">${events.slice(0,4).map(event=>`<div><b>${event[0]}</b><small>${event[1]}</small></div>`).join('')}</div></div>
  <div class="run-meta"><span>RUN SIM-RUN-0821</span><span>WORKFLOW career-agent-v3</span><span>MODEL simulated-analysis</span><span>OUTBOUND disabled</span></div>`;
}

function render(){renderProgress();renderWork();renderSide()}
function reset(){stage=0;selectedId=null;accepted=false;events=[['Workflow 已重置',now()+' · 回到搜索配置']];render();toast('已回到搜索配置')}

document.addEventListener('click',event=>{
  const jobButton=event.target.closest('[data-job]');
  if(jobButton){selectedId=jobButton.dataset.job;addEvent('已选择候选岗位',selectedJob().company);render();return}
  const view=event.target.closest('[data-view]');
  if(view){
    document.querySelectorAll('[data-view]').forEach(button=>button.classList.toggle('active',button===view));
    if(view.dataset.view==='workflow'){render();return}
    if(view.dataset.view==='profile'){$('#workArea').innerHTML=renderSetup();$('#decisionPanel').innerHTML='<div class="side-title"><span>PROFILE</span><h3>本次 Run 的职业画像</h3><p>画像仅用于当前模拟，不上传、不发送。</p></div>';return}
    $('#workArea').innerHTML=`<div class="panel-head"><div><span class="eyebrow">AUDIT LOG</span><h2>每一步都有状态和人工决策</h2><p>记录决策变量与工具事件，不展示隐藏推理。</p></div></div><div class="log-table">${events.map((item,index)=>`<div class="log-row"><span>${String(index+1).padStart(2,'0')} / EVENT</span><b>${item[0]}</b><span>${item[1]}</span></div>`).join('')}</div>`;$('#decisionPanel').innerHTML='<div class="side-title"><span>OBSERVABILITY</span><h3>可追踪，不泄露隐私</h3><p>真实系统不会在日志中记录 API Key 或浏览器凭证。</p></div>';return
  }
  const action=event.target.closest('[data-action]');if(!action)return;
  if(action.dataset.action==='reset'){reset();return}
  if(action.dataset.action==='discover'){stage=1;addEvent('岗位发现完成','读取 3 个模拟来源页面');toast('发现 3 个候选岗位');render()}
  else if(action.dataset.action==='analyze'){if(!selectedId)return;stage=2;addEvent('JD 分析完成',selectedJob().company+' · '+selectedJob().score+' 分');toast('分析完成，请查看依据与风险');render()}
  else if(action.dataset.action==='review'){stage=3;addEvent('进入人工确认','沟通草稿已生成');toast('请检查并编辑沟通草稿');render()}
  else if(action.dataset.action==='act'){
    const checkbox=$('#reviewConfirm');if(!checkbox||!checkbox.checked){toast('请先确认你已查看依据与沟通内容');return}
    stage=4;addEvent('人工确认通过','模拟沟通完成 · 未发送真实消息');toast('模拟执行完成');render()
  }
});

document.addEventListener('change',event=>{if(event.target.id==='reviewConfirm')accepted=event.target.checked});
render();
