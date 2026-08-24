const $ = function (selector) { return document.querySelector(selector); };

const flowSteps = [
  ['需求提报', '文字与商品'],
  ['AI 整理', '提取与补缺'],
  ['业务初审', '用途与预算'],
  ['AI 拆单', '建议与校验'],
  ['执行审批', '人工确认'],
  ['供应商', '沟通与物流'],
  ['完成', '到货签收']
];

const products = [
  { id: 'mirror', icon: '▣', name: '全身试衣镜', spec: '160 × 50 cm · 黑色窄边', supplier: '晨川办公用品', alt: '远桥商业物资', price: 340, qty: 2 },
  { id: 'tools', icon: '◇', name: '陈列工具套装', spec: '店铺陈列基础工具 · 12 件', supplier: '晨川办公用品', alt: '远桥商业物资', price: 105, qty: 3 },
  { id: 'paper', icon: '▤', name: '标签打印纸', spec: '热敏标签 · 50 × 30 mm', supplier: '远桥商业物资', alt: '晨川办公用品', price: 30, qty: 6 },
  { id: 'hanger', icon: '⌁', name: '防滑衣架', spec: '成人款 · 黑色 · 50 支/箱', supplier: '远桥商业物资', alt: '晨川办公用品', price: 96, qty: 0 }
];

const form = {
  store: '上海星港二期店',
  department: '商业中心',
  date: '2026-08-21',
  urgency: '普通',
  purpose: '新店开业前补充陈列道具与试衣镜'
};

let state = 'draft';
let events = [['演示已就绪', '现在 · 从发起采购开始']];
let toastTimer;

const stateIndex = {
  draft: 0,
  aiReview: 1,
  initialApproval: 2,
  splitting: 3,
  finalApproval: 4,
  messageReview: 5,
  dispatched: 5,
  shipped: 5,
  completed: 6
};

function money(value) {
  return '¥' + value.toLocaleString('zh-CN');
}

function totalAmount() {
  return products.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
}

function totalQty() {
  return products.reduce(function (sum, item) { return sum + item.qty; }, 0);
}

function selectedProducts() {
  return products.filter(function (item) { return item.qty > 0; });
}

function now() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function addEvent(title, detail) {
  events.unshift([title, now() + ' · ' + detail]);
  events = events.slice(0, 5);
}

function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
}

function renderFlow() {
  const active = stateIndex[state];
  $('#flowTrack').innerHTML = flowSteps.map(function (step, index) {
    const cls = index < active ? 'done' : index === active ? 'active' : '';
    const mark = index < active ? '✓' : String(index + 1);
    return '<div class="flow-step ' + cls + '"><i class="flow-dot">' + mark + '</i><span>' + step[0] + '</span><small>' + step[1] + '</small></div>';
  }).join('');
}

function orderHeader(status, tone) {
  return '<div class="order-hero"><div><span class="eyebrow">PURCHASE ORDER · BF-260816</span><h1>新店开业物资采购</h1><p>' + form.department + ' · ' + form.store + ' · 期望 ' + form.date.replace('2026-', '').replace('-', ' 月 ') + ' 日前到货</p></div><div class="order-amount"><span>采购金额</span><b>' + money(totalAmount()) + '</b><div class="status-pill ' + (tone || '') + '">' + status + '</div></div></div>';
}

function productRows() {
  return products.map(function (item) {
    return '<div class="product-row"><div class="product-info"><i class="product-icon">' + item.icon + '</i><div><b>' + item.name + '</b><small>' + item.spec + '</small></div></div><div class="product-meta">' + money(item.price) + '<small>参考单价</small></div><div class="qty"><button data-qty="minus" data-id="' + item.id + '" aria-label="减少">−</button><span>' + item.qty + '</span><button data-qty="plus" data-id="' + item.id + '" aria-label="增加">＋</button></div><div class="line-total">' + money(item.price * item.qty) + '</div></div>';
  }).join('');
}

function compactItems() {
  return '<div class="shipment">' + selectedProducts().map(function (item) {
    return '<div class="shipment-row"><span>' + item.name + '</span><b>' + item.qty + ' 件 · ' + money(item.price * item.qty) + '</b><em>已加入申请</em></div>';
  }).join('') + '</div>';
}

function supplierGroups(editable) {
  const groups = {};
  selectedProducts().forEach(function (item) {
    if (!groups[item.supplier]) groups[item.supplier] = [];
    groups[item.supplier].push(item);
  });
  return '<div class="supplier-groups">' + Object.keys(groups).map(function (name, groupIndex) {
    const items = groups[name];
    const amount = items.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    return '<article class="supplier-card"><header><div><i>' + (groupIndex + 1) + '</i><div><b>' + name + '</b><small>建议子单 BF-260816-' + String.fromCharCode(65 + groupIndex) + '</small></div></div><span>规则通过</span></header>' + items.map(function (item) {
      const select = editable ? '<select data-supplier-for="' + item.id + '"><option' + (item.supplier === name ? ' selected' : '') + '>' + name + '</option><option>' + item.alt + '</option></select>' : '';
      return '<div class="split-item"><div><b>' + item.name + '</b><small>' + item.spec + '</small>' + select + '</div><span>× ' + item.qty + '<small>' + money(item.price * item.qty) + '</small></span></div>';
    }).join('') + '<div class="supplier-total"><span>' + items.length + ' 个品项 · ' + items.reduce(function (sum, item) { return sum + item.qty; }, 0) + ' 件</span><b>' + money(amount) + '</b></div></article>';
  }).join('') + '</div>';
}

function renderDraft() {
  return '<section class="panel panel-main"><div class="stage-title"><div><span class="eyebrow">NEW REQUEST · MIXED INPUT</span><h1>把采购需求交给系统整理</h1><p>提交用途说明与商品后，AI 先提取交期、场景和品项，再由你校对，不能直接进入审批。</p></div><span class="status-pill">草稿</span></div><div class="input-disclosure"><i>AI</i><div><b>这一环节会使用 AI</b><span>只读取当前采购单与商品选择；输出是可编辑建议，不会自动审批或联系供应商。</span></div></div><div class="form-grid"><label class="field"><span>采购部门</span><select data-field="department"><option>商业中心</option><option>人力资源中心</option></select></label><label class="field"><span>采购门店</span><select data-field="store"><option>上海星港二期店</option><option>杭州湖滨店</option></select></label><label class="field"><span>期望到货</span><input type="date" data-field="date" value="' + form.date + '"></label><label class="field"><span>紧急程度</span><select data-field="urgency"><option>普通</option><option>紧急</option></select></label><label class="field wide"><span>原始需求说明 · 可使用自然语言</span><textarea data-field="purpose">' + form.purpose + '</textarea></label></div><div class="catalog-head"><h2>随需求提交的商品</h2><span>模拟附件已解析为候选商品，可继续调整数量</span></div><div class="product-list">' + productRows() + '</div></section>';
}

function renderAIReview() {
  const fields = [
    ['采购场景', '新店开业物资', 'High', '来源：用途说明'],
    ['收货门店', form.store, 'High', '来源：表单字段'],
    ['期望到货', form.date.replace('2026-', '').replace('-', ' 月 ') + ' 日前', 'High', '来源：日期字段'],
    ['紧急程度', form.urgency, 'Medium', '依据：交期与开业场景']
  ];
  return '<section class="panel panel-main"><div class="stage-title"><div><span class="eyebrow">AI EXTRACTION · RUN AI-BF-0821-01</span><h1>AI 已整理采购需求，等待人工校对</h1><p>黄色字段来自推断；高置信字段也可以修改。任何关键字段缺失都会在这里停止流转。</p></div><span class="status-pill amber">待确认</span></div><div class="ai-review-grid">' + fields.map(function(field){return '<article class="ai-field ' + field[2].toLowerCase() + '"><span>' + field[0] + '<em>' + field[2] + '</em></span><b>' + field[1] + '</b><small>' + field[3] + '</small></article>';}).join('') + '</div><div class="ai-review-body"><div><span class="eyebrow">EXTRACTED ITEMS</span><h2>' + selectedProducts().length + ' 个品项 · ' + totalQty() + ' 件</h2><p>商品名称、规格、数量和参考单价均来自本次模拟附件与商品目录，不由模型生成。</p></div><div class="validation-list"><div class="pass"><i>✓</i><span><b>必填字段完整</b><small>部门、门店、用途和交期均存在</small></span></div><div class="pass"><i>✓</i><span><b>商品信息可追溯</b><small>每个品项均绑定目录记录</small></span></div><div class="warn"><i>!</i><span><b>紧急程度为推断</b><small>请人工确认是否需要加急</small></span></div></div></div>' + compactItems() + '</section>';
}

function renderInitialApproval() {
  return '<section class="panel panel-main">' + orderHeader('等待钉钉初审', 'amber') + '<div class="approval-visual"><div class="approval-copy"><span>DINGTALK APPROVAL · 1 / 2</span><h2>采购申请已进入钉钉审批</h2><p>审批人在钉钉查看用途、门店、预算和商品摘要。Buyflow 等待回调，不重复建设审批界面。</p></div><div class="approval-orbit"><i>申</i><b></b><em>审</em></div></div>' + compactItems() + '</section>';
}

function renderSplitting() {
  return '<section class="panel panel-main">' + orderHeader('AI 拆单建议待复核', 'amber') + '<div class="split-banner ai"><div><b>AI 基于品类覆盖、历史合作与交期生成 ' + Object.keys(grouped()).length + ' 张子单建议</b><span>建议不是订单；采购人员可以调整供应商，规则会重新校验。</span></div><em>Medium confidence</em></div><div class="rule-checks"><span>RULE VALIDATION</span><div><b>✓ 供应商状态有效</b><b>✓ 预算未超限</b><b>✓ MOQ 已满足</b><b>✓ 交期覆盖</b></div></div>' + supplierGroups(true) + '<div class="split-explain"><b>为什么这样拆？</b><p>试衣镜与陈列工具归入晨川：目录覆盖完整、历史交期稳定；标签打印纸归入远桥：该品类为其主供。价格与供应商最终选择仍由采购人员确认。</p></div></section>';
}

function grouped() {
  return selectedProducts().reduce(function (out, item) {
    out[item.supplier] = (out[item.supplier] || 0) + 1;
    return out;
  }, {});
}

function renderFinalApproval() {
  return '<section class="panel panel-main">' + orderHeader('等待下发审批', 'amber') + '<div class="final-approval"><span>DINGTALK APPROVAL · 2 / 2</span><h2>拆单结果已提交最终审批</h2><p>这次审批确认的是“哪些供应商订单可以真正下发”。审批通过后，系统才生成一次性供应商链接。</p><div class="mini-orders">' + Object.keys(grouped()).map(function (name, index) { return '<div><div><b>子单 BF-260816-' + String.fromCharCode(65 + index) + '</b><small>' + name + ' · ' + grouped()[name] + ' 个品项</small></div><span>待批准</span></div>'; }).join('') + '</div></div></section>';
}

function renderMessageReview() {
  const recipients = Object.keys(grouped()).join('、');
  return '<section class="panel panel-main">' + orderHeader('对外联系待人工确认', 'amber') + '<div class="message-review"><div class="message-head"><div><span class="eyebrow">AI COMMUNICATION DRAFT</span><h2>审批已通过，先检查供应商沟通草稿</h2><p>收件人和订单金额来自已批准子单；AI 只负责把结构化信息整理成沟通文本。</p></div><span class="human-gate">HUMAN GATE</span></div><div class="recipient-row"><span>拟联系供应商</span><b>' + recipients + '</b><em>2 位</em></div><label>可编辑沟通草稿<textarea id="supplierDraft">您好，采购单 BF-260816 已完成内部审批。本次包含新店开业陈列物资，期望 08 月 21 日前送达上海星港二期店。请通过安全链接确认品项、交期并回传物流信息；如价格或交期存在差异，请勿直接发货，先在订单中反馈。</textarea></label><div class="outbound-check"><i>✓</i><span><b>外部联系默认关闭</b><small>点击右侧确认后仅生成模拟供应商链接，不发送真实消息。</small></span></div></div></section>';
}

function renderDispatched() {
  return '<section class="panel panel-main">' + orderHeader('已下发供应商', 'green') + '<div class="dispatch-success"><i>✓</i><h2>审批通过，供应商订单已生成</h2><p>两张子单拥有独立链接和状态，供应商无需注册即可查看并反馈。</p></div><div class="order-links"><button class="order-link" data-action="open-supplier"><div><b>晨川办公用品</b><span>BF-260816-A · ' + selectedProducts().filter(function (x) { return x.supplier === '晨川办公用品'; }).length + ' 个品项 · 待发货</span></div><i>↗</i></button><button class="order-link" data-action="open-supplier"><div><b>远桥商业物资</b><span>BF-260816-B · ' + selectedProducts().filter(function (x) { return x.supplier === '远桥商业物资'; }).length + ' 个品项 · 待发货</span></div><i>↗</i></button></div></section>';
}

function renderShipped() {
  return '<section class="panel panel-main">' + orderHeader('供应商已发货', 'green') + '<div class="dispatch-success"><i>↗</i><h2>物流状态已自动回写</h2><p>供应商刚刚提交了运单，采购执行不需要再去群里追问。</p></div><div class="shipment"><div class="shipment-row"><span>晨川办公用品</span><b>顺丰速运 · ' + ($('#trackingNo') ? $('#trackingNo').value : 'SF208160086') + '</b><em>运输中</em></div><div class="shipment-row"><span>远桥商业物资</span><b>京东物流 · JD2608161208</b><em>运输中</em></div><div class="shipment-row"><span>收货门店</span><b>' + form.store + '</b><em>等待签收</em></div></div></section>';
}

function renderCompleted() {
  return '<section class="panel panel-main">' + orderHeader('采购闭环完成', 'green') + '<div class="complete-card"><i>✓</i><h2>从需求到签收，状态完整留痕</h2><p>采购人、审批人和供应商只处理自己需要的动作，系统把状态自动串联起来。</p><div class="complete-metrics"><div><strong>2</strong><span>供应商子单</span></div><div><strong>' + totalQty() + '</strong><span>采购件数</span></div><div><strong>1 条</strong><span>连续流程记录</span></div></div></div></section>';
}

function sideConfig() {
  const configs = {
    draft: ['采购篮', '提交给 AI 整理', 'submit-request', 'AI 只整理当前输入，不会自动审批', '选择了 ' + selectedProducts().length + ' 个商品'],
    aiReview: ['人工校对', '确认结构化结果', 'confirm-ai', '确认后才生成采购单并进入业务初审', '1 个字段需要关注'],
    initialApproval: ['当前动作', '模拟钉钉初审通过', 'approve-initial', '模拟外部审批回调，随后生成 AI 拆单建议', '等待审批回调'],
    splitting: ['人工复核', '批准建议并提交审批', 'submit-final', '可修改供应商；规则通过后进入执行审批', 'AI 建议 ' + Object.keys(grouped()).length + ' 张子单'],
    finalApproval: ['当前动作', '模拟最终审批通过', 'approve-final', '通过后才真正生成供应商订单', '等待下发审批'],
    messageReview: ['发送前闸门', '确认并生成模拟链接', 'confirm-outbound', '不发送真实消息，仅进入供应商端演示', '2 位供应商待联系'],
    dispatched: ['当前动作', '打开供应商端', 'open-supplier', '体验供应商如何查看订单并回传物流', '2 张订单待供应商处理'],
    shipped: ['当前动作', '确认门店签收', 'receive', '签收后完成整条采购流程', '物流运输中'],
    completed: ['演示完成', '重新走一遍流程', 'reset', '所有数据均为虚构演示数据', '流程已闭环']
  };
  return configs[state];
}

function renderSide() {
  const c = sideConfig();
  return '<aside class="panel panel-side"><div class="summary-top"><span class="eyebrow">' + c[0].toUpperCase() + '</span><h3>' + c[4] + '</h3><p>BF-260816 · ' + form.store + '</p></div><div class="summary-lines"><div><span>品项 / 件数</span><b>' + selectedProducts().length + ' / ' + totalQty() + '</b></div><div><span>采购金额</span><b>' + money(totalAmount()) + '</b></div><div><span>当前阶段</span><b>' + flowSteps[stateIndex[state]][0] + '</b></div></div><div class="summary-total"><span>本单合计</span><strong>' + money(totalAmount()) + '</strong></div><button class="primary" data-action="' + c[2] + '">' + c[1] + '</button><p class="action-help">' + c[3] + '</p><div class="event-list"><span>RECENT ACTIVITY</span>' + events.slice(0, 3).map(function (event) { return '<div><b>' + event[0] + '</b><small>' + event[1] + '</small></div>'; }).join('') + '</div></aside>';
}

function render() {
  renderFlow();
  const renderers = {
    draft: renderDraft,
    aiReview: renderAIReview,
    initialApproval: renderInitialApproval,
    splitting: renderSplitting,
    finalApproval: renderFinalApproval,
    messageReview: renderMessageReview,
    dispatched: renderDispatched,
    shipped: renderShipped,
    completed: renderCompleted
  };
  const mount = $('#stageMount');
  mount.classList.remove('stage-enter');
  mount.innerHTML = renderers[state]() + renderSide();
  void mount.offsetWidth;
  mount.classList.add('stage-enter');
  $('#crumb').textContent = state === 'draft' ? '发起采购' : '采购单 / BF-260816';
  document.querySelectorAll('[data-nav]').forEach(function (button) {
    const nav = button.dataset.nav;
    button.classList.toggle('active', nav === 'draft' && state === 'draft' || nav === 'order' && state !== 'draft');
  });
}

function resetDemo() {
  state = 'draft';
  products.forEach(function (item, index) {
    item.qty = [2, 3, 6, 0][index];
    item.supplier = index < 2 ? '晨川办公用品' : '远桥商业物资';
  });
  events = [['演示已重置', now() + ' · 从发起采购开始']];
  render();
  showToast('已回到发起采购');
}

document.addEventListener('click', function (event) {
  const qtyButton = event.target.closest('[data-qty]');
  if (qtyButton) {
    const item = products.find(function (product) { return product.id === qtyButton.dataset.id; });
    item.qty = Math.max(0, item.qty + (qtyButton.dataset.qty === 'plus' ? 1 : -1));
    render();
    return;
  }

  const navButton = event.target.closest('[data-nav]');
  if (navButton) {
    const nav = navButton.dataset.nav;
    if (nav === 'draft') { state = 'draft'; render(); }
    else if (nav === 'order') {
      if (state === 'draft' || state === 'aiReview') showToast('先完成需求整理与人工校对，系统才会生成采购单');
      else render();
    } else if (nav === 'supplier') {
      if (state === 'dispatched' || state === 'shipped') openSupplier();
      else showToast('最终审批通过后，供应商协同入口才会开启');
    } else showToast('本次演示聚焦采购主流程');
    return;
  }

  const action = event.target.closest('[data-action]');
  if (!action) return;
  const name = action.dataset.action;
  if (name === 'submit-request') {
    if (!form.purpose.trim() || !selectedProducts().length) {
      showToast('请填写用途并至少选择一个商品');
      return;
    }
    state = 'aiReview';
    addEvent('AI 需求整理完成', '4 个字段已提取 · 1 个需关注');
    showToast('AI 已整理需求，请人工校对');
    render();
  } else if (name === 'confirm-ai') {
    state = 'initialApproval';
    addEvent('结构化结果已确认', '采购单已推送钉钉初审');
    showToast('人工确认完成，采购单 BF-260816 已生成');
    render();
  } else if (name === 'approve-initial') {
    state = 'splitting';
    addEvent('钉钉初审通过', 'AI 已生成供应商拆单建议');
    showToast('审批回调成功，请复核 AI 拆单建议');
    render();
  } else if (name === 'submit-final') {
    state = 'finalApproval';
    addEvent('拆单结果已复核', '提交钉钉下发审批');
    showToast('已提交最终审批');
    render();
  } else if (name === 'approve-final') {
    state = 'messageReview';
    addEvent('最终审批通过', 'AI 已生成供应商沟通草稿');
    showToast('审批已通过，请确认对外沟通内容');
    render();
  } else if (name === 'confirm-outbound') {
    state = 'dispatched';
    addEvent('采购人员确认对外联系', '模拟供应商链接已生成');
    showToast('已生成 2 张模拟供应商订单');
    render();
  } else if (name === 'open-supplier') {
    openSupplier();
  } else if (name === 'close-supplier') {
    closeSupplier();
  } else if (name === 'supplier-ship') {
    state = 'shipped';
    addEvent('晨川办公确认发货', '物流信息已自动回写');
    closeSupplier();
    showToast('供应商已发货，物流状态已同步');
    render();
  } else if (name === 'receive') {
    state = 'completed';
    addEvent('门店完成签收', '采购流程闭环');
    showToast('签收完成');
    render();
  } else if (name === 'reset') {
    resetDemo();
  }
});

document.addEventListener('input', function (event) {
  if (event.target.dataset.field) form[event.target.dataset.field] = event.target.value;
});

document.addEventListener('change', function (event) {
  if (event.target.dataset.field) form[event.target.dataset.field] = event.target.value;
  if (event.target.dataset.supplierFor) {
    const item = products.find(function (product) { return product.id === event.target.dataset.supplierFor; });
    if (item) {
      item.alt = item.supplier;
      item.supplier = event.target.value;
      addEvent('已调整供应商归属', item.name + ' → ' + item.supplier);
      showToast('供应商归属已更新，金额重新汇总');
      render();
    }
  }
});

function openSupplier() {
  $('#supplierItems').innerHTML = selectedProducts().filter(function (item) { return item.supplier === '晨川办公用品'; }).map(function (item) {
    return '<div class="phone-item"><b>' + item.name + '</b><span>× ' + item.qty + '</span></div>';
  }).join('');
  $('#supplierLayer').classList.add('open');
  $('#supplierLayer').setAttribute('aria-hidden', 'false');
}

function closeSupplier() {
  $('#supplierLayer').classList.remove('open');
  $('#supplierLayer').setAttribute('aria-hidden', 'true');
}

render();
