// =============================================
//   PATRIK VEÍCULOS — script.js
// =============================================

// ── CONFIGURAÇÕES ─────────────────────────────
var CONFIG = {
  cloudinaryCloud:  'dzqyqfqni',
  cloudinaryPreset: 'patrik_veiculos',
  jsonbinId:        '69fb9c23c0954111d8e81015',
  jsonbinKey:       '$2a$10$oHlqWBJRiQHv.xlFSaNPtuN55dd.sS1KFylI9nsdrxn4ZIXEfaCFq',
  whatsapp:         '5548996192000'
};

// ── ESTADO GLOBAL ─────────────────────────────
var currentCars    = [];
var activeFilter   = 'todos';
var searchTerm     = '';
var adminPhotos    = [];
var adminLoggedIn  = false;
var isLoading      = false;
// Hashes SHA-256 — nunca armazene senhas em texto puro no frontend
// Para gerar novo hash: crypto.subtle.digest('SHA-256', new TextEncoder().encode('suasenha'))
//   .then(b => console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))
var ADMIN_USER_HASH = 'f4f5bb0e870b0e8aff4b1f5fa4a798d87a04d7958edc7865f72a2a53ea123f3d';
var ADMIN_PASS_HASH = 'f6874aac2bdc3f57125c1b91c0d27c4c30cf8a12b55c1f44c346fd5c9a7eafc5';

// ── JSONBIN — CARREGAR ────────────────────────
function loadCars(callback) {
  var url = 'https://api.jsonbin.io/v3/b/' + CONFIG.jsonbinId + '/latest';
  fetch(url, { headers: { 'X-Master-Key': CONFIG.jsonbinKey } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      currentCars = (data.record && Array.isArray(data.record.carros))
        ? data.record.carros : [];
      if (callback) callback();
    })
    .catch(function() {
      try {
        var s = localStorage.getItem('patrik_cars');
        currentCars = s ? JSON.parse(s) : [];
      } catch(e) { currentCars = []; }
      if (callback) callback();
    });
}

// ── JSONBIN — SALVAR ──────────────────────────
function saveCarsRemote(callback) {
  try { localStorage.setItem('patrik_cars', JSON.stringify(currentCars)); } catch(e) {}
  fetch('https://api.jsonbin.io/v3/b/' + CONFIG.jsonbinId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.jsonbinKey
    },
    body: JSON.stringify({ carros: currentCars })
  })
  .then(function() { if (callback) callback(true); })
  .catch(function() { if (callback) callback(false); });
}

// ── HELPERS ───────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCarImgs(car) {
  if (!car.img) return [];
  try {
    var p = JSON.parse(car.img);
    return Array.isArray(p) ? p.filter(Boolean) : [car.img];
  } catch(e) {
    return car.img ? [car.img] : [];
  }
}

function getFirstImg(car) {
  var imgs = getCarImgs(car);
  return imgs.length ? imgs[0] : '';
}

function fmtPrice(p) {
  if (!p) return '0,00';
  return p.indexOf(',') !== -1 ? p : p + ',00';
}

// ── RENDER ESTOQUE ────────────────────────────
function renderCars() {
  var grid = document.getElementById('carsGrid');

  if (isLoading) {
    grid.innerHTML = '<div class="no-cars"><p style="font-size:32px;margin-bottom:12px;">&#9203;</p><p>Carregando estoque...</p></div>';
    return;
  }

  var list = currentCars.filter(function(c) { return c.status === 'disponivel'; });

  if (activeFilter !== 'todos') {
    list = list.filter(function(c) { return c.tipo === activeFilter; });
  }
  if (searchTerm) {
    var q = searchTerm.toLowerCase();
    list = list.filter(function(c) {
      return (c.marca + c.modelo + c.versao + c.ano + c.cor).toLowerCase().indexOf(q) !== -1;
    });
  }

  var total = currentCars.filter(function(c) { return c.status === 'disponivel'; }).length;
  document.getElementById('countCars').textContent = total;

  if (!list.length) {
    grid.innerHTML = '<div class="no-cars"><p style="font-size:40px;margin-bottom:16px">&#128269;</p><p>Nenhum veículo encontrado.</p></div>';
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  // paginação
  var totalPages = Math.ceil(list.length / CARS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  var start = (currentPage - 1) * CARS_PER_PAGE;
  var end   = start + CARS_PER_PAGE;
  var paginated = list.slice(start, end);

  // atualizar controles de paginação
  var pagDiv = document.getElementById('pagination');
  if (totalPages > 1) {
    pagDiv.style.display = 'flex';
    document.getElementById('page-info').textContent = 'Página ' + currentPage + ' de ' + totalPages;
    document.getElementById('btn-prev').disabled = currentPage === 1;
    document.getElementById('btn-prev').style.opacity = currentPage === 1 ? '0.4' : '1';
    document.getElementById('btn-next').disabled = currentPage === totalPages;
    document.getElementById('btn-next').style.opacity = currentPage === totalPages ? '0.4' : '1';
  } else {
    pagDiv.style.display = 'none';
  }

  var html = '';
  for (var i = 0; i < paginated.length; i++) {
    var c = paginated[i];
    var img = getFirstImg(c);
    var safeId = escapeHtml(c.id);
    html += '<div class="car-card" onclick="openCarPage(\'' + safeId + '\')">';
    html += '  <div class="car-card-img">';
    if (img) {
      html += '    <img src="' + escapeHtml(img) + '" alt="' + escapeHtml(c.marca) + ' ' + escapeHtml(c.modelo) + '" style="object-position:' + escapeHtml(c.position || 'center') + ';" onerror="this.style.display=\'none\'">';
    }
    html += '    <div class="car-badge">' + escapeHtml(c.combustivel) + '</div>';
    html += '  </div>';
    html += '  <div class="car-card-body">';
    html += '    <div class="car-name">' + escapeHtml(c.marca) + ' ' + escapeHtml(c.modelo) + '</div>';
    html += '    <div class="car-version">' + escapeHtml(c.versao) + ' &bull; ' + escapeHtml(c.ano) + '</div>';
    html += '    <div class="car-specs">';
    html += '      <span class="car-spec">&#128205; ' + escapeHtml(c.km) + ' km</span>';
    html += '      <span class="car-spec">&#9881; ' + escapeHtml(c.cambio) + '</span>';
    html += '      <span class="car-spec">&#127912; ' + escapeHtml(c.cor) + '</span>';
    html += '    </div>';
    html += '    <div class="car-price-label">Valor</div>';
    html += '    <div class="car-price">R$ ' + escapeHtml(fmtPrice(c.preco)) + '</div>';
    html += '    <div class="car-card-footer">';
    html += '      <button class="car-btn-detail" onclick="event.stopPropagation();openCarPage(\'' + safeId + '\')">Ver Detalhes</button>';
    html += '      <button class="car-btn-wpp" onclick="event.stopPropagation();sendWpp(\'' + safeId + '\')">&#128172; WhatsApp</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  }
  grid.innerHTML = html;
}

var currentPage   = 1;
var CARS_PER_PAGE = 12;

function filterCars(tipo, btn) {
  activeFilter = tipo;
  currentPage  = 1;
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderCars();
}

function searchCars() {
  searchTerm  = document.getElementById('searchInput').value;
  currentPage = 1;
  renderCars();
}

function changePage(dir) {
  currentPage += dir;
  renderCars();
  document.getElementById('estoque').scrollIntoView({ behavior: 'smooth' });
}

// ── PÁGINA DO CARRO (nova aba) ────────────────
function openCarPage(id) {
  var car = currentCars.find(function(c) { return c.id === id; });
  if (!car) return;

  var imgs   = getCarImgs(car);
  var preco  = escapeHtml(fmtPrice(car.preco));
  var tipo   = escapeHtml(car.tipo.charAt(0).toUpperCase() + car.tipo.slice(1));
  var wppMsg = encodeURIComponent('Olá! Vi o ' + car.marca + ' ' + car.modelo + ' ' + car.versao + ' ' + car.ano + ' no site da Patrik Veículos e tenho interesse!');
  var wppLink = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + wppMsg;

  // slider
  var sliderHtml = '';
  if (!imgs.length) {
    sliderHtml = '<div style="height:280px;display:flex;align-items:center;justify-content:center;color:#555;font-family:Montserrat,sans-serif;background:#1a1a1a;border-radius:12px;">Sem foto disponível</div>';
  } else if (imgs.length === 1) {
    sliderHtml = '<div style="aspect-ratio:16/10;overflow:hidden;border-radius:12px;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;"></div>';
  } else {
    sliderHtml += '<div id="sWrap" style="position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:12px;">';
    sliderHtml += '  <img id="sImg" src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;transition:opacity 0.3s;">';
    sliderHtml += '  <button onclick="sPrev()" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#8249;</button>';
    sliderHtml += '  <button onclick="sNext()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#8250;</button>';
    sliderHtml += '  <div id="sCnt" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.65);color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;font-family:Montserrat,sans-serif;">1 / ' + imgs.length + '</div>';
    sliderHtml += '</div>';
    sliderHtml += '<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">';
    for (var t = 0; t < imgs.length; t++) {
      sliderHtml += '<img src="' + imgs[t] + '" id="th' + t + '" onclick="sGo(' + t + ')" style="width:72px;height:52px;object-fit:cover;border-radius:6px;cursor:pointer;flex-shrink:0;border:' + (t === 0 ? '2px solid #F97316' : '2px solid transparent') + ';opacity:' + (t === 0 ? '1' : '0.65') + ';transition:all 0.2s;">';
    }
    sliderHtml += '</div>';
  }

  // opcionais
  var opHtml = '';
  if (car.opcionais) {
    var opts = car.opcionais.split(',');
    for (var o = 0; o < opts.length; o++) {
      var op = opts[o].trim();
      if (op) {
        opHtml += '<span style="background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.3);color:#FD8A2E;font-size:12px;padding:5px 12px;border-radius:4px;font-family:Montserrat,sans-serif;font-weight:500;">' + op + '</span>';
      }
    }
  }

  // slider JS — injetado como string para evitar conflito com tag script
  var sjs = '';
  if (imgs.length > 1) {
    sjs += 'var sImgs=' + JSON.stringify(imgs) + ';';
    sjs += 'var sIdx=0;';
    sjs += 'function sGo(i){';
    sjs += '  sIdx=i;';
    sjs += '  var el=document.getElementById("sImg");';
    sjs += '  el.style.opacity=0;';
    sjs += '  setTimeout(function(){el.src=sImgs[i];el.style.opacity=1;},150);';
    sjs += '  document.getElementById("sCnt").textContent=(i+1)+" / "+sImgs.length;';
    sjs += '  var ts=document.querySelectorAll("[id^=th]");';
    sjs += '  for(var k=0;k<ts.length;k++){';
    sjs += '    ts[k].style.border=k===i?"2px solid #F97316":"2px solid transparent";';
    sjs += '    ts[k].style.opacity=k===i?"1":"0.65";';
    sjs += '  }';
    sjs += '}';
    sjs += 'function sNext(){sGo((sIdx+1)%sImgs.length);}';
    sjs += 'function sPrev(){sGo((sIdx-1+sImgs.length)%sImgs.length);}';
    sjs += '(function(){';
    sjs += '  var w=document.getElementById("sWrap");';
    sjs += '  if(!w)return;';
    sjs += '  var sx=0;';
    sjs += '  w.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;});';
    sjs += '  w.addEventListener("touchend",function(e){';
    sjs += '    var dx=e.changedTouches[0].clientX-sx;';
    sjs += '    if(Math.abs(dx)>40){dx<0?sNext():sPrev();}';
    sjs += '  });';
    sjs += '})();';
  }

  // montar página
  var pg = '';
  pg += '<!DOCTYPE html><html lang="pt-BR"><head>';
  pg += '<meta charset="UTF-8">';
  pg += '<meta name="viewport" content="width=device-width,initial-scale=1">';
  pg += '<title>' + escapeHtml(car.marca) + ' ' + escapeHtml(car.modelo) + ' &mdash; Patrik Ve&iacute;culos</title>';
  pg += '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
  pg += '<style>';
  pg += '*{margin:0;padding:0;box-sizing:border-box;}';
  pg += 'body{background:#0A0A0A;color:#fff;font-family:Montserrat,sans-serif;}';
  pg += '::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px;}';
  pg += '.bar{background:#111;border-bottom:1px solid rgba(249,115,22,0.2);padding:14px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;}';
  pg += '.back{color:#F97316;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;}';
  pg += '.back:hover{color:#fd8a2e;}';
  pg += '.logo{font-family:"Bebas Neue",sans-serif;font-size:22px;letter-spacing:2px;color:#F97316;}';
  pg += '.hero{background:linear-gradient(135deg,#111,#1a1a1a);padding:40px 32px;}';
  pg += '.grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:start;}';
  pg += '.badges{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}';
  pg += '.bdg{background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.3);color:#F97316;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;letter-spacing:1px;text-transform:uppercase;}';
  pg += '.ctitle{font-family:"Bebas Neue",sans-serif;font-size:48px;letter-spacing:2px;line-height:1;margin-bottom:6px;}';
  pg += '.csub{color:#888;font-size:15px;margin-bottom:24px;}';
  pg += '.pbox{background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;}';
  pg += '.plbl{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;}';
  pg += '.pval{font-family:"Bebas Neue",sans-serif;font-size:52px;color:#F97316;}';
  pg += '.wbtn{width:100%;background:#25D366;border:none;color:#fff;padding:16px;border-radius:10px;font-family:Montserrat,sans-serif;font-weight:800;font-size:15px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;margin-bottom:12px;transition:background 0.2s;}';
  pg += '.wbtn:hover{background:#20BA5A;}';
  pg += '.cbtn{width:100%;background:transparent;border:2px solid rgba(255,255,255,0.15);color:#fff;padding:14px;border-radius:10px;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;transition:all 0.2s;}';
  pg += '.cbtn:hover{border-color:#F97316;color:#F97316;}';
  pg += '.specs{max-width:1100px;margin:0 auto;padding:40px 32px;}';
  pg += '.stitle{font-family:"Bebas Neue",sans-serif;font-size:32px;letter-spacing:2px;margin-bottom:20px;}';
  pg += '.stitle span{color:#F97316;}';
  pg += '.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:40px;}';
  pg += '.scard{background:#1a1a1a;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;}';
  pg += '.slbl{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;}';
  pg += '.sval{font-size:16px;font-weight:700;}';
  pg += '.opts{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:40px;}';
  pg += '.desc{background:#1a1a1a;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:24px;margin-bottom:40px;}';
  pg += '.desc p{color:#888;font-size:15px;line-height:1.8;}';
  pg += '.ftr{background:#111;border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;text-align:center;color:#555;font-size:12px;}';
  pg += '.ftr span{color:#F97316;}';
  pg += '@media(max-width:768px){.grid{grid-template-columns:1fr;}.ctitle{font-size:36px;}.pval{font-size:40px;}.hero,.specs{padding:24px 16px;}.bar{padding:12px 16px;}}';
  pg += '</style></head><body>';

  pg += '<div class="bar">';
  pg += '  <a href="javascript:window.close()" class="back">&#8592; Voltar ao Estoque</a>';
  pg += '  <div class="logo">PATRIK VE&Iacute;CULOS</div>';
  pg += '</div>';

  pg += '<div class="hero"><div class="grid">';
  pg += '  <div>' + sliderHtml + '</div>';
  pg += '  <div>';
  pg += '    <div class="badges"><span class="bdg">' + escapeHtml(car.combustivel) + '</span><span class="bdg">' + escapeHtml(car.cambio) + '</span><span class="bdg">' + tipo + '</span></div>';
  pg += '    <div class="ctitle">' + escapeHtml(car.marca) + ' ' + escapeHtml(car.modelo) + '</div>';
  pg += '    <div class="csub">' + escapeHtml(car.versao || '') + ' &nbsp;&bull;&nbsp; ' + escapeHtml(car.ano) + '</div>';
  pg += '    <div class="pbox"><div class="plbl">Valor</div><div class="pval">R$ ' + preco + '</div></div>';
  pg += '    <a href="' + wppLink + '" target="_blank" class="wbtn">&#128172; Tenho Interesse &mdash; WhatsApp</a>';
  pg += '    <a href="tel:+' + CONFIG.whatsapp + '" class="cbtn">&#128222; Ligar: (48) 99619-2000</a>';
  pg += '  </div>';
  pg += '</div></div>';

  pg += '<div class="specs">';
  pg += '  <div class="stitle">FICHA <span>T&Eacute;CNICA</span></div>';
  pg += '  <div class="sgrid">';
  pg += '    <div class="scard"><div class="slbl">Marca</div><div class="sval">'            + escapeHtml(car.marca)              + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Modelo</div><div class="sval">'           + escapeHtml(car.modelo)             + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Vers&atilde;o</div><div class="sval">'    + (car.versao ? escapeHtml(car.versao) : '&mdash;') + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Ano</div><div class="sval">'              + escapeHtml(car.ano)                + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Quilometragem</div><div class="sval">'   + escapeHtml(car.km) + ' km'         + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Combust&iacute;vel</div><div class="sval">' + escapeHtml(car.combustivel)     + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">C&acirc;mbio</div><div class="sval">'    + escapeHtml(car.cambio)             + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Cor</div><div class="sval">'              + escapeHtml(car.cor)               + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Portas</div><div class="sval">'           + escapeHtml(car.portas)            + '</div></div>';
  pg += '    <div class="scard"><div class="slbl">Categoria</div><div class="sval">'        + tipo                              + '</div></div>';
  pg += '  </div>';
  if (opHtml) {
    pg += '  <div class="stitle">OPCIONAIS</div>';
    pg += '  <div class="opts">' + opHtml + '</div>';
  }
  if (car.descricao) {
    pg += '  <div class="stitle">DESCRI&Ccedil;&Atilde;O</div>';
    pg += '  <div class="desc"><p>' + escapeHtml(car.descricao) + '</p></div>';
  }
  pg += '</div>';

  pg += '<div class="ftr">&copy; 2025 <span>Patrik Ve&iacute;culos</span> &mdash; Bairro Paraguai, Jacinto Machado/SC &mdash; (48) 99619-2000</div>';

  if (sjs) {
    pg += '<scr' + 'ipt>' + sjs + '<\/scr' + 'ipt>';
  }
  pg += '</body></html>';

  var blob = new Blob([pg], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function sendWpp(id) {
  var car = currentCars.find(function(c) { return c.id === id; });
  if (!car) return;
  var msg = encodeURIComponent('Olá! Vi o ' + car.marca + ' ' + car.modelo + ' ' + car.versao + ' ' + car.ano + ' no site da Patrik Veículos e tenho interesse!');
  window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + msg, '_blank');
}

// ── CONTATO ───────────────────────────────────
function sendContactWpp() {
  var nome    = document.getElementById('cf-nome').value.trim();
  var tel     = document.getElementById('cf-tel').value.trim();
  var assunto = document.getElementById('cf-assunto').value;
  var msg     = document.getElementById('cf-msg').value.trim();
  if (!nome || !tel) { alert('Preencha seu nome e telefone!'); return; }
  var text = encodeURIComponent('Olá! Me chamo ' + nome + '. Assunto: ' + assunto + '. ' + (msg ? msg + ' ' : '') + 'Meu contato: ' + tel);
  window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + text, '_blank');
}

// ── NAVBAR ────────────────────────────────────
window.addEventListener('scroll', function() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu()  { document.getElementById('mobileMenu').classList.remove('open'); }

// ── ADMIN — LOGIN ─────────────────────────────
function openAdmin() {
  document.getElementById('admin-panel').style.display = 'block';
  document.body.style.overflow = 'hidden';
  if (adminLoggedIn) showAdminMain();
}
function closeAdmin() {
  document.getElementById('admin-panel').style.display = 'none';
  document.body.style.overflow = '';
}
function showAdminMain() {
  document.getElementById('admin-login-screen').style.display = 'none';
  document.getElementById('admin-main').style.display = 'block';
  renderAdminList();
}
function adminLogout() {
  adminLoggedIn = false;
  document.getElementById('admin-main').style.display = 'none';
  document.getElementById('admin-login-screen').style.display = 'flex';
  closeAdmin();
}
function sha256(str) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
    .then(function(buf) {
      return Array.from(new Uint8Array(buf))
        .map(function(b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
}

function doLogin() {
  var u = document.getElementById('admin-user').value;
  var p = document.getElementById('admin-pass').value;
  Promise.all([sha256(u), sha256(p)]).then(function(hashes) {
    if (hashes[0] === ADMIN_USER_HASH && hashes[1] === ADMIN_PASS_HASH) {
      adminLoggedIn = true;
      showAdminMain();
    } else {
      var err = document.getElementById('admin-error-msg');
      err.style.display = 'block';
      setTimeout(function() { err.style.display = 'none'; }, 3000);
    }
  });
}

// ── ADMIN — TABS ──────────────────────────────
function adminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'estoque') renderAdminList();
}

// ── CLOUDINARY — UPLOAD ───────────────────────
function uploadToCloudinary(file, onSuccess, onError) {
  var fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CONFIG.cloudinaryPreset);
  fd.append('folder', 'patrik-veiculos');
  fetch('https://api.cloudinary.com/v1_1/' + CONFIG.cloudinaryCloud + '/image/upload', {
    method: 'POST',
    body: fd
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    console.log('Cloudinary response:', data);
    if (data.secure_url) onSuccess(data.secure_url);
    else onError(data.error ? data.error.message : 'Erro no upload');
  })
  .catch(function(e) { console.error('Cloudinary fetch error:', e); onError(e.message || e); });
}

function handleImgUpload(input) {
  var files = Array.from(input.files);
  if (!files.length) return;

  var remaining = 8 - adminPhotos.length;
  if (remaining <= 0) { alert('Limite de 8 fotos atingido!'); input.value = ''; return; }

  var toAdd = files.slice(0, remaining);
  if (files.length > remaining) alert('Apenas ' + remaining + ' foto(s) adicionada(s). Limite de 8.');

  var total  = toAdd.length;
  var done   = 0;
  var errors = 0;
  var prog   = document.getElementById('upload-progress');

  document.getElementById('img-filename').textContent = 'Enviando para a nuvem...';
  prog.style.display = 'block';
  prog.textContent   = 'Enviando 0 de ' + total + '...';

  toAdd.forEach(function(file) {
    uploadToCloudinary(
      file,
      function(url) {
        adminPhotos.push(url);
        done++;
        prog.textContent = 'Enviando ' + done + ' de ' + total + '...';
        if (done === total) finalizeUpload(total, errors);
      },
      function() {
        errors++;
        done++;
        prog.textContent = 'Enviando ' + done + ' de ' + total + '...';
        if (done === total) finalizeUpload(total, errors);
      }
    );
  });
}

function finalizeUpload(total, errors) {
  var prog = document.getElementById('upload-progress');
  prog.style.display = 'none';
  document.getElementById('img-filename').textContent =
    adminPhotos.length + ' foto(s) na nuvem' + (errors > 0 ? ' (' + errors + ' erro(s))' : ' &#9729;&#65039;');
  document.getElementById('car-img').value = JSON.stringify(adminPhotos);
  document.getElementById('car-img-file').value = '';
  renderGalleryPreview();
}

function renderGalleryPreview() {
  var g = document.getElementById('gallery-preview');
  if (!g) return;
  if (!adminPhotos.length) { g.innerHTML = ''; return; }
  var h = '';
  for (var i = 0; i < adminPhotos.length; i++) {
    var border = i === 0 ? '2px solid var(--orange)' : '2px solid rgba(255,255,255,0.1)';
    h += '<div class="gallery-thumb" style="border:' + border + ';">';
    h += '  <img src="' + adminPhotos[i] + '">';
    if (i === 0) {
      h += '  <div style="position:absolute;top:4px;left:4px;background:var(--orange);color:#000;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px;font-family:Montserrat,sans-serif;">CAPA</div>';
    }
    h += '  <div style="position:absolute;top:4px;right:4px;display:flex;gap:4px;">';
    if (i > 0) {
      h += '    <button onclick="movePhoto(' + i + ')" title="Definir como capa" style="background:rgba(0,0,0,0.7);border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:11px;">&#9664;</button>';
    }
    h += '    <button onclick="removePhoto(' + i + ')" style="background:rgba(220,38,38,0.85);border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:13px;">&#10005;</button>';
    h += '  </div>';
    h += '</div>';
  }
  g.innerHTML = h;
}

function removePhoto(i) {
  adminPhotos.splice(i, 1);
  document.getElementById('car-img').value = adminPhotos.length ? JSON.stringify(adminPhotos) : '';
  document.getElementById('img-filename').textContent = adminPhotos.length ? adminPhotos.length + ' foto(s)' : 'Nenhuma foto';
  renderGalleryPreview();
}

function movePhoto(i) {
  if (i === 0) return;
  var tmp = adminPhotos[i - 1];
  adminPhotos[i - 1] = adminPhotos[i];
  adminPhotos[i] = tmp;
  document.getElementById('car-img').value = JSON.stringify(adminPhotos);
  renderGalleryPreview();
}

// ── ADMIN — FORMULÁRIO ────────────────────────
function formatPrice(el) {
  var v = el.value.replace(/\D/g, '');
  if (!v.length) { el.value = ''; return; }
  while (v.length < 3) v = '0' + v;
  el.value = parseInt(v.slice(0, -2), 10).toLocaleString('pt-BR') + ',' + v.slice(-2);
}

function formatKm(el) {
  var v = el.value.replace(/\D/g, '');
  if (v) el.value = parseInt(v, 10).toLocaleString('pt-BR');
}

function saveCar() {
  var marca       = document.getElementById('car-marca').value.trim();
  var modelo      = document.getElementById('car-modelo').value.trim();
  var preco       = document.getElementById('car-preco').value.trim();
  var km          = document.getElementById('car-km').value.trim();
  var ano         = document.getElementById('car-ano').value.trim();
  var combustivel = document.getElementById('car-combustivel').value;
  var cambio      = document.getElementById('car-cambio').value;

  if (!marca || !modelo || !preco || !km || !ano || !combustivel || !cambio) {
    alert('Preencha os campos obrigatórios (*)'); return;
  }

  var btn = document.getElementById('admin-save-btn');
  btn.textContent = 'Salvando...';
  btn.disabled    = true;

  var editId = document.getElementById('edit-car-id').value;
  var car = {
    id:          editId || 'car_' + Date.now(),
    marca:       marca,
    modelo:      modelo,
    versao:      document.getElementById('car-versao').value.trim(),
    ano:         ano,
    preco:       preco,
    km:          km,
    combustivel: combustivel,
    cambio:      cambio,
    cor:         document.getElementById('car-cor').value.trim() || 'Não informado',
    tipo:        document.getElementById('car-tipo').value,
    portas:      document.getElementById('car-portas').value,
    position:    document.getElementById('car-position').value,
    status:      document.getElementById('car-status').value,
    img:         document.getElementById('car-img').value,
    opcionais:   document.getElementById('car-opcionais').value.trim(),
    descricao:   document.getElementById('car-descricao').value.trim()
  };

  if (editId) {
    var idx = currentCars.findIndex(function(c) { return c.id === editId; });
    if (idx !== -1) currentCars[idx] = car;
  } else {
    currentCars.push(car);
  }

  saveCarsRemote(function(ok) {
    btn.disabled    = false;
    btn.textContent = editId ? '&#128190; Atualizar Veículo' : '&#128190; Salvar Veículo';
    renderCars();
    clearForm();
    showToast(ok
      ? (editId ? 'Veículo atualizado!' : 'Veículo cadastrado!')
      : 'Salvo localmente (verifique a conexão)');
    adminTab('estoque', document.querySelectorAll('.admin-tab')[1]);
  });
}

function clearForm() {
  ['car-marca','car-modelo','car-versao','car-ano','car-preco','car-km',
   'car-cor','car-img','car-opcionais','car-descricao'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('car-combustivel').value = '';
  document.getElementById('car-cambio').value      = '';
  document.getElementById('car-tipo').value        = 'hatch';
  document.getElementById('car-status').value      = 'disponivel';
  document.getElementById('car-position').value    = 'center';
  document.getElementById('edit-car-id').value     = '';
  adminPhotos = [];
  document.getElementById('car-img-file').value       = '';
  document.getElementById('img-filename').textContent  = 'Nenhuma foto';
  document.getElementById('gallery-preview').innerHTML = '';
  document.getElementById('upload-progress').style.display = 'none';
  document.getElementById('admin-form-title').textContent  = 'Cadastrar Novo Veículo';
  document.getElementById('admin-save-btn').textContent    = '&#128190; Salvar Veículo';
  document.getElementById('admin-cancel-btn').style.display = 'none';
}

function cancelEdit() { clearForm(); }

function editCar(id) {
  var car = currentCars.find(function(c) { return c.id === id; });
  if (!car) return;
  adminTab('cadastrar', document.querySelectorAll('.admin-tab')[0]);
  document.getElementById('edit-car-id').value      = car.id;
  document.getElementById('car-marca').value        = car.marca;
  document.getElementById('car-modelo').value       = car.modelo;
  document.getElementById('car-versao').value       = car.versao || '';
  document.getElementById('car-ano').value          = car.ano;
  document.getElementById('car-preco').value        = car.preco;
  document.getElementById('car-km').value           = car.km;
  document.getElementById('car-combustivel').value  = car.combustivel;
  document.getElementById('car-cambio').value       = car.cambio;
  document.getElementById('car-cor').value          = car.cor;
  document.getElementById('car-tipo').value         = car.tipo;
  document.getElementById('car-portas').value       = car.portas;
  document.getElementById('car-status').value       = car.status;
  document.getElementById('car-position').value     = car.position || 'center';
  document.getElementById('car-img').value          = car.img || '';
  document.getElementById('car-opcionais').value    = car.opcionais || '';
  document.getElementById('car-descricao').value    = car.descricao || '';
  adminPhotos = [];
  if (car.img) {
    try {
      var p = JSON.parse(car.img);
      adminPhotos = Array.isArray(p) ? p : [car.img];
    } catch(e) { adminPhotos = [car.img]; }
  }
  document.getElementById('img-filename').textContent = adminPhotos.length ? adminPhotos.length + ' foto(s)' : 'Nenhuma foto';
  renderGalleryPreview();
  document.getElementById('admin-form-title').textContent    = 'Editar Veículo';
  document.getElementById('admin-save-btn').textContent      = '&#128190; Atualizar Veículo';
  document.getElementById('admin-cancel-btn').style.display  = 'inline-block';
}

function deleteCar(id) {
  if (!confirm('Remover este veículo?')) return;
  currentCars = currentCars.filter(function(c) { return c.id !== id; });
  saveCarsRemote(function() {
    renderCars();
    renderAdminList();
    showToast('Veículo removido!');
  });
}

// ── ADMIN — LISTA ─────────────────────────────
function renderAdminList() {
  var el = document.getElementById('admin-cars-list');
  if (!currentCars.length) {
    el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:60px;">Nenhum veículo cadastrado ainda.</p>';
    return;
  }
  var h = '<h3 style="font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;color:var(--orange);margin-bottom:20px;">' + currentCars.length + ' veículo(s) no sistema</h3>';
  for (var i = 0; i < currentCars.length; i++) {
    var c   = currentCars[i];
    var img = getFirstImg(c);
    var sc  = c.status === 'disponivel' ? '#4ADE80' : c.status === 'vendido' ? '#ef4444' : '#fbbf24';
    var sl  = escapeHtml(c.status.charAt(0).toUpperCase() + c.status.slice(1));
    var safeId = escapeHtml(c.id);
    h += '<div class="admin-car-row">';
    h += '  <div style="width:60px;height:40px;background:var(--dark3);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-width:60px;">';
    if (img) h += '    <img src="' + escapeHtml(img) + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">';
    else h += '&#128663;';
    h += '  </div>';
    h += '  <div class="admin-car-row-info">';
    h += '    <h4>' + escapeHtml(c.marca) + ' ' + escapeHtml(c.modelo) + ' ' + escapeHtml(c.versao || '') + '</h4>';
    h += '    <p>' + escapeHtml(c.ano) + ' &bull; ' + escapeHtml(c.km) + ' km &bull; R$ ' + escapeHtml(fmtPrice(c.preco)) + ' &bull; <span style="color:' + sc + '">' + sl + '</span></p>';
    h += '  </div>';
    h += '  <div class="admin-car-row-actions">';
    h += '    <button class="btn-edit" onclick="editCar(\'' + safeId + '\')">&#9998; Editar</button>';
    h += '    <button class="btn-del" onclick="deleteCar(\'' + safeId + '\')">&#128465; Remover</button>';
    h += '  </div>';
    h += '</div>';
  }
  el.innerHTML = h;
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  var t = document.getElementById('successToast');
  t.textContent = '✅ ' + msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3500);
}

// ── CONTADOR ANIMADO ──────────────────────────
function animateCounter(el, target, ms) {
  var cur  = 0;
  var step = target / (ms / 16);
  var timer = setInterval(function() {
    cur += step;
    if (cur >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(cur);
  }, 16);
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  isLoading = true;
  renderCars();
  loadCars(function() {
    isLoading = false;
    renderCars();
    var total = currentCars.filter(function(c) { return c.status === 'disponivel'; }).length;
    animateCounter(document.getElementById('countCars'), total, 1200);
  });

  // Link secreto admin — acesse: seusite.com/#admin-patrik
  if (window.location.hash === '#admin-patrik') {
    history.replaceState(null, '', window.location.pathname);
    openAdmin();
  }
});

window.addEventListener('hashchange', function() {
  if (window.location.hash === '#admin-patrik') {
    history.replaceState(null, '', window.location.pathname);
    openAdmin();
  }
});