// UI logic. Answers are kept in memory only (never stored or sent anywhere).
(function () {
  "use strict";

  var FIELDS = SchemeData.FIELDS;
  var SCHEMES = SchemeData.SCHEMES;
  var FIELD_KEYS = FIELDS.map(function (f) { return f.key; });

  var state = { lang: "en", profile: {}, topic: "all", showNo: false };

  try {
    var saved = localStorage.getItem("sf-lang");
    if (saved && I18N.T[saved]) state.lang = saved;
  } catch (e) { /* storage unavailable: fine */ }

  function tr(key) { return I18N.t(state.lang, key); }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { if (kid) node.appendChild(kid); });
    return node;
  }

  var $ = function (id) { return document.getElementById(id); };

  // ---------- option labels ----------
  function optionLabel(field, value) {
    if (field.key === "gender") return tr("o_" + value);
    if (field.key === "occupation") {
      if (value === "self-employed") return tr("o_selfemployed");
      if (value === "other") return tr("o_otheroccupation");
      return tr("o_" + value);
    }
    return value; // state and category names are shown as-is
  }

  // ---------- form ----------
  function buildForm() {
    var form = $("form");
    form.textContent = "";
    FIELDS.forEach(function (f) {
      var id = "f-" + f.key;
      var control;

      if (f.type === "number") {
        control = el("input", { id: id, type: "number", inputmode: "numeric", min: String(f.min), max: String(f.max) });
        if (state.profile[f.key] !== undefined) control.value = String(state.profile[f.key]);
        control.addEventListener("input", function () { setValue(f, control.value); });
      } else {
        control = el("select", { id: id });
        control.appendChild(el("option", { value: "", text: tr("unanswered") }));
        var opts = f.type === "bool" ? ["true", "false"] : f.options;
        opts.forEach(function (o) {
          var label = f.type === "bool" ? (o === "true" ? tr("yes") : tr("no")) : optionLabel(f, o);
          control.appendChild(el("option", { value: o, text: label }));
        });
        var cur = state.profile[f.key];
        if (cur !== undefined) control.value = String(cur);
        control.addEventListener("change", function () { setValue(f, control.value); });
      }

      form.appendChild(
        el("div", { class: "field", id: "field-" + f.key }, [el("label", { for: id, text: tr("f_" + f.key) }), control])
      );
    });
  }

  function setValue(field, raw) {
    if (raw === "" || raw === null) {
      delete state.profile[field.key];
    } else if (field.type === "number") {
      var n = Number(raw);
      if (isNaN(n) || n < 0) delete state.profile[field.key];
      else state.profile[field.key] = n;
    } else if (field.type === "bool") {
      state.profile[field.key] = raw === "true";
    } else {
      state.profile[field.key] = raw;
    }
    update();
  }

  // ---------- results ----------
  function visibleSchemes() {
    return SCHEMES.filter(function (s) { return state.topic === "all" || s.topic === state.topic; });
  }

  function labelsOf(list) { return list.map(function (x) { return x.label; }).join("; "); }

  function card(res) {
    var s = res.scheme;
    var meta = s.level + (s.state ? " · " + s.state : "") + " · " + s.topic;
    var kids = [
      el("h4", { text: s.name }),
      el("div", { class: "meta", text: meta }),
      el("p", { text: s.benefit }),
    ];

    if ((res.status === "almost" || res.status === "no") && res.failed.length) {
      kids.push(el("div", { class: "reason" }, [el("strong", { text: tr("whyNot") }), document.createTextNode(labelsOf(res.failed))]));
    }
    if ((res.status === "maybe" || res.status === "almost") && res.unknown.length) {
      kids.push(el("div", { class: "reason" }, [el("strong", { text: tr("missing") }), document.createTextNode(labelsOf(res.unknown))]));
    }

    var docs = el("ul", {}, s.documents.map(function (d) { return el("li", { text: d }); }));
    kids.push(el("details", {}, [el("summary", { text: tr("documents") }), docs]));
    kids.push(el("a", { class: "apply", href: s.url, target: "_blank", rel: "noopener noreferrer", text: tr("apply") + " ↗" }));
    kids.push(el("div", { class: "meta", text: s.lastVerified ? tr("verified") + ": " + s.lastVerified : tr("notVerified") }));

    return el("article", { class: "card" }, kids);
  }

  function group(kind, items) {
    var head = el("h3", {}, [el("span", { text: tr(kind === "no" ? "none" : kind) }), el("span", { class: "pill", text: String(items.length) })]);
    return el("section", { class: "group g-" + kind }, [head].concat(items.map(card)));
  }

  function renderResults() {
    var groups = Engine.matchAll(visibleSchemes(), state.profile);
    var root = $("groups");
    root.textContent = "";

    ["eligible", "maybe", "almost"].forEach(function (k) {
      if (groups[k].length) root.appendChild(group(k, groups[k]));
    });

    if (groups.no.length) {
      var btn = el("button", { type: "button", class: "toggle-no", text: state.showNo ? tr("hideMore") : tr("showMore") });
      btn.addEventListener("click", function () { state.showNo = !state.showNo; renderResults(); });
      root.appendChild(btn);
      if (state.showNo) root.appendChild(el("div", { class: "group g-no" }, [group("no", groups.no)]));
    }

    if (!root.children.length) root.appendChild(el("p", { class: "empty", text: tr("empty") }));
  }

  function renderHint() {
    var next = Engine.suggestNextField(visibleSchemes(), state.profile, FIELD_KEYS);
    var hint = $("nextHint");
    FIELD_KEYS.forEach(function (k) {
      var node = $("field-" + k);
      if (node) node.classList.toggle("suggested", k === next);
    });
    if (next) {
      hint.hidden = false;
      hint.textContent = tr("next") + " " + tr("f_" + next);
    } else {
      hint.hidden = true;
      hint.textContent = "";
    }
  }

  function buildTopicFilter() {
    var sel = $("topicFilter");
    sel.textContent = "";
    sel.appendChild(el("option", { value: "all", text: tr("filterAll") }));
    var seen = {};
    SCHEMES.forEach(function (s) {
      if (!seen[s.topic]) {
        seen[s.topic] = true;
        sel.appendChild(el("option", { value: s.topic, text: s.topic }));
      }
    });
    sel.value = state.topic;
  }

  // ---------- static text and language ----------
  function buildLangButtons() {
    var box = $("langs");
    box.textContent = "";
    I18N.LANGS.forEach(function (pair) {
      var b = el("button", { type: "button", "aria-pressed": String(state.lang === pair[0]), text: pair[1] });
      b.addEventListener("click", function () { setLang(pair[0]); });
      box.appendChild(b);
    });
  }

  function applyStaticText() {
    document.documentElement.lang = state.lang;
    document.title = tr("title");
    $("title").textContent = tr("title");
    $("tagline").textContent = tr("tagline");
    $("privacy").textContent = tr("privacy");
    $("sample").textContent = tr("sampleNotice");
    $("about-h").textContent = tr("about");
    $("reset").textContent = tr("reset");
    $("topicLabel").textContent = tr("topic");
  }

  function setLang(lang) {
    state.lang = lang;
    try { localStorage.setItem("sf-lang", lang); } catch (e) { /* ignore */ }
    buildLangButtons();
    applyStaticText();
    buildForm();
    buildTopicFilter();
    update();
  }

  function update() {
    renderResults();
    renderHint();
  }

  // ---------- start ----------
  $("reset").addEventListener("click", function () {
    state.profile = {};
    buildForm();
    update();
  });
  $("topicFilter").addEventListener("change", function (e) {
    state.topic = e.target.value;
    update();
  });
  $("form").addEventListener("submit", function (e) { e.preventDefault(); });

  setLang(state.lang);
})();
