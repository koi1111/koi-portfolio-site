const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const flowSteps = [
  ['统一提单', '选择商品或批量上传'],
  ['字段校验', '检查门店与商品主数据'],
  ['拆单分析', '生成仓库与供应商建议'],
  ['人工复核', '处理异常并确认归属'],
  ['审批下发', '批准后生成履约订单'],
  ['履约跟踪', '发货、签收与对账']
];

const catalog = [
  { id:'mirror', name:'全身试衣镜', spec:'160 × 50 cm / 黑色窄边', price:340, qty:26, stores:4 },
  { id:'tools', name:'陈列工具套装', spec:'门店基础工具 / 12 件', price:105, qty:58, stores:5 },
  { id:'paper', name:'热敏标签打印纸', spec:'50 × 30 mm / 800 张', price:30, qty:420, stores:5 },
  { id:'hanger', name:'防滑衣架', spec:'成人款 / 50 支每箱', price:96, qty:760, stores:5 }
];

const runs = [];
let state = 'draft';
let inputMode = 'upload';
let activeRun = null;
let toastTimer;
const stateIndex = { draft:0, validated:1, analyzing:2, review:3, approval:4, orders:5, completed:5, logs:2 };

function money(n){ return '¥' + n.toLocaleString('zh-CN'); }
function totalAmount(){ return catalog.reduce((s,x)=>s+x.qty*x.price,0); }
function now(){ return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
function showToast(text){ const el=$('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }

function renderFlow(){
  const active=stateIndex[state];
  $('#flowTrack').innerHTML=flowSteps.map((step,i)=>`<div class="flow-step ${i<active?'done':i===active?'active':''}"><i>${i<active?'✓':i+1}</i><span>${step[0]}</span><small>${step[1]}</small></div>`).join('');
}

function summarySide(title,action,label,help){
  return `<aside class="panel panel-side"><div class="side-head"><span>采购单 BF-260824</span><h3>${title}</h3><p>5 家门店 / 1,264 件 / 4 个商品</p></div><dl><div><dt>申请金额</dt><dd>${money(totalAmount())}</dd></div><div><dt>预计履约单</dt><dd>${activeRun?activeRun.orders:4} 张</dd></div><div><dt>需人工复核</dt><dd>${activeRun?activeRun.exceptions:2} 项</dd></div></dl><button class="primary" data-action="${action}">${label}</button><p class="action-help">${help}</p><button class="secondary" data-nav="logs">查看全部运行记录</button></aside>`;
}

function renderDraft(){
  const rows=catalog.map(x=>`<tr><td><b>${x.name}</b><small>${x.spec}</small></td><td>${x.stores} 家</td><td>${x.qty.toLocaleString('zh-CN')}</td><td>${money(x.price)}</td><td>${money(x.qty*x.price)}</td></tr>`).join('');
  return `<section class="panel panel-main"><div class="stage-title"><div><h1>填写同一张采购单</h1><p>所有行政采购使用同一入口。少量商品直接选择，多门店大批量需求可上传明细。</p></div><span class="status-pill">草稿</span></div><div class="mode-switch"><button data-mode="catalog" class="${inputMode==='catalog'?'active':''}">从商品目录选择</button><button data-mode="upload" class="${inputMode==='upload'?'active':''}">批量上传明细</button></div>${inputMode==='upload'?`<div class="upload-box"><div><b>门店行政采购_0824.xlsx</b><span>已解析 1,264 行，覆盖 5 家门店与 4 个商品</span></div><button data-action="replace-file">重新选择</button></div><div class="validation-strip"><span>必填字段 8/8</span><span>门店编码 5/5</span><span>商品编码 4/4</span><span>重复行 0</span></div>`:`<div class="catalog-pick"><b>商品目录</b><p>演示已选择 4 个商品，可继续调整数量。</p></div>`}<div class="table-head"><h2>采购明细预览</h2><span>仅展示合并结果，原始行保留追溯</span></div><div class="table-wrap"><table><thead><tr><th>商品</th><th>门店覆盖</th><th>数量</th><th>参考单价</th><th>小计</th></tr></thead><tbody>${rows}</tbody></table></div></section>${summarySide('等待提交','validate','提交并校验','先完成确定性字段校验，再进入拆单分析。')}`;
}

function createRun(){
  const id='RUN-260824-'+String(runs.length+1).padStart(3,'0');
  const run={id,time:now(),status:'运行中',model:'ModelVerse / 通用推理模型',prompt:'PROC-SPLIT v1.4',workflow:'WF-PROC-06',orders:4,exceptions:2,confidence:'中',duration:'8.6s',tokens:'6,842',cost:'¥0.18'};
  runs.unshift(run); activeRun=run; $('#analysisBadge').textContent=runs.length;
}

function renderValidated(){
  return `<section class="panel panel-main"><div class="stage-title"><div><h1>字段校验通过</h1><p>采购明细已冻结为输入快照。仓库库存、供应商目录和门店地址已完成关联。</p></div><span class="status-pill green">可分析</span></div><div class="check-grid"><article><b>1,264</b><span>有效明细行</span><small>空值 0 / 重复 0</small></article><article><b>5</b><span>有效门店</span><small>地址与编码完整</small></article><article><b>4</b><span>商品主数据</span><small>均可关联履约来源</small></article><article><b>2</b><span>需语义判断</span><small>存在混合履约可能</small></article></div><div class="boundary-note"><b>进入 AI 前的数据边界</b><p>模型只接收脱敏后的商品描述、需求数量与候选履约来源。金额计算、库存扣减和审批权限由系统规则执行。</p></div></section>${summarySide('可以开始分析','run-ai','运行智能拆单','运行会生成新的记录，结果不会自动下发。')}`;
}

function renderAnalyzing(){
  return `<section class="panel panel-main"><div class="stage-title"><div><h1>正在生成拆单建议</h1><p>${activeRun.id} 正在处理冻结后的采购快照。</p></div><span class="status-pill amber">运行中</span></div><div class="analysis-progress"><div class="analysis-steps"><article class="done"><i>✓</i><div><b>载入受控上下文</b><span>仓库库存、供应商商品目录、门店需求</span></div></article><article class="done"><i>✓</i><div><b>规则先行校验</b><span>锁定可用库存与禁止采购项</span></div></article><article class="active"><i>3</i><div><b>模型生成归类建议</b><span>识别同品多源与跨门店合并机会</span></div></article><article><i>4</i><div><b>输出结构校验</b><span>金额、数量与原申请必须守恒</span></div></article></div><pre class="live-log">[${activeRun.time}] 输入快照已锁定\n[规则] 仓库可发 732 件，供应商候选 2 家\n[模型] 正在归类 2 个混合履约商品\n[等待] 输出结构与总量校验</pre></div></section>${summarySide('分析运行中','noop','正在分析','此演示会在短暂延迟后生成结果。')}`;
}

function fulfillmentCards(){
  const cards=[['中心仓发货','WH-01','732 件','5 家门店','标签纸 420 件 / 衣架 300 件 / 试衣镜 12 件','高','库存快照与门店需求均完整'],['晨川办公用品','PO-A','312 件','5 家门店','工具套装 58 件 / 衣架 254 件','高','目录匹配且交期满足'],['远桥商业物资','PO-B','208 件','4 家门店','衣架 206 件 / 试衣镜 2 件','中','试衣镜需确认包装与配送限制'],['远桥商业物资','PO-C','12 件','2 家门店','试衣镜 12 件','中','跨区直送节省中转，但运费待确认']];
  return `<div class="fulfillment-grid">${cards.map((x,i)=>`<article class="fulfillment-card"><header><div><span>${x[1]}</span><b>${x[0]}</b></div><em class="confidence ${x[5]==='中'?'medium':''}">${x[5]}置信</em></header><strong>${x[2]}</strong><small>${x[3]}</small><p>${x[4]}</p><footer><span>判断依据</span><b>${x[6]}</b></footer>${i>1?`<button data-action="mark-reviewed" data-card="${i}">标记已复核</button>`:''}</article>`).join('')}</div>`;
}

function renderReview(){
  return `<section class="panel panel-main wide"><div class="stage-title"><div><h1>复核拆单建议</h1><p>AI 建议与最终决定分别留存。先处理异常，再提交下发审批。</p></div><button class="text-button" data-action="open-log" data-run="${activeRun.id}">查看 ${activeRun.id} 运行依据</button></div><div class="split-summary"><div><b>1,264</b><span>原始需求</span></div><i>=</i><div><b>732</b><span>仓库发货</span></div><i>+</i><div><b>532</b><span>供应商采购</span></div><strong>数量守恒 ✓</strong></div><div class="review-alert"><div><b>2 项需要人工确认</b><span>涉及跨区运费与易碎品配送，不会自动下发。</span></div><button data-action="review-all">逐项确认</button></div>${fulfillmentCards()}</section>${summarySide('等待人工复核','submit-approval','提交下发审批','确认后保留 AI 原建议和人工最终版本。')}`;
}

function renderApproval(){
  return `<section class="panel panel-main"><div class="stage-title"><div><h1>等待下发审批</h1><p>审批人看到原始申请、拆单建议、人工调整和异常处理记录。</p></div><span class="status-pill amber">待审批</span></div><div class="approval-card"><div><b>采购执行单 BF-260824</b><span>仓库发货 1 张 / 供应商采购 3 张</span></div><dl><div><dt>原需求数量</dt><dd>1,264 件</dd></div><div><dt>最终拆单数量</dt><dd>1,264 件</dd></div><div><dt>人工调整</dt><dd>2 项已复核</dd></div><div><dt>外部动作</dt><dd>审批通过后生成订单</dd></div></dl></div></section>${summarySide('等待审批','approve','模拟审批通过','批准后才生成仓库任务和供应商订单。')}`;
}

function renderOrders(){
  return `<section class="panel panel-main wide"><div class="stage-title"><div><h1>履约订单已生成</h1><p>仓库与供应商只处理各自订单，门店仍可从原采购单追踪全部到货。</p></div><span class="status-pill green">已下发</span></div><div class="order-table"><div class="order-row head"><span>履约单</span><span>来源</span><span>数量</span><span>覆盖门店</span><span>状态</span></div>${[['WH-01','中心仓','732','5','拣货中'],['PO-A','晨川办公用品','312','5','已接单'],['PO-B','远桥商业物资','208','4','待接单'],['PO-C','远桥商业物资','12','2','待确认运费']].map(x=>`<div class="order-row"><b>${x[0]}</b><span>${x[1]}</span><span>${x[2]} 件</span><span>${x[3]} 家</span><em>${x[4]}</em></div>`).join('')}</div><div class="lineage"><b>追溯关系</b><span>原采购单 BF-260824</span><i>→</i><span>分析运行 ${activeRun.id}</span><i>→</i><span>人工复核版本 V2</span><i>→</i><span>4 张履约单</span></div></section>${summarySide('订单已下发','complete','模拟完成履约','后续物流、签收与对账继续回写原采购单。')}`;
}

function renderCompleted(){
  return `<section class="panel panel-main"><div class="complete"><i>✓</i><h1>采购履约闭环</h1><p>5 家门店的需求已完成拆单、审批、发货与签收。AI 建议、人工修改和最终订单均可追溯。</p><div><span><b>1,264</b>件已签收</span><span><b>4</b>张履约单</span><span><b>0</b>数量差异</span></div></div></section>${summarySide('演示完成','reset','重新走一遍','所有内容均为虚构演示数据。')}`;
}

function runDetail(run){
  return `<div class="run-meta"><div><span>运行编号</span><b>${run.id}</b></div><div><span>模型</span><b>${run.model}</b></div><div><span>Prompt / Workflow</span><b>${run.prompt} / ${run.workflow}</b></div><div><span>状态</span><b>${run.status}</b></div></div><section class="trace-block"><h3>输入与来源</h3><ul><li>采购快照 BF-260824-V1：1,264 行，5 家门店，4 个商品</li><li>中心仓库存快照：2026-08-24 16:40</li><li>供应商商品目录：SUP-CAT-20260823</li><li>门店地址与配送限制：STORE-MASTER-V7</li></ul></section><section class="trace-block"><h3>判断变量与采用规则</h3><div class="decision-list"><div><b>仓库库存优先</b><span>可用库存满足且配送时效合格时，先生成仓库任务。</span></div><div><b>供应商归类</b><span>按商品目录匹配、区域覆盖、交期和最小起订量形成候选。</span></div><div><b>混合履约</b><span>单一来源不足时拆分数量，原需求总量必须守恒。</span></div><div><b>人工升级</b><span>运费未知、易碎配送或来源冲突时进入人工复核。</span></div></div></section><section class="trace-block"><h3>结构化输出</h3><pre>仓库发货 732 件\n供应商采购 532 件\n生成履约建议 4 张\n异常 2 项\n总量校验 1264 = 732 + 532，通过</pre></section><section class="trace-block"><h3>运行与治理</h3><div class="run-stats"><span>总体置信：${run.confidence}</span><span>耗时：${run.duration}</span><span>Token：${run.tokens}</span><span>模拟成本：${run.cost}</span></div><p>置信等级依据数据完整性、来源一致性、规则确定性与模型输出稳定性综合判断。所有外部下发均需人工审批。</p></section>`;
}

function renderLogs(){
  const list=runs.length?runs.map(r=>`<button class="run-row" data-action="open-log" data-run="${r.id}"><div><b>${r.id}</b><span>${r.time} / ${r.prompt}</span></div><span>${r.orders} 张建议单</span><em>${r.exceptions} 项复核</em><strong>${r.status}</strong></button>`).join(''):`<div class="empty-state"><b>还没有运行记录</b><p>提交采购单并运行智能拆单后，每次分析都会在这里单独留档。</p><button class="primary" data-nav="draft">去填写采购单</button></div>`;
  return `<section class="panel panel-main wide"><div class="stage-title"><div><h1>分析运行记录</h1><p>按运行编号追溯输入快照、模型与 Prompt 版本、判断依据、异常和最终处置。</p></div><span class="status-pill">${runs.length} 次运行</span></div><div class="model-console"><div><span>当前模型</span><b>ModelVerse / 通用推理模型</b></div><div><span>Prompt 版本</span><b>PROC-SPLIT v1.4</b></div><div><span>低置信处理</span><b>强制人工复核</b></div><div><span>执行权限</span><b>仅建议，不可自动下发</b></div></div><div class="run-list">${list}</div></section>`;
}

function render(){
  renderFlow();
  const map={draft:renderDraft,validated:renderValidated,analyzing:renderAnalyzing,review:renderReview,approval:renderApproval,orders:renderOrders,completed:renderCompleted,logs:renderLogs};
  $('#stageMount').innerHTML=(map[state]||renderDraft)();
  const labels={draft:'统一采购单',validated:'字段校验',analyzing:'拆单分析',review:'人工复核',approval:'审批下发',orders:'履约订单',completed:'履约完成',logs:'运行记录'};
  $('#crumb').textContent=labels[state];
  $$('[data-nav]').forEach(b=>{const n=b.dataset.nav;b.classList.toggle('active',n==='draft'&&state==='draft'||n==='analysis'&&['validated','analyzing','review','approval'].includes(state)||n==='orders'&&['orders','completed'].includes(state)||n==='logs'&&state==='logs')});
}

function reset(){ state='draft'; inputMode='upload'; activeRun=null; runs.length=0; $('#analysisBadge').textContent='0'; render(); showToast('演示已重置'); }

document.addEventListener('click',event=>{
  const mode=event.target.closest('[data-mode]'); if(mode){ inputMode=mode.dataset.mode; render(); return; }
  const nav=event.target.closest('[data-nav]'); if(nav){ const n=nav.dataset.nav; if(n==='draft')state='draft'; else if(n==='analysis')state=activeRun?'review':'validated'; else if(n==='orders')state=activeRun?'orders':'draft'; else if(n==='logs')state='logs'; render(); return; }
  const button=event.target.closest('[data-action]'); if(!button)return;
  const action=button.dataset.action;
  if(action==='validate'){state='validated';showToast('1,264 行明细校验通过');render()}
  else if(action==='run-ai'){createRun();state='analyzing';render();setTimeout(()=>{if(!activeRun)return;activeRun.status='待复核';if(state==='analyzing'){state='review';render();showToast('拆单建议已生成，2 项需复核')}},1200)}
  else if(action==='review-all'||action==='mark-reviewed'){showToast('异常已标记为人工复核');button.textContent='已复核 ✓';button.disabled=true}
  else if(action==='submit-approval'){state='approval';showToast('最终拆单已提交审批');render()}
  else if(action==='approve'){activeRun.status='已批准';state='orders';showToast('审批通过，4 张履约单已生成');render()}
  else if(action==='complete'){state='completed';render()}
  else if(action==='reset'){reset()}
  else if(action==='replace-file'){showToast('演示版保留当前模拟文件')}
  else if(action==='open-log'){const run=runs.find(r=>r.id===button.dataset.run)||activeRun;if(!run)return;$('#runDetail').innerHTML=runDetail(run);$('#logLayer').classList.add('open');$('#logLayer').setAttribute('aria-hidden','false')}
  else if(action==='close-log'){closeLog()}
});

function closeLog(){ $('#logLayer').classList.remove('open'); $('#logLayer').setAttribute('aria-hidden','true'); }
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLog()});
render();
