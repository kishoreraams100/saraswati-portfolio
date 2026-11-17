(() => {
  const S = window.SITE;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const img = (path) => new URL("images/" + path, document.baseURI).href;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function setVh(force) {
    const next = window.innerHeight;
    const prev = parseFloat(document.documentElement.dataset.vh || "0");
    if (!force && prev && Math.abs(next - prev) < 80) return;
    document.documentElement.dataset.vh = String(next);
    document.documentElement.style.setProperty("--vh", next + "px");
  }
  setVh(true);
  window.addEventListener("resize", () => setVh(false), { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(() => setVh(true), 250));

  /* ---------- nav ---------- */
  const nav = $(".nav");
  const overlay = $(".overlay");
  const burger = $(".burger");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.textContent = open ? "Close" : "Menu";
    overlay.classList.toggle("is-open", open);
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("lock", open);
  }
  burger.addEventListener("click", () => setMenu(!overlay.classList.contains("is-open")));
  $$(".overlay a, .links a, .logo, .skip").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );

  $$("a[href^='#']").forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", "#" + id);
    });
  });

  /* ---------- hero type-in ---------- */
  requestAnimationFrame(() => document.body.classList.add("is-ready"));

  /* ---------- signature wipe ---------- */
  const wipeSlides = S.wipeIds.map((id) => S.projects.find((p) => p.id === id));
  const WAVE_AMP = 6;
  const slideCount = wipeSlides.length;
  const step = 1 / (slideCount - 1);
  const smooth = (t) => t * t * (3 - 2 * t);

  function layerProgress(index, t) {
    if (index === 0) return 1;
    const start = (index - 1) * step + step * 0.1;
    const span = step * 0.7;
    return smooth(Math.min(1, Math.max(0, (t - start) / span)));
  }

  function waveClip(p) {
    const base = 100 + WAVE_AMP - p * (100 + WAVE_AMP * 2);
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * 100;
      const y = base + WAVE_AMP * Math.sin((x / 100) * Math.PI * 3 + p * Math.PI * 2);
      pts.push(x.toFixed(1) + "% " + y.toFixed(2) + "%");
    }
    return "polygon(0% 100%, " + pts.join(", ") + ", 100% 100%)";
  }

  const wipe = $("#projects");
  const stick = $(".wipe-stick");
  const capEm = $(".wipe-cap em");
  const capStrong = $(".wipe-cap strong");
  const capSmall = $(".wipe-cap small");
  const layers = [];

  function buildWipe() {
    if (!wipe || !stick) return;
    document.documentElement.style.setProperty("--wipe-slides", String(slideCount));
    if (reduce.matches) {
      wipe.className = "wipe-static";
      wipe.style.height = "";
      wipe.innerHTML =
        '<h2 class="h2 wrap">Selected Projects</h2>' +
        wipeSlides
          .map(
            (s) =>
              `<figure><img src="${img(s.cover)}" alt="${s.title}: ${s.subtitle}"><figcaption>${s.title} · ${s.subtitle}</figcaption></figure>`
          )
          .join("");
      return;
    }
    const shade = stick.querySelector(".wipe-shade");
    wipeSlides.forEach((s, i) => {
      const layer = document.createElement("div");
      layer.className = "wipe-layer";
      layer.style.zIndex = String(i);
      layer.style.clipPath = i === 0 ? "none" : waveClip(0);
      layer.innerHTML = `<div class="wipe-img"><img src="${img(s.cover)}" alt="${s.title}: ${s.subtitle}"></div>`;
      stick.insertBefore(layer, shade);
      layers.push({
        el: layer,
        img: layer.querySelector(".wipe-img"),
        project: s
      });
    });
    applyWipe(0);
  }

  function wipeT() {
    const rect = wipe.getBoundingClientRect();
    const total = wipe.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  let capIndex = 0;
  function applyWipe(t) {
    layers.forEach((layer, i) => {
      const p = layerProgress(i, t);
      const next = i < slideCount - 1 ? layerProgress(i + 1, t) : 0;
      if (i === 0) layer.el.style.clipPath = "none";
      else if (p >= 1) layer.el.style.clipPath = "inset(0)";
      else layer.el.style.clipPath = waveClip(p);
      layer.img.style.transform = `translate3d(0, ${(-5 * next).toFixed(2)}%, 0) scale(${(1.1 - 0.1 * p).toFixed(4)})`;
    });
    const idx = Math.min(slideCount - 1, Math.round(t / step));
    if (idx !== capIndex && capEm && capStrong && capSmall) {
      capIndex = idx;
      const s = wipeSlides[idx];
      capEm.textContent = s.category;
      capStrong.textContent = s.title;
      capSmall.textContent = s.subtitle;
    }
  }

  let wipeRaf = 0;
  function onScroll() {
    if (wipeRaf) return;
    wipeRaf = requestAnimationFrame(() => {
      wipeRaf = 0;
      const y = window.scrollY || 0;
      const heroImg = $(".hero-img");
      if (heroImg && !reduce.matches) {
        const hero = $("#hero");
        const h = hero ? hero.offsetHeight : 1;
        const p = Math.min(1, Math.max(0, y / h));
        heroImg.style.transform = `translate3d(0, ${p * 18}%, 0) scale(1)`;
      }
      const line = $(".tl-line i");
      const timeline = $(".timeline");
      if (line && timeline) {
        const r = timeline.getBoundingClientRect();
        const vis = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - r.top) / r.height));
        line.style.transform = `scaleY(${vis})`;
      }
      if (!reduce.matches && layers.length) applyWipe(wipeT());
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("touchmove", onScroll, { passive: true });

  buildWipe();
  onScroll();

  /* ---------- rails ---------- */
  function mountRail(rail) {
    const drag = { on: false, x: 0, left: 0, moved: false };
    rail.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      drag.on = true;
      drag.x = e.clientX;
      drag.left = rail.scrollLeft;
      drag.moved = false;
    });
    rail.addEventListener("pointermove", (e) => {
      if (!drag.on) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5) {
        drag.moved = true;
        rail.classList.add("dragging");
      }
      if (drag.moved) rail.scrollLeft = drag.left - dx;
    });
    const end = () => {
      if (!drag.on) return;
      drag.on = false;
      rail.classList.remove("dragging");
      if (!drag.moved) return;
      const kids = [...rail.children];
      const target = kids.reduce((best, el) =>
        Math.abs(el.offsetLeft - rail.scrollLeft - 24) < Math.abs(best.offsetLeft - rail.scrollLeft - 24)
          ? el
          : best
      );
      rail.scrollTo({ left: target.offsetLeft - 24, behavior: "smooth" });
    };
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointerleave", end);
    rail.addEventListener("click", (e) => {
      if (!drag.moved) return;
      e.preventDefault();
      e.stopPropagation();
      drag.moved = false;
    }, true);
    const wrap = rail.parentElement;
    const prev = wrap.querySelector('[data-dir="-1"]');
    const next = wrap.querySelector('[data-dir="1"]');
    const go = (dir) => rail.scrollBy({ left: dir * rail.clientWidth * 0.7, behavior: "smooth" });
    if (prev) prev.addEventListener("click", () => go(-1));
    if (next) next.addEventListener("click", () => go(1));
  }
  $$(".rail").forEach(mountRail);

  /* ---------- category filter ---------- */
  const chips = $("#chips");
  const projectRail = $("#project-rail");
  let activeCat = "All";
  const usedCats = new Set(S.projects.map((p) => p.category));

  function projectCard(p) {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.setAttribute("aria-label", "Open " + p.title);
    btn.innerHTML = `<img src="${img(p.cover)}" alt="${p.title}: ${p.subtitle}" loading="lazy" decoding="async"><span class="card-cap"><em>${p.category}</em><strong>${p.title}</strong><small>${p.subtitle}</small></span>`;
    btn.addEventListener("click", () => openDetail(p.id));
    return btn;
  }

  function renderProjects() {
    const list = S.projects.filter((p) => activeCat === "All" || p.category === activeCat);
    projectRail.replaceChildren(...list.map(projectCard));
  }

  S.categories
    .filter((c) => c === "All" || usedCats.has(c))
    .forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.textContent = c;
      b.setAttribute("aria-selected", c === "All" ? "true" : "false");
      if (c === "All") b.className = "on";
      b.addEventListener("click", () => {
        activeCat = c;
        $$("#chips button").forEach((x) => {
          x.classList.toggle("on", x.textContent === c);
          x.setAttribute("aria-selected", x.textContent === c ? "true" : "false");
        });
        renderProjects();
      });
      chips.appendChild(b);
    });
  renderProjects();

  /* ---------- site photos rail ---------- */
  const photoRail = $("#photo-rail");
  S.sitePhotos.forEach((src, i) => {
    const b = document.createElement("button");
    b.className = "photo";
    b.setAttribute("aria-label", "Enlarge site photograph " + (i + 1));
    b.innerHTML = `<img src="${img(src)}" alt="Executed project photograph ${i + 1}" loading="lazy" decoding="async">`;
    b.addEventListener("click", () =>
      openLightbox(
        S.sitePhotos.map((s) => ({ src: s })),
        i
      )
    );
    photoRail.appendChild(b);
  });

  /* ---------- drawings ---------- */
  const drawings = $("#drawings");
  S.drawings.forEach((d, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Enlarge " + d.title);
    b.innerHTML = `<img src="${img(d.src)}" alt="${d.title}, ${d.kind}" loading="lazy" decoding="async" style="object-fit:contain"><span><strong>${d.title}</strong><small>${d.kind}</small></span>`;
    b.addEventListener("click", () => openLightbox(S.drawings, i));
    drawings.appendChild(b);
  });

  /* ---------- detail + lightbox ---------- */
  const detail = $("#detail");
  const lightbox = $("#lightbox");
  let detailId = null;
  let lbItems = [];
  let lbIndex = 0;
  let lbZoom = false;

  function openDetail(id) {
    detailId = id;
    const i = S.projects.findIndex((p) => p.id === id);
    const p = S.projects[i];
    $("#d-hero").innerHTML = `<img class="contain-img" src="${img(p.cover)}" alt="${p.title}">`;
    $("#d-meta").textContent = p.category;
    $("#d-title").textContent = p.title;
    $("#d-sub").textContent = p.subtitle;
    const gal = $("#gal");
    gal.replaceChildren(
      ...p.images.map((src, n) => {
        const b = document.createElement("button");
        b.setAttribute("aria-label", "Enlarge image " + (n + 1));
        b.innerHTML = `<img src="${img(src)}" alt="${p.title}, image ${n + 1}" loading="lazy" decoding="async">`;
        b.addEventListener("click", () =>
          openLightbox(
            p.images.map((s) => ({ src: s })),
            n
          )
        );
        return b;
      })
    );
    detail.classList.remove("hidden");
    requestAnimationFrame(() => detail.classList.add("is-open"));
    document.body.classList.add("lock");
    $("#d-close").focus();
  }

  function closeDetail() {
    detail.classList.remove("is-open");
    document.body.classList.remove("lock");
    setTimeout(() => {
      if (!detail.classList.contains("is-open")) detail.classList.add("hidden");
    }, reduce.matches ? 0 : 800);
    detailId = null;
  }

  $("#d-close").addEventListener("click", closeDetail);
  $("#d-prev").addEventListener("click", () => {
    const i = S.projects.findIndex((p) => p.id === detailId);
    openDetail(S.projects[(i - 1 + S.projects.length) % S.projects.length].id);
  });
  $("#d-next").addEventListener("click", () => {
    const i = S.projects.findIndex((p) => p.id === detailId);
    openDetail(S.projects[(i + 1) % S.projects.length].id);
  });

  function openLightbox(items, index) {
    lbItems = items;
    lbIndex = index;
    lbZoom = false;
    lightbox.classList.remove("hidden");
    renderLightbox();
    $("#lb-close").focus();
  }
  function closeLightbox() {
    lightbox.classList.add("hidden");
    lbZoom = false;
  }
  function renderLightbox() {
    const item = lbItems[lbIndex];
    const stage = $("#lb-stage");
    stage.classList.toggle("zoom", lbZoom);
    $("#lb-label").textContent = item.title
      ? item.title + " · " + item.kind
      : lbIndex + 1 + " / " + lbItems.length;
    $("#lb-zoom").textContent = lbZoom ? "Fit" : "Zoom";
    stage.innerHTML = `<img src="${img(item.src)}" alt="${item.title || "Project image"}">`;
    $("#lb-nav").classList.toggle("hidden", lbItems.length < 2);
  }
  $("#lb-close").addEventListener("click", closeLightbox);
  $("#lb-zoom").addEventListener("click", () => {
    lbZoom = !lbZoom;
    renderLightbox();
  });
  $("#lb-stage").addEventListener("click", () => {
    lbZoom = !lbZoom;
    renderLightbox();
  });
  $("#lb-prev").addEventListener("click", () => {
    lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length;
    lbZoom = false;
    renderLightbox();
  });
  $("#lb-next").addEventListener("click", () => {
    lbIndex = (lbIndex + 1) % lbItems.length;
    lbZoom = false;
    renderLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!lightbox.classList.contains("hidden")) closeLightbox();
      else if (!detail.classList.contains("hidden")) closeDetail();
      else setMenu(false);
    }
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "ArrowRight") {
      lbIndex = (lbIndex + 1) % lbItems.length;
      lbZoom = false;
      renderLightbox();
    }
    if (e.key === "ArrowLeft") {
      lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length;
      lbZoom = false;
      renderLightbox();
    }
  });

  /* ---------- scroll reveals (reverse on way up) ---------- */
  if (!reduce.matches && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => en.target.classList.toggle("is-in", en.isIntersecting));
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    $$(".reveal, .reveal-left, .clip-reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal, .reveal-left, .clip-reveal").forEach((el) => el.classList.add("is-in"));
  }

  reduce.addEventListener("change", () => location.reload());
})();
