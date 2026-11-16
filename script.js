/* OPEN SCORE Vol.01 — 웹매거진 동작 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. 단락 마지막 줄에 한 글자만 남지 않도록 끝 세 글자를 붙여 둔다 */
  $$('p, li, dd, figcaption, .cap').forEach(function (el) {
    if (el.querySelector('p, li, dd')) return;
    var d = getComputedStyle(el).display;
    if (d.indexOf('flex') > -1 || d.indexOf('grid') > -1) return;
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), last = null, n;
    while ((n = w.nextNode())) { if (n.nodeValue.trim()) last = n; }
    if (!last) return;
    var t = last.nodeValue, m = t.match(/\S{1,3}\s*$/);
    if (!m || el.textContent.trim().length < 8) return;
    var cut = t.length - m[0].length, span = document.createElement('span');
    span.className = 'nw'; span.textContent = t.slice(cut);
    last.nodeValue = t.slice(0, cut);
    last.parentNode.insertBefore(span, last.nextSibling);
  });

  /* 2. 장 메뉴: 지금 읽는 장 표시 */
  var nav = $('#nav'), links = $$('#nav a');
  var setActive = function (id) {
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('on', on);
      if (on && nav.scrollWidth > nav.clientWidth) {
        var x = a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2;
        nav.scrollTo({ left: x, behavior: 'smooth' });
      }
    });
  };
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('[data-nav]').forEach(function (s) { spy.observe(s); });
    var coverIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setActive('cover'); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    coverIo.observe($('#cover'));
  }

  /* 3. 페스티벌 고정 버튼: 커버를 지나면 보이고, 특집 안에서는 숨김 */
  var fab = $('#festFab'), fest = $('#festival'), cover = $('#cover');
  var fabTick = function () {
    var y = window.scrollY, past = y > cover.offsetTop + cover.offsetHeight - 200;
    var r = fest.getBoundingClientRect(), inFest = r.top < window.innerHeight * 0.8 && r.bottom > 0;
    fab.classList.toggle('show', past && !inFest);
  };
  window.addEventListener('scroll', fabTick, { passive: true });
  fabTick();

  /* 4. 2부 시연 스크롤텔링 */
  var stepImg = $('#stepImg'), stepCap = $('#stepCap'), dots = $$('#stepDots i'), steps = $$('.step');
  var cur = -1;
  var showStep = function (i) {
    if (i === cur) return; cur = i;
    var s = steps[i];
    steps.forEach(function (x, k) { x.classList.toggle('on', k === i); });
    dots.forEach(function (x, k) { x.classList.toggle('on', k === i); });
    stepImg.classList.add('fade');
    setTimeout(function () {
      stepImg.src = s.getAttribute('data-img');
      stepImg.alt = s.getAttribute('data-cap') + ' 화면 시안';
      stepCap.textContent = s.getAttribute('data-cap');
      stepImg.classList.remove('fade');
    }, 160);
  };
  steps.forEach(function (s) { var im = new Image(); im.src = s.getAttribute('data-img'); });
  if ('IntersectionObserver' in window && steps.length) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) showStep(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { so.observe(s); });
  }
  if (steps.length) { steps[0].classList.add('on'); dots[0] && dots[0].classList.add('on'); cur = 0; }

  /* 5. 누르면 재생되는 영상 */
  $$('.yt').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true; f.title = b.getAttribute('aria-label') || '영상';
      b.innerHTML = ''; b.appendChild(f); b.style.cursor = 'default';
    }, { once: true });
  });

  /* 6. 작품 장면 바꿔 보기 */
  $$('.gal').forEach(function (g) {
    var main = $('.gal-main', g), bs = $$('.gal-thumbs button', g);
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.getAttribute('data-src');
        bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
    });
  });

  /* 7. 총보 크게 보기 */
  var dlg = $('#zoomDlg'), zImg = $('#zoomImg'), zTog = $('#zoomToggle');
  $$('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = b.getAttribute('data-zoom');
      if (!dlg || typeof dlg.showModal !== 'function') { window.open(src, '_blank'); return; }
      zImg.src = src; zImg.classList.remove('big'); zTog.textContent = '더 크게';
      dlg.showModal();
    });
  });
  if (dlg) {
    zTog.addEventListener('click', function () {
      var big = zImg.classList.toggle('big'); zTog.textContent = big ? '화면에 맞춤' : '더 크게';
    });
    $('#zoomClose').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* 8. 파트별 역할 */
  var partText = $('#partText');
  $$('.part-chips button').forEach(function (b, i, all) {
    b.addEventListener('click', function () {
      all.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      partText.textContent = b.getAttribute('data-part');
    });
  });

  /* 9. 페스티벌 나흘의 무대 */
  var DAYS = [
    { venue: 'GS칼텍스 예울마루 대극장 · 11. 10.(화)', title: '표준 오케스트라', teams: 12, students: 685 },
    { venue: 'GS칼텍스 예울마루 대극장 · 11. 11.(수)', title: '윈드 오케스트라', teams: 12, students: 396 },
    { venue: 'GS칼텍스 예울마루 대극장 · 11. 12.(목)', title: '표준·윈드·국악 오케스트라', teams: 12, students: 591 },
    { venue: 'GS칼텍스 예울마루 소극장 · 11. 13.(금)', title: '복합장르 — 합창·밴드·앙상블', teams: 12, students: 155 }
  ];
  var bars = $('#dayBars'), max = 685;
  DAYS.forEach(function (d, i) {
    var row = document.createElement('div');
    row.innerHTML = '<span>' + ['11.10 표준', '11.11 윈드', '11.12 표준·윈드·국악', '11.13 복합장르'][i] + '</span><i style="width:' + (d.students / max * 100) + '%"></i><em>' + d.students + '</em>';
    bars.appendChild(row);
  });
  var showDay = function (i) {
    var d = DAYS[i];
    $('#dayVenue').textContent = d.venue; $('#dayTitle').textContent = d.title;
    $('#dayTeams').textContent = d.teams; $('#dayStudents').textContent = d.students.toLocaleString('ko-KR');
    $$('#dayBars div').forEach(function (r, k) { r.classList.toggle('on', k === i); });
    $$('.day-tabs button').forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
  };
  $$('.day-tabs button').forEach(function (b) {
    b.addEventListener('click', function () { showDay(+b.getAttribute('data-day')); });
  });
  showDay(0);

  /* 10. 시작 체크리스트 (이 기기에만 저장) */
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
                set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var boxes = $$('#checklist input'), cnt = $('#checkCount');
  var count = function () { cnt.textContent = boxes.filter(function (b) { return b.checked; }).length + ' / ' + boxes.length; };
  boxes.forEach(function (b) {
    b.checked = store.get('openscore-' + b.getAttribute('data-k')) === '1';
    b.addEventListener('change', function () { store.set('openscore-' + b.getAttribute('data-k'), b.checked ? '1' : '0'); count(); });
  });
  count();

  /* 11. 공유하기 */
  var sb = $('#shareBtn');
  if (sb) sb.addEventListener('click', function () {
    var data = { title: 'OPEN SCORE Vol.01 — 교사가 짓는 음악 수업', text: '뮤지컬리너스에서 실시간 악보까지 · 전남중등음악사랑연구회', url: location.href.split('#')[0] };
    var done = function (msg) { var o = sb.textContent; sb.textContent = msg; setTimeout(function () { sb.textContent = o; }, 1800); };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(function () { done('주소를 복사했습니다'); }, function () { done(data.url); });
    else done(data.url);
  });
})();
