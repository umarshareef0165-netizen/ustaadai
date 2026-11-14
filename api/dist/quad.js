/**
 * Exact quadratic-equation solver — mirrors the physics motion solver.
 * Parses equations like "x² − 5x + 6 = 0", "2x² + 5x − 3 = 0", "x² = 4",
 * "x^2 - 3x + 3 = 0", "x square minus 5x plus 6 = 0".
 * Returns null for anything it cannot parse exactly (parameters like k,
 * missing terms, non-numeric coefficients) so the caller falls through to
 * retrieval instead of guessing.
 */
function fmt(n) {
    const s = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(3)));
    return s.replace(/-/g, "−");
}
function fmtSigned(n) {
    return (n < 0 ? "− " : "+ ") + fmt(Math.abs(n));
}
/** Parse one coefficient string: "" → 1, "-" → -1, "2" → 2, "0.5" → 0.5. */
function parseCoeff(s) {
    const t = s.trim();
    if (t === "" || t === "+")
        return 1;
    if (t === "-")
        return -1;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
}
/**
 * Parse a quadratic equation out of free text. Accepts unicode superscripts,
 * "x^2", "x square", spelled-out plus/minus, and equations with a non-zero
 * right-hand side ("x² = 4", "x² + 2x = 8").
 */
export function parseQuadratic(message) {
    let s = message
        .toLowerCase()
        .replace(/−/g, "-")
        .replace(/–/g, "-")
        .replace(/\bplus\b/g, "+")
        .replace(/\bminus\b/g, "-")
        .replace(/x\s*\^\s*2/g, "x²")
        .replace(/x\s+square/g, "x²")
        .replace(/\s+/g, "");
    if (!s.includes("x²"))
        return null;
    const discriminantOnly = /discriminant/.test(s);
    // Cut to the equation itself: from the first x² (or a leading coefficient)
    // to "=..." — drop trailing words like "halkaro".
    const eqStart = s.search(/[+-]?\d*\.?\d*x²/);
    if (eqStart < 0)
        return null;
    s = s.slice(eqStart);
    const eqEnd = s.search(/=(-?\d*\.?\d+)?/);
    if (eqEnd < 0) {
        // No "= ...": only usable for a discriminant request.
        if (!discriminantOnly)
            return null;
        // Treat the rest as the left-hand side, "= 0" implied.
        s = s + "=0";
    }
    else {
        // Keep "=N" then stop (drop any trailing words).
        const tail = s.slice(eqEnd);
        const m = tail.match(/^=(-?\d*\.?\d+)?/);
        if (!m)
            return null;
        s = s.slice(0, eqEnd) + m[0];
    }
    const [lhs, rhsRaw] = s.split("=");
    const rhs = rhsRaw === "" || rhsRaw === undefined ? 0 : parseFloat(rhsRaw);
    if (rhsRaw !== "" && rhsRaw !== undefined && !Number.isFinite(rhs))
        return null;
    // Split the left-hand side into signed terms.
    const terms = lhs.match(/[+-]?[^+-]+/g) ?? [];
    let a = null;
    let b = 0;
    let c = 0;
    for (const term of terms) {
        if (term.includes("x²")) {
            const coef = parseCoeff(term.replace("x²", ""));
            if (coef === null || coef === 0)
                return null;
            if (a !== null)
                return null; // two x² terms — not a quadratic
            a = coef;
        }
        else if (term.includes("x")) {
            const coef = parseCoeff(term.replace("x", ""));
            if (coef === null)
                return null;
            b += coef;
        }
        else {
            const n = parseFloat(term);
            if (!Number.isFinite(n))
                return null;
            c += n;
        }
    }
    if (a === null)
        return null;
    c -= rhs;
    return { a, b, c, discriminantOnly };
}
/** D = b² − 4ac; roots by the quadratic formula; Matric nature classification. */
export function solveQuadratic(p) {
    const D = p.b * p.b - 4 * p.a * p.c;
    let roots = null;
    let nature;
    if (D > 0) {
        const sq = Math.sqrt(D);
        const r1 = (-p.b + sq) / (2 * p.a);
        const r2 = (-p.b - sq) / (2 * p.a);
        roots = [r1, r2];
        nature =
            Number.isInteger(sq) && sq !== 0
                ? "D > 0 aur perfect square — roots rational aur unequal"
                : "D > 0 magar perfect square nahi — roots irrational aur unequal";
    }
    else if (D === 0) {
        roots = [-p.b / (2 * p.a)];
        nature = "D = 0 — roots equal (double root)";
    }
    else {
        nature = "D < 0 — koi real root nahi (roots imaginary hain)";
    }
    return { ...p, D, roots, nature };
}
/** True when the message asks to solve / find roots / discriminant of a quadratic. */
export function asksQuadratic(message) {
    const lower = ` ${message.toLowerCase()} `;
    return (lower.includes("x²") ||
        lower.includes("x^2") ||
        lower.includes("x square") ||
        lower.includes("quadratic") ||
        lower.includes("discriminant"));
}
function renderEquation(p) {
    const aPart = p.a === 1 ? "x²" : p.a === -1 ? "−x²" : `${fmt(p.a)}x²`;
    const bPart = p.b === 0 ? "" : p.b === 1 ? " + x" : p.b === -1 ? " − x" : ` ${fmtSigned(p.b)}x`;
    const cPart = p.c === 0 ? "" : ` ${fmtSigned(p.c)}`;
    return `${aPart}${bPart}${cPart} = 0`;
}
export function renderQuadraticAnswerUr(r) {
    const lines = [
        `مرحلہ 1 — معیاری شکل: ${renderEquation(r)} (a = ${fmt(r.a)}، b = ${fmt(r.b)}، c = ${fmt(r.c)})۔`,
        `مرحلہ 2 — ممیز (Discriminant): D = b² − 4ac = (${fmt(r.b)})² − 4 × ${fmt(r.a)} × ${fmt(r.c)} = ${fmt(r.D)}۔`,
        `مرحلہ 3 — نوعیت: ${r.nature}۔`,
    ];
    if (r.roots) {
        const formula = r.roots.length === 2
            ? `x = (−b ± √D) / 2a = (${fmt(-r.b)} ± √${fmt(r.D)}) / ${fmt(2 * r.a)} → x = ${fmt(r.roots[0])} ya ${fmt(r.roots[1])}`
            : `x = −b / 2a = ${fmt(-r.b)} / ${fmt(2 * r.a)} = ${fmt(r.roots[0])} (double root)`;
        lines.push(`مرحلہ 4 — کلیہ (Quadratic Formula): ${formula}۔`);
        lines.push(`Jawab: x = ${r.roots.map(fmt).join(" ya ")}۔ جانچ: roots ka sum = −b/a = ${fmt(-r.b / r.a)}، product = c/a = ${fmt(r.c / r.a)}۔`);
    }
    else {
        lines.push("Jawab: is equation ke koi real roots nahi hain۔");
    }
    return lines.join("\n");
}
export function renderQuadraticAnswerRoman(r) {
    const lines = [
        `Step 1 — Standard form: ${renderEquation(r)} (a = ${fmt(r.a)}, b = ${fmt(r.b)}, c = ${fmt(r.c)}).`,
        `Step 2 — Discriminant: D = b² − 4ac = (${fmt(r.b)})² − 4 × ${fmt(r.a)} × ${fmt(r.c)} = ${fmt(r.D)}.`,
        `Step 3 — Nature: ${r.nature}.`,
    ];
    if (r.roots) {
        const formula = r.roots.length === 2
            ? `x = (−b ± √D) / 2a = (${fmt(-r.b)} ± √${fmt(r.D)}) / ${fmt(2 * r.a)} → x = ${fmt(r.roots[0])} or ${fmt(r.roots[1])}`
            : `x = −b / 2a = ${fmt(-r.b)} / ${fmt(2 * r.a)} = ${fmt(r.roots[0])} (double root)`;
        lines.push(`Step 4 — Quadratic Formula: ${formula}.`);
        lines.push(`Jawab: x = ${r.roots.map(fmt).join(" or ")}. Check: sum of roots = −b/a = ${fmt(-r.b / r.a)}, product = c/a = ${fmt(r.c / r.a)}.`);
    }
    else {
        lines.push("Jawab: is equation ke koi real roots nahi hain.");
    }
    return lines.join("\n");
}
export function quadraticFollowUp(r) {
    const sum = fmt(-r.b / r.a);
    const prod = fmt(r.c / r.a);
    return {
        followUp: `اب آپ بتائیے: اس equation کے roots کا sum اور product کتنا ہے؟ (اشارہ: sum = −b/a = ${sum}، product = c/a = ${prod})`,
        followUpRoman: `Ab aap batayein: is equation ke roots ka sum aur product kitna hai? (Hint: sum = −b/a = ${sum}, product = c/a = ${prod})`,
    };
}
