/* Acile Harb portfolio — interactions */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('js');

  /* Scroll progress bar */
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.prepend(bar);
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    document.querySelector('.site-header')?.classList.toggle('scrolled', scrollY > 40);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hero title: letters rise in */
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
  });

  /* Reveal on scroll (content already in view shows immediately) */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(e => e.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(e => io.observe(e));
  }

  /* Count-up numbers */
  const counters = document.querySelectorAll('[data-count]');
  const runCount = el => {
    const end = +el.dataset.count, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = prefix + end + suffix; return; }
    const start = performance.now(), dur = 1100;
    const from = +el.dataset.from || 0;
    const step = t => {
      const p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(from + (end - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); }
    }), { threshold: .6 });
    counters.forEach(c => co.observe(c));
  }

  /* Work list: filters */
  const chips = document.querySelectorAll('.chip');
  const items = document.querySelectorAll('.work-item');
  chips.forEach(chip => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach(c => c.setAttribute('aria-pressed', c === chip));
    let n = 0;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.cat.split(' ').includes(f);
      it.hidden = !show;
      if (show) it.querySelector('.num').textContent = String(++n).padStart(2, '0');
    });
  }));

  /* Work list: floating preview that follows the cursor (desktop) */
  const float = document.querySelector('.float-preview');
  if (float && finePointer && !reduce) {
    document.documentElement.classList.add('has-float');
    const img = float.querySelector('img');
    let x = 0, y = 0, cx = 0, cy = 0, raf;
    const loop = () => {
      cx += (x - cx) * .14; cy += (y - cy) * .14;
      float.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) rotate(${(x - cx) * .03}deg)`;
      raf = requestAnimationFrame(loop);
    };
    items.forEach(it => {
      it.addEventListener('mouseenter', e => {
        img.src = it.querySelector('.cover img').src;
        x = cx = e.clientX; y = cy = e.clientY;
        float.classList.add('on');
        cancelAnimationFrame(raf); loop();
      });
      it.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
      it.addEventListener('mouseleave', () => { float.classList.remove('on'); cancelAnimationFrame(raf); });
    });
  }

  /* Magnetic buttons (desktop) */
  if (finePointer && !reduce) {
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* Copy email */
  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); btn.textContent = 'Copied ✓'; }
    catch { btn.textContent = btn.dataset.copy; }
    setTimeout(() => { btn.textContent = 'Copy email'; }, 1800);
  }));

  /* Lightbox for feed images & videos */
  const media = [...document.querySelectorAll('.feed figure')];
  if (media.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="lb-close label" aria-label="Close">Close ✕</button>' +
      '<button class="lb-nav lb-prev" aria-label="Previous">←</button>' +
      '<div class="lb-stage"></div>' +
      '<button class="lb-nav lb-next" aria-label="Next">→</button>' +
      '<p class="lb-count label"></p>';
    document.body.appendChild(lb);
    const stage = lb.querySelector('.lb-stage'), count = lb.querySelector('.lb-count');
    let idx = 0, lastFocus;
    const show = i => {
      idx = (i + media.length) % media.length;
      const src = media[idx].querySelector('img, video');
      const clone = src.cloneNode();
      if (clone.tagName === 'VIDEO') { clone.controls = true; clone.autoplay = true; clone.muted = true; clone.loop = true; }
      clone.removeAttribute('loading');
      stage.replaceChildren(clone);
      const cap = media[idx].querySelector('figcaption')?.textContent || '';
      count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}  ·  ${cap}`;
    };
    const open = i => { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); };
    const close = () => { lb.hidden = true; stage.replaceChildren(); document.body.style.overflow = ''; lastFocus?.focus(); };
    media.forEach((m, i) => {
      m.tabIndex = 0;
      m.setAttribute('role', 'button');
      m.setAttribute('aria-label', 'Open ' + (m.querySelector('figcaption')?.textContent || 'post'));
      m.addEventListener('click', () => open(i));
      m.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    lb.querySelector('.lb-close').onclick = close;
    lb.querySelector('.lb-prev').onclick = () => show(idx - 1);
    lb.querySelector('.lb-next').onclick = () => show(idx + 1);
    lb.addEventListener('click', e => { if (e.target === lb || e.target === stage) close(); });
    addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* Feed videos: play only when visible (saves data on phones) */
  if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver(es => es.forEach(en => {
      const v = en.target;
      if (en.isIntersecting && !reduce) v.play().catch(() => {}); else v.pause();
    }), { threshold: .3 });
    document.querySelectorAll('.feed video').forEach(v => { v.removeAttribute('autoplay'); vo.observe(v); });
  }

  /* Tilt on hover for marks and featured posts (desktop) */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }
})();
