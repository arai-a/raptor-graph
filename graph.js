let current = 0;

document.body.addEventListener("keydown", e => {
  if (e.key == "ArrowLeft") {
    current = (current - 1 + data.length) % data.length;
  }
  if (e.key == "ArrowRight") {
    current = (current + 1) % data.length;
  }
  draw(data[current]);
});

draw(data[current]);

function toReadable(n) {
  return Math.round(n * 100) / 100;
}

function signify(n) {
  return n < 0 ? ("" + n) : ("+" + n);
}

function draw([name, threshold, data]) {
  const names = [
    "before",
    "after",
  ];

  const desc = {
    before: "before",
    after: "stencil-mvp",
  };

  let maxX = 0;
  for (const subtest of ["dcf", "fcp", "fnbpaint", "loadtime"]) {
    for (let i = 0; i < names.length; i++) {
      for (const xs of g(data, names[i], subtest)[0]) {
        for (const x of xs) {
          while (x > maxX) {
            maxX += 100;
          }
        }
      }
    }
  }

  const W = 1200, H = 1200;
  const GX = W / maxX;
  let DX = 0;
  while (DX < maxX / 30) {
    DX += 50;
  }

  const canvas = document.getElementById("g");
  canvas.width = W;
  canvas.height = H;

  let ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, W, H);

  ctx.font = "16px monospace";
  ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
  for (let i = 0; (DX * i)* GX < W; i++) {
    ctx.fillRect((DX * i)* GX, 0, 1, H);
    ctx.fillText(DX * i, (DX * i)* GX + 2, 35);
  }
  ctx.fillText("[ms]", W - 40, 50);

  ctx.fillText(name, 0, 15);

  const hists = [];
  const values = [];

  for (let i = 0; i < names.length; i++) {
    const hist = {};
    const value = {};
    for (const subtest of ["dcf", "fcp", "fnbpaint", "loadtime"]) {
      hist[subtest] = [];
      value[subtest] = [];
      for (let x = 0; x < W; x++) {
        hist[subtest][x] = 0;
      }
    }
    hists.push(hist);
    values.push(value);
  }

  let D = 80;
  let Y = 80, VY = 280, BY = 220;

  for (const subtest of ["dcf", "fcp", "fnbpaint", "loadtime"]) {
    for (let i = 0; i < names.length; i++) {
      p(g(data, names[i], subtest), Y + D * i, i);

      const S = toReadable(values[i][subtest].reduce((x, y) => x + y, 0) / values[i][subtest].length);
      const s = toReadable(Math.sqrt(values[i][subtest].reduce((x, y) => x + (y - S)**2, 0) / values[i][subtest].length));

      let DSS = "";
      if (i > 0) {
        const S0 = toReadable(values[0][subtest].reduce((x, y) => x + y, 0) / values[0][subtest].length);
        const DS = toReadable(S - S0);
        DSS = ` | ${signify(DS)} (${signify(toReadable(DS / S0 * 100))}%)`;
      }
      ctx.font = "16px monospace";
      ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
      const t = `${S} ± ${s}${DSS}`;
      ctx.fillText(t, 300, Y + D * i - 10);
    }

    let maxY = 0;
    for (let i = 0; i < names.length; i++) {
      for (let x = 0; x < W; x++) {
        const y = hists[i][subtest][x];
        if (maxY < y) {
          maxY = y;
        }
      }
    }

    for (let i = 0; i < names.length; i++) {
      const base = Y + BY;

      if (i == 0) {
        ctx.strokeStyle = "rgba(128, 128, 255, 0.8)";
      } else {
        ctx.strokeStyle = "rgba(255, 128, 128, 0.8)";
      }
      ctx.beginPath();
      ctx.moveTo(0, base);
      for (let x = 0; x < W; x++) {
        const y = hists[i][subtest][x];
        ctx.lineTo(x, base - y * D / maxY);
      }
      ctx.stroke();
    }

    Y += VY;
  }

  function g(data, name, subtest) {
    const results = data[name];
    const r = [];
    for (const result of results) {
      r.push(result.suites[0].subtests.find(x => x.name == subtest).replicates);
    }
    return [r, name, subtest];
  }

  function p([data, name, subtest], y, index) {
    for (let xs of data) {
      let i = 0;
      for (let x of xs) {

        if (i >= 4) {
          if (x < threshold) {
            addToHist(hists[index][subtest], x * GX);
            values[index][subtest].push(x);
          }
        }

        if (i == 0) {
          ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
          ctx.beginPath();
          ctx.moveTo(x * GX - 3, y + i - 3);
          ctx.lineTo(x * GX + 3, y + i + 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x * GX + 3, y + i - 3);
          ctx.lineTo(x * GX - 3, y + i + 3);
          ctx.stroke();
        } else if (i < 4) {
          ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
          ctx.beginPath();
          ctx.moveTo(x * GX - 3, y + i - 3);
          ctx.lineTo(x * GX + 3, y + i + 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x * GX + 3, y + i - 3);
          ctx.lineTo(x * GX - 3, y + i + 3);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          if (x > threshold) {
            ctx.beginPath();
            ctx.moveTo(x * GX, y + i - 3);
            ctx.lineTo(x * GX - 3, y + i);
            ctx.lineTo(x * GX, y + i + 3);
            ctx.lineTo(x * GX + 3, y + i);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x * GX, y + i, 4, 0, Math.PI * 2, false);
            ctx.fill();
          }
        }
        i += 1;
      }
    }

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText(subtest + " : " + desc[name], 52, y - 10);
  }

  function addToHist(h, X) {
    const HistHeight = 1;

    for (let x = 0; x < W; x++) {
      h[x] += Math.exp(-(((x-X) / 10)**2)) * HistHeight;
    }
  }
}
