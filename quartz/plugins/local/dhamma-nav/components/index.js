import { h } from "preact"

/** Minimal relative path resolution for Quartz FullSlugs. */
function resolveRelative(from, to) {
  const fromParts = String(from).split("/").filter(Boolean)
  // drop file segment
  if (fromParts.length) fromParts.pop()
  const toParts = String(to)
    .replace(/\/index$/, "")
    .split("/")
    .filter(Boolean)
  // climb out of from dir
  const ups = fromParts.map(() => "..")
  const joined = [...ups, ...toParts].join("/")
  // folder pages prefer trailing slash style used by quartz
  return (joined ? `${joined}/` : "./").replace(/^(?!\.)/, "./")
}

function simplifySlug(slug) {
  const s = String(slug).replace(/\/index$/, "")
  return s === "index" || s === "" ? "/" : s
}

function DhammaNav(props) {
  const fileData = props?.fileData ?? {}
  const slug = fileData?.slug ?? "index"
  const simple = simplifySlug(slug)
  const isHome = simple === "/" || slug === "index"

  const navItems = [
    {
      slug: "佛法修学/index",
      label: "佛法修学",
      match: "佛法修学",
      icon: [
        h("path", { d: "M12 2C8 6 6 10 6 14a6 6 0 0 0 12 0c0-4-2-8-6-12z" }),
        h("path", { d: "M12 6v8" }),
      ],
    },
    {
      slug: "ai实践/index",
      label: "AI 实践",
      match: "AI实践",
      icon: [
        h("rect", { x: "4", y: "6", width: "16", height: "12", rx: "2" }),
        h("path", { d: "M8 10h8M8 14h5" }),
        h("circle", { cx: "17", cy: "14", r: "0.5", fill: "currentColor" }),
      ],
    },
    {
      slug: "关于/index",
      label: "关于",
      match: "关于",
      icon: [h("circle", { cx: "12", cy: "12", r: "9" }), h("path", { d: "M12 16v-4M12 8h.01" })],
    },
  ]

  return h(
    "nav",
    { class: "dhamma-nav", "aria-label": "主导航" },
    h(
      "ul",
      null,
      navItems.map((item) => {
        const isActive =
          !isHome &&
          (String(slug).toLowerCase().startsWith(item.match.toLowerCase()) ||
            String(simple).toLowerCase().includes(item.match.toLowerCase()))
        const href = resolveRelative(slug, item.slug)
        return h(
          "li",
          { key: item.slug },
          h(
            "a",
            {
              href,
              class: `nav-item${isActive ? " active" : ""}`,
              "aria-current": isActive ? "page" : undefined,
            },
            h(
              "svg",
              {
                class: "nav-icon",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "1.5",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "aria-hidden": "true",
              },
              item.icon,
            ),
            h("span", { class: "nav-label" }, item.label),
          ),
        )
      }),
    ),
  )
}

// 阅读进度条 + TOC scrollspy + skip-to-content
DhammaNav.afterDOMLoaded = `
(function () {
  var bar = document.createElement("div");
  bar.className = "reading-progress";
  bar.setAttribute("aria-hidden", "true");
  bar.innerHTML = '<div class="reading-progress-fill"></div>';
  document.body.appendChild(bar);
  var fill = bar.querySelector(".reading-progress-fill");

  var skip = document.createElement("a");
  skip.className = "skip-to-content";
  skip.href = "#quartz-body";
  skip.textContent = "跳到正文";
  document.body.appendChild(skip);

  function updateProgress() {
    var h = document.documentElement;
    var st = h.scrollTop || document.body.scrollTop;
    var sh = h.scrollHeight - h.clientHeight;
    var p = sh > 0 ? (st / sh) * 100 : 0;
    fill.style.width = p + "%";
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateProgress();
        updateScrollspy();
        ticking = false;
      });
      ticking = true;
    }
  }

  function updateScrollspy() {
    var headings = document.querySelectorAll("article h2, article h3");
    if (!headings.length) return;
    var tocLinks = document.querySelectorAll(".sidebar.right .toc a, #toc a");
    if (!tocLinks.length) return;
    var scrollY = window.scrollY + 120;
    var current = null;
    headings.forEach(function (h) {
      if (h.offsetTop <= scrollY) current = h;
    });
    tocLinks.forEach(function (link) {
      link.parentElement.classList.remove("active");
      if (current && link.getAttribute("href") === "#" + current.id) {
        link.parentElement.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("nav", function () {
    requestAnimationFrame(function () {
      updateProgress();
      updateScrollspy();
    });
  });
  updateProgress();
})();
`

// 桌面竖栏基础样式；横顶栏形态由 custom.scss 统一覆盖
DhammaNav.css = `
.dhamma-nav {
  margin-top: 1.35rem;
  padding: 0;
}
.dhamma-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.dhamma-nav .nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.72rem 0.85rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.98rem;
  color: var(--墨色);
  text-decoration: none;
  background: transparent;
  border-left: 2.5px solid transparent;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  line-height: 1.45;
}
.dhamma-nav .nav-item:hover {
  background: var(--暖金-bg);
  color: var(--暖金);
}
.dhamma-nav .nav-item.active {
  background: var(--暖金-bg);
  color: var(--暖金);
  border-left-color: var(--暖金);
  font-weight: 600;
}
.dhamma-nav .nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.88;
  stroke-width: 2;
}
.dhamma-nav .nav-item:hover .nav-icon,
.dhamma-nav .nav-item.active .nav-icon {
  opacity: 1;
}
`

const DhammaNavConstructor = () => DhammaNav

export { DhammaNavConstructor as DhammaNav }
