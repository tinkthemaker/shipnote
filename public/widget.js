(function () {
  var scriptEl = document.currentScript;
  var base = scriptEl
    ? scriptEl.src.replace(/\/widget\.js(\?.*)?$/, "")
    : "";

  var LS_KEY = "shipnote_last_seen";

  function fetchJSON(url) {
    return fetch(url, { credentials: "omit" }).then(function (r) {
      return r.json();
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getLastSeen() {
    try {
      var v = localStorage.getItem(LS_KEY);
      return v ? parseInt(v, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  function setLastSeen(ts) {
    try {
      localStorage.setItem(LS_KEY, String(ts));
    } catch (e) {}
  }

  function truncate(html, maxLen) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    var text = tmp.textContent || tmp.innerText || "";
    if (text.length <= maxLen) return html;
    return escapeHtml(text.substring(0, maxLen)) + "...";
  }

  function buildWidget(config, posts) {
    var accent = config.accent_color || "#3b82f6";
    var position = config.position || "bottom-right";
    var theme = config.theme || "auto";
    var projectName = config.project_name || "Shipnote";
    var logoUrl = config.logo_url;

    var isRight = position === "bottom-right";
    var lastSeen = getLastSeen();
    var newCount = posts.filter(function (p) {
      return p.published_at > lastSeen;
    }).length;

    // Shadow host
    var host = document.createElement("div");
    host.id = "shipnote-widget";
    var shadow = host.attachShadow({ mode: "open" });

    // Styles
    var style = document.createElement("style");
    style.textContent = [
      ":host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
      "* { box-sizing: border-box; margin: 0; padding: 0; }",
      ".sn-btn { position: fixed; bottom: 24px; width: 48px; height: 48px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(0,0,0,0.15); transition: transform 0.15s; z-index: 999999; }",
      ".sn-btn:hover { transform: scale(1.08); }",
      ".sn-btn.right { right: 24px; }",
      ".sn-btn.left { left: 24px; }",
      ".sn-btn svg { width: 24px; height: 24px; fill: white; }",
      ".sn-badge { position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; border-radius: 10px; background: #ef4444; color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 5px; }",
      ".sn-badge.hidden { display: none; }",
      ".sn-panel { position: fixed; bottom: 84px; width: 380px; max-height: 520px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); z-index: 999998; display: none; flex-direction: column; overflow: hidden;",
      "background: " + (theme === "dark" ? "#18181b" : theme === "light" ? "#ffffff" : "#ffffff") + ";",
      "color: " + (theme === "dark" ? "#e4e4e7" : "#27272a") + ";",
      "border: 1px solid " + (theme === "dark" ? "#3f3f46" : "#e4e4e7") + "; }",
      ".sn-panel.right { right: 24px; }",
      ".sn-panel.left { left: 24px; }",
      ".sn-panel.open { display: flex; }",
      ".sn-header { padding: 16px; border-bottom: 1px solid " + (theme === "dark" ? "#3f3f46" : "#e4e4e7") + "; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }",
      ".sn-header-logo { width: 24px; height: 24px; border-radius: 4px; object-fit: contain; }",
      ".sn-header-name { font-size: 15px; font-weight: 600; }",
      ".sn-close { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 20px; color: " + (theme === "dark" ? "#a1a1aa" : "#71717a") + "; padding: 0 4px; }",
      ".sn-list { overflow-y: auto; flex: 1; }",
      ".sn-card { padding: 14px 16px; border-bottom: 1px solid " + (theme === "dark" ? "#27272a" : "#f4f4f5") + "; cursor: pointer; transition: background 0.1s; }",
      ".sn-card:hover { background: " + (theme === "dark" ? "#27272a" : "#fafafa") + "; }",
      ".sn-card:last-child { border-bottom: none; }",
      ".sn-card-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }",
      ".sn-card-cat { display: inline-block; padding: 1px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; color: white; }",
      ".sn-card-date { font-size: 12px; color: " + (theme === "dark" ? "#a1a1aa" : "#71717a") + "; }",
      ".sn-card-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }",
      ".sn-card-preview { font-size: 13px; color: " + (theme === "dark" ? "#a1a1aa" : "#71717a") + "; line-height: 1.4; }",
      ".sn-expanded { padding: 16px; }",
      ".sn-expanded-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }",
      ".sn-expanded-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }",
      ".sn-expanded-body { font-size: 14px; line-height: 1.6; }",
      ".sn-expanded-body h1,.sn-expanded-body h2,.sn-expanded-body h3 { font-weight: 600; margin: 12px 0 6px; }",
      ".sn-expanded-body p { margin-bottom: 8px; }",
      ".sn-expanded-body ul,.sn-expanded-body ol { margin: 8px 0; padding-left: 20px; }",
      ".sn-expanded-body code { background: " + (theme === "dark" ? "#27272a" : "#f4f4f5") + "; padding: 1px 5px; border-radius: 3px; font-size: 13px; }",
      ".sn-expanded-body pre { background: " + (theme === "dark" ? "#27272a" : "#f4f4f5") + "; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0; }",
      ".sn-expanded-body pre code { background: none; padding: 0; }",
      ".sn-back { background: none; border: none; cursor: pointer; font-size: 13px; color: " + accent + "; margin-bottom: 10px; padding: 0; }",
      ".sn-empty { padding: 32px 16px; text-align: center; color: " + (theme === "dark" ? "#a1a1aa" : "#71717a") + "; font-size: 14px; }",
    ].join("\n");
    shadow.appendChild(style);

    // Bell button
    var btn = document.createElement("button");
    btn.className = "sn-btn " + (isRight ? "right" : "left");
    btn.style.backgroundColor = accent;
    btn.setAttribute("aria-label", "What's new");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

    var badge = document.createElement("span");
    badge.className = "sn-badge" + (newCount === 0 ? " hidden" : "");
    badge.textContent = String(newCount);
    btn.appendChild(badge);
    shadow.appendChild(btn);

    // Panel
    var panel = document.createElement("div");
    panel.className = "sn-panel " + (isRight ? "right" : "left");
    shadow.appendChild(panel);

    var isOpen = false;
    var currentView = "list";

    function renderHeader() {
      var header = document.createElement("div");
      header.className = "sn-header";
      if (logoUrl) {
        var img = document.createElement("img");
        img.className = "sn-header-logo";
        img.src = logoUrl;
        img.alt = "";
        header.appendChild(img);
      }
      var name = document.createElement("span");
      name.className = "sn-header-name";
      name.textContent = projectName;
      header.appendChild(name);
      var close = document.createElement("button");
      close.className = "sn-close";
      close.setAttribute("aria-label", "Close");
      close.textContent = "\u00d7";
      close.onclick = function (e) {
        e.stopPropagation();
        togglePanel();
      };
      header.appendChild(close);
      return header;
    }

    function renderList() {
      currentView = "list";
      panel.innerHTML = "";
      panel.appendChild(renderHeader());

      var list = document.createElement("div");
      list.className = "sn-list";

      if (posts.length === 0) {
        var empty = document.createElement("div");
        empty.className = "sn-empty";
        empty.textContent = "No updates yet.";
        list.appendChild(empty);
      }

      posts.forEach(function (post) {
        var card = document.createElement("div");
        card.className = "sn-card";

        var meta = document.createElement("div");
        meta.className = "sn-card-meta";
        if (post.category_name) {
          var cat = document.createElement("span");
          cat.className = "sn-card-cat";
          cat.style.backgroundColor = post.category_color || "#6b7280";
          cat.textContent = post.category_name;
          meta.appendChild(cat);
        }
        var date = document.createElement("span");
        date.className = "sn-card-date";
        date.textContent = formatDate(post.published_at);
        meta.appendChild(date);
        card.appendChild(meta);

        var title = document.createElement("div");
        title.className = "sn-card-title";
        title.textContent = post.title;
        card.appendChild(title);

        var preview = document.createElement("div");
        preview.className = "sn-card-preview";
        preview.innerHTML = truncate(post.body_html, 120);
        card.appendChild(preview);

        card.onclick = function () {
          renderExpanded(post);
        };

        list.appendChild(card);
      });

      panel.appendChild(list);
    }

    function renderExpanded(post) {
      currentView = "expanded";
      panel.innerHTML = "";
      panel.appendChild(renderHeader());

      var container = document.createElement("div");
      container.className = "sn-list";

      var inner = document.createElement("div");
      inner.className = "sn-expanded";

      var back = document.createElement("button");
      back.className = "sn-back";
      back.textContent = "\u2190 Back";
      back.onclick = function () {
        renderList();
      };
      inner.appendChild(back);

      var title = document.createElement("div");
      title.className = "sn-expanded-title";
      title.textContent = post.title;
      inner.appendChild(title);

      var meta = document.createElement("div");
      meta.className = "sn-expanded-meta";
      if (post.category_name) {
        var cat = document.createElement("span");
        cat.className = "sn-card-cat";
        cat.style.backgroundColor = post.category_color || "#6b7280";
        cat.textContent = post.category_name;
        meta.appendChild(cat);
      }
      var date = document.createElement("span");
      date.className = "sn-card-date";
      date.textContent = formatDate(post.published_at);
      meta.appendChild(date);
      inner.appendChild(meta);

      var body = document.createElement("div");
      body.className = "sn-expanded-body";
      body.innerHTML = post.body_html;
      inner.appendChild(body);

      container.appendChild(inner);
      panel.appendChild(container);
    }

    function togglePanel() {
      isOpen = !isOpen;
      if (isOpen) {
        renderList();
        panel.classList.add("open");
        var latest = posts.length > 0 ? posts[0].published_at : 0;
        if (latest > 0) {
          setLastSeen(latest);
          badge.classList.add("hidden");
        }
      } else {
        panel.classList.remove("open");
      }
    }

    btn.onclick = togglePanel;

    document.body.appendChild(host);
  }

  Promise.all([
    fetchJSON(base + "/api/widget/config"),
    fetchJSON(base + "/api/widget/posts"),
  ])
    .then(function (results) {
      buildWidget(results[0], results[1]);
    })
    .catch(function (err) {
      console.error("[shipnote] widget failed to load:", err);
    });
})();
