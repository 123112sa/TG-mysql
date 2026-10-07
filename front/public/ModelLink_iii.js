(() => {
  "use strict";
  var e,
    t,
    n = {
      626: () => {
        const e = 40,
          t = {},
          n = {},
          s = {
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowColor: "rgb(0 102 255)",
            shadowBlur: 10,
          },
          i = { strokeStyle: "#318dff", fillStyle: "rgba(63,166,255, 0.3)" },
          r = { strokeStyle: "#137868", fillStyle: "#ffffff", lineWidth: 5 },
          o = { strokeStyle: "#137868", fillStyle: "#ffffff", lineWidth: 5 },
          a = { strokeStyle: "#2586ff", fillStyle: "#ffffff30", lineWidth: 3 },
          c = { strokeStyle: "#2586ff", fillStyle: "#345fff91", lineWidth: 3 },
          h = { strokeStyle: "#333", fillStyle: "#333", lineWidth: 4 },
          l = { strokeStyle: "#3f7ae7", fillStyle: "#3f7ae7", lineWidth: 6 },
          y = {
            lineMode: 1,
            magnet: !0,
            label: !0,
            labelMode: "name",
            noRepeatName: !0,
            grid: !0,
            dev: !1,
            performance: !0,
            stream: !1,
          },
          d = {
            lineWidth: 10,
            strokeStyle: "#f15200aa",
            fillStyle: "#ffffff87",
          },
          x = {
            lineWidth: 5,
            strokeStyle: "#f15200aa",
            fillStyle: "#f1520087",
          },
          u = {
            lineWidth: 10,
            strokeStyle: "#4caf50aa",
            fillStyle: "#ffffff87",
          },
          f = {
            lineWidth: 5,
            strokeStyle: "#4caf50aa",
            fillStyle: "#4caf5087",
          },
          p = 30,
          _ = { stroke: "#999", lineWidth: 0.5 },
          g = { stroke: "#999", lineWidth: 0.5 },
          v = {
            MT: "n-resize",
            MB: "n-resize",
            RM: "e-resize",
            LM: "e-resize",
            LT: "nw-resize",
            RB: "nw-resize",
            RT: "ne-resize",
            LB: "ne-resize",
          },
          m = {
            LM: "RM",
            RM: "LM",
            MT: "MB",
            MB: "MT",
            L: "R",
            R: "L",
            T: "B",
            B: "T",
          },
          b = { 0: "MT", 8: "RM", 16: "MB", 24: "LM" },
          E = {
            translate: { x: 0, y: 0 },
            boundary: { left: 0, right: 0, top: 0, bottom: 0 },
            scale: 1,
          },
          w = (e, t) => {
            const { el: n, transform: s } = t,
              { translate: i, scale: r } = s,
              o = L(n);
            return {
              x: 1 * ((e.offsetX * o.x - i.x) / r).toFixed(1),
              y: 1 * ((e.offsetY * o.y - i.y) / r).toFixed(1),
            };
          },
          M = (e) => ({
            x: 1 * (e.x / 30).toFixed() * 30,
            y: 1 * (e.y / 30).toFixed() * 30,
          }),
          L = (e) => ({
            x: (e.width / getComputedStyle(e).width.split("px")[0]) * 1,
            y: (e.height / getComputedStyle(e).height.split("px")[0]) * 1,
          }),
          S = (e, t) => Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2),
          T = (e, t, n = 1.2) => {
            const { center: s, width: i, height: r } = t;
            return (
              Math.abs(e.x - s.x) < (i / 2) * n &&
              Math.abs(e.y - s.y) < (r / 2) * n
            );
          },
          O = (e, t) => {
            const n = e.x,
              s = e.y;
            return (
              ((n > t.x1 && n < t.x2) || (n < t.x1 && n > t.x2)) &&
              ((s > t.y1 && s < t.y2) || (s < t.y1 && s > t.y2))
            );
          },
          D = (e, t, n = []) => {
            const s = {},
              i = {
                T: ["0-3", "29-31"],
                R: ["4-12"],
                B: ["13-19"],
                L: ["20-28"],
              };
            for (const e in i)
              i[e].forEach((t) => {
                const [n, i] = t.split("-").map((e) => 1 * e);
                for (let t = n; t <= i; t++) s[t] = e;
              });
            const r = e.x / 2 + t.x / 2,
              o = e.y / 2 + t.y / 2,
              a = {
                TL_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TL_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: t.x - 30, y: e.y - 30 },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TL_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x - 30, y: o },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TL_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: r, y: e.y - 30 },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TB_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
                TB_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: r, y: e.y - 30 },
                  { x: r, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                TB_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
                TB_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: r, y: e.y - 30 },
                  { x: r, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                TT_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                TT_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: t.x, y: e.y - 30 },
                  { x: t.x, y: t.y },
                ],
                TT_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                TT_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: t.x, y: e.y - 30 },
                  { x: t.x, y: t.y },
                ],
                TR_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x + 30, y: o },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TR_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: r, y: e.y - 30 },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TR_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y },
                  { x: t.x, y: t.y },
                ],
                TR_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y - 30 },
                  { x: t.x + 30, y: e.y - 30 },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RL_0: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RL_1: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: o },
                  { x: t.x - 30, y: o },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RL_2: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: o },
                  { x: t.x - 30, y: o },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RL_3: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RB_0: [
                  { x: e.x, y: e.y },
                  { x: t.x, y: e.y },
                  { x: t.x, y: t.y },
                ],
                RB_1: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                RB_2: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                RB_3: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                RT_0: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                RT_1: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
                RT_2: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                RT_3: [
                  { x: e.x, y: e.y },
                  { x: t.x, y: e.y },
                  { x: t.x, y: t.y },
                ],
                RR_0: [
                  { x: e.x, y: e.y },
                  { x: t.x + 30, y: e.y },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RR_1: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RR_2: [
                  { x: e.x, y: e.y },
                  { x: e.x + 30, y: e.y },
                  { x: e.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                RR_3: [
                  { x: e.x, y: e.y },
                  { x: t.x + 30, y: e.y },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LL_0: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LL_1: [
                  { x: e.x, y: e.y },
                  { x: t.x - 30, y: e.y },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LL_2: [
                  { x: e.x, y: e.y },
                  { x: t.x - 30, y: e.y },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LL_3: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LB_0: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
                LB_1: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                LB_2: [
                  { x: e.x, y: e.y },
                  { x: t.x, y: e.y },
                  { x: t.x, y: t.y },
                ],
                LB_3: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                LT_0: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                LT_1: [
                  { x: e.x, y: e.y },
                  { x: t.x, y: e.y },
                  { x: t.x, y: t.y },
                ],
                LT_2: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                LT_3: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
                LR_0: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: o },
                  { x: t.x + 30, y: o },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LR_1: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LR_2: [
                  { x: e.x, y: e.y },
                  { x: r, y: e.y },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                LR_3: [
                  { x: e.x, y: e.y },
                  { x: e.x - 30, y: e.y },
                  { x: e.x - 30, y: o },
                  { x: t.x + 30, y: o },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BB_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: t.x, y: e.y + 30 },
                  { x: t.x, y: t.y },
                ],
                BB_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                BB_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: t.x, y: e.y + 30 },
                  { x: t.x, y: t.y },
                ],
                BB_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y + 30 },
                  { x: t.x, y: t.y + 30 },
                  { x: t.x, y: t.y },
                ],
                BL_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: r, y: e.y + 30 },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BL_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x - 30, y: o },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BL_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: t.x - 30, y: e.y + 30 },
                  { x: t.x - 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BL_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BR_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: t.x + 30, y: e.y + 30 },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BR_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BR_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: r, y: e.y + 30 },
                  { x: r, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BR_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x + 30, y: o },
                  { x: t.x + 30, y: t.y },
                  { x: t.x, y: t.y },
                ],
                BT_0: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: r, y: e.y + 30 },
                  { x: r, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                BT_1: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
                BT_2: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: e.y + 30 },
                  { x: r, y: e.y + 30 },
                  { x: r, y: t.y - 30 },
                  { x: t.x, y: t.y - 30 },
                  { x: t.x, y: t.y },
                ],
                BT_3: [
                  { x: e.x, y: e.y },
                  { x: e.x, y: o },
                  { x: t.x, y: o },
                  { x: t.x, y: t.y },
                ],
              };
            let c = s[e.key];
            c || (e.side && (c = e.side));
            let l = s[t.key];
            l ||
              (l =
                Math.abs(e.x - t.x) < h.lineWidth
                  ? e.y > t.y
                    ? "B"
                    : "T"
                  : e.x > t.x
                  ? "R"
                  : "L");
            const y = { points: [], desc: [] };
            if (
              (e.x < t.x
                ? e.y > t.y
                  ? (y.points = a[c + l + "_0"])
                  : (y.points = a[c + l + "_3"])
                : e.y > t.y
                ? (y.points = a[c + l + "_2"])
                : (y.points = a[c + l + "_1"]),
              (y.desc = [c, l]),
              4 === y.points.length)
            ) {
              const e = y.points[0];
              let t = { x: 0, y: 0 };
              for (const n of y.points)
                n.x === e.x && (t.x += 1), n.y === e.y && (t.y += 1);
              (4 !== t.x && 4 !== t.y) || y.points.splice(1, 2);
            }
            return y;
          },
          k = (e, t, n) => {
            const s = [];
            let i = !1;
            e.forEach((e) => {
              const { type: n, start: i, end: r, controllers: o } = e,
                a = { aniFn: () => null, loopFn: () => null, aniFrameIndex: 0 };
              if (1 === n) {
                const { points: e } = D(i, r);
                ((e) => {
                  let t = 0;
                  for (let n = 0; n < e.length - 1; n++) t += S(e[n], e[n + 1]);
                })(e);
                let n = 0;
                const s = function () {
                    const { aniFrameIndex: s } = this,
                      i = e[n],
                      r = e[n + 1],
                      o = 1 * ((240 / 720) * S(i, r)).toFixed(0),
                      a = (r.x - i.x) / o,
                      c = (r.y - i.y) / o;
                    t({ x: i.x + a * s, y: i.y + c * s }),
                      (this.aniFrameIndex += 1),
                      this.loopFn(o);
                  },
                  o = function (t) {
                    this.aniFrameIndex === t &&
                      ((this.aniFrameIndex = 0),
                      (n += 1),
                      n === e.length - 1 && (n = 0));
                  };
                (a.aniFn = s), (a.loopFn = o);
              } else if (0 === n) {
                const e = { x: (r.x - i.x) / 120, y: (r.y - i.y) / 120 },
                  n = function () {
                    const { aniFrameIndex: n } = this;
                    t({ x: i.x + e.x * n, y: i.y + e.y * n }),
                      (this.aniFrameIndex += 1),
                      this.loopFn(120);
                  },
                  s = function (e) {
                    this.aniFrameIndex === e && (this.aniFrameIndex = 0);
                  };
                (a.aniFn = n), (a.loopFn = s);
              } else if (3 === n) {
                const e = function () {
                    const { aniFrameIndex: e } = this,
                      n = I(e / 120, i, r, o);
                    t(n), (this.aniFrameIndex += 1), this.loopFn(120);
                  },
                  n = function (e) {
                    this.aniFrameIndex === e && (this.aniFrameIndex = 0);
                  };
                (a.aniFn = e), (a.loopFn = n);
              }
              s.push(a);
            });
            const r = () => {
              n(),
                s.forEach((e) => e.aniFn()),
                i && window.requestAnimationFrame(r);
            };
            return {
              start: () => {
                (i = !0), window.requestAnimationFrame(r);
              },
              end: () => {
                (i = !1), s.splice(0, s.length);
              },
            };
          },
          I = (e, t, n, s) => {
            const { x: i, y: r } = t,
              { x: o, y: a } = n,
              { x: c, y: h } = s[0],
              { x: l, y } = s[1];
            return {
              x:
                i * (1 - e) * (1 - e) * (1 - e) +
                3 * c * e * (1 - e) * (1 - e) +
                3 * l * e * e * (1 - e) +
                o * e * e * e,
              y:
                r * (1 - e) * (1 - e) * (1 - e) +
                3 * h * e * (1 - e) * (1 - e) +
                3 * y * e * e * (1 - e) +
                a * e * e * e,
            };
          },
          C = {
            ctx: null,
            setCTX(e) {
              this.ctx = e;
            },
            clear(e, t, n) {
              this.ctx.clearRect(e.x - t / 2, e.y - n / 2, t, n);
            },
            isInPath(e, t) {
              this.ctx.save(), (this.ctx.lineWidth = 24);
              const n = this.ctx.isPointInStroke(t, e.x, e.y);
              return this.ctx.restore(), n;
            },
            circle(e, t, n, s) {
              ((e, t, n, s, i = {}) => {
                if (
                  (e.save(),
                  Object.entries(i).forEach((t) => {
                    e[t[0]] = t[1];
                  }),
                  e.beginPath(),
                  "number" == typeof s)
                ) {
                  const i = s;
                  e.arc(t, n, i, 0, 2 * Math.PI);
                } else if (s.x === s.y) {
                  const i = s.x / 2;
                  e.arc(t, n, i, 0, 2 * Math.PI);
                } else if (s.x !== s.y) return s.x, void s.y;
                e.stroke(), e.fill(), e.closePath(), e.restore();
              })(this.ctx, e, t, n, s);
            },
            grid(e, t, n) {
              ((e, t, n, s) => {
                const {
                    lineWidth: i = "1",
                    stroke: r = "blue",
                    fill: o = "white",
                  } = s,
                  {
                    baseX: a,
                    offsetX: c = 0,
                    baseY: h,
                    offsetY: l = 0,
                    width: y,
                    height: d,
                  } = n;
                e.save(),
                  e.beginPath(),
                  (e.lineWidth = i),
                  (e.strokeStyle = r),
                  (e.fillStyle = o);
                const x = new Path2D();
                let u = c,
                  f = l;
                for (let e = a; e < a + y; e += t)
                  e < u || (x.moveTo(e, h + l), x.lineTo(e, h + d));
                if (c < 0)
                  for (let e = a; e > a + c; e -= t)
                    x.moveTo(e, h + l), x.lineTo(e, h + d);
                for (let e = h; e < h + d; e += t)
                  e < f || (x.moveTo(a + c, e), x.lineTo(a + y, e));
                if (l < 0)
                  for (let e = h; e > h + l; e -= t)
                    x.moveTo(a + c, e), x.lineTo(a + y, e);
                e.stroke(x), e.restore();
              })(this.ctx, e, t, n);
            },
            image(e, t, n, s, i, r) {
              ((e, t, n, s, i, r, o = {}) => {
                e.save(),
                  Object.entries(o).forEach((t) => {
                    e[t[0]] = t[1];
                  }),
                  e.drawImage(s, t - i / 2, n - r / 2, i, r),
                  e.restore();
              })(this.ctx, e, t, n, s, i, r);
            },
            roundRect(e, t, n, s, i) {
              ((
                e,
                t,
                n,
                s,
                i,
                r = {
                  lineWidth: 0.5,
                  strokeStyle: "rgba(0,0,200, 0.5)",
                  fillStyle: "rgba(0,0,200, 0.5)",
                }
              ) => {
                if ((e.save(), 2 * i > n || 2 * i > s)) return !1;
                const { x: o, y: a } = t;
                Object.entries(r).forEach((t) => {
                  e[t[0]] = t[1];
                }),
                  e.translate(o - n / 2, a - s / 2),
                  e.beginPath(0),
                  e.arc(n - i, s - i, i, 0, Math.PI / 2),
                  e.lineTo(i, s),
                  e.arc(i, s - i, i, Math.PI / 2, Math.PI),
                  e.lineTo(0, i),
                  e.arc(i, i, i, Math.PI, (3 * Math.PI) / 2),
                  e.lineTo(n - i, 0),
                  e.arc(n - i, i, i, (3 * Math.PI) / 2, 2 * Math.PI),
                  e.lineTo(n, s - i),
                  e.closePath(),
                  e.stroke(),
                  e.fill(),
                  e.restore();
              })(this.ctx, e, t, n, s, i);
            },
            line(e, t, n, s) {
              return ((e, t, n, s = {}, i = !1) => {
                e.save(),
                  e.beginPath(),
                  Object.entries(s).forEach((t) => {
                    e[t[0]] = t[1];
                  });
                const r = new Path2D();
                if ((r.moveTo(t.x, t.y), r.lineTo(n.x, n.y), e.stroke(r), i)) {
                  e.translate(n.x, n.y);
                  let s = (n.x - t.x) / (n.y - t.y);
                  (s = Math.atan(s)),
                    n.y - t.y >= 0 ? e.rotate(-s) : e.rotate(Math.PI - s),
                    (e.lineWidth = 1),
                    e.lineTo(0, -10),
                    e.lineTo(5, -12),
                    e.lineTo(0, 0),
                    e.lineTo(-5, -12),
                    e.lineTo(0, -10),
                    e.stroke(),
                    e.fill();
                }
                return e.closePath(), e.restore(), r;
              })(this.ctx, e, t, n, s);
            },
            bezier3(e, t, n, s, i) {
              return ((
                e,
                t,
                n,
                s = {},
                i = !1,
                r = [
                  { x: 0, y: 0 },
                  { x: 0, y: 0 },
                ]
              ) => {
                e.save(),
                  e.beginPath(),
                  Object.entries(s).forEach((t) => {
                    e[t[0]] = t[1];
                  });
                const o = new Path2D();
                if (
                  (o.moveTo(t.x, t.y),
                  o.bezierCurveTo(r[0].x, r[0].y, r[1].x, r[1].y, n.x, n.y),
                  e.stroke(o),
                  i)
                ) {
                  let s = 1;
                  s || (s = t.x > n.x ? "R" : "L"),
                    e.closePath(),
                    e.beginPath(),
                    e.moveTo(n.x, n.y),
                    e.translate(n.x, n.y),
                    "R" === s
                      ? e.rotate((90 * Math.PI) / 180)
                      : "L" === s
                      ? e.rotate((-90 * Math.PI) / 180)
                      : "T" === s
                      ? e.rotate(0)
                      : "B" === s && e.rotate((180 * Math.PI) / 180),
                    (e.lineWidth = 1),
                    e.lineTo(0, 0),
                    e.lineTo(5, -2),
                    e.lineTo(0, 10),
                    e.lineTo(-5, -2),
                    e.lineTo(0, 0),
                    e.stroke(),
                    e.fill();
                }
                return e.closePath(), e.restore(), o;
              })(this.ctx, e, t, n, s, i);
            },
            straightAngle(e, t, n, s) {
              return ((e, t, n, s = {}, i = { withArrow: !1 }) => {
                e.save(),
                  e.beginPath(),
                  Object.entries(s).forEach((t) => {
                    e[t[0]] = t[1];
                  });
                const { points: r, desc: o } = D(t, n),
                  [a, c] = o,
                  h = new Path2D();
                h.moveTo(r[0].x, r[0].y);
                for (let e = 1; e < r.length - 1; e++) h.lineTo(r[e].x, r[e].y);
                const l = r.length;
                switch (c) {
                  case "T":
                    h.lineTo(r[l - 1].x, r[l - 1].y - 6);
                    break;
                  case "R":
                    h.lineTo(r[l - 1].x + 6, r[l - 1].y);
                    break;
                  case "B":
                    h.lineTo(r[l - 1].x, r[l - 1].y + 6);
                    break;
                  case "L":
                    h.lineTo(r[l - 1].x - 6, r[l - 1].y);
                }
                if ((e.stroke(h), e.closePath(), i.withArrow)) {
                  (e.fillStyle = e.strokeStyle), e.beginPath();
                  const s = r[r.length - 1];
                  e.moveTo(s.x, s.y),
                    e.translate(s.x, s.y),
                    c || (c = t.x > n.x ? "R" : "L"),
                    "R" === c
                      ? e.rotate((90 * Math.PI) / 180)
                      : "L" === c
                      ? e.rotate((-90 * Math.PI) / 180)
                      : "T" === c
                      ? e.rotate(0)
                      : "B" === c && e.rotate((180 * Math.PI) / 180),
                    (e.lineWidth = 1),
                    e.lineTo(0, -10),
                    e.lineTo(5, -12),
                    e.lineTo(0, 0),
                    e.lineTo(-5, -12),
                    e.lineTo(0, -10),
                    e.stroke(),
                    e.fill(),
                    e.closePath();
                }
                return e.restore(), h;
              })(this.ctx, e, t, n, s);
            },
            text(e, t, n) {
              ((
                e,
                t,
                n,
                s = {
                  font: "25px '微软雅黑'",
                  textAlign: "center",
                  fillStyle: "#333",
                  textBaseline: "middle",
                }
              ) => {
                e.save(),
                  Object.entries(s).forEach((t) => {
                    e[t[0]] = t[1];
                  }),
                  String(n).split("\n").forEach((n, s) => e.fillText(n, t.x, t.y + 20 * s)),
                  e.restore();
              })(this.ctx, e, t, n);
            },
            pathAniGroup: (e, t) =>
              k(
                e,
                ({ x: e, y: t }) => {
                  C.circle(e, t, 5, {
                    strokeStyle: "#e73f5e",
                    fillStyle: "#e73f5e",
                  });
                },
                t
              ),
          },
          N = C,
          P = class extends class {
            constructor(e, t, n = 1) {
              (this.type = n),
                (this.start = e),
                (this.end = t),
                (this.source = null),
                (this.destination = null),
                (this.path = null),
                (this.status = { selected: !1, hover: !1 }),
                (this.info = { controllers: [] }),
                (this.style = h),
                (this._type = "connector");
            }
            link(e, t) {}
            hover(e = !1) {
              this.status.hover = e;
              const t = e || this.status.selected;
              e
                ? (this.tempStyle = t ? l : this.style)
                : t || delete this.tempStyle;
            }
            select(e = !1) {
              this.status.selected = e;
              const t = e || this.status.hover;
              e
                ? (this.tempStyle = t ? l : this.style)
                : t || delete this.tempStyle;
            }
            compile() {
              return {
                type: this.type,
                start: this.start,
                end: this.end,
                info: this.info,
                style: this.style,
                ...(this?._compile() || {}),
              };
            }
            render() {
              const { start: e, end: t } = this,
                n = t.x - e.x,
                s = (t.y, e.y, this.tempStyle || this.style);
              switch (this.type) {
                case 0:
                  (this.path = N.line(e, t, s, !0)),
                    (this.info.controllers = []);
                  break;
                case 1:
                  (this.path = N.straightAngle(e, t, s, { withArrow: !0 })),
                    (this.info.controllers = []);
                  break;
                case 3:
                  const i = [
                    { x: e.x + n / 2, y: e.y },
                    { x: e.x + n / 2, y: t.y },
                  ];
                  (this.info.controllers = i),
                    (this.path = N.bezier3(e, t, s, !1, i));
              }
            }
            destroy(e) {}
          } {
            constructor(e, t, n = 1) {
              super(e, t, n), (this._type = "connector");
            }
            link(e, t) {
              (this.source = e),
                (this.destination = t),
                this.source.addOut(this.destination),
                this.destination.addIn(this.source),
                (this.name = `${this.source.name}-${this.destination.name}`),
                (this.id = `${this.source.id}-${this.destination.id}`);
            }
            _compile() {
              return {
                source: [
                  this.source.__CANVAS__.name,
                  this.source._type,
                  this.source.id,
                ],
                destination: [
                  this.destination.__CANVAS__.name,
                  this.destination._type,
                  this.destination.id,
                ],
              };
            }
            destroy(e) {
              e.getData(
                (e) =>
                  e.source === this.source &&
                  e.destination === this.destination &&
                  e !== this
              ).length ||
                (this.source.removeOut(this.destination),
                this.destination.removeIn(this.source));
            }
          },
          A = () =>
            Number(Math.random().toString().substr(3, 6) + Date.now()).toString(
              36
            ),
          R = class {
            constructor() {
              (this.id = ""),
                (this._type = "default"),
                (this.name = "default"),
                (this.desc = ""),
                (this.shape = { center: { x: 0, y: 0 }, width: 0, height: 0 }),
                (this.status = { selected: !1, hover: !1 }),
                (this.in = new Set()),
                (this.out = new Set());
            }
            init(e, t) {
              (this.id = A()),
                (this.__CANVAS__ = t),
                this.setPosition(e.x, e.y),
                this._init?.(e, t),
                (this.name = this.name || this.id);
            }
            setPosition(e, t, n = !1) {
              this.shape.center = n
                ? { x: this.shape.center.x + e, y: this.shape.center.y + t }
                : { x: e, y: t };
            }
            setSize(e, t, n = !1) {
              n
                ? ((this.shape.width = e + this.shape.width),
                  (this.shape.height = t + this.shape.height))
                : ((this.shape.width = e), (this.shape.height = t));
            }
            hover(e) {
              this.status.hover = e;
            }
            select(e = !1) {
              this.status.selected = e;
            }
            addIn(e) {
              this.in.add(e);
            }
            addOut(e) {
              this.out.add(e);
            }
            removeIn(e) {
              this.in.delete(e);
            }
            removeOut(e) {
              this.out.delete(e);
            }
            getRelation() {
              return [[...this.in], [...this.out]];
            }
            compile() {
              return {
                id: this.id,
                _type: this._type,
                name: this.name,
                desc: this.desc,
                shape: this.shape,
                canvas: this.__CANVAS__.name,
                ...(this?._compile() || {}),
              };
            }
            load(e, t) {
              const { id: n, name: s, desc: i, shape: r } = e;
              this.init(r.center, t),
                (this.id = n),
                (this.name = s),
                (this.desc = i || ""),
                (this.shape = r),
                this._load?.(e);
            }
            destroy() {}
          },
          B = class extends R {
            constructor(e, t = {}) {
              super(),
                (this.options = t),
                (this.proto = e),
                (this._type = "gm");
            }
            _init() {
              this.name = this.proto.name;
              const { width: t = e, height: n = e } = this.proto.raw.shape;
              this.setSize(3 * t, 3 * n);
            }
            hover(e = !1) {
              const { status: t, shape: n, proto: s } = this;
              if (((t.hover = e), e)) {
                const e = ((e, t, n = [], s = { fillStyle: "#ffffff30" }) =>
                  [
                    [0, -0.5],
                    [1 / 6, -0.5],
                    [1 / 4, -0.5],
                    [1 / 3, -0.5],
                    [0.5, -0.5],
                    [0.5, -1 / 3],
                    [0.5, -1 / 4],
                    [0.5, -1 / 6],
                    [0.5, 0],
                    [0.5, 1 / 6],
                    [0.5, 1 / 4],
                    [0.5, 1 / 3],
                    [0.5, 0.5],
                    [1 / 3, 0.5],
                    [1 / 4, 0.5],
                    [1 / 6, 0.5],
                    [0, 0.5],
                    [-1 / 6, 0.5],
                    [-1 / 4, 0.5],
                    [-1 / 3, 0.5],
                    [-0.5, 0.5],
                    [-0.5, 1 / 3],
                    [-0.5, 1 / 4],
                    [-0.5, 1 / 6],
                    [-0.5, 0],
                    [-0.5, -1 / 6],
                    [-0.5, -1 / 4],
                    [-0.5, -1 / 3],
                    [-0.5, -0.5],
                    [-1 / 3, -0.5],
                    [-1 / 4, -0.5],
                    [-1 / 6, -0.5],
                  ]
                    .map((n, i) => ({
                      x: e.x + n[0] * t.x,
                      y: e.y + n[1] * t.y,
                      key: i,
                      ...s,
                    }))
                    .filter((e) => n.includes(e.key)))(
                  n.center,
                  { x: n.width, y: n.height },
                  s.points
                );
                return (
                  e.forEach((e) => {
                    e.owner = this;
                  }),
                  e
                );
              }
              return null;
            }
            _compile() {
              return { options: this.options, proto: this.proto };
            }
            render() {
              const { center: e, width: i, height: r } = this.shape,
                { hover: o, selected: a } = this.status,
                c = a ? s : o ? n : t;
              N.image(e.x, e.y, this.proto.image, i, r, c);
            }
          },
          K = class extends R {
            constructor(e = "in") {
              super(), (this.type = e), (this._type = "port");
            }
            _init(e, t) {
              (this.name = this.id),
                (this.shape.width = 60),
                (this.shape.height = 60),
                t.__SUB__.resetPoints(this.type, "add", this);
            }
            addIn(e) {
              [...this.out].forEach((t) => {
                t.addIn(e), e.addOut(t);
              }),
                this.in.add(e);
            }
            addOut(e) {
              [...this.in].forEach((t) => {
                t.addOut(e), e.addIn(t);
              }),
                this.out.add(e);
            }
            removeIn(e) {
              [...this.out].forEach((t) => {
                t.removeIn(e), e.removeOut(t);
              }),
                this.in.delete(e);
            }
            removeOut(e) {
              [...this.in].forEach((t) => {
                t.removeOut(e), e.removeIn(t);
              }),
                this.out.delete(e);
            }
            hover(e = !1) {
              const { status: t, shape: n, type: s } = this,
                { center: i, width: r, height: o } = n;
              return (
                (t.hover = e),
                e
                  ? "in" === s
                    ? [{ x: i.x + r / 2, y: i.y, key: 8, owner: this }]
                    : [{ x: i.x - r / 2, y: i.y, key: 24, owner: this }]
                  : null
              );
            }
            _compile() {
              return { type: this.type };
            }
            render() {
              const { type: e, shape: t, status: n } = this,
                { center: s, width: i } = t,
                { selected: r } = n;
              N.circle(s.x, s.y, i / 2, "in" === e ? d : u),
                r && N.circle(s.x, s.y, (i / 2) * 0.6, "in" === e ? x : f);
            }
            destroy() {
              [...this.in, ...this.out].forEach((e) => {
                if (e.__CANVAS__ !== this.__CANVAS__) {
                  const e = this.__CANVAS__.__SUB__.suCanvas.stores.connector;
                  [
                    ...e.findBy("destination", this),
                    ...e.findBy("source", this),
                  ].forEach((t) => {
                    t.destroy(e), e.remove(t);
                  });
                }
              }),
                this.__CANVAS__.__SUB__.resetPoints(this.type, "remove", this);
            }
          },
          j = class extends R {
            constructor(e, t) {
              super(),
                (this.canvas = t),
                (this.canvas.__SUB__ = this),
                (this.suCanvas = e),
                (this.ports = { in: new Set(), out: new Set() }),
                (this.points = []),
                (this._type = "sub");
            }
            _init() {
              (this.name = this.canvas.name),
                (this.shape.width = 500),
                (this.shape.height = 500);
            }
            setSize(e, t, n = !1, s) {
              n
                ? ((this.shape.width = e + this.shape.width),
                  (this.shape.height = t + this.shape.height))
                : ((this.shape.width = e), (this.shape.height = t)),
                this.resetPoints("both", "resize", s);
            }
            resetPoints(e, t, n) {
              const { height: s, center: i, width: r } = this.shape;
              if ("resize" !== t) {
                this.ports.in,
                  this.ports.out,
                  "add" === t
                    ? this.ports[`${e}`].add(n)
                    : "remove" === t && this.ports[`${e}`].delete(n);
                const r = {
                  in: s / ([...this.ports.in].length + 1),
                  out: s / ([...this.ports.out].length + 1),
                };
                [...this.ports.in].length && "in" === e
                  ? this.suCanvas.stores.connector.data.forEach((e) => {
                      [...this.ports.in].forEach((t, n) => {
                        e.destination === t &&
                          (e.end = {
                            ...e.end,
                            y: i.y - s / 2 + r.in * (n + 1),
                          });
                      });
                    })
                  : [...this.ports.out].length &&
                    "out" === e &&
                    this.suCanvas.stores.connector.data.forEach((e) => {
                      [...this.ports.in].forEach((t, n) => {
                        e.source === t &&
                          (e.start = {
                            ...e.start,
                            y: i.y - s / 2 + r.out * (n + 1),
                          });
                      });
                    });
              } else {
                const { center: e, height: t, width: o } = n,
                  a = {
                    in: t / ([...this.ports.in].length + 1),
                    out: t / ([...this.ports.out].length + 1),
                  },
                  c = {
                    in: s / ([...this.ports.in].length + 1),
                    out: s / ([...this.ports.out].length + 1),
                  },
                  h = [...this.ports.in].map((n, h) => {
                    const l = a.in * (h + 1),
                      y = c.in * (h + 1);
                    return {
                      id: n.id,
                      x: i.x - r / 2 - (e.x - o / 2),
                      y: i.y - s / 2 + y - (e.y - t / 2 + l),
                    };
                  }),
                  l = [...this.ports.out].map((n, h) => {
                    const l = a.out * (h + 1),
                      y = c.out * (h + 1);
                    return {
                      id: n.id,
                      x: i.x - (r / 2) * -1 - (e.x - (o / 2) * -1),
                      y: i.y - s / 2 + y - (e.y - t / 2 + l),
                    };
                  });
                this.suCanvas.stores.connector.data.forEach((e) => {
                  h.forEach((t) => {
                    e.destination.id === t.id &&
                      (e.end = {
                        ...e.end,
                        y: e.end.y + t.y,
                        x: e.end.x + t.x,
                      });
                  }),
                    l.forEach((t) => {
                      e.source.id === t.id &&
                        (e.start = {
                          ...e.start,
                          y: e.start.y + t.y,
                          x: e.start.x + t.x,
                        });
                    });
                });
              }
            }
            getRelation() {
              const e = new Set();
              [...this.ports.in].forEach((t) => {
                [...t.in].forEach((t) => {
                  e.add(t.__CANVAS__);
                });
              });
              const t = new Set();
              return (
                [...this.ports.out].forEach((e) => {
                  [...e.out].forEach((e) => {
                    t.add(e.__CANVAS__);
                  });
                }),
                [[...e], [...t]]
              );
            }
            _compile() {
              return { sub: this.canvas.name };
            }
            render() {
              const { center: e, width: n, height: i } = this.shape,
                { selected: a } = this.status,
                c = a ? s : t;
              N.roundRect(e, n, i, 20, { ...c, ...o });
              const h = {
                in: i / ([...this.ports.in].length + 1),
                out: i / ([...this.ports.out].length + 1),
              };
              (this.points = []),
                ["in", "out"].forEach((t) => {
                  [...this.ports[`${t}`]].forEach((s, r) => {
                    const o = "in" === t ? 1 : -1,
                      a = h[t] * (r + 1),
                      c = { x: e.x - (n / 2) * o, y: e.y - i / 2 + a };
                    this.points.push({
                      ...c,
                      key: "in" === t ? 24 : 8,
                      name: s.name,
                      id: s.id,
                      owner: s,
                    });
                  });
                }),
                this.points.forEach((e) => {
                  const t = 24 === e.key ? 1 : -1;
                  N.circle(e.x, e.y, 16, r),
                    N.text({ x: e.x + 20 * t + 8 * t, y: e.y }, e.name, {
                      textAlign: 24 === e.key ? "left" : "right",
                      font: "30px '微软雅黑'",
                      fillStyle: "#333",
                      textBaseline: "middle",
                    });
                });
            }
            destroy() {
              const { canvas: e, name: t } = this,
                { stores: n } = e,
                s = [];
              Object.entries(n).forEach((e) => {
                const [t, n] = e;
                n.data.forEach((e) => {
                  s.push(e);
                });
              }),
                (e.info.selected = s),
                e.utils.remove(),
                e.__MODEL_LINK__.removeCanvas(t);
            }
          },
          F = (e, t) => {
            const n = e?.reduce((e, t) => e[t], t),
              s = {};
            return (
              n &&
                e.reduce(
                  (t, s, i) => (
                    i === e.length - 1 ? (t[s] = n) : (t[s] = {}), t[s]
                  ),
                  s
                ),
              { v: n, t: s }
            );
          },
          z = function (e) {
            const { activeCanvas: t } = this;
            let n = null;
            n =
              e.__CANVAS__.name !== t.name
                ? this.display(e.__CANVAS__.name)
                : t;
            const { transform: s, info: i } = n;
            if (i.focusing) return;
            const { x: r, y: o } = e.shape.center,
              a = s.translate,
              c = t.el.width / 2 - r,
              h = t.el.height / 2 - o;
            let l = 0;
            const y = (c - a.x) / 60,
              d = (h - a.y) / 60,
              x = (1 - s.scale) / 60,
              u = () => {
                s.setTranslate(s.translate.x + y, s.translate.y + d),
                  s.setScale(s.scale + x),
                  (l += 1),
                  n.render(),
                  60 === l
                    ? ((n.info.focusing = !1), (n.info.sysDisable = !1))
                    : window.requestAnimationFrame(u);
              };
            (n.info.sysDisable = !0),
              (n.info.focusing = !0),
              n.select([e]),
              window.requestAnimationFrame(u);
          },
          V = function (e, t = {}) {
            const { canvasSet: n = [], focus: s = !1 } = t,
              i = n.length ? n : Object.keys(this.canvasSet);
            for (const t of i) {
              const n = this.getCanvas(t),
                { stores: i } = n,
                r = i.gm.data.find((t) => t.name === e);
              if (r) return s && this.focus(r), r;
            }
            return null;
          },
          H = function () {
            const { activeCanvas: e } = this,
              { stores: t } = e,
              { gm: n, sub: s, port: i } = t,
              r = [n, s, i]
                .map((e) => e.getData())
                .flat()
                .map((e) => e.shape),
              o = {};
            r.forEach((e) => {
              const t = e.center.x - e.width / 2,
                n = e.center.x + e.width / 2,
                s = e.center.y - e.height / 2,
                i = e.center.y + e.height / 2;
              (o.x1 = Math.min(t, o.x1 || t)),
                (o.x2 = Math.max(n, o.x2 || n)),
                (o.y1 = Math.min(s, o.y1 || s)),
                (o.y2 = Math.max(i, o.y2 || i));
            });
            const a = (o.x2 + o.x1) / 2,
              c = (o.y2 + o.y1) / 2;
            (o.x1 -= 10), (o.y1 -= 10), (o.x2 += 10), (o.y2 += 10);
            const [h, l] = [o.x2 - o.x1, o.y2 - o.y1],
              y = Math.max(h / e.el.width, l / e.el.height),
              { transform: d } = e;
            if (y <= 1) {
              const t = { x: e.el.width / 2 - a, y: e.el.height / 2 - c };
              d.setTranslate(t.x, t.y), d.setScale(1);
            } else {
              const t = {
                x: e.el.width / 2 - a / y,
                y: e.el.height / 2 - c / y,
              };
              d.setTranslate(t.x, t.y), d.setScale(1 / y);
            }
            e.render();
          },
          U = function (e) {
            const t = this.data()
                .filter((t) => t.id !== e.id)
                .map((e) => e.name),
              n = e.name;
            if (t.includes(n)) {
              const t = n.match(/_(\d+)/)?.[1];
              return (
                (e.name = t
                  ? `${e.name.split(`_${t}`)[0]}_${1 * t + 1}`
                  : `${e.name}_1`),
                U.call(this, e)
              );
            }
            return n;
          },
          W = {
            0: {
              EMPTY_RIGHT: 3,
              MOVE: 0,
              LEFT_DOWN: 1,
              RESIZE: 10,
              CONNECT: 6,
            },
            3: { EMPTY_MOVE: 4, MOVE: 4, UP: 0 },
            4: { EMPTY_RIGHT: 3, EMPTY_MOVE: 4, MOVE: 4, UP: 0, CONNECT: 6 },
            1: { MOVE: 2, EMPTY_MOVE: 8, UP: 0 },
            2: { MOVE: 2, UP: 0 },
            8: { EMPTY_MOVE: 8, UP: 0 },
            6: {
              MOVE: 6,
              EMPTY_MOVE: 6,
              UP: 6,
              LEFT_DOWN: 0,
              END: 0,
              EMPTY_RIGHT: 3,
            },
            10: { MOVE: 10, EMPTY_MOVE: 10, LEFT_DOWN: 0 },
          },
          Y = class {
            constructor(e) {
              (this.name = e), (this.data = []);
            }
            findOne(e) {
              return this.data.find(e);
            }
            getData(e) {
              return e ? [...this.data].filter(e) : [...this.data];
            }
            add(e) {
              this.data.push(e);
            }
            clear(e = !1) {
              this.data = [];
            }
            remove(e) {
              const t = this.data.indexOf(e);
              return this.data.splice(t, 1)[0];
            }
            reset(e) {
              this.data = e;
            }
            findBy(e, t) {
              return this.data.filter((n) => n[e] === t);
            }
          },
          X = function () {
            const { stores: e } = this,
              { gm: t, port: n, sub: s } = e;
            this.select([...t.data, ...s.data, ...n.data]);
          },
          q = function () {
            const e = this,
              { info: t, stores: n } = e,
              { gm: s, port: i, sub: r, connector: o } = n,
              a = [];
            t.selected.forEach((e) => {
              if ((a.push({ type: e._type, id: e.id }), e instanceof P))
                return e.destroy(n.connector), void n.connector.remove(e);
              [...o.findBy("source", e), ...o.findBy("destination", e)].forEach(
                (e) => {
                  e.destroy(n.connector), o.remove(e);
                }
              ),
                e?.destroy?.(),
                e instanceof B
                  ? s.remove(e)
                  : e instanceof j
                  ? r.remove(e)
                  : e instanceof K && i.remove(e);
            }),
              e.utils.clear(),
              e.__MODEL_LINK__.saveSnapshot({ type: "delete" }),
              this.__MODEL_LINK__.publisher.trigger("remove", { v: a }),
              e.render();
          },
          $ = function () {
            const { info: e } = this;
            this.select([]),
              (e.tools = {
                areaSelector: {
                  base: { x: 0, y: 0 },
                  center: { x: 0, y: 0 },
                  width: 0,
                  height: 0,
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 0,
                },
                connectPoints: [],
                tempConnector: { info: {}, connector: null },
              });
          },
          Z = function () {
            const e = this,
              { info: t } = e,
              n = t.selected.filter((e) => "gm" === e._type),
              s = t.selected.filter((e) => "connector" === e._type),
              i = n.map((e) => e.compile()),
              r = s.map((e) => e.compile());
            (e.info.copyData.gm = i), (e.info.copyData.c = r);
          },
          J = function () {
            const e = this,
              { info: t } = e,
              { copyData: n } = t;
            if (0 === Object.keys(n).length) return;
            const s = {},
              i = {};
            if (n?.gm) {
              s.gm = [];
              const r = { x: 30, y: 30 };
              if (t.copyAnchor) {
                const e = n.gm[0].shape.center;
                (r.x = t.copyAnchor.x - e.x), (r.y = t.copyAnchor.y - e.y);
              }
              n.gm.forEach((t) => {
                const o = JSON.parse(JSON.stringify(t)),
                  a = new B(o.proto, o.options);
                a.load(o, e),
                  (a.proto = e.__MODEL_LINK__.getModel(o.proto._uType)),
                  e.stores.gm.add(a),
                  (a.id = A());
                const c = o.shape.center;
                (c.x = o.shape.center.x + r.x),
                  (c.y = o.shape.center.y + r.y),
                  a.setPosition(c.x, c.y),
                  e.__MODEL_LINK__.getSettings("noRepeatName") &&
                    e.__MODEL_LINK__.checkName(a),
                  s.gm.push(a),
                  n.c.length && (i[t.id] = a);
              });
            }
            return Object.keys(s)
              ? (e.__MODEL_LINK__.saveSnapshot({ type: "paste", value: s }),
                e.__MODEL_LINK__.publisher.trigger("paste", { v: { id: s } }),
                n.c.length &&
                  n.c.forEach((t) => {
                    const n = t.source[2],
                      s = t.destination[2];
                    e.select([i[n], i[s]]), e.utils.connectModel();
                  }),
                e.select(s.gm),
                e.utils.showInOutLine("all"),
                e.render(),
                s)
              : null;
          },
          G = function () {
            this.utils.copy(), this.utils.remove();
          },
          Q = function (e, t) {
            const n = this,
              { stores: s } = n,
              i = n.__MODEL_LINK__.search(e),
              r = n.__MODEL_LINK__.search(t);
            if (!i || !r)
              return void n.__MODEL_LINK__.publisher.trigger("error", {
                v: {
                  msg: "端点模型无效，检查名称是否有误或者存在跨画布关系",
                  code: "005",
                },
              });
            const o = [];
            try {
              const e = (t, n, s) => {
                for (const i of t.out) {
                  if ("gm" !== i._type) return [];
                  s.push(i),
                    i.name !== n.name
                      ? (i.out.size > 0 && e(i, n, [...s]), s.pop())
                      : (o.push([...s]), s.pop());
                }
              };
              e(i, r, [i]);
              const t = new Set();
              for (const e of o)
                for (let n = 0; n < e.length - 1; n++) {
                  const i = s.connector.data.find(
                    (t) =>
                      t.source.name === e[n].name &&
                      t.destination.name === e[n + 1].name
                  );
                  t.add(i);
                }
              n.select([...t]);
            } catch (e) {
              n.__MODEL_LINK__.publisher.trigger("error", {
                v: { msg: "路径搜索异常", code: "006" },
              });
            }
          },
          ee = function (e) {
            const t = this,
              { selected: n } = t.info,
              { connector: s } = t.stores,
              i = new Set();
            n.forEach((t) => {
              if ("connector" === t._type) return;
              const n = t.__CANVAS__.name;
              if ((i.add(t), "in" === e || "all" === e))
                for (const e of t.in) {
                  if (e.__CANVAS__.name !== n) continue;
                  console.log("in model", e);
                  const r = s.data.find((n) => n.id === e.id + "-" + t.id);
                  i.add(r);
                }
              if ("out" === e || "all" === e)
                for (const e of t.out) {
                  if (e.__CANVAS__.name !== n) continue;
                  const r = s.data.find((n) => n.id === t.id + "-" + e.id);
                  i.add(r);
                }
            }),
              t.select([...i]);
          },
          te = function () {
            const e = this,
              { selected: t } = e.info,
              n = this?.__MODEL_LINK__?.getSettings?.("lineMode") || 0,
              s = [],
              i = [];
            if (!(t.length < 2)) {
              t.forEach((e) => {
                ["gm", "port"].includes(e._type) &&
                  (s.push({
                    x: e.shape.center.x + e.shape.width / 2,
                    y: e.shape.center.y,
                    key: 8,
                    active: !0,
                  }),
                  i.push({
                    x: e.shape.center.x - e.shape.width / 2,
                    y: e.shape.center.y,
                    key: 24,
                    active: !0,
                  }));
              }),
                console.log(s, i);
              for (let r = 0; r < s.length - 1; r++) {
                const o = new P(s[r], i[r + 1], n);
                e.stores.connector.add(o),
                  o.link(t[r], t[r + 1]),
                  e.__MODEL_LINK__.publisher.trigger("connect", {
                    v: { link: [t[r], t[r + 1]], connector: o },
                  });
              }
              e.render();
            }
          },
          ne = function (e) {
            const t = this,
              { info: n, stores: s } = t,
              { gm: i } = s;
            n.selected.forEach((n) => {
              const s = i.remove(n);
              "top" === e ? i.data.push(s) : i.data.unshift(s), t.render();
            });
          },
          se = function (e, t) {
            const { info: n } = this,
              s = {};
            (s[e] = t),
              n.selected.forEach((e) => {
                e.style && (e.style = Object.assign({}, e.style, s));
              }),
              this.render();
          },
          ie = function () {
            this.transform.reset(), this.render();
          },
          re = function () {
            const { stores: e } = this,
              { gm: t, sub: n, port: s } = e;
            [...t.data, ...n.data, ...s.data].forEach((t) => {
              const { x: n, y: s } = t.shape.center;
              if (n % 30 != 0 || s % 30 != 0) {
                const i = {
                  x: Math.round(n / p) * p - n,
                  y: Math.round(s / p) * p - s,
                };
                t.setPosition(i.x, i.y, !0),
                  ((t, n) => {
                    for (let s = 0; s < e.connector.data.length; s++) {
                      const i = e.connector.data[s];
                      if (i.source.id !== t.id)
                        if (i.destination.id !== t.id) {
                          if ("sub" === t._type) {
                            for (const e of [...t.ports.in])
                              i.source.id === e.id
                                ? ((i.start.x += n.x), (i.start.y += n.y))
                                : i.destination.id === e.id &&
                                  ((i.end.x += n.x), (i.end.y += n.y));
                            for (const e of [...t.ports.out])
                              i.source.id === e.id
                                ? ((i.start.x += n.x), (i.start.y += n.y))
                                : i.destination.id === e.id &&
                                  ((i.end.x += n.x), (i.end.y += n.y));
                          }
                        } else (i.end.x += n.x), (i.end.y += n.y);
                      else (i.start.x += n.x), (i.start.y += n.y);
                    }
                  })(t, i);
              }
            }),
              this.render();
          },
          oe = class {
            constructor(e, t = !1) {
              (this.target = e), (this.bind = t);
            }
            register(e) {
              this.target &&
                e.forEach((e) => {
                  const { name: t, handler: n } = e,
                    s = n.bind(this.target);
                  (this[t] = s), this.bind && (this.target[t] = s);
                });
            }
          },
          ae = 0.1,
          ce = (e) => {
            e.preventDefault();
            const { canvas: t } = ve,
              { transform: n, info: s } = t,
              { scale: i, translate: r } = n,
              o = L(t.el),
              a = e.offsetX * o.x - r.x,
              c = e.offsetY * o.y - r.y,
              h = (a / i) * ae,
              l = (c / i) * ae,
              y = w(e, t);
            if (
              (s.scaleCenter && S(s.scaleCenter, y) > 5
                ? (s.scaleCenter = { x: a / i, y: c / i })
                : (s.scaleCenter = y),
              e.wheelDelta > 0 && i < 5)
            )
              n.setTranslate(r.x - h, r.y - l), n.setScale(i + ae);
            else {
              if (!(e.wheelDelta < 0 && i > 0.2)) return;
              n.setTranslate(r.x + h, r.y + l), n.setScale(i - ae);
            }
            t.render();
          },
          he = (e) => {
            const { canvas: t } = ve,
              { info: n, stores: s } = t,
              { lastCoordinate: i } = n;
            t.tools.connectPoints.length && (t.tools.connectPoints = []);
            const r = { x: e.x - i.x, y: e.y - i.y };
            (n.lastCoordinate = e),
              n.selected.forEach((e) => {
                if (e.setPosition) {
                  e.setPosition(r.x, r.y, !0);
                  for (let t = 0; t < s.connector.data.length; t++) {
                    const n = s.connector.data[t];
                    if (n.source.id !== e.id)
                      if (n.destination.id !== e.id) {
                        if ("sub" === e._type) {
                          for (const t of [...e.ports.in])
                            n.source.id === t.id
                              ? ((n.start.x += r.x), (n.start.y += r.y))
                              : n.destination.id === t.id &&
                                ((n.end.x += r.x), (n.end.y += r.y));
                          for (const t of [...e.ports.out])
                            n.source.id === t.id
                              ? ((n.start.x += r.x), (n.start.y += r.y))
                              : n.destination.id === t.id &&
                                ((n.end.x += r.x), (n.end.y += r.y));
                        }
                      } else (n.end.x += r.x), (n.end.y += r.y);
                    else (n.start.x += r.x), (n.start.y += r.y);
                  }
                }
              }),
              t.render();
          },
          le = () => {
            const { canvas: e } = ve,
              { stores: t, tools: n } = e,
              s = t.gm.data.filter((e) => O(e.shape.center, n.areaSelector)),
              i = t.port.data.filter((e) => O(e.shape.center, n.areaSelector)),
              r = t.sub.data.filter((e) => O(e.shape.center, n.areaSelector));
            e.select([...i, ...s, ...r]), (n.areaSelector.width = 0);
          },
          ye = (e, t) => {
            const { canvas: n } = ve,
              { tools: s, stores: i } = n,
              { source: r, start: o } = s.tempConnector.connector;
            if (e) {
              e.owner = null;
              const s = new P(
                o,
                { ...e },
                n?.__MODEL_LINK__?.getSettings?.("lineMode") || 0
              );
              i.connector.add(s),
                s.link(r, t),
                n.__MODEL_LINK__.publisher.trigger("connect", {
                  v: { link: [r, t], connector: s },
                });
            }
            n.select([]),
              (s.connectPoints = []),
              (s.tempConnector.info = {}),
              (s.tempConnector.connector = null);
          },
          de = (e, t) => {
            if (!e) return -1;
            const { canvas: n } = ve,
              { tools: s, info: i } = n,
              { tempConnector: r } = s;
            if (r.connector)
              return (
                t !== i.selected[0]
                  ? (ye(e, e.owner),
                    n.__MODEL_LINK__.saveSnapshot({ type: "connect" }))
                  : ye(),
                0
              );
            {
              const e = s.connectPoints.filter((e) => e.active)?.[0];
              if (s.connectPoints.length && e)
                return (
                  ((e) => {
                    const { canvas: t } = ve,
                      { tools: n, info: s } = t,
                      { tempConnector: i } = n,
                      r = { ...e },
                      o = r.owner;
                    r.owner = null;
                    const a = new P(
                      r,
                      r,
                      t?.__MODEL_LINK__?.getSettings?.("lineMode") || 0
                    );
                    (i.connector = a),
                      (i.info = JSON.parse(JSON.stringify(r))),
                      (a.source = o),
                      (n.connectPoints = []);
                  })(e),
                  1
                );
            }
          },
          xe = {
            9: "TAB",
            13: "ENTER",
            16: "SHIFT",
            17: "CTRL",
            46: "DELETE",
            48: "0",
            49: "1",
            50: "2",
            51: "3",
            52: "4",
            53: "5",
            54: "6",
            55: "7",
            56: "8",
            57: "9",
            65: "A",
            66: "B",
            67: "C",
            68: "D",
            69: "E",
            70: "F",
            71: "G",
            72: "H",
            73: "I",
            74: "J",
            75: "K",
            76: "L",
            77: "M",
            78: "N",
            79: "O",
            80: "P",
            81: "Q",
            82: "R",
            83: "S",
            84: "T",
            85: "U",
            86: "V",
            87: "W",
            88: "X",
            89: "Y",
            90: "Z",
          },
          ue = {
            el: null,
            canvas: null,
            setCanvas: (e) => {
              ue.canvas = e;
            },
            initEvent(e) {
              (this.el = e),
                (e.oncontextmenu = function () {
                  return !1;
                }),
                e.addEventListener("mousedown", fe),
                e.addEventListener("mousemove", pe),
                e.addEventListener("mouseup", _e),
                e.addEventListener("wheel", ce),
                e.addEventListener("dblclick", ge);
              const t = new (class {
                constructor(e) {
                  (this.target = e),
                    (this.handler = {}),
                    (this.downKeys = []),
                    this.init();
                }
                init() {
                  this.target.addEventListener("keydown", (e) => {
                    const t = xe[e.keyCode];
                    if (t)
                      if (0 === this.downKeys.length) {
                        this.downKeys.push(t);
                        const n = this.downKeys.join("+");
                        this.handler[n] &&
                        "INPUT" !== document.activeElement.nodeName &&
                        "TEXTAREA" !== document.activeElement.nodeName
                          ? (e.preventDefault(), this.handler[n](e))
                          : ("INPUT" !== document.activeElement.nodeName &&
                              "TEXTAREA" !== document.activeElement.nodeName) ||
                            this.zero();
                      } else if (
                        1 === this.downKeys.length &&
                        "CTRL" === this.downKeys[0] &&
                        "CTRL" !== t
                      ) {
                        this.downKeys.push(t);
                        const n = this.downKeys.join("+");
                        this.handler[n] &&
                        "INPUT" !== document.activeElement.nodeName &&
                        "TEXTAREA" !== document.activeElement.nodeName
                          ? (e.preventDefault(), this.handler[n](e))
                          : ("INPUT" !== document.activeElement.nodeName &&
                              "TEXTAREA" === document.activeElement.nodeName) ||
                            this.zero();
                      }
                  }),
                    this.target.addEventListener("keyup", (e) => {
                      const t = xe[e.keyCode];
                      if ((e.preventDefault(), t)) {
                        const e = this.downKeys.indexOf(t);
                        -1 !== e && this.downKeys.splice(e, 1);
                      }
                    });
                }
                register(e, t) {
                  let n = Array.isArray(e) ? e.join("+") : e;
                  this.handler[n] = t;
                }
                zero() {
                  this.downKeys = [];
                }
              })(document);
              t.register(["CTRL", "A"], () => {
                ue.canvas.utils.selectAll();
              }),
                t.register("DELETE", () => {
                  ue.canvas.utils.remove();
                }),
                t.register(["CTRL", "Z"], () => {
                  ue.canvas.__MODEL_LINK__.undoSnapshot();
                }),
                t.register(["CTRL", "C"], () => {
                  ue.canvas.utils.copy();
                }),
                t.register(["CTRL", "X"], () => {
                  ue.canvas.utils.cut();
                }),
                t.register(["CTRL", "V"], () => {
                  ue.canvas.utils.paste();
                });
            },
          },
          fe = (e) => {
            const { canvas: t } = ue,
              { info: n, status: s, tools: i, transform: r, stores: o } = t,
              { connectPoints: a } = i,
              { scale: c, translate: h } = r;
            if (n.sysDisable) return;
            const l = w(e, t),
              y = M(l),
              d = {
                x: 1 * (l.x * c + h.x).toFixed(0),
                y: 1 * (l.y * c + h.y).toFixed(0),
              };
            if (0 === e.button) {
              n.lastCoordinate = t.__MODEL_LINK__.getSettings("magnet") ? y : l;
              const { gm: r, connector: c, sub: h, port: x } = t.stores;
              if (n.hoveringResizeController)
                return (
                  s.change("RESIZE"),
                  void (n.resizeTarget = n.hoveringResizeController.target)
                );
              const u = [
                  {
                    key: "gm",
                    filter: (e) => e.getData((e) => T(l, e.shape))?.reverse(),
                  },
                  {
                    key: "sub",
                    filter: (e) => e.getData((e) => T(l, e.shape))?.reverse(),
                  },
                  {
                    key: "port",
                    filter: (e) =>
                      e
                        .getData(
                          (e) =>
                            S(l, e.shape.center) < (e.shape.width / 2) * 1.2
                        )
                        ?.reverse(),
                  },
                ],
                f = a.filter((e) => S(e, l) < 15)?.[0];
              let p = !1;
              for (const e of u) {
                const r = e.filter(o[e.key])?.[0];
                if (r) {
                  if (f) {
                    if (
                      (t.select([]),
                      6 !== s.current && "port" === r._type && "out" === r.type)
                    )
                      return void t.__MODEL_LINK__.publisher.trigger("error", {
                        v: { msg: "出端口不可连出", code: "007" },
                      });
                    if (
                      6 === s.current &&
                      "port" === r._type &&
                      "in" === r.type
                    )
                      return void t.__MODEL_LINK__.publisher.trigger("error", {
                        v: { msg: "入端口不可连入", code: "008" },
                      });
                    if (1 === de(f, r)) return void s.change("CONNECT");
                  } else
                    (n.downTarget = r),
                      (i.tempConnector.info = {}),
                      (i.tempConnector.connector = null);
                  p = !0;
                  break;
                }
              }
              if (!p) {
                const s = c.data.filter(
                  (e) => !!e.path && N.isInPath(d, e.path)
                );
                if (s.length)
                  if (e.ctrlKey) {
                    const e = new Set(n.selected);
                    e.has(s[0]) ? e.delete(s[0]) : e.add(s[0]),
                      t.select([...e]);
                  } else t.select(s);
                else
                  t.select([]),
                    (i.tempConnector.info = {}),
                    (i.tempConnector.connector = null),
                    i.areaSelector.width
                      ? le()
                      : ((e) => {
                          const { canvas: t } = ve,
                            { tools: n } = t;
                          n.areaSelector.base = e;
                        })(l);
              }
              e.altKey && ((n.copyAnchor = l), t.utils.paste()),
                s.change("LEFT_DOWN");
            } else
              2 === e.button &&
                (6 === s.current ? (n.breakState = 6) : 8 === s.current && le(),
                ((e) => {
                  const { canvas: t } = ve,
                    { transform: n, info: s } = t,
                    { translate: i } = n;
                  s.downCoordinate = {
                    x: e.offsetX,
                    y: e.offsetY,
                    tx: i.x,
                    ty: i.y,
                  };
                })(e),
                s.change("EMPTY_RIGHT"));
          },
          pe = (e) => {
            const { canvas: t } = ue,
              { info: n, status: s, tools: i } = t;
            if (n.sysDisable) return;
            const r = w(e, t);
            if (!(S(r, n.lastCoordinate) < 5))
              switch (
                ((n.coordinate = r),
                t.__MODEL_LINK__.publisher.trigger("coordinateChange", {
                  v: n.coordinate,
                }),
                s.change(n.downTarget ? "MOVE" : "EMPTY_MOVE"),
                s.current)
              ) {
                case 4:
                  ((e) => {
                    const { canvas: t } = ve,
                      { info: n, transform: s } = t,
                      { downCoordinate: i } = n;
                    if (n.downCoordinate) {
                      const n = L(t.el),
                        r = i.tx + (e.offsetX - i.x) * n.x,
                        o = i.ty + (e.offsetY - i.y) * n.y;
                      s.setTranslate(r, o), t.render();
                    }
                  })(e);
                  break;
                case 2:
                  if (
                    (null !== i.connectorAniMgr &&
                      (i.connectorAniMgr.end(), (i.connectorAniMgr = null)),
                    n.selected.includes(n.downTarget) ||
                      t.select([n.downTarget]),
                    t.__MODEL_LINK__.getSettings("magnet"))
                  ) {
                    const e = M(r);
                    he(e);
                  } else he(r);
                  break;
                case 8:
                  ((e) => {
                    const { canvas: t } = ve,
                      { tools: n } = t,
                      { x: s, y: i } = n.areaSelector.base,
                      { x: r, y: o } = e,
                      a = s <= r ? s : r,
                      c = i <= o ? i : o,
                      h = Math.abs(s - r),
                      l = Math.abs(i - o),
                      y = { x: a + h / 2, y: c + l / 2 };
                    (n.areaSelector = Object.assign(n.areaSelector, {
                      center: y,
                      width: h,
                      height: l,
                      x1: s,
                      y1: i,
                      x2: r,
                      y2: o,
                    })),
                      t.render();
                  })(r);
                  break;
                case 10:
                  ((e) => {
                    const { canvas: t } = ve,
                      { info: n, stores: s } = t,
                      {
                        lastCoordinate: i,
                        resizeTarget: r,
                        hoveringResizeController: o,
                        selected: a,
                      } = n,
                      { key: c } = o,
                      h = { x: e.x - i.x, y: e.y - i.y },
                      l = { x: 0, y: 0 },
                      y = { x: 0, y: 0 };
                    if (["RM", "LM"].includes(c)) {
                      if (Math.abs(h.x) < 30) return;
                      (y.y = 0),
                        (l.y = 0),
                        "RM" === c
                          ? ((y.x = (h.x > 0 ? 1 : -1) * p), (l.x = y.x / 2))
                          : "LM" === c &&
                            ((y.x = (h.x < 0 ? 1 : -1) * p),
                            (l.x = (y.x / 2) * -1));
                    } else if (["MT", "MB"].includes(c)) {
                      if (Math.abs(h.y) < 30) return;
                      (y.x = 0),
                        (l.x = 0),
                        "MT" === c
                          ? ((y.y = (h.y < 0 ? 1 : -1) * p),
                            (l.y = (y.y / 2) * -1))
                          : "MB" === c &&
                            ((y.y = (h.y > 0 ? 1 : -1) * p), (l.y = y.y / 2));
                    } else if (["LT", "RB"].includes(c)) {
                      if (Math.abs(h.y) < 30 || Math.abs(h.x) < 30) return;
                      "LT" === c
                        ? (h.x <= 0 && h.y <= 0
                            ? ((y.x = p), (l.x = (y.x / 2) * -1))
                            : h.x >= 0 && h.y >= 0
                            ? ((y.x = -30), (l.x = (y.x / 2) * -1))
                            : (y.x = 0),
                          (y.y = y.x),
                          (l.y = l.x))
                        : "RB" === c &&
                          (h.x <= 0 && h.y <= 0
                            ? ((y.x = -30), (l.x = y.x / 2))
                            : h.x >= 0 && h.y >= 0
                            ? ((y.x = p), (l.x = y.x / 2))
                            : (y.x = 0),
                          (y.y = y.x),
                          (l.y = l.x));
                    } else if (["RT", "LB"].includes(c)) {
                      if (Math.abs(h.y) < 30 || Math.abs(h.x) < 30) return;
                      "RT" === c
                        ? (h.x >= 0 && h.y <= 0
                            ? ((y.x = p), (l.x = y.x / 2))
                            : h.x <= 0 && h.y >= 0
                            ? ((y.x = -30), (l.x = y.x / 2))
                            : ((y.x = 0), (l.x = 0)),
                          (y.y = y.x),
                          (l.y = -1 * l.x))
                        : "LB" === c &&
                          (h.x >= 0 && h.y <= 0
                            ? ((y.x = -30), (l.x = (y.x / 2) * -1))
                            : h.x <= 0 && h.y >= 0
                            ? ((y.x = p), (l.x = (y.x / 2) * -1))
                            : ((y.x = 0), (l.x = 0)),
                          (y.y = y.x),
                          (l.y = -1 * l.x));
                    }
                    r.shape.width + y.x < 5 && ((y.x = 0), (l.x = 0)),
                      r.shape.height + y.y < 5 && ((y.y = 0), (l.y = 0));
                    for (const e of a) {
                      const t = JSON.parse(JSON.stringify(e.shape));
                      e.setPosition(l.x, l.y, !0), e.setSize(y.x, y.y, !0, t);
                      for (const t of s.connector.getData())
                        if (t.source.id === e.id) {
                          const e = b[t.start.key];
                          m[e[0]] === c[0]
                            ? (t.start.x += 0)
                            : e[0] === c[0]
                            ? (t.start.x += 2 * l.x)
                            : (t.start.x += l.x),
                            m[e[1]] === c[1]
                              ? (t.start.y += 0)
                              : e[1] === c[1]
                              ? (t.start.y += 2 * l.y)
                              : (t.start.y += l.y);
                        } else if (t.destination.id === e.id) {
                          const e = b[t.end.key];
                          m[e[0]] === c[0]
                            ? (t.end.x += 0)
                            : e[0] === c[0]
                            ? (t.end.x += 2 * l.x)
                            : (t.end.x += l.x),
                            m[e[1]] === c[1]
                              ? (t.end.y += 0)
                              : e[1] === c[1]
                              ? (t.end.y += 2 * l.y)
                              : (t.end.y += l.y);
                        }
                    }
                    (n.lastCoordinate = e), t.render();
                  })(r);
                  break;
                case 6:
                  ((e) => {
                    const { canvas: t } = ve,
                      { tools: n } = t;
                    (n.tempConnector.connector.end = e), t.render();
                  })(r);
                default:
                  ((e) => {
                    const { canvas: t } = ve,
                      { transform: n, stores: s } = t,
                      { translate: i, scale: r } = n,
                      { gm: o, connector: a, port: c, sub: h } = s;
                    let l = null;
                    for (const n of t.tools.resizeControllers) {
                      let t = !1;
                      for (const s of n)
                        if (S(e, s) < 6) {
                          (l = s), (t = !0);
                          break;
                        }
                      if (t) break;
                    }
                    if (l)
                      return (
                        (y = t.el),
                        (d = v[l.key]),
                        (y.style.cursor = d),
                        void (t.info.hoveringResizeController = l)
                      );
                    var y, d;
                    t.info.hoveringResizeController = null;
                    const x = o.getData((t) => T(e, t.shape)).reverse(),
                      u = c
                        .getData(
                          (t) =>
                            S(e, t.shape.center) < (t.shape.width / 2) * 1.2
                        )
                        .reverse(),
                      f = h.getData((t) => T(e, t.shape, 1.1)).reverse(),
                      p = {
                        x: 1 * (e.x * r + i.x).toFixed(0),
                        y: 1 * (e.y * r + i.y).toFixed(0),
                      },
                      _ = a.getData((e) => !!e.path && N.isInPath(p, e.path));
                    let g = null;
                    if (x.length) g = x[0];
                    else if (_.length) g = _[0];
                    else if (u.length) g = u[0];
                    else if (f.length)
                      for (const n of f[0].points)
                        S(n, e) < 16 &&
                          ((g = f[0]),
                          (t.tools.connectPoints = [{ ...n, active: !0 }]));
                    t.hoverAt(g);
                    let m = !1;
                    if (x.length || u.length) {
                      const { connectPoints: n } = t.tools,
                        s = n.filter((t) => S(t, e) < 15);
                      s.length
                        ? s[0].active || ((s[0].active = !0), (m = !0))
                        : n.filter((e) => e.active).length &&
                          ((n.filter((e) => e.active)[0].active = !1),
                          (m = !0));
                    }
                    m && t.render();
                  })(r);
              }
          },
          _e = (e) => {
            const { canvas: t } = ue,
              { status: n, tools: s, info: i, stores: r } = t,
              { connectPoints: o } = s;
            if (i.sysDisable) return;
            const a = w(e, t);
            if (((i.coordinate = a), 8 === n.current)) le();
            else if (2 === n.current)
              t.__MODEL_LINK__.saveSnapshot({ type: "drag" });
            else if (6 === n.current) {
              const e = [
                  {
                    key: "gm",
                    filter: (e) => e.getData((e) => T(a, e.shape))?.reverse(),
                  },
                  {
                    key: "sub",
                    filter: (e) => e.getData((e) => T(a, e.shape))?.reverse(),
                  },
                  {
                    key: "port",
                    filter: (e) =>
                      e
                        .getData(
                          (e) => S(a, e.shape.center) < e.shape.width / 2
                        )
                        ?.reverse(),
                  },
                ],
                s = o.filter((e) => S(e, a) < 15)?.[0];
              for (const i of e) {
                const e = i.filter(r[i.key])?.[0];
                if (e) {
                  if (s) {
                    if (
                      6 === n.current &&
                      "port" === e._type &&
                      "in" === e.type
                    )
                      return void t.__MODEL_LINK__.publisher.trigger("error", {
                        v: { msg: "入端口不可连入", code: "008" },
                      });
                    de(s, e), n.change("END");
                  }
                  break;
                }
              }
            } else if (1 === n.current) {
              if (i.downTarget)
                if (e.ctrlKey) {
                  const e = new Set(i.selected);
                  e.has(i.downTarget)
                    ? e.delete(i.downTarget)
                    : e.add(i.downTarget),
                    t.select([...e]);
                } else t.select([i.downTarget]);
            } else if (4 === n.current && 6 === i.breakState)
              return n.change("CONNECT"), void (i.breakState = 0);
            (i.downTarget = null), n.change("UP"), t.render();
          },
          ge = (e) => {
            const { canvas: t } = ue,
              { info: n } = t;
            if (n.sysDisable) return;
            const s = w(e, t),
              { sub: i } = t.stores,
              r = i.data.filter((e) => T(s, e.shape));
            r.length && t.__MODEL_LINK__.display(r[0].name);
          },
          ve = ue,
          me = {
            on: (e, t) => {
              me.events[e] || (me.events[e] = []), me.events[e].push(t);
            },
            trigger: (e, t) => {
              const n = `on${e.charAt(0).toUpperCase()}${e.slice(1)}`;
              me.events[n] || (me.events[n] = []),
                me.events[n].forEach((e) => {
                  e.call(null, t);
                });
            },
            events: {},
          },
          be = me,
          Ee = { settings: {}, subscribers: {} };
        window.ModelLink = class {
          constructor(e = Ee) {
            const { el: t, settings: n } = e;
            (this.options = e),
              (this.mountDOM = t),
              (this.canvasDOM = null),
              (this.canvasSet = {}),
              (this.activeCanvas = null),
              (this.models = []),
              (this.eventManager = ve),
              (this.publisher = be),
              (this.painter = N),
              (this.settings = Object.assign({}, y, n)),
              (this.queue = new (class {
                constructor(e) {
                  (this.max = e), (this.snapshots = []), (this.index = 0);
                }
                save(e) {
                  this.index !== this.snapshots.length - 1 &&
                    (this.snapshots = this.snapshots.slice(0, this.index + 1)),
                    this.snapshots.push(e),
                    this.snapshots.length > this.max && this.snapshots.shift(),
                    (this.index = this.snapshots.length - 1);
                }
                back() {
                  return 0 !== this.index
                    ? ((this.index -= 1), this.snapshots[this.index])
                    : (console.log("oldest snapshot"), !1);
                }
                redo() {
                  return this.index !== this.snapshots.length - 1
                    ? ((this.index += 1), this.snapshots[this.index])
                    : (console.log("latest snapshot"), !1);
                }
                clear() {
                  (this.snapshots = []), (this.index = 0);
                }
                len() {
                  return this.snapshots.length;
                }
              })(10)),
              (this.utils = new oe(this, !0)),
              this.utils.register([
                { name: "overview", handler: H },
                { name: "focus", handler: z },
                { name: "checkName", handler: U },
                { name: "search", handler: V },
              ]),
              this.initDOM(),
              this.initEvent(),
              this.initStatus();
          }
          initDOM() {
            const e = document.createElement("canvas");
            this.mountDOM.appendChild(e),
              (this.canvasDOM = e),
              this.resetSize(),
              this.initStyle();
          }
          initEvent() {
            const { subscribers: e } = this.options;
            this.eventManager.setCanvas(this.activeCanvas),
              this.eventManager.initEvent(this.canvasDOM),
              Object.entries(e).forEach((e) => {
                this.publisher.on(e[0], e[1]);
              }),
              window.addEventListener("resize", () => {
                this.resetSize();
              });
          }
          initStatus() {
            console.log(
              "%c Model Link 流程绘制系统 %c Authored by Liu Tao ",
              "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
              "background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff"
            ),
              console.log(
                "%c Developers %c L.T, Z.G.D ",
                "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
                "background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff"
              ),
              N.setCTX(this.canvasDOM.getContext("2d")),
              this.publisher.trigger("settingsUpdate", { v: this.settings });
          }
          initStyle() {
            const e = document.createElement("style");
            (e.innerHTML =
              ".change-canvas-ani {\n  animation: fade-in-fwd 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;\n}\n@keyframes fade-in-fwd {\n  0% {\n    -webkit-transform: translateZ(-80px);\n            transform: translateZ(-80px);\n    opacity: 0;\n  }\n  100% {\n    -webkit-transform: translateZ(0);\n            transform: translateZ(0);\n    opacity: 1;\n  }\n}\n\n::-webkit-scrollbar{\n  width: 2px;\n  height: 2px;\n}\n::-webkit-scrollbar-thumb{\n  border-radius: 10px;\n  -webkit-box-shadow: inset 0 0 2px rgba(0,0,0,0.2);\n  background: #535353;\n}\n::-webkit-scrollbar-track{\n  -webkit-box-shadow: inset 0 0 2px rgba(0,0,0,0.2);\n  border-radius: 10px;\n  background: #EDEDED;\n}"),
              document.body.appendChild(e);
          }
          create(t, n = !0, s = !0) {
            if (this.canvasSet[t])
              return s ? this.create(t + Date.now(), n) : this.canvasSet[t];
            const r = new (class {
              constructor(t, n = "main") {
                (this.el = t),
                  (this.ctx = this.el.getContext("2d")),
                  (this.name = n),
                  (this.version = ""),
                  (this.grid = new (class {
                    constructor(e = {}) {
                      this.config = e;
                    }
                    render(t) {
                      const n = Object.assign(
                        {
                          baseX: 0,
                          offsetX: 0,
                          baseY: 0,
                          offsetY: 0,
                          width: 100,
                          height: 100,
                        },
                        t
                      );
                      N.grid((3 * e) / 4, n, _),
                        N.grid(3 * e, n, g),
                        N.circle(0, 0, 5, {
                          strokeStyle: "red",
                          fillStyle: "red",
                        });
                    }
                  })({})),
                  (this.transform = new (class {
                    constructor(e, t = E) {
                      (this.canvas = e),
                        (this.translate = t.translate),
                        (this.boundary = t.boundary),
                        (this.scale = t.scale);
                    }
                    setTranslate(e, t) {
                      (this.translate = { x: e, y: t }),
                        this.canvas.__MODEL_LINK__.publisher.trigger(
                          "translate",
                          { v: this.translate }
                        );
                    }
                    setBoundary(e, t, n, s) {
                      this.boundary = { left: e, right: t, top: n, bottom: s };
                    }
                    setScale(e) {
                      (this.scale = e),
                        this.canvas.__MODEL_LINK__.publisher.trigger("scale", {
                          v: this.scale,
                        });
                    }
                    reset() {
                      (this.translate = E.translate),
                        (this.boundary = E.boundary),
                        (this.scale = E.scale);
                    }
                  })(this)),
                  (this.status = new (class {
                    constructor(e) {
                      (this.canvas = e), (this.current = 0);
                    }
                    setTo(e) {
                      this.canvas.__MODEL_LINK__.settings.dev &&
                        console.log(this.current, e),
                        (this.current = e),
                        this.canvas.__MODEL_LINK__.publisher.trigger(
                          "statusChange",
                          { v: this.current }
                        );
                    }
                    change(e) {
                      const t = W[this.current][e];
                      void 0 !== t && t !== this.current
                        ? this.setTo(t)
                        : void 0 === t && 0 !== this.current && this.setTo(0);
                    }
                  })(this)),
                  (this.stores = {
                    gm: new Y("gm"),
                    connector: new Y("connector"),
                    sub: new Y("sub"),
                    port: new Y("port"),
                  }),
                  (this.info = {
                    coordinate: { x: 0, y: 0 },
                    downCoordinate: { tx: 0, x: 0, ty: 0, y: 0 },
                    lastCoordinate: { x: 0, y: 0 },
                    scaleCenter: { x: 0, y: 0 },
                    preloaded: null,
                    hovering: null,
                    hoveringResizeController: null,
                    resizeTarget: null,
                    selected: [],
                    downTarget: null,
                    sysDisable: !1,
                    copyData: {},
                    breakState: 0,
                    focusing: !1,
                    copyAnchor: null,
                  }),
                  (this.tools = {
                    areaSelector: {
                      base: { x: 0, y: 0 },
                      center: { x: 0, y: 0 },
                      width: 0,
                      height: 0,
                      x1: 0,
                      y1: 0,
                      x2: 0,
                      y2: 0,
                    },
                    connectPoints: [],
                    tempConnector: { info: {}, connector: null },
                    resizeControllers: [],
                    connectorAniMgr: null,
                  }),
                  (this.render = this.render.bind(this)),
                  (this.utils = new oe(this)),
                  this.utils.register([
                    { name: "selectAll", handler: X },
                    { name: "remove", handler: q },
                    { name: "clear", handler: $ },
                    { name: "showRoute", handler: Q },
                    { name: "copy", handler: Z },
                    { name: "paste", handler: J },
                    { name: "cut", handler: G },
                    { name: "showInOutLine", handler: ee },
                    { name: "connectModel", handler: te },
                    { name: "setZIndex", handler: ne },
                    { name: "setStyle", handler: se },
                    { name: "resetTransform", handler: ie },
                    { name: "toStdPosition", handler: re },
                  ]);
              }
              preload(e, t) {
                return (
                  (this.preloaded = Object.assign({}, e)),
                  (this.preloaded.on = (e) => {
                    let n = w(e, this);
                    this.__MODEL_LINK__.getSettings("magnet") && (n = M(n));
                    let s = null;
                    const i = {
                      0: { generator: () => new B(this.preloaded), type: "gm" },
                      1: {
                        generator: () =>
                          new j(
                            this,
                            this.__MODEL_LINK__.create("子系统", !1, !0)
                          ),
                        type: "sub",
                      },
                      2: {
                        generator: () =>
                          this.__SUB__
                            ? new K("in")
                            : (this.__MODEL_LINK__.publisher.trigger("error", {
                                v: {
                                  msg: "顶级画布不可以添加端口",
                                  code: "001",
                                },
                              }),
                              null),
                        type: "port",
                      },
                      3: {
                        generator: () =>
                          this.__SUB__
                            ? new K("out")
                            : (this.__MODEL_LINK__.publisher.trigger("error", {
                                v: {
                                  msg: "顶级画布不可以添加端口",
                                  code: "001",
                                },
                              }),
                              null),
                        type: "port",
                      },
                    };
                    (s = i[t].generator()),
                      s &&
                        (s.init(n, this),
                        this.stores[i[t].type].add(s),
                        this.__MODEL_LINK__.getSettings("noRepeatName") &&
                          this.__MODEL_LINK__.checkName(s),
                        delete this.preloaded.on,
                        (this.preloaded = null),
                        this.select([s]),
                        this.__MODEL_LINK__.saveSnapshot({
                          type: "create",
                          value: s.id,
                        }),
                        this.__MODEL_LINK__.publisher.trigger("create", {
                          v: { id: s.id },
                        }));
                  }),
                  this.preloaded
                );
              }
              hoverAt(e) {
                const { info: t, tools: n, status: s } = this;
                let i = !1;
                if (e) {
                  if (t.hovering !== e) {
                    t.hovering && t.hovering.hover(!1), (i = !0);
                    const s = e.hover(!0);
                    (t.hovering = e),
                      (e instanceof B || e instanceof K) &&
                        (n.connectPoints = s);
                  }
                } else
                  (n.connectPoints = []),
                    t.hovering && (t.hovering.hover(!1), (i = !0));
                var r;
                n.resizeControllers.length &&
                  t.selected.includes(e) &&
                  (n.connectPoints = []),
                  (t.hovering = e),
                  (r = e ? "pointer" : ""),
                  (this.el.style.cursor = r),
                  i && this.render();
              }
              select(e) {
                const { info: t, tools: n } = this;
                t.selected.length && t.selected.forEach((e) => e.select(!1)),
                  e.length
                    ? ((t.selected = e),
                      t.selected.forEach((e) => e.select(!0)))
                    : (t.selected = []),
                  null !== n.connectorAniMgr &&
                    (n.connectorAniMgr.end(), (n.connectorAniMgr = null)),
                  this.__MODEL_LINK__.publisher.trigger("select", {
                    v: t.selected,
                  }),
                  this.render();
              }
              getSelected() {
                return this.info.selected;
              }
              setProperty(e, t) {
                if (1 !== this.info.selected.length) return;
                const n = this.info.selected[0],
                  s = n[e];
                if (((n[e] = t), "name" === e))
                  if ("sub" !== n._type)
                    this.__MODEL_LINK__.getSettings("noRepeatName") &&
                      this.__MODEL_LINK__.checkName(n);
                  else {
                    const e = this.__MODEL_LINK__.canvasSet[s];
                    delete this.__MODEL_LINK__.canvasSet[s],
                      (this.__MODEL_LINK__.canvasSet[t] = e),
                      (e.name = t);
                  }
                s !== n[e] &&
                  (this.__MODEL_LINK__.publisher.trigger("propChange", {
                    v: { key: e, value: [s, n[e]], target: n },
                  }),
                  this.render());
              }
              load(e) {
                const t = this,
                  n = {
                    gm: (e) => {
                      const n = new B(e.proto, e.options);
                      return (
                        n.load(e, t),
                        (n.proto = t.__MODEL_LINK__.getModel(e.proto._uType)),
                        n
                      );
                    },
                    sub: (e) => {
                      const n = new j(
                        t,
                        t.__MODEL_LINK__.create(e.name, !1, !1)
                      );
                      return n.load(e, t), n;
                    },
                    port: (e) => {
                      const n = new K(e.type);
                      return (
                        n.load(e, t), t.__SUB__.resetPoints(e.type, "add", n), n
                      );
                    },
                  };
                Object.entries(e).forEach((e) => {
                  const [t, s] = e;
                  n?.[t] &&
                    s.forEach((e) => {
                      this.stores[t].add(n[t](e));
                    });
                });
              }
              relink(e) {
                e.forEach((e) => {
                  const t = new P(e.start, e.end, e.type);
                  (t.style = e?.style || h), this.stores.connector.add(t);
                  const [n, s, i] = e.source,
                    r = this.__MODEL_LINK__.canvasSet[n].stores[s].findBy(
                      "id",
                      i
                    )[0],
                    [o, a, c] = e.destination,
                    l = this.__MODEL_LINK__.canvasSet[o].stores[a].findBy(
                      "id",
                      c
                    )[0];
                  t.link(r, l);
                });
              }
              render() {
                const {
                  ctx: e,
                  el: t,
                  tools: n,
                  info: s,
                  stores: r,
                  grid: o,
                  transform: h,
                  status: l,
                } = this;
                t.width = t.width;
                const { translate: y, scale: d } = h,
                  {
                    areaSelector: x,
                    connectPoints: u,
                    tempConnector: f,
                    resizeControllers: p,
                    connectorAniMgr: _,
                  } = n;
                e.setTransform(d, 0, 0, d, y.x, y.y);
                const g = w({ offsetX: 0, offsetY: 0 }, this),
                  v = w(
                    {
                      offsetX: t.getBoundingClientRect().width,
                      offsetY: t.getBoundingClientRect().height,
                    },
                    this
                  ),
                  m = 100,
                  b = { x1: g.x - m, y1: g.y - m, x2: v.x + m, y2: v.y + m },
                  E = this.__MODEL_LINK__.getSettings("performance"),
                  M = this.transform.scale > 0.5,
                  L = this.transform.scale > 0.5;
                if (
                  (h.setBoundary(g.x, v.x, g.y, v.y),
                  this.__MODEL_LINK__.getSettings("grid") &&
                    ((E && !M) ||
                      o.render({
                        baseX: 0,
                        offsetX: g.x,
                        baseY: 0,
                        offsetY: g.y,
                        width: b.x2,
                        height: b.y2,
                      })),
                  r.connector.data.forEach((e) => {
                    (O(e.start, b) || O(e.end, b)) && e.render();
                  }),
                  Object.entries(r).forEach((e) => {
                    "connector" !== e[0] &&
                      e[1].data.forEach((e) => {
                        const { center: t, height: n } = e.shape,
                          s = ((e, t) => {
                            const { width: n, height: s, center: i } = e,
                              r = i.x - n / 2,
                              o = i.x + n / 2,
                              a = i.y - s / 2,
                              c = i.y + s / 2;
                            return !(
                              r > t.x2 ||
                              o < t.x1 ||
                              c < t.y1 ||
                              a > t.y2
                            );
                          })(e.shape, b);
                        if (s) {
                          if (
                            this.__MODEL_LINK__.getSettings("label") &&
                            e.name &&
                            (!E || L)
                          ) {
                            const s =
                                this.__MODEL_LINK__.getSettings("labelMode") ||
                                "name",
                              i = { x: t.x, y: t.y + n / 2 + 20 };
                            "name" === s || "both" === s
                              ? (N.text(i, e.name),
                                "both" === s &&
                                  e.desc &&
                                  N.text(
                                    { x: t.x, y: t.y + n / 2 + 40 },
                                    `【${e.desc}】`
                                  ))
                              : "desc" === s &&
                                N.text(i, e.desc ? `【${e.desc}】` : e.name);
                          }
                          e.render();
                        }
                      });
                  }),
                  x.width && N.roundRect(x.center, x.width, x.height, 1, i),
                  u.length &&
                    u.forEach((e) => {
                      N.circle(e.x, e.y, { x: 30, y: 30 }, e.active ? c : a);
                    }),
                  f.connector && f.connector.render(),
                  s.selected.length)
                ) {
                  const e = this.info.selected.filter(
                    (e) => "connector" === e._type
                  );
                  if (e.length) {
                    if (2 !== l.current && null === _) {
                      const t = e.map((e) => ({
                        start: e.start,
                        end: e.end,
                        controllers: e?.info?.controllers,
                        type: e.type,
                      }));
                      (n.connectorAniMgr = N.pathAniGroup(t, this.render)),
                        n.connectorAniMgr.start();
                      const s = [...e];
                      for (const e of s) {
                        const [t] = r.connector.data.splice(
                          r.connector.data.indexOf(e),
                          1
                        );
                        r.connector.data.push(t), t.render();
                      }
                    }
                  } else null !== _ && (_.end(), (_ = null));
                  (n.resizeControllers = []),
                    s.selected.forEach((e) => {
                      ["gm", "sub"].includes(e._type) &&
                        n.resizeControllers.push(
                          ((
                            e,
                            t = {
                              fillStyle: "rgba(0,160,255,0.5)",
                              strokeWidth: 2,
                              strokeStyle: "rgba(0,0,200, 0.5)",
                            }
                          ) => {
                            const { shape: n } = e,
                              { width: s, height: i, center: r } = n,
                              { x: o, y: a } = r,
                              c = [
                                { x: o, y: a - i / 2 - 0, key: "MT" },
                                { x: o, y: a + i / 2 + 0, key: "MB" },
                                {
                                  x: o - s / 2 - 0,
                                  y: a - i / 2 - 0,
                                  key: "LT",
                                },
                                {
                                  x: o + s / 2 + 0,
                                  y: a - i / 2 - 0,
                                  key: "RT",
                                },
                                {
                                  x: o - s / 2 - 0,
                                  y: a + i / 2 + 0,
                                  key: "LB",
                                },
                                {
                                  x: o + s / 2 + 0,
                                  y: a + i / 2 + 0,
                                  key: "RB",
                                },
                                { x: o - s / 2 - 0, y: a, key: "LM" },
                                { x: o + s / 2 + 0, y: a, key: "RM" },
                              ];
                            return (
                              c.forEach((n) => {
                                (n.target = e), (n.style = t);
                              }),
                              c
                            );
                          })(e)
                        );
                    }),
                    n.resizeControllers.forEach((e) => {
                      e.forEach((e) => {
                        N.circle(e.x, e.y, 6, e.style);
                      });
                    }),
                    e.length ||
                      (s.selected.includes(s.hovering) &&
                        (n.connectPoints = []));
                } else
                  null !== _ && (_.end(), (_ = null)),
                    n.resizeControllers.length && (n.resizeControllers = []);
                this.__MODEL_LINK__.activeCanvas !== this &&
                  null !== _ &&
                  (_.end(), (_ = null));
              }
            })(this.canvasDOM, t);
            return (
              (r.__MODEL_LINK__ = this),
              (this.canvasSet[t] = r),
              this.publisher.trigger("createCanvas", { v: r }),
              n &&
                ((this.activeCanvas = r),
                this.eventManager.setCanvas(this.activeCanvas),
                r.render(),
                Object.keys(this.canvasSet) &&
                  this.saveSnapshot({ type: "init" })),
              r
            );
          }
          saveSnapshot(e = {}) {
            const t = this.compile(),
              n = { ...e, time: Date.now(), data: t };
            this.settings.dev &&
              console.log(
                `%c Model Link 操作队列更新 %c ${e.type} `,
                "background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff",
                "background:#41b883 ; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff"
              ),
              this.queue.save(n);
          }
          undoSnapshot() {
            const e = this.queue.back();
            e
              ? (this.publisher.trigger("back", { v: { lastSnapShot: e } }),
                this.load(e.data, !1))
              : this.publisher.trigger("error", {
                  v: { msg: "撤销仓已空", code: "002" },
                });
          }
          getCanvas(e) {
            return this.canvasSet[e] || this.activeCanvas || null;
          }
          removeCanvas(e) {
            return (
              !!this.canvasSet[e] &&
              (this.canvasSet[e] === this.activeCanvas
                ? (this.publisher.trigger("error", {
                    v: { msg: "不可删除当前活跃画布", code: "009" },
                  }),
                  !1)
                : (delete this.canvasSet[e],
                  this.publisher.trigger("removeCanvas", { v: e }),
                  !0))
            );
          }
          display(e, t = !0) {
            return this.canvasSet[e]
              ? ((this.activeCanvas.active = !1),
                this.activeCanvas.utils.clear(),
                (this.activeCanvas = this.canvasSet[e]),
                (this.activeCanvas.active = !0),
                t && this.mountDOM.classList.add("change-canvas-ani"),
                this.eventManager.setCanvas(this.activeCanvas),
                this.activeCanvas.render(),
                this.publisher.trigger("changeCanvas", {
                  v: this.activeCanvas,
                }),
                setTimeout(() => {
                  this.mountDOM?.classList.remove("change-canvas-ani");
                }, 1e3),
                this.canvasSet[e])
              : (console.warn("invalid canvas name"), null);
          }
          loadModels(e) {
            const t = [];
            Object.values(e).forEach((e) => {
              e.models.forEach((n) => {
                const s = new Image(40, 40);
                (s.src = e.basePath + n.shape.imgsrc),
                  (s.onload = () => {
                    t.push({
                      _uType: n.type,
                      image: s,
                      raw: n,
                      name: n.name,
                      ...n.shape,
                    });
                  });
              });
            }),
              (this.models = t);
          }
          getModel(e) {
            return this.models.filter((t) => t._uType === e)[0];
          }
          getModels() {
            return this.models || [];
          }
          preload(e, t = 0) {
            const n = this.models.filter((t) => t._uType === e)?.[0];
            return n || 0 !== t ? this.activeCanvas.preload(n, t) : null;
          }
          updateSettings(e, t) {
            (this.settings[e] = t),
              this.publisher.trigger("settingsUpdate", { v: this.settings }),
              this.activeCanvas.render();
          }
          getSettings(e) {
            return this.settings[e];
          }
          compile(e = {}) {
            const { json: t = !0, name: n = "" } = e,
              s = ((e, t = {}) => {
                const { name: n } = t,
                  s = {
                    info: {
                      version: "3",
                      name: "",
                      timestamp: Date.now(),
                      entrance: e?.activeCanvas?.name || "",
                    },
                    content: {},
                  };
                let i = [];
                return (
                  (i = n ? [e.canvasSet[n]] : Object.values(e.canvasSet)),
                  i.forEach((e) => {
                    const { stores: t } = e,
                      n = {};
                    s.content[e.name] = n;
                    for (const e in t)
                      t[e].data.forEach((t) => {
                        n[e] || (n[e] = []), n[e].push(t.compile());
                      });
                  }),
                  s
                );
              })(this, e);
            return t ? JSON.stringify(s) : s;
          }
          load(e, t = !0) {
            const n = JSON.parse(e);
            this.canvasSet = {};
            const { content: s, info: i } = n;
            for (const e in s) this.create(e, !1, !1).load(s[e]);
            for (const e in s) {
              const t = this.canvasSet[e],
                n = s[e].connector;
              n && t.relink(n);
            }
            if (t)
              this.publisher.trigger("load", { v: n }),
                this.queue.clear(),
                this.display(i.entrance, !0);
            else {
              const {
                  translate: e,
                  boundary: t,
                  scale: n,
                } = this.activeCanvas.transform,
                s = this.canvasSet[i.entrance];
              (s.transform.translate = e),
                (s.transform.boundary = t),
                (s.transform.scale = n),
                this.display(i.entrance, !1);
            }
          }
          resetSize() {
            const { size: e = 2 } = this.options,
              t = getComputedStyle(this.mountDOM),
              n = 1 * t.width.split("px")[0],
              s = 1 * t.height.split("px")[0];
            this.canvasDOM.setAttribute("width", n * e),
              this.canvasDOM.setAttribute("height", s * e),
              (this.canvasDOM.style.width = n + "px"),
              (this.canvasDOM.style.height = s + "px"),
              this.activeCanvas && this.activeCanvas.render();
          }
          data(e = {}) {
            const { includes: t = ["name"] } = e,
              n = [];
            return (
              Object.keys(this.canvasSet).length &&
                Object.values(this.canvasSet).forEach((e) => {
                  e.stores.gm.getData().forEach((e) => {
                    const s = e.compile(),
                      i = {};
                    t.length &&
                      t.forEach((e) => {
                        if (e.includes(".")) {
                          const { t } = F(e.split("."), s);
                          Object.assign(i, t);
                        } else i[e] = s[e];
                      }),
                      n.push({
                        id: s.id,
                        ...i,
                        in: [...e.in]
                          .filter((e) => "gm" === e._type)
                          .map((e) => {
                            const n = {};
                            return (
                              t.length &&
                                t.forEach((t) => {
                                  if (t.includes(".")) {
                                    const { t: s } = F(t.split("."), e);
                                    Object.assign(n, s);
                                  } else n[t] = e[t];
                                }),
                              { canvas: e.__CANVAS__.name, id: e.id, ...n }
                            );
                          }),
                        out: [...e.out]
                          .filter((e) => "gm" === e._type)
                          .map((e) => {
                            const n = {};
                            return (
                              t.length &&
                                t.forEach((t) => {
                                  if (t.includes(".")) {
                                    const { t: s } = F(t.split("."), e);
                                    Object.assign(n, s);
                                  } else n[t] = e[t];
                                }),
                              { canvas: e.__CANVAS__.name, id: e.id, ...n }
                            );
                          }),
                      });
                  });
                }),
              n
            );
          }
          destroy() {
            this.canvasDOM?.remove(),
              (this.mountDOM = null),
              (this.canvasDOM = null),
              (this.canvasSet = {}),
              (this.activeCanvas = null),
              (this.models = []);
          }
        };
      },
    },
    s = {};
  function i(e) {
    var t = s[e];
    if (void 0 !== t) {
      if (void 0 !== t.error) throw t.error;
      return t.exports;
    }
    var r = (s[e] = { exports: {} });
    try {
      var o = { id: e, module: r, factory: n[e], require: i };
      i.i.forEach(function (e) {
        e(o);
      }),
        (r = o.module),
        o.factory.call(r.exports, r, r.exports, o.require);
    } catch (e) {
      throw ((r.error = e), e);
    }
    return r.exports;
  }
  (i.m = n),
    (i.c = s),
    (i.i = []),
    (i.hu = (e) => e + "." + i.h() + ".hot-update.js"),
    (i.hmrF = () => "main." + i.h() + ".hot-update.json"),
    (i.h = () => "a86fd6072b4ef6ed6cfb"),
    (i.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || new Function("return this")();
      } catch (e) {
        if ("object" == typeof window) return window;
      }
    })()),
    (i.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
    (e = {}),
    (t = "model-link3:"),
    (i.l = (n, s, r, o) => {
      if (e[n]) e[n].push(s);
      else {
        var a, c;
        if (void 0 !== r)
          for (
            var h = document.getElementsByTagName("script"), l = 0;
            l < h.length;
            l++
          ) {
            var y = h[l];
            if (
              y.getAttribute("src") == n ||
              y.getAttribute("data-webpack") == t + r
            ) {
              a = y;
              break;
            }
          }
        a ||
          ((c = !0),
          ((a = document.createElement("script")).charset = "utf-8"),
          (a.timeout = 120),
          i.nc && a.setAttribute("nonce", i.nc),
          a.setAttribute("data-webpack", t + r),
          (a.src = n)),
          (e[n] = [s]);
        var d = (t, s) => {
            (a.onerror = a.onload = null), clearTimeout(x);
            var i = e[n];
            if (
              (delete e[n],
              a.parentNode && a.parentNode.removeChild(a),
              i && i.forEach((e) => e(s)),
              t)
            )
              return t(s);
          },
          x = setTimeout(
            d.bind(null, void 0, { type: "timeout", target: a }),
            12e4
          );
        (a.onerror = d.bind(null, a.onerror)),
          (a.onload = d.bind(null, a.onload)),
          c && document.head.appendChild(a);
      }
    }),
    (() => {
      var e,
        t,
        n,
        s,
        r = {},
        o = i.c,
        a = [],
        c = [],
        h = "idle";
      function l(e) {
        h = e;
        for (var t = [], n = 0; n < c.length; n++) t[n] = c[n].call(null, e);
        return Promise.all(t);
      }
      function y(e) {
        if (0 === t.length) return e();
        var n = t;
        return (
          (t = []),
          Promise.all(n).then(function () {
            return y(e);
          })
        );
      }
      function d(e) {
        if ("idle" !== h)
          throw new Error("check() is only allowed in idle status");
        return l("check")
          .then(i.hmrM)
          .then(function (s) {
            return s
              ? l("prepare").then(function () {
                  var r = [];
                  return (
                    (t = []),
                    (n = []),
                    Promise.all(
                      Object.keys(i.hmrC).reduce(function (e, t) {
                        return i.hmrC[t](s.c, s.r, s.m, e, n, r), e;
                      }, [])
                    ).then(function () {
                      return y(function () {
                        return e
                          ? u(e)
                          : l("ready").then(function () {
                              return r;
                            });
                      });
                    })
                  );
                })
              : l(f() ? "ready" : "idle").then(function () {
                  return null;
                });
          });
      }
      function x(e) {
        return "ready" !== h
          ? Promise.resolve().then(function () {
              throw new Error("apply() is only allowed in ready status");
            })
          : u(e);
      }
      function u(e) {
        (e = e || {}), f();
        var t = n.map(function (t) {
          return t(e);
        });
        n = void 0;
        var i = t
          .map(function (e) {
            return e.error;
          })
          .filter(Boolean);
        if (i.length > 0)
          return l("abort").then(function () {
            throw i[0];
          });
        var r = l("dispose");
        t.forEach(function (e) {
          e.dispose && e.dispose();
        });
        var o,
          a = l("apply"),
          c = function (e) {
            o || (o = e);
          },
          h = [];
        return (
          t.forEach(function (e) {
            if (e.apply) {
              var t = e.apply(c);
              if (t) for (var n = 0; n < t.length; n++) h.push(t[n]);
            }
          }),
          Promise.all([r, a]).then(function () {
            return o
              ? l("fail").then(function () {
                  throw o;
                })
              : s
              ? u(e).then(function (e) {
                  return (
                    h.forEach(function (t) {
                      e.indexOf(t) < 0 && e.push(t);
                    }),
                    e
                  );
                })
              : l("idle").then(function () {
                  return h;
                });
          })
        );
      }
      function f() {
        if (s)
          return (
            n || (n = []),
            Object.keys(i.hmrI).forEach(function (e) {
              s.forEach(function (t) {
                i.hmrI[e](t, n);
              });
            }),
            (s = void 0),
            !0
          );
      }
      (i.hmrD = r),
        i.i.push(function (u) {
          var f,
            p,
            _,
            g,
            v = u.module,
            m = (function (n, s) {
              var i = o[s];
              if (!i) return n;
              var r = function (t) {
                  if (i.hot.active) {
                    if (o[t]) {
                      var r = o[t].parents;
                      -1 === r.indexOf(s) && r.push(s);
                    } else (a = [s]), (e = t);
                    -1 === i.children.indexOf(t) && i.children.push(t);
                  } else
                    console.warn(
                      "[HMR] unexpected require(" +
                        t +
                        ") from disposed module " +
                        s
                    ),
                      (a = []);
                  return n(t);
                },
                c = function (e) {
                  return {
                    configurable: !0,
                    enumerable: !0,
                    get: function () {
                      return n[e];
                    },
                    set: function (t) {
                      n[e] = t;
                    },
                  };
                };
              for (var d in n)
                Object.prototype.hasOwnProperty.call(n, d) &&
                  "e" !== d &&
                  Object.defineProperty(r, d, c(d));
              return (
                (r.e = function (e) {
                  return (function (e) {
                    switch (h) {
                      case "ready":
                        return (
                          l("prepare"),
                          t.push(e),
                          y(function () {
                            return l("ready");
                          }),
                          e
                        );
                      case "prepare":
                        return t.push(e), e;
                      default:
                        return e;
                    }
                  })(n.e(e));
                }),
                r
              );
            })(u.require, u.id);
          (v.hot =
            ((f = u.id),
            (p = v),
            (g = {
              _acceptedDependencies: {},
              _acceptedErrorHandlers: {},
              _declinedDependencies: {},
              _selfAccepted: !1,
              _selfDeclined: !1,
              _selfInvalidated: !1,
              _disposeHandlers: [],
              _main: (_ = e !== f),
              _requireSelf: function () {
                (a = p.parents.slice()), (e = _ ? void 0 : f), i(f);
              },
              active: !0,
              accept: function (e, t, n) {
                if (void 0 === e) g._selfAccepted = !0;
                else if ("function" == typeof e) g._selfAccepted = e;
                else if ("object" == typeof e && null !== e)
                  for (var s = 0; s < e.length; s++)
                    (g._acceptedDependencies[e[s]] = t || function () {}),
                      (g._acceptedErrorHandlers[e[s]] = n);
                else
                  (g._acceptedDependencies[e] = t || function () {}),
                    (g._acceptedErrorHandlers[e] = n);
              },
              decline: function (e) {
                if (void 0 === e) g._selfDeclined = !0;
                else if ("object" == typeof e && null !== e)
                  for (var t = 0; t < e.length; t++)
                    g._declinedDependencies[e[t]] = !0;
                else g._declinedDependencies[e] = !0;
              },
              dispose: function (e) {
                g._disposeHandlers.push(e);
              },
              addDisposeHandler: function (e) {
                g._disposeHandlers.push(e);
              },
              removeDisposeHandler: function (e) {
                var t = g._disposeHandlers.indexOf(e);
                t >= 0 && g._disposeHandlers.splice(t, 1);
              },
              invalidate: function () {
                switch (((this._selfInvalidated = !0), h)) {
                  case "idle":
                    (n = []),
                      Object.keys(i.hmrI).forEach(function (e) {
                        i.hmrI[e](f, n);
                      }),
                      l("ready");
                    break;
                  case "ready":
                    Object.keys(i.hmrI).forEach(function (e) {
                      i.hmrI[e](f, n);
                    });
                    break;
                  case "prepare":
                  case "check":
                  case "dispose":
                  case "apply":
                    (s = s || []).push(f);
                }
              },
              check: d,
              apply: x,
              status: function (e) {
                if (!e) return h;
                c.push(e);
              },
              addStatusHandler: function (e) {
                c.push(e);
              },
              removeStatusHandler: function (e) {
                var t = c.indexOf(e);
                t >= 0 && c.splice(t, 1);
              },
              data: r[f],
            }),
            (e = void 0),
            g)),
            (v.parents = a),
            (v.children = []),
            (a = []),
            (u.require = m);
        }),
        (i.hmrC = {}),
        (i.hmrI = {});
    })(),
    (() => {
      var e;
      i.g.importScripts && (e = i.g.location + "");
      var t = i.g.document;
      if (!e && t && (t.currentScript && (e = t.currentScript.src), !e)) {
        var n = t.getElementsByTagName("script");
        n.length && (e = n[n.length - 1].src);
      }
      if (!e)
        throw new Error(
          "Automatic publicPath is not supported in this browser"
        );
      (e = e
        .replace(/#.*$/, "")
        .replace(/\?.*$/, "")
        .replace(/\/[^\/]+$/, "/")),
        (i.p = e);
    })(),
    (() => {
      var e,
        t,
        n,
        s,
        r = (i.hmrS_jsonp = i.hmrS_jsonp || { 179: 0 }),
        o = {};
      function a(e) {
        return new Promise((t, n) => {
          o[e] = t;
          var s = i.p + i.hu(e),
            r = new Error();
          i.l(s, (t) => {
            if (o[e]) {
              o[e] = void 0;
              var s = t && ("load" === t.type ? "missing" : t.type),
                i = t && t.target && t.target.src;
              (r.message =
                "Loading hot update chunk " +
                e +
                " failed.\n(" +
                s +
                ": " +
                i +
                ")"),
                (r.name = "ChunkLoadError"),
                (r.type = s),
                (r.request = i),
                n(r);
            }
          });
        });
      }
      function c(o) {
        function a(e) {
          for (
            var t = [e],
              n = {},
              s = t.map(function (e) {
                return { chain: [e], id: e };
              });
            s.length > 0;

          ) {
            var r = s.pop(),
              o = r.id,
              a = r.chain,
              h = i.c[o];
            if (h && (!h.hot._selfAccepted || h.hot._selfInvalidated)) {
              if (h.hot._selfDeclined)
                return { type: "self-declined", chain: a, moduleId: o };
              if (h.hot._main)
                return { type: "unaccepted", chain: a, moduleId: o };
              for (var l = 0; l < h.parents.length; l++) {
                var y = h.parents[l],
                  d = i.c[y];
                if (d) {
                  if (d.hot._declinedDependencies[o])
                    return {
                      type: "declined",
                      chain: a.concat([y]),
                      moduleId: o,
                      parentId: y,
                    };
                  -1 === t.indexOf(y) &&
                    (d.hot._acceptedDependencies[o]
                      ? (n[y] || (n[y] = []), c(n[y], [o]))
                      : (delete n[y],
                        t.push(y),
                        s.push({ chain: a.concat([y]), id: y })));
                }
              }
            }
          }
          return {
            type: "accepted",
            moduleId: e,
            outdatedModules: t,
            outdatedDependencies: n,
          };
        }
        function c(e, t) {
          for (var n = 0; n < t.length; n++) {
            var s = t[n];
            -1 === e.indexOf(s) && e.push(s);
          }
        }
        i.f && delete i.f.jsonpHmr, (e = void 0);
        var h = {},
          l = [],
          y = {},
          d = function (e) {
            console.warn(
              "[HMR] unexpected require(" + e.id + ") to disposed module"
            );
          };
        for (var x in t)
          if (i.o(t, x)) {
            var u,
              f = t[x],
              p = !1,
              _ = !1,
              g = !1,
              v = "";
            switch (
              ((u = f ? a(x) : { type: "disposed", moduleId: x }).chain &&
                (v = "\nUpdate propagation: " + u.chain.join(" -> ")),
              u.type)
            ) {
              case "self-declined":
                o.onDeclined && o.onDeclined(u),
                  o.ignoreDeclined ||
                    (p = new Error(
                      "Aborted because of self decline: " + u.moduleId + v
                    ));
                break;
              case "declined":
                o.onDeclined && o.onDeclined(u),
                  o.ignoreDeclined ||
                    (p = new Error(
                      "Aborted because of declined dependency: " +
                        u.moduleId +
                        " in " +
                        u.parentId +
                        v
                    ));
                break;
              case "unaccepted":
                o.onUnaccepted && o.onUnaccepted(u),
                  o.ignoreUnaccepted ||
                    (p = new Error(
                      "Aborted because " + x + " is not accepted" + v
                    ));
                break;
              case "accepted":
                o.onAccepted && o.onAccepted(u), (_ = !0);
                break;
              case "disposed":
                o.onDisposed && o.onDisposed(u), (g = !0);
                break;
              default:
                throw new Error("Unexception type " + u.type);
            }
            if (p) return { error: p };
            if (_)
              for (x in ((y[x] = f),
              c(l, u.outdatedModules),
              u.outdatedDependencies))
                i.o(u.outdatedDependencies, x) &&
                  (h[x] || (h[x] = []), c(h[x], u.outdatedDependencies[x]));
            g && (c(l, [u.moduleId]), (y[x] = d));
          }
        t = void 0;
        for (var m, b = [], E = 0; E < l.length; E++) {
          var w = l[E],
            M = i.c[w];
          M &&
            (M.hot._selfAccepted || M.hot._main) &&
            y[w] !== d &&
            !M.hot._selfInvalidated &&
            b.push({
              module: w,
              require: M.hot._requireSelf,
              errorHandler: M.hot._selfAccepted,
            });
        }
        return {
          dispose: function () {
            var e;
            n.forEach(function (e) {
              delete r[e];
            }),
              (n = void 0);
            for (var t, s = l.slice(); s.length > 0; ) {
              var o = s.pop(),
                a = i.c[o];
              if (a) {
                var c = {},
                  y = a.hot._disposeHandlers;
                for (E = 0; E < y.length; E++) y[E].call(null, c);
                for (
                  i.hmrD[o] = c,
                    a.hot.active = !1,
                    delete i.c[o],
                    delete h[o],
                    E = 0;
                  E < a.children.length;
                  E++
                ) {
                  var d = i.c[a.children[E]];
                  d &&
                    (e = d.parents.indexOf(o)) >= 0 &&
                    d.parents.splice(e, 1);
                }
              }
            }
            for (var x in h)
              if (i.o(h, x) && (a = i.c[x]))
                for (m = h[x], E = 0; E < m.length; E++)
                  (t = m[E]),
                    (e = a.children.indexOf(t)) >= 0 && a.children.splice(e, 1);
          },
          apply: function (e) {
            for (var t in y) i.o(y, t) && (i.m[t] = y[t]);
            for (var n = 0; n < s.length; n++) s[n](i);
            for (var r in h)
              if (i.o(h, r)) {
                var a = i.c[r];
                if (a) {
                  m = h[r];
                  for (var c = [], d = [], x = [], u = 0; u < m.length; u++) {
                    var f = m[u],
                      p = a.hot._acceptedDependencies[f],
                      _ = a.hot._acceptedErrorHandlers[f];
                    if (p) {
                      if (-1 !== c.indexOf(p)) continue;
                      c.push(p), d.push(_), x.push(f);
                    }
                  }
                  for (var g = 0; g < c.length; g++)
                    try {
                      c[g].call(null, m);
                    } catch (t) {
                      if ("function" == typeof d[g])
                        try {
                          d[g](t, { moduleId: r, dependencyId: x[g] });
                        } catch (n) {
                          o.onErrored &&
                            o.onErrored({
                              type: "accept-error-handler-errored",
                              moduleId: r,
                              dependencyId: x[g],
                              error: n,
                              originalError: t,
                            }),
                            o.ignoreErrored || (e(n), e(t));
                        }
                      else
                        o.onErrored &&
                          o.onErrored({
                            type: "accept-errored",
                            moduleId: r,
                            dependencyId: x[g],
                            error: t,
                          }),
                          o.ignoreErrored || e(t);
                    }
                }
              }
            for (var v = 0; v < b.length; v++) {
              var E = b[v],
                w = E.module;
              try {
                E.require(w);
              } catch (t) {
                if ("function" == typeof E.errorHandler)
                  try {
                    E.errorHandler(t, { moduleId: w, module: i.c[w] });
                  } catch (n) {
                    o.onErrored &&
                      o.onErrored({
                        type: "self-accept-error-handler-errored",
                        moduleId: w,
                        error: n,
                        originalError: t,
                      }),
                      o.ignoreErrored || (e(n), e(t));
                  }
                else
                  o.onErrored &&
                    o.onErrored({
                      type: "self-accept-errored",
                      moduleId: w,
                      error: t,
                    }),
                    o.ignoreErrored || e(t);
              }
            }
            return l;
          },
        };
      }
      (self.webpackHotUpdatemodel_link3 = (e, n, r) => {
        for (var a in n) i.o(n, a) && (t[a] = n[a]);
        r && s.push(r), o[e] && (o[e](), (o[e] = void 0));
      }),
        (i.hmrI.jsonp = function (e, r) {
          t || ((t = {}), (s = []), (n = []), r.push(c)),
            i.o(t, e) || (t[e] = i.m[e]);
        }),
        (i.hmrC.jsonp = function (o, h, l, y, d, x) {
          d.push(c),
            (e = {}),
            (n = h),
            (t = l.reduce(function (e, t) {
              return (e[t] = !1), e;
            }, {})),
            (s = []),
            o.forEach(function (t) {
              i.o(r, t) && void 0 !== r[t] && (y.push(a(t)), (e[t] = !0));
            }),
            i.f &&
              (i.f.jsonpHmr = function (t, n) {
                e &&
                  !i.o(e, t) &&
                  i.o(r, t) &&
                  void 0 !== r[t] &&
                  (n.push(a(t)), (e[t] = !0));
              });
        }),
        (i.hmrM = () => {
          if ("undefined" == typeof fetch)
            throw new Error("No browser support: need fetch API");
          return fetch(i.p + i.hmrF()).then((e) => {
            if (404 !== e.status) {
              if (!e.ok)
                throw new Error(
                  "Failed to fetch update manifest " + e.statusText
                );
              return e.json();
            }
          });
        });
    })(),
    i(626);
})();
//# sourceMappingURL=ModelLink_iii.js.map
