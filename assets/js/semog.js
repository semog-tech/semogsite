/* ============================================================
   SEMOG — motion & interações compartilhadas
   Depende de GSAP + ScrollTrigger (CDN). Degrada com elegância:
   sem GSAP ou com prefers-reduced-motion, tudo fica estático.
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* Política de motion: reveals, contadores, marquee e a headline
     rodam SEMPRE (o site é uma demo de motion). A preferência de
     reduced-motion do SO desativa apenas smooth scroll, parallax
     e os pin/scrub pesados. */
  var reduceHeavy = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hasGsap = typeof window.gsap !== "undefined";

  /* ---------- Nav: fundo ao rolar ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    // listener passivo apenas para toggle de classe (não anima por frame)
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector(".nav-burger");
  var mobileMenu = document.querySelector(".nav-mobile");
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mobileMenu.classList.toggle("is-open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Animação por caractere (independe de GSAP) ---------- */
  function splitChars(el) {
    var CHAR_DELAY = 30, START = 200;
    var idx = 0;
    function wrap(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        /* palavras ficam inquebraveis; caracteres animam dentro delas */
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          var w = document.createElement("span");
          w.style.display = "inline-block";
          w.style.whiteSpace = "nowrap";
          part.split("").forEach(function (c) {
            var s = document.createElement("span");
            s.className = "ch";
            s.textContent = c;
            s.style.setProperty("--d", (START + idx * CHAR_DELAY) + "ms");
            idx++;
            w.appendChild(s);
          });
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== "BR") {
        Array.prototype.slice.call(node.childNodes).forEach(wrap);
      }
    }
    el.setAttribute("aria-label", el.textContent);
    Array.prototype.slice.call(el.childNodes).forEach(wrap);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("is-in"); });
    });
  }
  document.querySelectorAll("[data-chars]").forEach(splitChars);
  document.querySelectorAll("[data-fade]").forEach(function (el) {
    var delay = parseInt(el.getAttribute("data-fade-delay") || 0, 10);
    var dur = el.getAttribute("data-fade-duration");
    if (dur) el.style.transitionDuration = dur + "ms";
    setTimeout(function () { el.classList.add("is-in"); }, delay);
  });

  /* ---------- Lenis smooth scroll (efeito pesado: respeita o SO) ---------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceHeavy) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    function lenisRaf(time) { lenis.raf(time); requestAnimationFrame(lenisRaf); }
    requestAnimationFrame(lenisRaf);
  }

  /* ---------- Sem GSAP: revela tudo e sai ---------- */
  if (!hasGsap) {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("[data-counter]").forEach(function (el) {
      el.textContent = el.getAttribute("data-counter");
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Reveals ---------- */
  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    var dir = el.getAttribute("data-reveal");
    var from = { opacity: 0, y: 28, x: 0, scale: 1 };
    if (dir === "left") { from.x = -36; from.y = 0; }
    if (dir === "right") { from.x = 36; from.y = 0; }
    if (dir === "scale") { from.scale = 0.94; from.y = 0; }

    gsap.fromTo(el, from, {
      opacity: 1, y: 0, x: 0, scale: 1,
      duration: 1,
      delay: parseFloat(el.getAttribute("data-reveal-delay") || 0),
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  /* ---------- Stagger groups ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var items = group.children;
    gsap.fromTo(items,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0,
        duration: 0.9, ease: "expo.out", stagger: 0.09,
        scrollTrigger: { trigger: group, start: "top 86%", once: true }
      }
    );
  });

  /* ---------- Contadores ---------- */
  document.querySelectorAll("[data-counter]").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-counter"));
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 2.2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onUpdate: function () {
        el.textContent = Math.round(obj.v).toLocaleString("pt-BR");
      }
    });
  });

  /* ---------- Parallax leve em imagens marcadas (efeito pesado) ---------- */
  if (!reduceHeavy) {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax") || 8);
      gsap.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* ---------- Revelação palavra a palavra no scroll (manifesto/quotes) ---------- */
  document.querySelectorAll("[data-words]").forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(/\s+/).map(function (w) {
      return '<span class="wd" aria-hidden="true" style="opacity:0.14;">' + w + "</span>";
    }).join(" ");
    var words = el.querySelectorAll(".wd");
    if (reduceHeavy) {
      /* sem scrub: revela em bloco quando entra na tela */
      gsap.to(words, {
        opacity: 1, duration: 0.8, stagger: 0.02, ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", once: true }
      });
    } else {
      gsap.to(words, {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: el, start: "top 82%", end: "top 30%", scrub: 0.6 }
      });
    }
  });

  /* ---------- Botões magnéticos (desktop, ponteiro fino) ---------- */
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.25);
      });
      btn.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Split de headline (hero) ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(function (w) {
      return '<span class="w" aria-hidden="true" style="display:inline-block;overflow:hidden;vertical-align:top;"><span style="display:inline-block;">' + w + "</span></span>";
    }).join(" ");
    gsap.fromTo(el.querySelectorAll(".w > span"),
      { yPercent: 110 },
      { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.07, delay: 0.15 }
    );
  });
})();
