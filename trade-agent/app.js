// TradeLink AI - 外贸智能获客 Agent

const mockCustomers = [
  { id: 1, company: 'TechParts GmbH', contact: 'Michael Weber', region: '德国', match: 96, status: 'new', code: '8473', volume: '$2.1M', email: 'm.weber@techparts.de', title: '采购总监' },
  { id: 2, company: 'Nordic Industries AB', contact: 'Anna Lindqvist', region: '瑞典', match: 94, status: 'follow', code: '8483', volume: '$1.8M', email: 'anna@nordicind.se', title: '供应链经理' },
  { id: 3, company: 'Pacific Trading Co.', contact: 'James Chen', region: '美国', match: 91, status: 'new', code: '8419', volume: '$3.2M', email: 'j.chen@pacifictrading.com', title: '总经理' },
  { id: 4, company: 'EuroMachine SRL', contact: 'Marco Rossi', region: '意大利', match: 89, status: 'won', code: '8481', volume: '$950K', email: 'rossi@euromachine.it', title: '采购主管' },
  { id: 5, company: 'Asia Components Ltd', contact: 'Yuki Tanaka', region: '日本', match: 87, status: 'follow', code: '8471', volume: '$1.5M', email: 'tanaka@asiacomponents.jp', title: '采购经理' },
];

const mockFollowUps = {
  2: [
    { date: '2024-02-10', note: '已发送产品目录，对方对型号 A-200 感兴趣' },
    { date: '2024-02-08', note: '首次邮件联系，已回复表示有意向' },
  ],
  5: [
    { date: '2024-02-09', note: '电话沟通，预计下周发询价单' },
  ],
};

// Navigation
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const screen = el.dataset.screen;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screen}`).classList.add('active');
  });
});

// CTA -> Discover
document.querySelector('[data-action="go-discover"]')?.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-screen="discover"]').classList.add('active');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-discover').classList.add('active');
});

document.querySelector('[data-action="go-customers"]')?.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-screen="customers"]').classList.add('active');
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-customers').classList.add('active');
  renderCustomerTable(mockCustomers);
});

// One-click Discover
const btnDiscover = document.getElementById('btn-discover');
const discoverResult = document.getElementById('discover-result');
const matchCount = document.getElementById('match-count');

btnDiscover?.addEventListener('click', () => {
  const keyword = document.getElementById('search-keyword').value;
  if (!keyword.trim()) {
    alert('请输入产品关键词');
    return;
  }
  btnDiscover.disabled = true;
  btnDiscover.textContent = 'AI 匹配中...';
  setTimeout(() => {
    const count = Math.floor(Math.random() * 200) + 50;
    matchCount.textContent = count;
    discoverResult.style.display = 'block';
    btnDiscover.disabled = false;
    btnDiscover.innerHTML = '<span class="btn-icon">⚡</span> 一键智能匹配';
  }, 1500);
});

// Render customer table
function renderCustomerTable(customers) {
  const tbody = document.getElementById('customer-tbody');
  const statusMap = { new: '新发现', follow: '跟进中', won: '已成交' };
  const statusClass = { new: 'badge-new', follow: 'badge-follow', won: 'badge-won' };
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td class="company-name">${c.company}</td>
      <td>${c.contact}</td>
      <td>${c.region}</td>
      <td><span class="match-score">${c.match}%</span></td>
      <td><span class="badge ${statusClass[c.status]}">${statusMap[c.status]}</span></td>
      <td><a class="link-btn" data-id="${c.id}">查看详情</a></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('.link-btn').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openDetail(parseInt(link.dataset.id));
    });
  });
}

// Open customer detail modal
function openDetail(id) {
  const c = mockCustomers.find(x => x.id === id);
  if (!c) return;
  const statusMap = { new: '新发现', follow: '跟进中', won: '已成交' };
  document.getElementById('detail-company').textContent = c.company;
  document.getElementById('detail-status').textContent = statusMap[c.status];
  document.getElementById('detail-code').textContent = c.code;
  document.getElementById('detail-region').textContent = c.region;
  document.getElementById('detail-volume').textContent = c.volume;
  document.getElementById('detail-contact').textContent = c.contact;
  document.getElementById('detail-title').textContent = c.title;
  document.getElementById('detail-email').textContent = c.email;
  document.getElementById('detail-email').href = `mailto:${c.email}`;

  const timeline = document.getElementById('follow-timeline');
  const follows = mockFollowUps[id] || [];
  timeline.innerHTML = follows.length ? follows.map(f => `
    <li>
      <div class="timeline-date">${f.date}</div>
      <div class="timeline-note">${f.note}</div>
    </li>
  `).join('') : '<li><div class="timeline-note" style="color:var(--text-muted)">暂无跟进记录</div></li>';

  document.getElementById('follow-note').value = '';
  document.getElementById('follow-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('customer-detail').classList.add('active');
}

// Close modal
document.querySelectorAll('[data-close="modal"]').forEach(el => {
  el.addEventListener('click', () => {
    document.getElementById('customer-detail').classList.remove('active');
  });
});

// Add follow-up
document.getElementById('btn-add-follow')?.addEventListener('click', () => {
  const note = document.getElementById('follow-note').value;
  const date = document.getElementById('follow-date').value;
  if (!note.trim()) return;
  const activeCompany = document.getElementById('detail-company').textContent;
  const c = mockCustomers.find(x => x.company === activeCompany);
  if (c) {
    if (!mockFollowUps[c.id]) mockFollowUps[c.id] = [];
    mockFollowUps[c.id].unshift({ date, note });
    openDetail(c.id);
  }
});

// Search customers
document.getElementById('customer-search')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = mockCustomers.filter(c =>
    c.company.toLowerCase().includes(q) ||
    c.contact.toLowerCase().includes(q) ||
    c.region.toLowerCase().includes(q)
  );
  renderCustomerTable(filtered);
});

// Init
renderCustomerTable(mockCustomers);
