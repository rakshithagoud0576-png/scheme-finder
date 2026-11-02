// Eligibility engine: pure functions, no DOM. Works in browser and Node.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function isUnknown(v) {
    return v === undefined || v === null || v === "" || (typeof v === "number" && isNaN(v));
  }

  function same(a, b) {
    if (typeof a === "string" && typeof b === "string") return a.toLowerCase() === b.toLowerCase();
    return a === b;
  }

  // Returns "pass" | "fail" | "unknown" for one rule against a profile.
  function checkRule(rule, profile) {
    if (rule.anyOf) {
      var sawUnknown = false;
      for (var i = 0; i < rule.anyOf.length; i++) {
        var r = checkRule(rule.anyOf[i], profile);
        if (r === "pass") return "pass";
        if (r === "unknown") sawUnknown = true;
      }
      return sawUnknown ? "unknown" : "fail";
    }

    var v = profile[rule.field];
    if (isUnknown(v)) return "unknown";

    switch (rule.op) {
      case "eq":
        return same(v, rule.value) ? "pass" : "fail";
      case "is":
        return v === rule.value ? "pass" : "fail";
      case "in":
        return rule.value.some(function (x) { return same(v, x); }) ? "pass" : "fail";
      case "gte":
        return v >= rule.value ? "pass" : "fail";
      case "lte":
        return v <= rule.value ? "pass" : "fail";
      case "between":
        return v >= rule.value[0] && v <= rule.value[1] ? "pass" : "fail";
      default:
        return "unknown";
    }
  }

  // status: "eligible" | "maybe" | "almost" | "no"
  function evaluate(scheme, profile) {
    var result = { scheme: scheme, status: "eligible", failed: [], unknown: [] };

    if (scheme.state) {
      if (isUnknown(profile.state)) {
        result.unknown.push({ label: "Only for " + scheme.state, fields: ["state"] });
      } else if (!same(profile.state, scheme.state)) {
        result.status = "no";
        result.failed.push({ label: "Only for residents of " + scheme.state, fields: ["state"] });
        return result;
      }
    }

    scheme.rules.forEach(function (rule) {
      var outcome = checkRule(rule, profile);
      var fields = fieldsOf(rule);
      if (outcome === "fail") result.failed.push({ label: rule.label, fields: fields });
      else if (outcome === "unknown") result.unknown.push({ label: rule.label, fields: fields });
    });

    if (result.failed.length === 0) result.status = result.unknown.length ? "maybe" : "eligible";
    else if (result.failed.length === 1) result.status = "almost";
    else result.status = "no";
    return result;
  }

  function fieldsOf(rule) {
    if (rule.anyOf) {
      var out = [];
      rule.anyOf.forEach(function (r) {
        fieldsOf(r).forEach(function (f) { if (out.indexOf(f) < 0) out.push(f); });
      });
      return out;
    }
    return [rule.field];
  }

  function matchAll(schemes, profile) {
    var groups = { eligible: [], maybe: [], almost: [], no: [] };
    schemes.forEach(function (s) {
      var r = evaluate(s, profile);
      groups[r.status].push(r);
    });
    return groups;
  }

  // Adaptive questioning: of the fields the user has not answered, which one appears in
  // the rules of the most schemes that are still possible? Ask that one next.
  function suggestNextField(schemes, profile, fieldKeys) {
    var counts = {};
    schemes.forEach(function (s) {
      var res = evaluate(s, profile);
      if (res.status === "no") return;
      var pending = {};
      res.unknown.forEach(function (u) {
        u.fields.forEach(function (f) { pending[f] = true; });
      });
      Object.keys(pending).forEach(function (f) { counts[f] = (counts[f] || 0) + 1; });
    });

    var best = null;
    var bestCount = 0;
    fieldKeys.forEach(function (k) {
      if (!isUnknown(profile[k]) && profile[k] !== undefined) return;
      if ((counts[k] || 0) > bestCount) {
        best = k;
        bestCount = counts[k];
      }
    });
    return best;
  }

  return {
    checkRule: checkRule,
    evaluate: evaluate,
    matchAll: matchAll,
    suggestNextField: suggestNextField,
    isUnknown: isUnknown,
  };
});
