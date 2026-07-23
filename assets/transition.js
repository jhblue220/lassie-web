/* ============================================================
 *  페이지 전환 (전 페이지 내부 이동에 적용)
 *  - 홈(index)/Adoption 은 자체 인트로가 있어 진입 안무에서 제외(퇴장은 동일)
 *  순서 (서로 겹치지 않음):
 *   [나가기] 옛 카드: 축소 빠르게 → 왼쪽으로 천천히→빠르게 쏙 (완전히 나감)
 *   [대기]   약 0.5초 흰 화면
 *   [들어오기] 카드 진입 → 폰트(아래→위, 쫀득) → 이미지 박스(점점 커지며 채움, 느렸다 빨라짐)
 *             → 확장(느렸다 빨라짐)
 *  타이밍/이징은 아래 T / 이징 상수에서 조절.
 * ============================================================ */
(function () {
  'use strict';

  var CARD = 0.66;

  // 이징
  var EASE_OUT   = 'cubic-bezier(0.22, 1, 0.36, 1)';    // 카드 진입(부드럽게 안착)
  var FONT_SPRING= 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // 폰트: 쫀득(아래→위 오버슈트)
  var ACCEL      = 'cubic-bezier(0.55, 0, 0.9, 0.35)';  // 이미지/확장: 느렸다 빨라짐(ease-in)

  // 타이밍(ms) — 느낌 조절은 여기서
  var T = {
    out: 660,           // 나가기
    preDelay: 250,      // 나간 뒤 흰 화면 대기(≈0.25s)
    inFly: 520,         // 카드 진입
    gapAfterFly: 200,
    fontDur: 480, fontStagger: 70, fontStaggerCap: 240, gapAfterFont: 30,  // 폰트 뜨면 바로 이미지
    imgDur: 460,  imgStagger: 90,  imgStaggerCap: 200,  gapAfterImg: 220,  // 이미지 템포 ↑
    expandDur: 620      // 확장
  };

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function pageName() { return (location.pathname.split('/').pop() || '').toLowerCase(); }
  var pn = pageName();
  // 자체 인트로가 있는 페이지는 제네릭 진입 안무 제외 (홈/입양)
  var excluded = (pn === '' || pn === 'index.html' || pn === 'adoption.html');

  // 내부 클릭 전환으로 도착했을 때만 진입 안무 재생 (runExit 가 플래그 세팅)
  var willEnter = sessionStorage.getItem('pt_go') === '1' && !excluded && !reduce;
  sessionStorage.removeItem('pt_go');

  if (willEnter) {
    document.documentElement.classList.add('pt-preload');
    setTimeout(function () { document.documentElement.classList.remove('pt-preload'); }, 2000);
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function headerH() {
    var h = document.querySelector('.site-header');
    return h ? Math.round(h.getBoundingClientRect().height) : 88;
  }
  function makeEl(cls, parent) {
    var el = document.createElement('div');
    el.className = cls;
    parent.appendChild(el);
    return el;
  }
  function wrapBelowHeader() {
    var header = document.querySelector('.site-header');
    var stage = document.createElement('div');
    stage.className = 'pt-stage';
    var nodes = [];
    for (var i = 0; i < document.body.childNodes.length; i++) {
      if (document.body.childNodes[i] !== header) nodes.push(document.body.childNodes[i]);
    }
    nodes.forEach(function (n) { stage.appendChild(n); });
    document.body.appendChild(stage);
    return stage;
  }
  function unwrap(stage) {
    while (stage.firstChild) document.body.insertBefore(stage.firstChild, stage);
    stage.remove();
  }

  /* ---------------- 진입 안무 (Club) ---------------- */
  function runEntrance() {
    document.body.classList.add('pt-active');
    var hH = headerH();
    var stage = wrapBelowHeader();
    var backdrop = makeEl('pt-backdrop', document.body);
    backdrop.style.top = hH + 'px';
    var cardBg = document.createElement('div');
    cardBg.className = 'pt-cardbg';
    stage.insertBefore(cardBg, stage.firstChild);
    window.scrollTo(0, 0);

    stage.style.transformOrigin = 'top center';
    stage.classList.add('pt-carding');

    var media = stage.querySelectorAll('img, video, picture, canvas, [class*="ph"]');
    var texts = stage.querySelectorAll(
      'h1, h2, h3, h4, h5, p, button, .menu-link, .word, dt, dd, li, .club-level, .feature-title'
    );
    media.forEach(function (m) { m.style.opacity = '0'; });
    texts.forEach(function (t) { t.style.opacity = '0'; });

    backdrop.style.opacity = '1';

    // 카드 진입 (preDelay 만큼 흰 화면 대기 후 오른쪽에서 안착)
    var fly = stage.animate(
      [{ transform: 'translateX(64%) scale(' + CARD + ')', opacity: 0 },
       { transform: 'translateX(0) scale(' + CARD + ')', opacity: 1 }],
      { duration: T.inFly, delay: T.preDelay, easing: EASE_OUT, fill: 'both' });
    document.documentElement.classList.remove('pt-preload');

    fly.finished.then(function () {
      return wait(T.gapAfterFly);
    }).then(function () {
      // 폰트: 아래에서 위로, 쫀득하게
      texts.forEach(function (t, i) {
        t.animate([{ opacity: 0, transform: 'translateY(28px)' },
                   { opacity: 1, transform: 'translateY(0)' }],
          { duration: T.fontDur, delay: Math.min(i * T.fontStagger, T.fontStaggerCap),
            easing: FONT_SPRING, fill: 'both' });
      });
      return wait(T.fontStaggerCap + T.fontDur + T.gapAfterFont);
    }).then(function () {
      // 이미지 박스: 해당 영역에서 점점 커지며 채움 (느렸다 빨라짐)
      media.forEach(function (m, i) {
        m.animate([{ opacity: 0, transform: 'scale(0.55)' },
                   { opacity: 1, transform: 'scale(1)' }],
          { duration: T.imgDur, delay: Math.min(i * T.imgStagger, T.imgStaggerCap),
            easing: ACCEL, fill: 'both' });
      });
      return wait(T.imgStaggerCap + T.imgDur + T.gapAfterImg);
    }).then(function () {
      // 확장: 느렸다 빨라지며 화면을 꽉 채움
      stage.classList.remove('pt-carding');
      backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.expandDur, easing: ACCEL, fill: 'both' });
      return stage.animate(
        [{ transform: 'translateX(0) scale(' + CARD + ')' }, { transform: 'translateX(0) scale(1)' }],
        { duration: T.expandDur, easing: ACCEL, fill: 'both' }).finished;
    }).then(function () {
      texts.forEach(function (t) { t.style.opacity = ''; t.style.transform = ''; });
      media.forEach(function (m) { m.style.opacity = ''; m.style.transform = ''; });
      stage.getAnimations().forEach(function (a) { a.cancel(); });
      stage.style.transform = ''; stage.style.transformOrigin = '';
      cardBg.remove();
      unwrap(stage);
      backdrop.remove();
      document.body.classList.remove('pt-active');
    });
  }

  /* ---------------- 퇴장 안무 (완전히 나간 뒤 이동) ---------------- */
  var navigating = false;
  function runExit(href) {
    navigating = true;
    sessionStorage.setItem('pt_go', '1'); // 도착 페이지에서 진입 안무 트리거
    document.body.classList.add('pt-active');
    var hH = headerH();
    var stage = wrapBelowHeader();
    stage.style.transformOrigin = 'top center';
    stage.classList.add('pt-carding');
    var backdrop = makeEl('pt-backdrop', document.body);
    backdrop.style.top = hH + 'px';
    backdrop.style.opacity = '1';

    // 축소 빠르게(0→0.34) → 왼쪽으로 천천히→빠르게 쏙 (ease-in)
    stage.animate(
      [{ transform: 'scale(1) translateX(0)', offset: 0, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
       { transform: 'scale(' + CARD + ') translateX(0)', offset: 0.34, easing: 'cubic-bezier(0.6, 0, 0.95, 0.4)' },
       { transform: 'scale(' + CARD + ') translateX(-130%)', offset: 1 }],
      { duration: T.out, fill: 'both' }
    ).finished.then(function () { location.href = href; });

    setTimeout(function () { if (navigating) location.href = href; }, T.out + 250);
  }

  // 열려 있는 메뉴/검색 팝업을 빠르게 닫음 (열려 있었으면 true)
  function closeMenusFast() {
    var mp = document.querySelector('.menu-panel');
    var sp = document.querySelector('.search-panel');
    var mi = document.querySelector('.menu-item');
    var mt = document.querySelector('.menu-link-toggle');
    var header = document.querySelector('.site-header');
    var wasOpen = (mp && mp.classList.contains('open')) || (sp && sp.classList.contains('open'));
    if (header) header.classList.add('pt-menuclosing');
    if (mp) mp.classList.remove('open');
    if (sp) sp.classList.remove('open');
    if (mi) mi.classList.remove('open');
    if (mt) mt.setAttribute('aria-expanded', 'false');
    return wasOpen;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || navigating || reduce) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(https?:|mailto:|tel:)/i.test(href)) return;
    var dest = href.split('#')[0].split('?')[0];
    if (!/\.html$/i.test(dest)) return;                            // .html 페이지 이동만
    if ((dest.split('/').pop() || '').toLowerCase() === pn) return; // 같은 페이지면 무시
    e.preventDefault();
    navigating = true;                        // 즉시 잠금 (연타 방지)
    document.body.classList.add('pt-active');  // 헤더 조작 비활성화
    var wasOpen = closeMenusFast();            // 메뉴 먼저 빠르게 닫기
    if (wasOpen) setTimeout(function () { runExit(href); }, 230); // 닫힌 뒤 전환
    else runExit(href);
  });

  /* ---------------- 실행 ---------------- */
  if (willEnter) {
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', runEntrance);
    else runEntrance();
  }
})();
