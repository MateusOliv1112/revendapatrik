// =============================================
//   PATRIK VEÍCULOS — script.js
// =============================================


// ── STORAGE ───────────────────────────────────
function getCars() {
  try {
    var s = localStorage.getItem('patrik_cars');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return JSON.parse(JSON.stringify(defaultCars));
}
function saveCars(cars) {
  localStorage.setItem('patrik_cars', JSON.stringify(cars));
}

// ── ESTADO GLOBAL ─────────────────────────────
var currentCars  = getCars();
var activeFilter = 'todos';
var searchTerm   = '';
var adminPhotos  = [];
var adminLoggedIn = false;
var ADMIN_USER   = 'patrik';
var ADMIN_PASS   = 'patrik2025';

// ── HELPERS ───────────────────────────────────
function getCarImgs(car) {
  if (!car.img) return [];
  try {
    var p = JSON.parse(car.img);
    return Array.isArray(p) ? p.filter(Boolean) : [car.img];
  } catch (e) {
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
  var list = currentCars.filter(function (c) { return c.status === 'disponivel'; });

  if (activeFilter !== 'todos') {
    list = list.filter(function (c) { return c.tipo === activeFilter; });
  }
  if (searchTerm) {
    var q = searchTerm.toLowerCase();
    list = list.filter(function (c) {
      return (c.marca + c.modelo + c.versao + c.ano + c.cor).toLowerCase().indexOf(q) !== -1;
    });
  }

  var total = currentCars.filter(function (c) { return c.status === 'disponivel'; }).length;
  document.getElementById('countCars').textContent = total;

  if (!list.length) {
    grid.innerHTML = '<div class="no-cars"><p style="font-size:40px;margin-bottom:16px">🔍</p><p>Nenhum veículo encontrado.</p></div>';
    return;
  }

  var wppSvg = '<svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>';

  var html = '';
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    var img = getFirstImg(c);
    html += '<div class="car-card" onclick="openCarPage(\'' + c.id + '\')">';
    html += '  <div class="car-card-img">';
    if (img) html += '    <img src="' + img + '" alt="' + c.marca + ' ' + c.modelo + '" onerror="this.style.display=\'none\'">';
    html += '    <svg class="img-placeholder" width="48" height="48" fill="none" stroke="rgba(249,115,22,0.4)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 17H5M4 17l1.5-6h13L20 17M7 10V9a5 5 0 0 1 10 0v1"/></svg>';
    html += '    <div class="car-badge">' + c.combustivel + '</div>';
    html += '  </div>';
    html += '  <div class="car-card-body">';
    html += '    <div class="car-name">' + c.marca + ' ' + c.modelo + '</div>';
    html += '    <div class="car-version">' + c.versao + ' &bull; ' + c.ano + '</div>';
    html += '    <div class="car-specs">';
    html += '      <span class="car-spec"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 17H5l-1-7h16l-1 7h-4M9 17v2M15 17v2"/></svg>' + c.km + ' km</span>';
    html += '      <span class="car-spec"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>' + c.cambio + '</span>';
    html += '      <span class="car-spec"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9"/></svg>' + c.cor + '</span>';
    html += '    </div>';
    html += '    <div class="car-price-label">Valor</div>';
    html += '    <div class="car-price">R$ ' + fmtPrice(c.preco) + '</div>';
    html += '    <div class="car-card-footer">';
    html += '      <button class="car-btn-detail" onclick="event.stopPropagation();openCarPage(\'' + c.id + '\')">Ver Detalhes</button>';
    html += '      <button class="car-btn-wpp" onclick="event.stopPropagation();sendWpp(\'' + c.id + '\')">' + wppSvg + ' WhatsApp</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';
  }
  grid.innerHTML = html;
}

function filterCars(tipo, btn) {
  activeFilter = tipo;
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderCars();
}

function searchCars() {
  searchTerm = document.getElementById('searchInput').value;
  renderCars();
}

// ── PÁGINA DO CARRO (nova aba) ────────────────
function openCarPage(id) {
  var car = currentCars.find(function (c) { return c.id === id; });
  if (!car) return;

  var imgs  = getCarImgs(car);
  var preco = fmtPrice(car.preco);
  var wppMsg = encodeURIComponent('Olá! Vi o ' + car.marca + ' ' + car.modelo + ' ' + car.versao + ' ' + car.ano + ' no site da Patrik Veículos e tenho interesse!');
  var wppLink = 'https://wa.me/5548996192000?text=' + wppMsg;
  var tipo = car.tipo.charAt(0).toUpperCase() + car.tipo.slice(1);

  // ---------- slider HTML ----------
  var sliderHtml = '';
  if (!imgs.length) {
    sliderHtml = '<div style="height:300px;display:flex;align-items:center;justify-content:center;color:#555;font-family:Montserrat,sans-serif;">Sem foto disponível</div>';
  } else if (imgs.length === 1) {
    sliderHtml = '<div style="aspect-ratio:16/10;overflow:hidden;border-radius:12px;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;"></div>';
  } else {
    sliderHtml += '<div id="sWrap" style="position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:12px;">';
    sliderHtml += '<img id="sImg" src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;transition:opacity 0.3s;">';
    sliderHtml += '<button onclick="sPrev()" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:22px;cursor:pointer;">&#8249;</button>';
    sliderHtml += '<button onclick="sNext()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.6);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:22px;cursor:pointer;">&#8250;</button>';
    sliderHtml += '<div id="sCnt" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.65);color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;font-family:Montserrat,sans-serif;">1 / ' + imgs.length + '</div>';
    sliderHtml += '</div>';
    sliderHtml += '<div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:4px;">';
    for (var t = 0; t < imgs.length; t++) {
      sliderHtml += '<img src="' + imgs[t] + '" id="th' + t + '" onclick="sGo(' + t + ')" style="width:72px;height:52px;object-fit:cover;border-radius:6px;cursor:pointer;flex-shrink:0;border:' + (t === 0 ? '2px solid #F97316' : '2px solid transparent') + ';opacity:' + (t === 0 ? '1' : '0.65') + ';transition:all 0.2s;">';
    }
    sliderHtml += '</div>';
  }

  // ---------- opcionais ----------
  var opHtml = '';
  if (car.opcionais) {
    var opts = car.opcionais.split(',');
    for (var o = 0; o < opts.length; o++) {
      var op = opts[o].trim();
      if (op) opHtml += '<span style="background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.3);color:#FD8A2E;font-size:12px;padding:5px 12px;border-radius:4px;font-family:Montserrat,sans-serif;font-weight:500;">' + op + '</span>';
    }
  }

  // ---------- slider JS (sem backticks, sem template literals) ----------
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
    sjs += '  for(var k=0;k<ts.length;k++){ts[k].style.border=k===i?"2px solid #F97316":"2px solid transparent";ts[k].style.opacity=k===i?"1":"0.65";}';
    sjs += '}';
    sjs += 'function sNext(){sGo((sIdx+1)%sImgs.length);}';
    sjs += 'function sPrev(){sGo((sIdx-1+sImgs.length)%sImgs.length);}';
    sjs += '(function(){';
    sjs += '  var w=document.getElementById("sWrap");';
    sjs += '  if(!w)return;var sx=0;';
    sjs += '  w.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;});';
    sjs += '  w.addEventListener("touchend",function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){dx<0?sNext():sPrev();}});';
    sjs += '})();';
  }

  // ---------- montar HTML da página ----------
  var pg = '';
  pg += '<!DOCTYPE html>';
  pg += '<html lang="pt-BR">';
  pg += '<head>';
  pg += '<meta charset="UTF-8">';
  pg += '<meta name="viewport" content="width=device-width,initial-scale=1">';
  pg += '<title>' + car.marca + ' ' + car.modelo + ' — Patrik Veículos</title>';
  pg += '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
  pg += '<style>';
  pg += '*{margin:0;padding:0;box-sizing:border-box;}';
  pg += 'body{background:#0A0A0A;color:#fff;font-family:Montserrat,sans-serif;}';
  pg += '::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px;}';
  pg += '.bar{background:#111;border-bottom:1px solid rgba(249,115,22,0.2);padding:14px 32px;display:flex;align-items:center;justify-content:space-between;}';
  pg += '.back{color:#F97316;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;}';
  pg += '.back:hover{color:#fd8a2e;}';
  pg += '.logo-text{font-family:"Bebas Neue",sans-serif;font-size:22px;letter-spacing:2px;color:#F97316;}';
  pg += '.hero{background:linear-gradient(135deg,#111,#1a1a1a);padding:40px 32px;}';
  pg += '.hero-grid{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:start;}';
  pg += '.info{}';
  pg += '.badges{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}';
  pg += '.bdg{background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.3);color:#F97316;font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;letter-spacing:1px;text-transform:uppercase;}';
  pg += '.car-title{font-family:"Bebas Neue",sans-serif;font-size:48px;letter-spacing:2px;line-height:1;margin-bottom:6px;}';
  pg += '.car-sub{color:#888;font-size:15px;margin-bottom:24px;}';
  pg += '.price-box{background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;}';
  pg += '.price-lbl{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;}';
  pg += '.price-val{font-family:"Bebas Neue",sans-serif;font-size:52px;color:#F97316;letter-spacing:1px;}';
  pg += '.wbtn{width:100%;background:#25D366;border:none;color:#fff;padding:16px;border-radius:10px;font-family:Montserrat,sans-serif;font-weight:800;font-size:15px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;margin-bottom:12px;}';
  pg += '.wbtn:hover{background:#20BA5A;}';
  pg += '.cbtn{width:100%;background:transparent;border:2px solid rgba(255,255,255,0.15);color:#fff;padding:14px;border-radius:10px;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;}';
  pg += '.cbtn:hover{border-color:#F97316;color:#F97316;}';
  pg += '.specs{max-width:1100px;margin:0 auto;padding:40px 32px;}';
  pg += '.stitle{font-family:"Bebas Neue",sans-serif;font-size:32px;letter-spacing:2px;color:#fff;margin-bottom:20px;}';
  pg += '.stitle span{color:#F97316;}';
  pg += '.sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:40px;}';
  pg += '.scard{background:#1a1a1a;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;}';
  pg += '.slbl{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;}';
  pg += '.sval{font-size:16px;font-weight:700;color:#fff;}';
  pg += '.opts{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:40px;}';
  pg += '.desc{background:#1a1a1a;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:24px;margin-bottom:40px;}';
  pg += '.desc p{color:#888;font-size:15px;line-height:1.8;}';
  pg += '.ftr{background:#111;border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;text-align:center;color:#555;font-size:12px;}';
  pg += '.ftr span{color:#F97316;}';
  pg += '@media(max-width:768px){.hero-grid{grid-template-columns:1fr;}.car-title{font-size:36px;}.price-val{font-size:40px;}.hero,.specs{padding:24px 16px;}.bar{padding:12px 16px;}}';
  pg += '</style>';
  pg += '</head>';
  pg += '<body>';
  pg += '<div class="bar">';
  pg += '<a href="javascript:window.close()" class="back">&#8592; Voltar ao Estoque</a>';
  pg += '<div class="logo-text">PATRIK VE&Iacute;CULOS</div>';
  pg += '</div>';
  pg += '<div class="hero"><div class="hero-grid">';
  pg += '<div>' + sliderHtml + '</div>';
  pg += '<div class="info">';
  pg += '<div class="badges"><span class="bdg">' + car.combustivel + '</span><span class="bdg">' + car.cambio + '</span><span class="bdg">' + tipo + '</span></div>';
  pg += '<div class="car-title">' + car.marca + ' ' + car.modelo + '</div>';
  pg += '<div class="car-sub">' + (car.versao || '') + ' &nbsp;&bull;&nbsp; ' + car.ano + '</div>';
  pg += '<div class="price-box"><div class="price-lbl">Valor</div><div class="price-val">R$ ' + preco + '</div></div>';
  pg += '<a href="' + wppLink + '" target="_blank" class="wbtn">';
  pg += '<svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>';
  pg += 'Tenho Interesse &mdash; WhatsApp';
  pg += '</a>';
  pg += '<a href="tel:+5548996192000" class="cbtn">&#128222; Ligar: (48) 99619-2000</a>';
  pg += '</div></div></div>';
  pg += '<div class="specs">';
  pg += '<div class="stitle">FICHA <span>T&Eacute;CNICA</span></div>';
  pg += '<div class="sgrid">';
  pg += '<div class="scard"><div class="slbl">Marca</div><div class="sval">'       + car.marca      + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Modelo</div><div class="sval">'      + car.modelo     + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Vers&atilde;o</div><div class="sval">'  + (car.versao||'—') + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Ano</div><div class="sval">'         + car.ano        + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Quilometragem</div><div class="sval">' + car.km + ' km' + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Combust&iacute;vel</div><div class="sval">' + car.combustivel + '</div></div>';
  pg += '<div class="scard"><div class="slbl">C&acirc;mbio</div><div class="sval">'   + car.cambio     + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Cor</div><div class="sval">'         + car.cor        + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Portas</div><div class="sval">'      + car.portas     + '</div></div>';
  pg += '<div class="scard"><div class="slbl">Categoria</div><div class="sval">'   + tipo           + '</div></div>';
  pg += '</div>';
  if (opHtml) {
    pg += '<div class="stitle">OPCIONAIS</div>';
    pg += '<div class="opts">' + opHtml + '</div>';
  }
  if (car.descricao) {
    pg += '<div class="stitle">DESCRI&Ccedil;&Atilde;O</div>';
    pg += '<div class="desc"><p>' + car.descricao + '</p></div>';
  }
  pg += '</div>';
  pg += '<div class="ftr">&copy; 2025 <span>Patrik Ve&iacute;culos</span> &mdash; Bairro Paraguai, Jacinto Machado/SC &mdash; (48) 99619-2000</div>';
  if (sjs) {
    pg += '<script>' + sjs + '<\/script>';
  }
  pg += '</body></html>';

  var blob = new Blob([pg], { type: 'text/html' });
  var url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function sendWpp(id) {
  var car = currentCars.find(function (c) { return c.id === id; });
  if (!car) return;
  var msg = encodeURIComponent('Olá! Vi o ' + car.marca + ' ' + car.modelo + ' ' + car.versao + ' ' + car.ano + ' no site da Patrik Veículos e tenho interesse!');
  window.open('https://wa.me/5548996192000?text=' + msg, '_blank');
}

// ── CONTATO ───────────────────────────────────
function sendContactWpp() {
  var nome   = document.getElementById('cf-nome').value.trim();
  var tel    = document.getElementById('cf-tel').value.trim();
  var assunto= document.getElementById('cf-assunto').value;
  var msg    = document.getElementById('cf-msg').value.trim();
  if (!nome || !tel) { alert('Preencha seu nome e telefone!'); return; }
  var text = encodeURIComponent('Olá! Me chamo ' + nome + '. Assunto: ' + assunto + '. ' + (msg ? msg + ' ' : '') + 'Meu contato: ' + tel);
  window.open('https://wa.me/5548996192000?text=' + text, '_blank');
}

// ── NAVBAR ────────────────────────────────────
window.addEventListener('scroll', function () {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});
function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu()  { document.getElementById('mobileMenu').classList.remove('open'); }

// ── ADMIN LOGIN ───────────────────────────────
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
function doLogin() {
  var u = document.getElementById('admin-user').value;
  var p = document.getElementById('admin-pass').value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    adminLoggedIn = true;
    showAdminMain();
  } else {
    var err = document.getElementById('admin-error-msg');
    err.style.display = 'block';
    setTimeout(function () { err.style.display = 'none'; }, 3000);
  }
}

// ── ADMIN TABS ────────────────────────────────
function adminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.remove('active'); });
  document.querySelectorAll('.admin-section').forEach(function (s) { s.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'estoque') renderAdminList();
}

// ── ADMIN FOTOS ───────────────────────────────
function handleImgUpload(input) {
  var files = Array.from(input.files);
  if (!files.length) return;
  var remaining = 8 - adminPhotos.length;
  if (remaining <= 0) { alert('Limite de 8 fotos atingido!'); input.value = ''; return; }
  var toAdd = files.slice(0, remaining);
  if (files.length > remaining) alert('Apenas ' + remaining + ' foto(s) adicionada(s). Limite de 8.');
  document.getElementById('img-filename').textContent = 'Carregando...';
  var loaded = 0;
  toAdd.forEach(function (file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      adminPhotos.push(e.target.result);
      loaded++;
      if (loaded === toAdd.length) {
        document.getElementById('img-filename').textContent = adminPhotos.length + ' foto(s)';
        document.getElementById('car-img').value = JSON.stringify(adminPhotos);
        renderGalleryPreview();
        input.value = '';
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderGalleryPreview() {
  var g = document.getElementById('gallery-preview');
  if (!g) return;
  if (!adminPhotos.length) { g.innerHTML = ''; return; }
  var h = '';
  for (var i = 0; i < adminPhotos.length; i++) {
    var border = i === 0 ? '2px solid var(--orange)' : '2px solid rgba(255,255,255,0.1)';
    h += '<div class="gallery-thumb" style="border:' + border + ';">';
    h += '<img src="' + adminPhotos[i] + '">';
    if (i === 0) h += '<div style="position:absolute;top:4px;left:4px;background:var(--orange);color:#000;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px;font-family:Montserrat,sans-serif;">CAPA</div>';
    h += '<div style="position:absolute;top:4px;right:4px;display:flex;gap:4px;">';
    if (i > 0) h += '<button onclick="movePhoto(' + i + ')" style="background:rgba(0,0,0,0.7);border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:11px;">&#9664;</button>';
    h += '<button onclick="removePhoto(' + i + ')" style="background:rgba(220,38,38,0.85);border:none;color:#fff;width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:13px;">&#10005;</button>';
    h += '</div></div>';
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

// ── ADMIN FORMULÁRIO ──────────────────────────
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
  var marca      = document.getElementById('car-marca').value.trim();
  var modelo     = document.getElementById('car-modelo').value.trim();
  var preco      = document.getElementById('car-preco').value.trim();
  var km         = document.getElementById('car-km').value.trim();
  var ano        = document.getElementById('car-ano').value.trim();
  var combustivel= document.getElementById('car-combustivel').value;
  var cambio     = document.getElementById('car-cambio').value;
  if (!marca || !modelo || !preco || !km || !ano || !combustivel || !cambio) {
    alert('Preencha os campos obrigatórios (*)'); return;
  }
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
    status:      document.getElementById('car-status').value,
    img:         document.getElementById('car-img').value,
    opcionais:   document.getElementById('car-opcionais').value.trim(),
    descricao:   document.getElementById('car-descricao').value.trim()
  };
  if (editId) {
    var idx = currentCars.findIndex(function (c) { return c.id === editId; });
    if (idx !== -1) currentCars[idx] = car;
  } else {
    currentCars.push(car);
  }
  saveCars(currentCars);
  renderCars();
  clearForm();
  showToast(editId ? 'Veículo atualizado!' : 'Veículo cadastrado!');
  adminTab('estoque', document.querySelectorAll('.admin-tab')[1]);
}

function clearForm() {
  ['car-marca','car-modelo','car-versao','car-ano','car-preco','car-km',
   'car-cor','car-img','car-opcionais','car-descricao'].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('car-combustivel').value = '';
  document.getElementById('car-cambio').value = '';
  document.getElementById('car-tipo').value = 'hatch';
  document.getElementById('car-status').value = 'disponivel';
  document.getElementById('edit-car-id').value = '';
  adminPhotos = [];
  document.getElementById('car-img-file').value = '';
  document.getElementById('img-filename').textContent = 'Nenhuma foto';
  document.getElementById('gallery-preview').innerHTML = '';
  document.getElementById('admin-form-title').textContent = 'Cadastrar Novo Veículo';
  document.getElementById('admin-save-btn').textContent = '💾 Salvar Veículo';
  document.getElementById('admin-cancel-btn').style.display = 'none';
}

function cancelEdit() { clearForm(); }

function editCar(id) {
  var car = currentCars.find(function (c) { return c.id === id; });
  if (!car) return;
  adminTab('cadastrar', document.querySelectorAll('.admin-tab')[0]);
  document.getElementById('edit-car-id').value   = car.id;
  document.getElementById('car-marca').value     = car.marca;
  document.getElementById('car-modelo').value    = car.modelo;
  document.getElementById('car-versao').value    = car.versao || '';
  document.getElementById('car-ano').value       = car.ano;
  document.getElementById('car-preco').value     = car.preco;
  document.getElementById('car-km').value        = car.km;
  document.getElementById('car-combustivel').value = car.combustivel;
  document.getElementById('car-cambio').value    = car.cambio;
  document.getElementById('car-cor').value       = car.cor;
  document.getElementById('car-tipo').value      = car.tipo;
  document.getElementById('car-portas').value    = car.portas;
  document.getElementById('car-status').value    = car.status;
  document.getElementById('car-img').value       = car.img || '';
  document.getElementById('car-opcionais').value = car.opcionais || '';
  document.getElementById('car-descricao').value = car.descricao || '';
  adminPhotos = [];
  if (car.img) {
    try {
      var parsed = JSON.parse(car.img);
      adminPhotos = Array.isArray(parsed) ? parsed : [car.img];
    } catch (e) {
      adminPhotos = [car.img];
    }
  }
  document.getElementById('img-filename').textContent = adminPhotos.length ? adminPhotos.length + ' foto(s)' : 'Nenhuma foto';
  renderGalleryPreview();
  document.getElementById('admin-form-title').textContent = 'Editar Veículo';
  document.getElementById('admin-save-btn').textContent = '💾 Atualizar Veículo';
  document.getElementById('admin-cancel-btn').style.display = 'inline-block';
}

function deleteCar(id) {
  if (!confirm('Remover este veículo?')) return;
  currentCars = currentCars.filter(function (c) { return c.id !== id; });
  saveCars(currentCars);
  renderCars();
  renderAdminList();
  showToast('Veículo removido!');
}

function renderAdminList() {
  var el = document.getElementById('admin-cars-list');
  if (!currentCars.length) {
    el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:40px;">Nenhum veículo cadastrado.</p>';
    return;
  }
  var h = '<h3 style="font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;color:var(--orange);margin-bottom:20px;">' + currentCars.length + ' veículo(s) no sistema</h3>';
  for (var i = 0; i < currentCars.length; i++) {
    var c   = currentCars[i];
    var img = getFirstImg(c);
    var sc  = c.status === 'disponivel' ? '#4ADE80' : c.status === 'vendido' ? '#ef4444' : '#fbbf24';
    var sl  = c.status.charAt(0).toUpperCase() + c.status.slice(1);
    h += '<div class="admin-car-row">';
    h += '<div style="width:60px;height:40px;background:var(--dark3);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-width:60px;">';
    if (img) h += '<img src="' + img + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">';
    else h += '🚗';
    h += '</div>';
    h += '<div class="admin-car-row-info">';
    h += '<h4>' + c.marca + ' ' + c.modelo + ' ' + c.versao + '</h4>';
    h += '<p>' + c.ano + ' &bull; ' + c.km + ' km &bull; R$ ' + fmtPrice(c.preco) + ' &bull; <span style="color:' + sc + '">' + sl + '</span></p>';
    h += '</div>';
    h += '<div class="admin-car-row-actions">';
    h += '<button class="btn-edit" onclick="editCar(\'' + c.id + '\')">&#9998; Editar</button>';
    h += '<button class="btn-del" onclick="deleteCar(\'' + c.id + '\')">&#128465; Remover</button>';
    h += '</div></div>';
  }
  el.innerHTML = h;
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  var t = document.getElementById('successToast');
  t.textContent = '✅ ' + msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}

// ── CONTADOR ANIMADO ──────────────────────────
function animateCounter(el, target, ms) {
  var cur = 0;
  var step = target / (ms / 16);
  var t = setInterval(function () {
    cur += step;
    if (cur >= target) { el.textContent = target; clearInterval(t); return; }
    el.textContent = Math.floor(cur);
  }, 16);
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  renderCars();
  setTimeout(function () {
    var total = currentCars.filter(function (c) { return c.status === 'disponivel'; }).length;
    animateCounter(document.getElementById('countCars'), total, 1200);
  }, 400);
});