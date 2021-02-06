let current = 0;

var files = [];
var map = {};
var subtests = Object.keys(data);

for (const subtest of Object.keys(data)) {
  for (const run of Object.keys(data[subtest])) {
    for (const file of Object.keys(data[subtest][run])) {
      if (!files.includes(file)) {
        files.push(file);
      }

      if (!(file in map)) {
        map[file] = {};
      }
      if (!(run in map[file])) {
        map[file][run] = {};
      }
      map[file][run][subtest] = data[subtest][run][file];
    }
  }
}

//console.log(JSON.stringify(map, undefined, 2));

document.body.addEventListener("keydown", e => {
  if (e.key == "ArrowLeft") {
    current = (current - 1 + files.length) % files.length;
  }
  if (e.key == "ArrowRight") {
    current = (current + 1) % files.length;
  }
  draw(files[current]);
});

draw(files[current]);

function toReadable(n) {
  return Math.round(n * 100) / 100;
}

function signify(n) {
  return n < 0 ? ("" + n) : ("+" + n);
}

function draw(file) {
  const data = map[file];

  const runs = [
    "before",
    "after",
  ];

  let maxX = 0;
  for (const subtest of subtests) {
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      for (const x of data[run][subtest]) {
        while (x > maxX) {
          maxX += 10;
        }
      }
    }
  }

  const W = 1200, H = 2000;
  const GX = W / maxX;
  let DX = 0;
  while (DX < maxX / 30) {
    DX += 1;
  }

  const canvas = document.getElementById("g");
  canvas.width = W;
  canvas.height = H;

  let ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgb(0, 0, 0)";
  ctx.fillRect(0, 0, W, H);

  ctx.font = "16px monospace";
  for (let i = 0; (DX * i)* GX < W; i++) {
    ctx.fillStyle = "rgba(0, 255, 255, 0.4)";
    ctx.fillRect((DX * i)* GX, 0, 1, H);
    ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
    ctx.fillText(DX * i, (DX * i)* GX + 2, 35);
  }
  ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
  ctx.fillText("[ms]", W - 40, 50);

  ctx.fillText(file, 0, 15);

  const hists = [];
  const values = [];

  for (let i = 0; i < runs.length; i++) {
    const hist = {};
    const value = {};
    for (const subtest of subtests) {
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

  for (const subtest of subtests) {
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      p(run, subtest, data[run][subtest], Y + D * i, i);

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
    for (let i = 0; i < runs.length; i++) {
      for (let x = 0; x < W; x++) {
        const y = hists[i][subtest][x];
        if (maxY < y) {
          maxY = y;
        }
      }
    }

    for (let i = 0; i < runs.length; i++) {
      const base = Y + BY;

      if (i == 0) {
        ctx.strokeStyle = "rgba(128, 128, 255, 0.8)";
      } else if (i == 1) {
        ctx.strokeStyle = "rgba(255, 128, 128, 0.8)";
      } else {
        ctx.strokeStyle = "rgba(128, 255, 128, 0.8)";
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

  function p(run, subtest, data, y, index) {
    let i = 0;
    for (let x of data) {
      addToHist(hists[index][subtest], x * GX);
      values[index][subtest].push(x);

      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";

      ctx.beginPath();
      ctx.arc(x * GX, y + i, 4, 0, Math.PI * 2, false);
      ctx.fill();
      i += 0.1;
    }

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillText(subtest + " : " + run, 52, y - 10);
  }

  function addToHist(h, X) {
    const HistHeight = 1;

    for (let x = 0; x < W; x++) {
      h[x] += Math.exp(-(((x-X) / 4)**2)) * HistHeight;
    }
  }
}
