const $=s=>document.querySelector(s),fmt=n=>Number(n).toLocaleString('zh-CN'),money=n=>fmt(n),pill=(t,c='')=>`<span class="pill ${c}">${t}</span>`;
const demo=document.body.dataset.demo;
if(demo==='ctc')initCtc();if(demo==='permission')initPermission();if(demo==='otb')initOtb();if(demo==='gap-radar')initGapRadar();if(demo==='buyflow')initBuyflow();

function initCtc(){
 const base=[
  {store:'云桥店',spu:'A-104 跑步鞋',stock:3,transit:1,daily:1.2,lead:3,cap:12,warehouse:36,sizes:'37–40'},
  {store:'江湾店',spu:'A-104 跑步鞋',stock:8,transit:0,daily:1.0,lead:4,cap:15,warehouse:36,sizes:'37–40'},
  {store:'云桥店',spu:'B-208 轻量夹克',stock:2,transit:0,daily:.8,lead:3,cap:10,warehouse:28,sizes:'S–XL'},
  {store:'松林店',spu:'B-208 轻量夹克',stock:6,transit:2,daily:.45,lead:5,cap:11,warehouse:28,sizes:'S–XL'},
  {store:'江湾店',spu:'C-316 休闲长裤',stock:1,transit:1,daily:.65,lead:4,cap:9,warehouse:22,sizes:'M–XL'},
  {store:'松林店',spu:'C-316 休闲长裤',stock:5,transit:0,daily:.35,lead:5,cap:9,warehouse:22,sizes:'M–XL'}];
 function run(){const days=Math.max(3,Math.min(30,Number($('#ctcDays').value)||10)),season=$('#ctcScenario').value==='season',factor=season?1.25:1;let raw=0,baseQty=0,final=0,remain={};const rows=base.map((r,i)=>{const forecast=r.daily*factor,projected=r.stock+r.transit-forecast*r.lead,target=forecast*days,demand=Math.max(0,Math.ceil(target-projected)),simple=Math.max(0,Math.ceil(target-r.stock-r.transit));raw+=demand;baseQty+=simple;const available=remain[r.spu]??r.warehouse;let qty=Math.min(demand,r.cap-r.stock-r.transit,available);qty=Math.max(0,Math.floor(qty/2)*2);remain[r.spu]=available-qty;final+=qty;return {...r,forecast,projected,target,demand,simple,qty,status:qty===0?'无需调拨':qty<demand?'约束缩减':'满足需求'}});const wh=base.reduce((m,r)=>(m[r.spu]=r.warehouse,m),{}),whTotal=Object.values(wh).reduce((a,b)=>a+b,0);$('#ctcWarehouse').textContent=whTotal;$('#ctcDemand').textContent=raw;$('#ctcFinal').textContent=final;$('#ctcGap').textContent=raw-final;$('#ctcMode').textContent=season?'换季首铺模拟':'常规补货模拟';$('#ctcRows').innerHTML=rows.map(r=>`<tr><td>${r.store}</td><td>${r.spu}</td><td>${r.stock}</td><td>${r.transit}</td><td>${r.forecast.toFixed(2)}</td><td>${r.lead}天</td><td>${r.simple}</td><td><b>${r.qty}</b></td><td>${pill(r.status,r.status==='满足需求'?'ok':r.status==='约束缩减'?'warn':'')}</td></tr>`).join('');const samples=rows.slice(0,5).map((r,i)=>`${i+1}. ${r.store}/${r.spu}\n   Projected=${r.stock}+${r.transit}-${r.forecast.toFixed(2)}×${r.lead}=${r.projected.toFixed(1)}\n   原始需求=max(0, ${r.target.toFixed(1)}-${r.projected.toFixed(1)})=${r.demand} → 约束后=${r.qty}`).join('\n');const empty=rows.filter(r=>r.qty===0).length,neg=rows.filter(r=>r.projected<0).length;$('#ctcLog').textContent=`【输入】${rows.length} 条门店商品组合 / ${new Set(rows.map(r=>r.store)).size} 家门店 / ${new Set(rows.map(r=>r.spu)).size} 个商品\n【参数】${season?'换季首铺':'常规补货'} / 覆盖 ${days} 天\n\n${samples}\n\n【约束变化】\n原始需求 ${raw} → 最终建议 ${final}，缩减 ${raw-final}\n简单基线 ${baseQty} → Projected Stock 方法 ${raw}\n\n【自动校验】\n空值 0 / 负数输入 0 / Projected Stock<0：${neg} / 建议为0：${empty}\n最终建议≤仓库可调库存：${final<=whTotal?'通过':'异常'}`}
 $('#ctcRun').onclick=run;$('#ctcReset').onclick=()=>{$('#ctcScenario').value='daily';$('#ctcDays').value=10;$('#ctcRows').innerHTML='<tr><td colspan="9" class="empty">点击“运行调拨”查看可解释建议</td></tr>';['#ctcDemand','#ctcFinal','#ctcGap'].forEach(x=>$(x).textContent='—');$('#ctcLog').textContent='等待输入…\n系统将展示前 5 条计算、约束变化和自动校验。'}
}

function initPermission(){
 const roles={clerk:{name:'云桥店 · 店员',scope:'仅云桥店',groups:['销售','库存']},regional:{name:'华东区 · 区域负责人',scope:'华东区门店',groups:['销售','库存','客流']},buyer:{name:'鞋履组 · 买手',scope:'鞋履组品牌',groups:['销售','库存','采购','成本']},analyst:{name:'经营分析岗',scope:'聚合经营数据',groups:['销售','库存','客流']}};
 const runs=[];
 function run(forceCost=false){
  const r=roles[$('#permRole').value],q=forceCost?'查看各品牌成本价、库存成本和毛利':$('#permQuery').value,needCost=/成本|毛利|结算/.test(q),needInventory=/库存/.test(q),required=needCost?'成本':needInventory?'库存':'销售',allowed=r.groups.includes(required),runId='RUN-PERM-'+String(runs.length+1).padStart(3,'0'),time=new Date().toLocaleTimeString('zh-CN'),model=$('#permModel').value,prompt=$('#permPrompt').value;
  const gates=[['身份解析',r.name,true],['AI 指标识别',required,true],['字段权限',allowed?'已授权':'未授权',allowed],['数据范围',r.scope,true],['执行闸门',allowed?'允许执行':'拒绝执行',allowed]];
  runs.unshift({id:runId,time,query:q,metric:required,actor:r.name,allowed,model,prompt});
  $('#permGates').innerHTML=gates.map(([a,b,ok])=>`<div class="gate ${ok?'pass':'block'}"><span>${a}</span><b>${b}</b></div>`).join('');
  const result=$('#permResult'),status=$('#permStatus');result.classList.toggle('blocked',!allowed);result.innerHTML=allowed?`<b>允许执行</b><span>查询范围已缩小为“${r.scope}”，仅返回授权字段。</span>`:`<b>查询已拦截</b><span>${r.name}没有“${required}”字段组权限，SQL 未进入数据库。</span>`;status.textContent=allowed?'ALLOWED':'BLOCKED';status.className=`pill ${allowed?'ok':'danger'}`;
  $('#permRows').innerHTML=allowed?`<tr><td>${r.scope}</td><td>¥ ${money(r.scope==='仅云桥店'?128640:846300)}</td><td>${fmt(r.scope==='仅云桥店'?1246:7280)}</td><td>${needCost?'¥ 418,200':'- 无权限字段'}</td></tr>`:'<tr><td colspan="4" class="empty">执行前已拒绝，没有返回数据</td></tr>';
  $('#permRunId').textContent=runId;$('#permTrace').innerHTML=`<div><span>输入快照</span><b>${q}</b></div><div><span>AI 结构化输出</span><b>指标：${required} / 时间：本周 / 粒度：${r.scope}</b></div><div><span>模型与版本</span><b>${model} / ${prompt}</b></div><div><span>策略判断</span><b>${allowed?'字段已授权，范围已收窄':'字段未授权，执行前拒绝'}</b></div><div><span>最终处置</span><b>${allowed?'生成受控查询':'没有生成 SQL'}</b></div>`;
  $('#permAudit').innerHTML=`<div><b>${allowed?'ALLOW':'DENY'} · ${required}</b><br><small>${time} · ${r.name}</small></div><div><b>范围：${r.scope}</b><br><small>策略来源：RBAC-73 + ABAC-12</small></div><div><b>${allowed?'已生成受控查询':'未生成 SQL'}</b><br><small>${allowed?'字段和范围已写入查询约束':'拒绝原因已写入审计记录'}</small></div>`;
  $('#permRunCount').textContent=`${runs.length} 次运行`;$('#permRunLog').innerHTML=runs.map(x=>`<button class="perm-run-row" data-run="${x.id}"><div><b>${x.id}</b><small>${x.time} / ${x.prompt}</small></div><span>${x.metric}</span><em>${x.actor}</em><strong class="${x.allowed?'allow':'deny'}">${x.allowed?'允许':'拒绝'}</strong></button>`).join('');
 }
 $('#permRun').onclick=()=>run(false);$('#permCost').onclick=()=>{$('#permQuery').value='查看各品牌成本价、库存成本和毛利';run(true)};$('#permRunLog').onclick=e=>{const row=e.target.closest('[data-run]');if(!row)return;const x=runs.find(item=>item.id===row.dataset.run);if(!x)return;$('#permRunId').textContent=x.id;$('#permTrace').innerHTML=`<div><span>输入快照</span><b>${x.query}</b></div><div><span>AI 结构化输出</span><b>指标：${x.metric}</b></div><div><span>模型与版本</span><b>${x.model} / ${x.prompt}</b></div><div><span>策略判断</span><b>${x.allowed?'字段已授权，范围已收窄':'字段未授权，执行前拒绝'}</b></div><div><span>最终处置</span><b>${x.allowed?'生成受控查询':'没有生成 SQL'}</b></div>`};run(false)
}

function initOtb(){
 const original=[{id:'north',group:'sport',brand:'Northline',budget:460,plan:280,bought:250,sales:72,margin:48},{id:'motion',group:'sport',brand:'Motion Lab',budget:380,plan:235,bought:168,sales:61,margin:45},{id:'mori',group:'life',brand:'Mori Days',budget:320,plan:205,bought:218,sales:54,margin:51},{id:'harbor',group:'life',brand:'Harbor Field',budget:290,plan:180,bought:112,sales:67,margin:43}];let data=original.map(x=>({...x}));
 function view(){const group=$('#otbGroup').value,rows=data.filter(x=>group==='all'||x.group===group),sum=k=>rows.reduce((a,b)=>a+b[k],0),avg=k=>Math.round(rows.reduce((a,b)=>a+b[k],0)/rows.length);$('#otbBudget').textContent=money(sum('budget'));$('#otbPlan').textContent=money(sum('plan'));$('#otbBought').textContent=`${Math.round(sum('bought')/sum('plan')*100)}%`;$('#otbMargin').textContent=`${avg('margin')}%`;$('#otbRows').innerHTML=rows.map(r=>{const use=r.bought/r.plan,status=use>1?'超出计划':use<.7?'采购偏慢':r.sales<60?'销售偏慢':'节奏正常';return `<tr><td><b>${r.brand}</b></td><td>${r.budget}</td><td>${r.plan}</td><td>${r.bought}</td><td>${r.sales}%</td><td>${r.margin}%</td><td>${pill(status,use>1?'danger':status==='节奏正常'?'ok':'warn')}</td><td><button class="btn secondary" data-brand="${r.id}">调整</button></td></tr>`}).join('');$('#otbBars').innerHTML=rows.map(r=>`<div class="bar-group"><i class="bar" style="height:${Math.max(10,r.plan/3)}px"></i><i class="bar actual" style="height:${Math.max(10,r.bought/3)}px"></i><span>${r.brand.split(' ')[0]}</span></div>`).join('');const risks=rows.filter(r=>r.bought>r.plan||r.sales<60);$('#otbInsight').textContent=risks.length?`经营关注：${risks.map(r=>r.brand).join('、')} 存在超买或销售进度偏慢，建议先核对到货节奏和库存后再调整 OTB。`:'当前采购与销售节奏基本匹配，继续观察毛利和库存。';$('#otbBrand').innerHTML=rows.map(r=>`<option value="${r.id}">${r.brand}</option>`).join('');syncInput()}
 function syncInput(){const r=data.find(x=>x.id===$('#otbBrand').value);if(r)$('#otbNewPlan').value=r.plan}
 $('#otbApply').onclick=view;$('#otbBrand').onchange=syncInput;$('#otbRows').onclick=e=>{const b=e.target.closest('[data-brand]');if(!b)return;$('#otbBrand').value=b.dataset.brand;syncInput();$('#otbNewPlan').focus()};$('#otbSubmit').onclick=()=>{const r=data.find(x=>x.id===$('#otbBrand').value),old=r.plan,next=Math.max(0,Number($('#otbNewPlan').value)||old);r.plan=next;$('#otbDelta').innerHTML=`<span class="delta">${r.brand}: ${old} → ${next}</span>`;$('#otbApproval').textContent='待商品负责人审批';$('#otbApproval').className='pill warn';view()};$('#otbReset').onclick=()=>{data=original.map(x=>({...x}));$('#otbDelta').textContent='';$('#otbApproval').textContent='尚未调整';$('#otbApproval').className='pill';view()};view()
}

function initGapRadar(){
 const datasets={
  apparel:[
   {category:'轻量外套',share:.18,scale:1260,actual:128,groups:4,sell:84,stockout:true},
   {category:'通勤针织',share:.14,scale:1260,actual:146,groups:3,sell:66,stockout:false},
   {category:'休闲长裤',share:.16,scale:1260,actual:171,groups:5,sell:73,stockout:false},
   {category:'功能配件',share:.09,scale:1260,actual:48,groups:4,sell:88,stockout:true},
   {category:'城市徒步鞋',share:.21,scale:1260,actual:192,groups:5,sell:82,stockout:true},
   {category:'基础卫衣',share:.12,scale:1260,actual:158,groups:3,sell:57,stockout:false}
  ],
  urban:[
   {category:'轻量外套',share:.16,scale:980,actual:104,groups:4,sell:78,stockout:false},
   {category:'通勤针织',share:.17,scale:980,actual:121,groups:4,sell:76,stockout:false},
   {category:'休闲长裤',share:.15,scale:980,actual:132,groups:5,sell:69,stockout:false},
   {category:'功能配件',share:.08,scale:980,actual:31,groups:3,sell:91,stockout:true},
   {category:'城市徒步鞋',share:.24,scale:980,actual:177,groups:5,sell:86,stockout:true},
   {category:'基础卫衣',share:.11,scale:980,actual:118,groups:3,sell:61,stockout:false}
  ]};
 let shortlist=new Set();
 function calculate(){
  const key=$('#radarGroup').value,threshold=Math.max(0,Number($('#radarThreshold').value)||0),period=$('#radarPeriod').value;
  const rows=datasets[key].map(r=>{const reference=Math.round(r.share*r.scale),baseline=Math.max(0,reference-r.actual),supplyBonus=r.stockout&&r.sell>=80?Math.round(reference*.1):0,score=baseline+supplyBonus;return {...r,reference,baseline,supplyBonus,score}}).filter(r=>r.score>=threshold).sort((a,b)=>b.score-a.score);
  const total=rows.reduce((s,r)=>s+r.score,0),strong=rows.filter(r=>r.groups>=4&&r.score>0).length,stockout=rows.filter(r=>r.supplyBonus>0).length;
  $('#radarCategories').textContent=rows.length;$('#radarOpportunity').textContent=fmt(total);$('#radarStrong').textContent=strong;$('#radarSupply').textContent=stockout;
  $('#radarRows').innerHTML=rows.length?rows.map((r,i)=>`<tr><td><span class="rank">${String(i+1).padStart(2,'0')}</span></td><td><b>${r.category}</b></td><td>${(r.share*100).toFixed(0)}%</td><td>${fmt(r.reference)}</td><td>${fmt(r.actual)}</td><td>${fmt(r.baseline)}</td><td>${r.supplyBonus?pill(`+${r.supplyBonus} 供给证据`,'warn'):pill('无修正')}</td><td><b>${fmt(r.score)}</b></td><td><button class="btn secondary shortlist-btn ${shortlist.has(r.category)?'selected':''}" data-shortlist="${r.category}">${shortlist.has(r.category)?'已关注':'加入关注'}</button></td></tr>`).join(''):'<tr><td colspan="9" class="empty">当前阈值下没有机会项</td></tr>';
  const samples=rows.slice(0,5).map((r,i)=>`${i+1}. ${r.category}\n   目标参照=${(r.share*100).toFixed(0)}%×${r.scale}=${r.reference}\n   基线缺口=max(0, ${r.reference}-${r.actual})=${r.baseline}\n   供给修正=${r.supplyBonus} → 最终机会分=${r.score}`).join('\n');
  $('#radarLog').textContent=`【输入】${datasets[key].length} 个三级品类 / 5 个参照品牌组 / ${period}\n【基线】目标参照 = 公司品类占比 × 目标组规模\n【修正】高售罄且提前断货时，增加目标参照的 10% 作为供给证据\n\n${samples||'无样本通过阈值'}\n\n【输出】${rows.length} 个机会项 / 总机会分 ${total}\n【自动校验】\n空值 0 / 负数 0 / 机会分为 0：${rows.filter(r=>r.score===0).length}\n目标参照合计≤目标组规模：${rows.reduce((s,r)=>s+r.reference,0)<=datasets[key][0].scale?'通过':'需复核'}\n排序单调递减：${rows.every((r,i)=>i===0||rows[i-1].score>=r.score)?'通过':'异常'}`;
  $('#radarShortlist').innerHTML=shortlist.size?[...shortlist].map(x=>`<span>${x}<button data-remove-shortlist="${x}" aria-label="移除${x}">×</button></span>`).join(''):'<small>从机会表中加入重点关注品类。</small>';
 }
 $('#radarRun').onclick=calculate;$('#radarReset').onclick=()=>{shortlist.clear();$('#radarGroup').value='apparel';$('#radarPeriod').value='2026H1';$('#radarThreshold').value=20;calculate()};$('#radarRows').onclick=e=>{const b=e.target.closest('[data-shortlist]');if(!b)return;shortlist.add(b.dataset.shortlist);calculate()};$('#radarShortlist').onclick=e=>{const b=e.target.closest('[data-remove-shortlist]');if(!b)return;shortlist.delete(b.dataset.removeShortlist);calculate()};calculate();
}

function initBuyflow(){
 const steps=['申请提交','自动拆单','审批通过','供应商确认','物流发货','到货签收','月度对账'];
 const items=[{name:'A4 复印纸',qty:12,price:26,supplier:'晨川办公'},{name:'文件收纳盒',qty:18,price:16,supplier:'晨川办公'},{name:'热敏标签纸',qty:8,price:35,supplier:'远桥物资'}];
 let state='draft',supplier='晨川办公',audit=[];
 const stateIndex={draft:0,submitted:1,split:2,approved:3,confirmed:4,shipped:5,received:6,reconciled:7,declined:3};
 const stateLabel={draft:'待提交',submitted:'等待自动拆单',split:'等待审批',approved:'等待供应商确认',confirmed:'等待发货',shipped:'等待签收',received:'等待对账',reconciled:'采购闭环完成',declined:'供应商拒绝'};
 function addAudit(title,detail){audit.unshift({title,detail,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})})}
 function render(){
  const active=stateIndex[state];$('#flowSteps').innerHTML=steps.map((s,i)=>`<div class="flow-step ${i<active?'done':i===active?'active':''}"><i>${i<active?'✓':i+1}</i><span>${s}</span></div>`).join('');
  const total=items.reduce((s,x)=>s+x.qty*x.price,0);$('#buyflowAmount').textContent=`¥ ${money(total)}`;$('#buyflowOrders').textContent=state==='draft'?'—':'2';$('#buyflowStatus').textContent=stateLabel[state];
  $('#buyflowItems').innerHTML=items.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.qty}</td><td>¥ ${x.price}</td><td>${state==='draft'?'待系统匹配':x.supplier}</td><td>¥ ${money(x.qty*x.price)}</td></tr>`).join('');
  const actions={
   draft:['提交采购申请','系统会校验明细并按优选供应商拆成 2 张采购单。','提交申请','submit'],
   submitted:['执行自动拆单','根据商品—供应商关系生成采购单，并保留原申请的追溯关系。','生成采购单','split'],
   split:['模拟钉钉审批','审批通过后才生成供应商访问令牌，供应商无需内部账号。','审批通过','approve'],
   approved:['供应商确认','在移动端确认接单；也可以选择拒绝，验证异常分支。','供应商接单','confirm'],
   confirmed:['登记物流','填写模拟运单后，申请人可以在同一状态页追踪。','确认发货','ship'],
   shipped:['到货签收','由申请方确认数量与状态，签收结果进入对账依据。','确认签收','receive'],
   received:['生成月度对账','按供应商与已签收订单汇总，生成可核对的月度账单。','生成对账单','reconcile'],
   reconciled:['采购闭环完成','申请、拆单、审批、供应商、物流、签收和对账记录均已连通。','重新演示','reset'],
   declined:['重新分配供应商','原供应商拒绝原因已记录，请重新指派备用供应商并再次推送。','指派远桥物资','reassign']
  }[state];
  $('#buyflowActionTitle').textContent=actions[0];$('#buyflowActionText').textContent=actions[1];$('#buyflowPrimary').textContent=actions[2];$('#buyflowPrimary').dataset.action=actions[3];$('#buyflowDecline').hidden=state!=='approved';$('#buyflowWaybill').hidden=state!=='confirmed';$('#buyflowSupplier').textContent=supplier;$('#buyflowMobileState').textContent=state==='approved'?'等待供应商处理':state==='declined'?'已拒绝，等待采购重分配':active>=3?'已确认接单':'尚未推送';
  $('#buyflowAudit').innerHTML=audit.length?audit.map(x=>`<div><i></i><span><b>${x.title}</b><small>${x.time} · ${x.detail}</small></span></div>`).join(''):'<div class="audit-empty">提交后将在这里形成连续审计记录。</div>';
 }
 function act(name){
  if(name==='submit'){state='submitted';addAudit('采购申请已提交','区域行政 · P-2026-018')}
  else if(name==='split'){state='split';addAudit('已自动拆分 2 张采购单','优选供应商规则命中 3 个商品')}
  else if(name==='approve'){state='approved';addAudit('审批通过并推送供应商','一次性访问令牌已生成')}
  else if(name==='confirm'){state='confirmed';addAudit(`${supplier}确认接单`,'预计 2 个工作日内发货')}
  else if(name==='decline'){state='declined';addAudit(`${supplier}拒绝接单`,'模拟原因：部分商品临时缺货')}
  else if(name==='reassign'){supplier='远桥物资';state='approved';addAudit('采购重新指派供应商','拒绝记录保留，已重新推送')}
  else if(name==='ship'){const no=$('#buyflowWaybillInput').value.trim()||'SF-MOCK-260818';state='shipped';addAudit('供应商已确认发货',`模拟运单 ${no}`)}
  else if(name==='receive'){state='received';addAudit('申请方完成签收','数量一致，无异常')}
  else if(name==='reconcile'){state='reconciled';addAudit('已生成月度对账单','仅汇总已签收采购单')}
  else if(name==='reset'){state='draft';supplier='晨川办公';audit=[];$('#buyflowWaybillInput').value=''}render();
 }
 $('#buyflowPrimary').onclick=e=>act(e.currentTarget.dataset.action);$('#buyflowDecline').onclick=()=>act('decline');$('#buyflowReset').onclick=()=>act('reset');render();
}
