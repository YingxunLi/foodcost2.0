let stageHeight;
let stageWidth;
const margin = { top: 176, right: 80, bottom: 88, left: 80 };

// ----------- recht Button ----------- 
const topFields = [
  { key: "Cost", label: "Cost" },
  { key: "TagGNI", label: "Income" },
  { key: "Vergleich", label: "Ratio" }
];

// ----------- ⚠️ current ----------- 
let currentPage = "bar"; // "bar" | "afford" | "overview"
let currentTopField = "Cost"; // "Cost" | "TagGNI" | "Vergleich" -- button
let currentField = "Cost"; // "Cost" | "TagGNI" | "Vergleich" -- diagram
let selectedFoodKey = null;

// ----------- render mode ----------- 
function renderTopArea(mode) {
  let renderer = document.querySelector('#renderer');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;

  //old top-area weg
  let oldTop = document.getElementById("top-area");
  if (oldTop) oldTop.remove();

  let topArea = document.createElement("div");
  topArea.id = "top-area";
  topArea.style.left = `${margin.left}px`;
  topArea.style.width = `${stageWidth - margin.left - margin.right}px`;

  // main title
  let mainTitle = document.createElement("div");
  mainTitle.className = "main-title";
  mainTitle.textContent = "Global Cost of a Healthy Diet in 2021";
  topArea.appendChild(mainTitle);

  // left & right button container
  let btnRow = document.createElement("div");
  btnRow.className = "btn-row";

  // left button container
  let leftArea = document.createElement("div");
  leftArea.className = "left-area";

  // main button
  const mainBtns = [
    { key: "bar", label: "Cost vs Income", class: ["top-btn", "main"] },
    { key: "afford", label: "Affordability", class: ["top-btn", "main", "affordability"] },
    { key: "overview", label: "Overview", class: ["top-btn", "main", "overview"] }
  ];
  mainBtns.forEach(btnConf => {
    let btn = document.createElement("button");
    btn.textContent = btnConf.label;
    btnConf.class.forEach(c => btn.classList.add(c));
    if (mode === btnConf.key) btn.classList.add("active");
    else btn.classList.add("inactive");
    btn.onclick = () => switchPage(btnConf.key);
    leftArea.appendChild(btn);
  });
  btnRow.appendChild(leftArea);

  // right button container
  let rightArea = document.createElement("div");
  rightArea.className = "right-area";

  if (mode === "bar") {
    topFields.forEach(f => {
      let btn = document.createElement("button");
      btn.textContent = f.label;
      btn.classList.add("top-btn");
      if (currentTopField === f.key) btn.classList.add("active");
      btn.onclick = () => {
        if (currentTopField !== f.key) {
          let prevField = currentField;
          currentTopField = f.key;
          currentField = f.key;
          renderTopArea("bar");
          // switch animation 
          const transitionMap = {
            "Cost-TagGNI": "costToIncome",
            "Cost-Vergleich": "costToRatio",
            "TagGNI-Vergleich": "incomeToRatio",
            "Vergleich-Cost": "ratioToCost",
            "Vergleich-TagGNI": "ratioToIncome",
            "TagGNI-Cost": "incomeToCost"
          };
          const transitionKey = `${prevField}-${currentField}`;
          drawCountryCostChart(transitionMap[transitionKey]);
        }
      };
      rightArea.appendChild(btn);
    });
  }

  if (mode === "afford") {
    const scatterFields = [
      { key: "Vergleich", label: "Ratio" },
      { key: "Percent cannot afford", label: "Unaffordability" },
      { key: "Unterernährung", label: "Malnutrition" }
    ];
    let currentScatterField = barToScatterUltraSmoothTransition.currentScatterField || "Vergleich";
    scatterFields.forEach(f => {
      let btn = document.createElement("button");
      btn.textContent = f.label;
      btn.classList.add("top-btn");
      if (f.key === currentScatterField) btn.classList.add("active");
      btn.onclick = () => {
        if (barToScatterUltraSmoothTransition.currentScatterField !== f.key) {
          barToScatterUltraSmoothTransition.prevRField = barToScatterUltraSmoothTransition.currentScatterField;
          barToScatterUltraSmoothTransition.currentScatterField = f.key;
          renderTopArea("afford");
          barToScatterUltraSmoothTransition.hasEnteredScatter = true;
          barToScatterUltraSmoothTransition();
        }
      };
      rightArea.appendChild(btn);
    });
  }

  btnRow.appendChild(leftArea);
  btnRow.appendChild(rightArea);
  topArea.appendChild(btnRow);
  renderer.parentNode.appendChild(topArea);
}

// ----------- switch mode ----------- 
function switchPage(mode) {
  currentPage = mode;

  // State-Reset für alle Modi außer afford
  if (mode !== "afford") {
    // Reset scatter state when leaving affordability
    barToScatterUltraSmoothTransition.hasEnteredScatter = false;
    barToScatterUltraSmoothTransition.currentScatterField = "Vergleich";
    barToScatterUltraSmoothTransition.prevRField = "Vergleich";
  }

  if (mode === "bar") {
    currentField = "Cost";
    currentTopField = "Cost";
    // scatter->bar
    const dots = document.querySelectorAll(".bar-to-dot");
    if (dots.length > 0) {
      renderTopArea("bar");

      const data = getDataSortedByIncome();
      const chartWidth = stageWidth - margin.left - margin.right;
      const chartHeight = stageHeight - margin.top - margin.bottom;
      const gap = 6;
      const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;
      const maxCost = Math.max(...data.map(d => parseFloat(d["Cost"])));
      // animation dot->bar
      dots.forEach((dot, i) => {
        const cost = parseFloat(data[i]["Cost"]);
        const barHeight = gmynd.map(cost, 0, maxCost, 0, chartHeight);
        const xPos = margin.left + i * (barWidth + gap);
        const yPos = margin.top + (chartHeight - barHeight);
        dot.style.width = `${barWidth}px`;
        dot.style.height = `${barHeight}px`;
        dot.style.left = `${xPos}px`;
        dot.style.top = `${yPos}px`;
        dot.style.borderRadius = "0";
      });
      setTimeout(() => {
        // Vollständige Bereinigung aller scatter-bezogenen Elemente
        document.querySelectorAll(".bar-to-dot").forEach(el => el.remove());
        drawCountryCostChart();
      }, 900);
      return;
    }
    renderTopArea("bar");
    drawCountryCostChart();
  } else if (mode === "afford") {
    if (!barToScatterUltraSmoothTransition.currentScatterField) {
      barToScatterUltraSmoothTransition.currentScatterField = "Vergleich";
      barToScatterUltraSmoothTransition.prevRField = "Vergleich";
    }
    renderTopArea("afford");
    barToScatterUltraSmoothTransition();
  } else if (mode === "overview") {
    // Vollständige Bereinigung aller scatter-bezogenen Elemente
    document.querySelectorAll(".bar-to-dot").forEach(el => el.remove());
    renderTopArea("overview");
    drawOverviewChart();
  }
}

let tooltip = document.createElement("div");
tooltip.classList.add("tooltip");
tooltip.style.display = "none";
document.body.appendChild(tooltip);

function init() {
  renderer = document.querySelector('#renderer');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  switchPage("bar");
}

init();

// ----------- sortieren nach income ----------- 
function getDataSortedByIncome() {
  return [...jsonData].sort((a, b) => parseFloat(a.TagGNI) - parseFloat(b.TagGNI));
}

// ----------- 📒 cost vs income ----------- 
function drawCountryCostChart(transitionMode) {
  document.querySelector("#renderer").innerHTML = "";

  // alte weg
  let oldLegend = document.getElementById("food-legend-area");
  if (oldLegend) oldLegend.remove();

  // legendArea-checkbox
  if (currentField === "Cost") {
    const foodKeys = [
      "Fruits",
      "Vegetables",
      "Starchy Staples",
      "Animal-source Foods",
      "Nuts",
      "Oils and Fats"
    ];
    const foodAverages = foodKeys.map(key => ({
      key,
      avg: [...jsonData].reduce((sum, d) => sum + parseFloat(d[key]), 0) / jsonData.length
    }));
    foodAverages.sort((a, b) => b.avg - a.avg);

    const colors = [
      "hsl(343, 96%, 97.8%)",
      "hsl(343, 96%, 95%)",
      "hsl(343, 96%, 91.5%)",
      "hsl(343, 96%, 86.5%)",
      "hsl(343, 96%, 80.5%)",
      "hsl(343, 96%, 73%)"
    ];

    const chartWidth = stageWidth - margin.left - margin.right;
    let legendArea = document.createElement("div");
    legendArea.id = "food-legend-area";
    legendArea.style.top = `${stageHeight - margin.bottom + 10}px`;
    legendArea.style.left = margin.left + "px";
    legendArea.style.width = (stageWidth - margin.left - margin.right) + "px";
    const legendItems = [
      {
        key: "Select All",
        selected: !selectedFoodKey,
        onClick: () => {
          selectedFoodKey = null;
          drawCountryCostChart();
        }
      },
      ...foodAverages.map((food, idx) => ({
        key: food.key,
        color: colors[idx],
        selected: selectedFoodKey === food.key,
        onClick: () => {
          selectedFoodKey = selectedFoodKey === food.key ? null : food.key;
          drawCountryCostChart();
        }
      }))
    ];

    legendItems.forEach(itemData => {
      let item = document.createElement("div");
      item.className = "legend-item" + (itemData.selected ? " selected" : "");
      let colorBox = document.createElement("span");
      colorBox.className = "legend-color";
      colorBox.style.background = itemData.color;
      item.appendChild(colorBox);
      let label = document.createElement("span");
      label.textContent = itemData.key;
      item.appendChild(label);
      item.onclick = itemData.onClick;
      legendArea.appendChild(item);
    });
    renderer.parentNode.appendChild(legendArea);
  } else {
    // income & ratio brauchen keine legend
    let oldLegend = document.getElementById("food-legend-area");
    if (oldLegend) oldLegend.remove();
    selectedFoodKey = null;
  }

  // cost-bar-area
  const data = getDataSortedByIncome();
  const chartWidth = stageWidth - margin.left - margin.right;
  const chartHeight = stageHeight - margin.top - margin.bottom;
  const gap = 6;
  const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;

  let maxCost = Math.max(...data.map(d => parseFloat(d["Cost"])));
  let maxIncome = Math.max(...data.map(d => parseFloat(d["TagGNI"])));
  let maxVergleich = Math.max(...data.map(d => parseFloat(d["Vergleich"])));

  const bars = [];

  if (currentField === "Cost") {
    const foodKeys = [
      "Fruits",
      "Vegetables",
      "Starchy Staples",
      "Animal-source Foods",
      "Nuts",
      "Oils and Fats"
    ];
    const foodAverages = foodKeys.map(key => ({
      key,
      avg: data.reduce((sum, d) => sum + parseFloat(d[key]), 0) / data.length
    }));
    foodAverages.sort((a, b) => b.avg - a.avg);

    const colors = [
      "hsl(343, 96%, 97.8%)",
      "hsl(343, 96%, 95%)",
      "hsl(343, 96%, 91.5%)",
      "hsl(343, 96%, 86.5%)",
      "hsl(343, 96%, 80.5%)",
      "hsl(343, 96%, 73%)"
    ];

    data.forEach((country, i) => {
      let yStack = margin.top + chartHeight;
      const xPos = margin.left + i * (barWidth + gap);

      if (selectedFoodKey) {
        let total = parseFloat(country["Cost"]);
        let totalBarHeight = gmynd.map(total, 0, maxCost, 0, chartHeight);
        let totalBarTop = margin.top + (chartHeight - totalBarHeight);
        let bar = document.createElement("div");
        bar.classList.add("bar", "income");
        bar.style.position = "absolute";
        bar.style.left = `${xPos}px`;
        bar.style.top = `${totalBarTop}px`;
        bar.style.width = `${barWidth}px`;
        bar.style.height = `${totalBarHeight}px`;
        bar.style.transition = "height 0.5s, top 0.5s";
        document.querySelector("#renderer").appendChild(bar);

        bar.addEventListener('mouseenter', (event) => {
          tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>Select All: $${total.toFixed(2)} intl $/person/day (PPP, constant 2021)`;
          tooltip.style.display = "block";
          positionTooltip(event, tooltip);
          bar.classList.add('active');
        });
        bar.addEventListener('mousemove', (event) => {
          positionTooltip(event, tooltip);
        });
        bar.addEventListener('mouseleave', () => {
          tooltip.style.display = "none";
          bar.classList.remove('active');
        });

        let value = parseFloat(country[selectedFoodKey]);
        let barHeight = gmynd.map(value, 0, maxCost, 0, chartHeight);
        let barTop = margin.top + (chartHeight - barHeight);

        let barTopDiv = document.createElement("div");
        barTopDiv.classList.add("bar");
        barTopDiv.style.position = "absolute";
        barTopDiv.style.left = `${xPos}px`;
        barTopDiv.style.top = `${barTop}px`;
        barTopDiv.style.width = `${barWidth}px`;
        barTopDiv.style.height = `${barHeight}px`;
        barTopDiv.style.background = "#FED5E1";
        barTopDiv.style.transition = "height 0.5s, top 0.5s";

        barTopDiv.addEventListener("mouseenter", (event) => {
          tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>${selectedFoodKey}: $${value.toFixed(2)} intl $/person/day (PPP, constant 2021)`;
          tooltip.style.display = "block";
          positionTooltip(event, tooltip);
          barTopDiv.classList.add('active');
        });
        barTopDiv.addEventListener("mousemove", (event) => {
          positionTooltip(event, tooltip);
        });
        barTopDiv.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
          barTopDiv.classList.remove('active');
        });

        document.querySelector("#renderer").appendChild(barTopDiv);
      } else {
        foodAverages.forEach((food, idx) => {
          const value = parseFloat(country[food.key]);
          const barHeight = gmynd.map(value, 0, maxCost, 0, chartHeight);

          yStack -= barHeight;

          let seg = document.createElement("div");
          seg.className = "bar food-segment";
          seg.style.position = "absolute";
          seg.style.left = `${xPos}px`;
          seg.style.top = `${yStack}px`;
          seg.style.width = `${barWidth}px`;
          seg.style.height = `${barHeight}px`;
          // seg.style.background = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alphas[idx]})`;
          seg.style.background = colors[idx];
          seg.style.transition = "height 0.5s, top 0.5s";

          seg.addEventListener("mouseenter", (event) => {
            tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>${food.key}: $${value.toFixed(2)} intl $/person/day (PPP, constant 2021)`;
            tooltip.style.display = "block";
            positionTooltip(event, tooltip);
          });
          seg.addEventListener("mousemove", (event) => {
            positionTooltip(event, tooltip);
          });
          seg.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          });

          document.querySelector("#renderer").appendChild(seg);
        });
      }
    });
    return;
  }

  // cost->income
  if (transitionMode === "costToIncome") {
    // Zuerst cost-Balken rendern (mit cost-Maximalwert abbilden)
    data.forEach((country, i) => {
      const cost = parseFloat(country["Cost"]);
      const barHeight = gmynd.map(cost, 0, maxCost, 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);
      const yPos = margin.top + (chartHeight - barHeight);

      let bar = document.createElement("div");
      bar.classList.add("bar", "cost");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;
      bar.style.position = "absolute";
      bar.style.transition = "height 0.5s, top 0.5s";

      document.querySelector("#renderer").appendChild(bar);
      bars.push(bar);
    });

    // Erzwinge Reflow
    void document.querySelector("#renderer").offsetHeight;

    // Übergang zu cost-Balken unter income-Anzeige
    data.forEach((country, i) => {
      const cost = parseFloat(country["Cost"]);
      const barHeight = gmynd.map(cost, 0, maxIncome, 0, chartHeight);
      const yPos = margin.top + (chartHeight - barHeight);
      const bar = bars[i];
      bar.style.height = `${barHeight}px`;
      bar.style.top = `${yPos}px`;
    });

    // Nach Übergang income+cost Doppelsäulen rendern
    setTimeout(() => {
      drawCountryCostChart();
    }, 500);
    return;
  }
  // cost->ratio
  if (transitionMode === "costToRatio") {
    // Zuerst cost-Balken rendern (mit cost-Maximalwert abbilden)
    data.forEach((country, i) => {
      const cost = parseFloat(country["Cost"]);
      const barHeight = gmynd.map(cost, 0, maxCost, 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);
      const yPos = margin.top + (chartHeight - barHeight);

      let bar = document.createElement("div");
      bar.classList.add("bar", "cost");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;
      bar.style.position = "absolute";
      bar.style.transition = "height 0.5s, top 0.5s";
      document.querySelector("#renderer").appendChild(bar);
      bars.push(bar);
    });

    // Erzwinge Reflow
    void document.querySelector("#renderer").offsetHeight;

    // Übergang zu ratio-Anzeige
    data.forEach((country, i) => {
      const vergleich = parseFloat(country["Vergleich"]);
      const barHeight = gmynd.map(vergleich, 0, maxVergleich, 0, chartHeight);
      const yPos = margin.top + (chartHeight - barHeight);
      const bar = bars[i];
      bar.style.height = `${barHeight}px`;
      bar.style.top = `${yPos}px`;
    });

    // Nach Übergang ratio-Balken rendern
    setTimeout(() => {
      drawCountryCostChart();
    }, 500);

    return;
  }

  // income->ratio
  if (transitionMode === "incomeToRatio") {
    // Zuerst income-Seite rendern: income-Balken (grau) und cost-Balken (rosa)，beide mit income-Maximalwert abbilden
    data.forEach((country, i) => {
      const income = parseFloat(country["TagGNI"]);
      const cost = parseFloat(country["Cost"]);
      const vergleich = parseFloat(country["Vergleich"]);
      const barHeightIncome = gmynd.map(income, 0, maxIncome, 0, chartHeight);
      const barHeightCost = gmynd.map(cost, 0, maxIncome, 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);

      // income bar（Ziel: ratio100% bar）
      let barBg = document.createElement("div");
      barBg.classList.add("bar", "ratio-bg");
      barBg.style.width = `${barWidth}px`;
      barBg.style.height = `${barHeightIncome}px`;
      barBg.style.left = `${xPos}px`;
      barBg.style.top = `${margin.top + (chartHeight - barHeightIncome)}px`;
      barBg.style.position = "absolute";
      barBg.style.transition = "height 0.5s, top 0.5s";
      document.querySelector("#renderer").appendChild(barBg);
      bars.push(barBg);

      // cost bar（Ziel: ratio: vergleich bar）
      let pinkBar = document.createElement("div");
      pinkBar.classList.add("bar", "ratio-fg");
      pinkBar.style.width = `${barWidth}px`;
      pinkBar.style.height = `${barHeightCost}px`;
      pinkBar.style.left = `${xPos}px`;
      pinkBar.style.top = `${margin.top + (chartHeight - barHeightCost)}px`;
      pinkBar.style.position = "absolute";
      pinkBar.style.transition = "height 0.5s, top 0.5s";
      document.querySelector("#renderer").appendChild(pinkBar);
      bars.push(pinkBar);
    });

    // Erzwinge Reflow
    void document.querySelector("#renderer").offsetHeight;

    // income bar - ratio 100% bar，cost bar - ratio  vergleich bar
    data.forEach((country, i) => {
      // grau
      const barHeightBg = gmynd.map(100, 0, maxVergleich, 0, chartHeight);
      const yPosBg = margin.top + (chartHeight - barHeightBg);
      const barBg = bars[i * 2];
      barBg.style.height = `${barHeightBg}px`;
      barBg.style.top = `${yPosBg}px`;

      // pink
      const vergleich = parseFloat(country["Vergleich"]);
      const barHeightPink = gmynd.map(vergleich, 0, maxVergleich, 0, chartHeight);
      const yPosPink = margin.top + (chartHeight - barHeightPink);
      const pinkBar = bars[i * 2 + 1];
      pinkBar.style.height = `${barHeightPink}px`;
      pinkBar.style.top = `${yPosPink}px`;
    });

    // Nach Übergang ratio-Seite rendern (mit grauem Hintergrund和rosa Balken)
    setTimeout(() => {
      drawCountryCostChart();
    }, 500);

    return;
  }

  // ratio->income
  if (transitionMode === "ratioToIncome") {
    data.forEach((country, i) => {
      const vergleich = parseFloat(country["Vergleich"]);
      const barHeightGray = gmynd.map(100, 0, maxVergleich, 0, chartHeight);
      const barHeightPink = gmynd.map(vergleich, 0, maxVergleich, 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);

      // grau bar
      let barBg = document.createElement("div");
      barBg.classList.add("bar", "ratio-bg");
      barBg.style.width = `${barWidth}px`;
      barBg.style.height = `${barHeightGray}px`;
      barBg.style.left = `${xPos}px`;
      barBg.style.top = `${margin.top + (chartHeight - barHeightGray)}px`;
      barBg.style.position = "absolute";
      barBg.style.transition = "height 0.5s, top 0.5s";
      document.querySelector("#renderer").appendChild(barBg);
      bars.push(barBg);

      // pink bar
      let pinkBar = document.createElement("div");
      pinkBar.classList.add("bar", "ratio-fg");
      pinkBar.style.width = `${barWidth}px`;
      pinkBar.style.height = `${barHeightPink}px`;
      pinkBar.style.left = `${xPos}px`;
      pinkBar.style.top = `${margin.top + (chartHeight - barHeightPink)}px`;
      pinkBar.style.position = "absolute";
      pinkBar.style.transition = "height 0.5s, top 0.5s";
      document.querySelector("#renderer").appendChild(pinkBar);
      bars.push(pinkBar);
    });

    // Erzwinge Reflow
    void document.querySelector("#renderer").offsetHeight;

    // animation: ratio bar - income bar
    data.forEach((country, i) => {
      const income = parseFloat(country["TagGNI"]);
      const cost = parseFloat(country["Cost"]);
      const barHeightIncome = gmynd.map(income, 0, maxIncome, 0, chartHeight);
      const barHeightCost = gmynd.map(cost, 0, maxIncome, 0, chartHeight);
      const yPosIncome = margin.top + (chartHeight - barHeightIncome);
      const yPosCost = margin.top + (chartHeight - barHeightCost);
      const barBg = bars[i * 2];
      const pinkBar = bars[i * 2 + 1];
      barBg.style.height = `${barHeightIncome}px`;
      barBg.style.top = `${yPosIncome}px`;
      pinkBar.style.height = `${barHeightCost}px`;
      pinkBar.style.top = `${yPosCost}px`;
    });

    setTimeout(() => {
      drawCountryCostChart();
    }, 500);

    return;
  }

  data.forEach((country, i) => {
    const cost = parseFloat(country["Cost"]);
    const income = parseFloat(country["TagGNI"]);
    const vergleich = parseFloat(country["Vergleich"]);
    const fieldValue = parseFloat(country[currentField]);
    const barHeight = gmynd.map(
      fieldValue,
      0,
      currentField === "TagGNI"
        ? maxIncome
        : currentField === "Vergleich"
          ? maxVergleich
          : maxCost,
      0,
      chartHeight
    );
    const xPos = margin.left + i * (barWidth + gap);
    const yPos = margin.top + (chartHeight - barHeight);

    if (currentField === "TagGNI") {
      // income-Balken
      let barIncome = document.createElement("div");
      barIncome.classList.add("bar", "income");
      barIncome.style.width = `${barWidth}px`;
      barIncome.style.height = `${gmynd.map(income, 0, maxIncome, 0, chartHeight)}px`;
      barIncome.style.left = `${xPos}px`;
      barIncome.style.top = `${margin.top + (chartHeight - gmynd.map(income, 0, maxIncome, 0, chartHeight))}px`;
      barIncome.style.position = "absolute";

      // cost-Balken (mit income-Maximalwert abbilden)
      let barCost = document.createElement("div");
      barCost.classList.add("bar", "cost");
      barCost.style.width = `${barWidth}px`;
      barCost.style.height = `${gmynd.map(cost, 0, maxIncome, 0, chartHeight)}px`;
      barCost.style.left = `${xPos}px`;
      barCost.style.top = `${margin.top + (chartHeight - gmynd.map(cost, 0, maxIncome, 0, chartHeight))}px`;
      barCost.style.position = "absolute";

      // Interaktion: income
      barIncome.addEventListener('mouseenter', () => {
        tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>Income: $${income.toFixed(2)} Intl $/person/day (PPP, constant 2021)`;
        tooltip.style.display = "block";
        const barRect = barIncome.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
        barIncome.classList.add('active');
      });
      barIncome.addEventListener('mousemove', () => {
        const barRect = barIncome.getBoundingClientRect();
        positionTooltip(event, tooltip); 
      });
      barIncome.addEventListener('mouseleave', () => {
        tooltip.style.display = "none";
        barIncome.classList.remove('active');
      });

      // Interaktion: cost
      barCost.addEventListener('mouseenter', () => {
        tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>Cost: $${cost.toFixed(2)} intl $/person/day (PPP, constant 2021)`;
        tooltip.style.display = "block";
        const barRect = barCost.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
        barCost.classList.add('active');
      });
      barCost.addEventListener('mousemove', () => {
        positionTooltip(event, tooltip);
      });
      barCost.addEventListener('mouseleave', () => {
        tooltip.style.display = "none";
        barCost.classList.remove('active');
      });

      document.querySelector("#renderer").appendChild(barIncome);
      document.querySelector("#renderer").appendChild(barCost);
      bars.push(barIncome, barCost);
    } else if (["Cost", "Vergleich"].includes(currentField)) {
      // Ratio-Seite: zuerst grauer
      if (currentField === "Vergleich") {
        // Grauer Hintergrundbalken (100%)
        let barBg = document.createElement("div");
        barBg.classList.add("bar", "ratio-bg");
        barBg.style.width = `${barWidth}px`;
        barBg.style.height = `${gmynd.map(100, 0, maxVergleich, 0, chartHeight)}px`;
        barBg.style.left = `${xPos}px`;
        barBg.style.top = `${margin.top + (chartHeight - gmynd.map(100, 0, maxVergleich, 0, chartHeight))}px`;
        barBg.style.position = "absolute";
        document.querySelector("#renderer").appendChild(barBg);
      }

      let bar = document.createElement("div");
      bar.classList.add("bar");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;

      bar.addEventListener('mouseenter', () => {
        let val = fieldValue;
        if (currentField === "Cost") val = `$${fieldValue.toFixed(2)}`;
        if (currentField === "Vergleich") val = `${fieldValue.toFixed(2)}%`;
        if (currentField === "TagGNI") val = `$${fieldValue.toFixed(2)} Intl $/person/day (PPP, constant 2021)`;
        tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>Ratio: ${val}`;
        tooltip.style.display = "block";
        positionTooltip(event, tooltip);
        bars.forEach(b => b.classList.remove('active'));
        bar.classList.add('active');
      });
      bar.addEventListener('mousemove', () => {
        positionTooltip(event, tooltip);
      });
      bar.addEventListener('mouseleave', () => {
        tooltip.style.display = "none";
        bars.forEach(b => {
          b.classList.remove('active');
          b.style.backgroundColor = b.dataset.baseColor;
        });
      });

      document.querySelector("#renderer").appendChild(bar);
      bars.push(bar);
    } else {
      let costBar = document.createElement("div");
      costBar.classList.add("bar", "cost-background");
      costBar.style.width = `${barWidth}px`;
      const costBarHeight = gmynd.map(cost, 0, maxCost, 0, chartHeight);
      costBar.style.height = `${costBarHeight}px`;
      costBar.style.left = `${xPos}px`;
      costBar.style.top = `${margin.top + (chartHeight - costBarHeight)}px`;
      costBar.style.position = "absolute";
      document.querySelector("#renderer").appendChild(costBar);

      let bar = document.createElement("div");
      bar.classList.add("bar");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;

      bar.addEventListener('mouseenter', () => {
        tooltip.innerHTML = `<b>${country["Country Name"]}</b><br>$${cost.toFixed(2)} intl $/person/day (PPP, constant 2021)`;
        tooltip.style.display = "block";
        positionTooltip(event, tooltip);
        bar.classList.add('active');
      });
      bar.addEventListener('mousemove', () => {
        positionTooltip(event, tooltip);
      });
      bar.addEventListener('mouseleave', () => {
        tooltip.style.display = "none";
        bar.classList.remove('active');
      });

      document.querySelector("#renderer").appendChild(bar);
      bars.push(bar);
    }
  });
}

// ----------- 📒 Affordability ----------- 
function barToScatterUltraSmoothTransition() {
  document.querySelector("#renderer").innerHTML = "";

  // unter weg
  let oldLegend = document.getElementById("food-legend-area");
  if (oldLegend) oldLegend.remove();

  // neue buttons erstellen
  const scatterFields = [
    { key: "Vergleich", label: "Ratio" },
    { key: "Percent cannot afford", label: "Unaffordability" },
    { key: "Unterernährung", label: "Malnutrition" }
  ];

  // protection
  if (!barToScatterUltraSmoothTransition.currentScatterField) {
    barToScatterUltraSmoothTransition.currentScatterField = "Vergleich";
    barToScatterUltraSmoothTransition.prevRField = "Vergleich";
  }
  let currentScatterField = barToScatterUltraSmoothTransition.currentScatterField;

  if (typeof barToScatterUltraSmoothTransition.hasEnteredScatter === "undefined") {
    barToScatterUltraSmoothTransition.hasEnteredScatter = false;
  }

  // scatter top area erstellen
  let scatterTop = document.createElement("div");
  scatterTop.id = "scatter-top-btns";

  // old area entfernen
  let oldScatterTop = document.getElementById("scatter-top-btns");
  if (oldScatterTop) oldScatterTop.remove();
  document.querySelector("#top-area").appendChild(scatterTop);

  // Daten vorbereiten
  const data = getDataSortedByIncome();

  // console.log("data", data); 
  const yAxisSpace = 60;
  const chartWidth = stageWidth - margin.left - margin.right - yAxisSpace;
  const chartHeight = stageHeight - margin.top - margin.bottom;
  const gap = 6;
  const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;

  // X / Y 
  const minX = Math.min(...data.map(d => parseFloat(d["TagGNI"])));
  const maxX = Math.max(...data.map(d => parseFloat(d["TagGNI"])));
  const minY = Math.min(...data.map(d => parseFloat(d["Cost"])));
  const maxY = Math.max(...data.map(d => parseFloat(d["Cost"])));

  // min / max
  const rField = barToScatterUltraSmoothTransition.currentScatterField || "Vergleich";
  const minR = Math.min(...data.map(d => parseFloat(d[rField])));
  const maxR = Math.max(...data.map(d => parseFloat(d[rField])));

  // X 
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const t = i / xTicks;
    // log
    const logMinX = Math.log10(minX);
    const logMaxX = Math.log10(maxX);
    const logVal = logMinX + t * (logMaxX - logMinX);
    const val = Math.pow(10, logVal);
    const x = gmynd.map(logVal, logMinX, logMaxX, 0, chartWidth);

    // x punkt
    let tick = document.createElement("div");
    tick.className = "axis-x-tick";
    tick.style.left = `${margin.left + yAxisSpace + x - 3}px`;
    tick.style.top = `${margin.top + chartHeight - 3 + 2}px`;
    document.querySelector("#renderer").appendChild(tick);

    // x label
    let label = document.createElement("div");
    label.className = "axis-x-tick-label";
    label.style.left = `${margin.left + yAxisSpace + x - 15}px`;
    label.style.top = `${margin.top + chartHeight + 15}px`;
    label.textContent = val.toFixed(2);
    document.querySelector("#renderer").appendChild(label);
  }

  for (let i = 0; i < xTicks; i++) {
    const startT = i / xTicks;
    const endT = (i + 1) / xTicks;

    // kleine Striche zwischen den Hauptstrichen
    for (let j = 1; j <= 5; j++) {
      const minorT = startT + (endT - startT) * (j / 6);
      const logMinX = Math.log10(minX);
      const logMaxX = Math.log10(maxX);
      const logVal = logMinX + minorT * (logMaxX - logMinX);
      const x = gmynd.map(logVal, logMinX, logMaxX, 0, chartWidth);

      let minorTick = document.createElement("div");
      minorTick.className = "axis-x-tick axis-x-minor-tick";
      minorTick.style.left = `${margin.left + yAxisSpace + x - 2}px`;
      minorTick.style.top = `${margin.top + chartHeight - 2 + 2}px`;
      document.querySelector("#renderer").appendChild(minorTick);
    }
  }

  // Y 
  const yTicks = 3;
  for (let i = 0; i <= yTicks; i++) {
    const t = i / yTicks;
    // log
    const logMinY = Math.log10(minY);
    const logMaxY = Math.log10(maxY);
    const logVal = logMinY + t * (logMaxY - logMinY);
    const val = Math.pow(10, logVal);
    const y = gmynd.map(logVal, logMinY, logMaxY, chartHeight, 0);

    // y punkt
    let tick = document.createElement("div");
    tick.style.left = `${margin.left + yAxisSpace - 6}px`;
    tick.style.top = `${margin.top + y - 3}px`;
    tick.className = "axis-y-tick";
    document.querySelector("#renderer").appendChild(tick);

    // y label
    let label = document.createElement("div");
    label.style.left = `${margin.left + 10}px`;
    label.style.top = `${margin.top + y - 8}px`;
    label.className = "axis-y-tick-label";
    label.textContent = val.toFixed(2);
    document.querySelector("#renderer").appendChild(label);
  }

  for (let i = 0; i < yTicks; i++) {
    const startT = i / yTicks;
    const endT = (i + 1) / yTicks;

    // kleine Striche zwischen den Hauptstrichen
    for (let j = 1; j <= 5; j++) {
      const minorT = startT + (endT - startT) * (j / 6);
      const logMinY = Math.log10(minY);
      const logMaxY = Math.log10(maxY);
      const logVal = logMinY + minorT * (logMaxY - logMinY);
      const y = gmynd.map(logVal, logMinY, logMaxY, chartHeight, 0);

      let minorTick = document.createElement("div");
      minorTick.className = "axis-y-tick axis-y-minor-tick";
      minorTick.style.left = `${margin.left + yAxisSpace - 4}px`;
      minorTick.style.top = `${margin.top + y - 2}px`;
      document.querySelector("#renderer").appendChild(minorTick);
    }
  }

  if (!barToScatterUltraSmoothTransition.hasEnteredScatter) {
    // bar zuerst zeichnen dann dot 
    let barDots = [];
    let startStates = [];
    let endStates = [];
    data.forEach((country, i) => {
      const cost = parseFloat(country["Cost"]);
      const barHeight = gmynd.map(cost, 0, Math.max(...data.map(d => parseFloat(d["Cost"]))), 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);
      const yPos = margin.top + (chartHeight - barHeight);

      // Position
      const logMinX = Math.log10(minX);
      const logMaxX = Math.log10(maxX);
      const logMinY = Math.log10(minY);
      const logMaxY = Math.log10(maxY);

      const x = gmynd.map(Math.log10(parseFloat(country["TagGNI"])), logMinX, logMaxX, 0, chartWidth);
      const y = gmynd.map(Math.log10(parseFloat(country["Cost"])), logMinY, logMaxY, chartHeight, 0);
      const r = gmynd.map(parseFloat(country[rField]), minR, maxR, 20, 160);

      let bar = document.createElement("div");
      bar.classList.add("bar", "bar-to-dot");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;
      bar.style.cursor = "pointer";
      bar.style.transition = "width 0.9s cubic-bezier(0.4, 0, 0.2, 1), height 0.9s cubic-bezier(0.4, 0, 0.2, 1), left 0.9s cubic-bezier(0.4, 0, 0.2, 1), top 0.9s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
      document.querySelector("#renderer").appendChild(bar);
      barDots.push(bar);

      let label = document.createElement("div");
      label.className = "dot-label";
      label.style.display = "none";
      // bar.appendChild(label);
      //label recht oben
      document.querySelector("#renderer").appendChild(label);
      bar._dotLabel = label;

      bar.style.transition = "none";
      void bar.offsetHeight;
      bar.style.transition = "width 0.9s cubic-bezier(0.4, 0, 0.2, 1), height 0.9s cubic-bezier(0.4, 0, 0.2, 1), left 0.9s cubic-bezier(0.4, 0, 0.2, 1), top 0.9s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
      startStates.push({
        width: barWidth,
        height: barHeight,
        left: xPos,
        top: yPos,
        borderRadius: 0
      });
      endStates.push({
        width: r,
        height: r,
        left: margin.left + yAxisSpace + x - r / 2,
        top: margin.top + y - r / 2,
        borderRadius: r
      });
    });

    data.forEach((country, i) => {
      let bar = barDots[i];
      let label = bar._dotLabel;
      bar.onmouseenter = () => {
        let field = barToScatterUltraSmoothTransition.currentScatterField;
        let value = country[field];
        value = parseFloat(value);
        value = value.toFixed(2);
        let fieldLabel = {
          "Vergleich": "Ratio",
          "Percent cannot afford": "Unaffordability",
          "Unterernährung": "Malnutrition"
        }[field] || field;
        label.innerHTML = `<b>${country["Country Name"]}</b><br>${fieldLabel}: ${value}%`;
        label.style.display = "block";

        label.style.right = `${margin.right}px`;
        label.style.top = `${margin.top}px`;

        drawScatterHoverLines(country, margin, chartWidth, chartHeight, minX, maxX, minY, maxY, yAxisSpace);
        document.querySelectorAll('.axis-x-tick, .axis-x-tick-label, .axis-y-tick, .axis-y-tick-label, .axis-x-minor-tick, .axis-y-minor-tick').forEach(el => {
          el.classList.add('show');
        });
      };
      bar.onmousemove = () => {
        tooltip.style.left = `${bar.getBoundingClientRect().right + 10}px`;
        tooltip.style.top = `${bar.getBoundingClientRect().top}px`;
      };
      bar.onmouseleave = () => {
        label.style.display = "none";
        document.querySelectorAll('.axis-x-tick, .axis-x-tick-label, .axis-y-tick, .axis-y-tick-label, .axis-x-minor-tick, .axis-y-minor-tick').forEach(el => {
          el.classList.remove('show');
        });
        removeScatterHoverLines();
      };
    });

    void document.querySelector("#renderer").offsetHeight;

    barDots.forEach((bar, i) => {
      const e = endStates[i];
      bar.style.width = `${e.width}px`;
      bar.style.height = `${e.height}px`;
      bar.style.left = `${e.left}px`;
      bar.style.top = `${e.top}px`;
      bar.style.borderRadius = `${e.borderRadius}px`;
    });

    barToScatterUltraSmoothTransition.hasEnteredScatter = true;
    return;
  }

  // zwischen dot: nur Gross ändern
  const existingDots = document.querySelectorAll(".bar-to-dot");

  let dots = [];
  let prevRField = barToScatterUltraSmoothTransition.prevRField || rField;
  const prevMinR = Math.min(...data.map(d => parseFloat(d[prevRField])));
  const prevMaxR = Math.max(...data.map(d => parseFloat(d[prevRField])));
  data.forEach((country, i) => {
    const logMinX = Math.log10(minX);
    const logMaxX = Math.log10(maxX);
    const logMinY = Math.log10(minY);
    const logMaxY = Math.log10(maxY);

    const x = gmynd.map(Math.log10(parseFloat(country["TagGNI"])), logMinX, logMaxX, 0, chartWidth);
    const y = gmynd.map(Math.log10(parseFloat(country["Cost"])), logMinY, logMaxY, chartHeight, 0);

    // alt radius
    const prevR = gmynd.map(parseFloat(country[prevRField]), prevMinR, prevMaxR, 20, 160);
    // ziel radius
    const r = gmynd.map(parseFloat(country[rField]), minR, maxR, 20, 160);

    let dot = document.createElement("div");
    dot.classList.add("bar", "bar-to-dot");
    dot.style.left = `${margin.left + yAxisSpace + x - prevR / 2}px`;
    dot.style.top = `${margin.top + y - prevR / 2}px`;
    dot.style.width = `${prevR}px`;
    dot.style.height = `${prevR}px`;
    dot.style.cursor = "pointer";
    dot.style.transition = "width 0.6s cubic-bezier(0.4, 0, 0.2, 1), height 0.6s cubic-bezier(0.4, 0, 0.2, 1), left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    document.querySelector("#renderer").appendChild(dot);
    // dots.push({ dot, x, y, prevR, r });

    // label continer
    let label = document.createElement("div");
    label.className = "dot-label";
    label.style.display = "none";
    // dot.appendChild(label);
    document.querySelector("#renderer").appendChild(label);
    dots.push({ dot, x, y, prevR, r, label });
  });

  data.forEach((country, i) => {
    let bar = dots[i].dot;
    let label = dots[i].label;
    bar.onmouseenter = () => {

      let field = barToScatterUltraSmoothTransition.currentScatterField;
      let value = country[field];
      let fieldLabel = {
        "Vergleich": "Ratio",
        "Percent cannot afford": "Unaffordability",
        "Unterernährung": "Malnutrition"
      }[field] || field;
      label.innerHTML = `<b>${country["Country Name"]}</b><br>${fieldLabel}: ${value}%`;
      label.style.display = "block";

      label.style.right = `${margin.right}px`;
      label.style.top = `${margin.top}px`;

      drawScatterHoverLines(country, margin, chartWidth, chartHeight, minX, maxX, minY, maxY, yAxisSpace);
      document.querySelectorAll('.axis-x-tick, .axis-x-tick-label, .axis-y-tick, .axis-y-tick-label, .axis-x-minor-tick, .axis-y-minor-tick').forEach(el => {
        el.classList.add('show');
      });
    };
    bar.onmouseleave = () => {
      bar.style.transform = "";
      label.style.display = "none";
      document.querySelectorAll('.axis-x-tick, .axis-x-tick-label, .axis-y-tick, .axis-y-tick-label, .axis-x-minor-tick, .axis-y-minor-tick').forEach(el => {
        el.classList.remove('show');
      });
      removeScatterHoverLines();
    };
  });

  void document.querySelector("#renderer").offsetHeight;

  dots.forEach(({ dot, x, y, r }) => {
    dot.style.width = `${r}px`;
    dot.style.height = `${r}px`;
    dot.style.left = `${margin.left + yAxisSpace + x - r / 2}px`;
    dot.style.top = `${margin.top + y - r / 2}px`;
  });

  if (barToScatterUltraSmoothTransition.prevRField !== rField) {
    barToScatterUltraSmoothTransition.prevRField = rField;
  }
}

// hover-guide line
function drawScatterHoverLines(country, margin, chartWidth, chartHeight, minX, maxX, minY, maxY, yAxisSpace) {
  const logMinX = Math.log10(minX);
  const logMaxX = Math.log10(maxX);
  const logMinY = Math.log10(minY);
  const logMaxY = Math.log10(maxY);
  const x = gmynd.map(Math.log10(parseFloat(country["TagGNI"])), logMinX, logMaxX, 0, chartWidth);
  const y = gmynd.map(Math.log10(parseFloat(country["Cost"])), logMinY, logMaxY, chartHeight, 0);

  // alte weg
  removeScatterHoverAxes();

  let vLine = document.createElement("div");
  vLine.id = "scatter-hover-vline";
  vLine.style.left = `${margin.left + yAxisSpace + x}px`;
  vLine.style.top = `${margin.top + y}px`;
  vLine.style.height = `${chartHeight - y}px`;
  document.querySelector("#renderer").appendChild(vLine);

  let hLine = document.createElement("div");
  hLine.id = "scatter-hover-hline";
  hLine.style.left = `${margin.left + yAxisSpace}px`;
  hLine.style.top = `${margin.top + y}px`;
  hLine.style.width = `${x}px`;
  document.querySelector("#renderer").appendChild(hLine);

  let xLabel = document.createElement("div");
  xLabel.id = "scatter-hover-xlabel";
  xLabel.style.left = `${margin.left + yAxisSpace + x - 30}px`;
  xLabel.style.top = `${margin.top + chartHeight + 12}px`;
  xLabel.textContent = `Income: $${parseFloat(country["TagGNI"]).toFixed(2)} Intl $/person/day (PPP, constant 2021)`;
  document.querySelector("#renderer").appendChild(xLabel);

  let yLabel = document.createElement("div");
  yLabel.id = "scatter-hover-ylabel";
  yLabel.style.left = `${margin.left}px`;
  yLabel.style.top = `${margin.top + y - 12}px`;
  yLabel.textContent = `Cost: $${parseFloat(country["Cost"]).toFixed(2)}`;
  document.querySelector("#renderer").appendChild(yLabel);
}

function removeScatterHoverAxes() {
  let vLine = document.getElementById("scatter-hover-vline");
  if (vLine) vLine.remove();
  let hLine = document.getElementById("scatter-hover-hline");
  if (hLine) hLine.remove();
}

function removeScatterHoverLines() {
  removeScatterHoverAxes();
  ["scatter-hover-xlabel", "scatter-hover-ylabel"].forEach(id => {
    let el = document.getElementById(id);
    if (el) el.remove();
  });
}

// ----------- 📒 Overview Chart ----------- 
function drawOverviewChart() {
  document.querySelector("#renderer").innerHTML = "";

  // unter weg
  let oldLegend = document.getElementById("food-legend-area");
  if (oldLegend) oldLegend.remove();


  const chartWidth = stageWidth - margin.left - margin.right;
  const chartHeight = stageHeight - margin.top - margin.bottom;

  // Daten & Bereich
  const data = getDataSortedByIncome();
  const minCost = Math.min(...data.map(d => parseFloat(d["Cost"])));
  const maxCost = Math.max(...data.map(d => parseFloat(d["Cost"])));
  const minIncome = Math.min(...data.map(d => parseFloat(d["TagGNI"])));
  const maxIncome = Math.max(...data.map(d => parseFloat(d["TagGNI"])));
  const minUnter = Math.min(...data.map(d => parseFloat(d["Unterernährung"])));
  const maxUnter = Math.max(...data.map(d => parseFloat(d["Unterernährung"])));

  const minCostArea = Math.PI * 100 * 100;
  const maxCostArea = Math.PI * 200 * 200;
  const minIncomeArea = Math.PI * 100 * 100;
  const maxIncomeArea = Math.PI * 200 * 200;
  const minUnterArea = Math.PI * 10 * 10;
  const maxUnterArea = Math.PI * 75 * 75;

  // Position
  const nodes = data.map((country, i) => {
    const cost = parseFloat(country.Cost);
    const income = parseFloat(country.TagGNI);
    const unter = parseFloat(country.Unterernährung);
    const vergleich = parseFloat(country.Vergleich);

    // original radius calculation
    let rCost = Math.sqrt(gmynd.map(cost, minCost, maxCost, minCostArea, maxCostArea) / Math.PI);
    let rIncome = Math.sqrt(gmynd.map(income, minIncome, maxIncome, minIncomeArea, maxIncomeArea) / Math.PI);
    let rUnter = Math.sqrt(gmynd.map(unter, minUnter, maxUnter, minUnterArea, maxUnterArea) / Math.PI);

    let aCost = gmynd.map(cost, minCost, maxIncome, 0, 250);
    let aIncome = gmynd.map(income, minCost, maxCost, 0, 250);
    // let rUnter = gmynd.map(unter, minUnter, maxUnter, 10, 75);

    // //log
    const logMinIncome = Math.log10(minIncome);
    const logMaxIncome = Math.log10(maxIncome);
    const xBase = gmynd.map(Math.log10(income), logMinIncome, logMaxIncome, margin.left, margin.left + chartWidth);
    const x = xBase + (Math.random() - 0.5) * 0;
    const y = margin.top + Math.random() * chartHeight;

    return {
      country,
      cost: cost,
      income: income,
      ratio: vergleich,
      rCost,
      rIncome,
      rUnter,
      aCost,
      aIncome,
      x,
      y

    };
  });

  // Vermeidung von Überlappungen durch Kraftfeldsimulation
  function simulate(nodes, iterations = 200) {
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        let n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          let n2 = nodes[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let minDist = (n1.rCost + n2.rCost) / 2 + 1;
          if (dist < minDist && dist > 0) {
            let move = (minDist - dist) / 2;
            let mx = (dx / dist) * move;
            let my = (dy / dist) * move;
            // n1.x -= mx;
            // n1.y -= my;
            // // n2.x += mx;
            // n2.y += my;
            // n1.x -= mx;                      // <--- hier auskommentiert
            n1.y -= my * 0.5;                   // <--- hier habe ich den Faktor 0.1 hinzugefügt
            // n2.x += mx;                      // <--- hier auskommentiert
            n2.y += my * 0.5;
          }
        }
        // nicht aus dem Chartbereich heraus
        n1.x = Math.max(margin.left + n1.rCost / 2, Math.min(margin.left + chartWidth - n1.rCost / 2, n1.x));
        n1.y = Math.max(margin.top + n1.rCost / 2, Math.min(margin.top + chartHeight - n1.rCost / 2, n1.y));
      }
    }
  }
  simulate(nodes, 300);


  //  difference
  // const differences = nodes.map(n => Math.abs(n.aIncome - n.aCost));
  // const mindifference = Math.min(...differences);
  // const maxdifference = Math.max(...differences);
  const diffs = nodes.map(n => Math.abs(50-n.ratio));
  const mindiff = Math.min(...diffs);
  const maxdiff = Math.max(...diffs);

  
  // Kreise
  nodes.forEach((node, index) => {
    let diff = Math.abs(node.ratio - 50);
    node.border = gmynd.map(
      // difference,
      // mindifference,
      // maxdifference,
      diff,
      mindiff,
      maxdiff,
      1, 80
    );


    const d = node.country;
    const ratio = parseFloat(d.Vergleich);

    // Group Container
    let group = document.createElement("div");
    group.dataset.rIncome= node.rIncome;
    group.dataset.rCost = node.rCost;
    group.dataset.income= node.income;
    group.dataset.cost = node.cost;
    group.dataset.diff = diff
    group.style.position = "absolute";
    group.style.left = `${node.x}px`;
    group.style.top = `${node.y}px`;
    group.style.transform = "translate(-50%, -50%)";
    group.style.cursor = "pointer";
    group.style.width = `${node.rIncome * 1.1}px`;
    group.style.height = `${node.rIncome * 1.1}px`;

    let incomeCircle, costCircle;
    if (ratio < 50) {
      // income > cost, zeichen income Kreis vor cost Kreis
      incomeCircle = document.createElement("div");
      incomeCircle.className = "overview-circle-green";
      incomeCircle.style.width = incomeCircle.style.height = "0px";
      incomeCircle.style.left = incomeCircle.style.top = "50%";
      incomeCircle.style.transform = "translate(-50%, -50%)";
      incomeCircle.style.border = "0px solid #02947B";
      incomeCircle.style.opacity = "0.5";
      incomeCircle.style.transition = "width 0.6s ease-out, height 0.6s ease-out, border-width 0.6s ease-out";
      group.appendChild(incomeCircle);
    } else {
      // income < cost, zeichen cost Kreis vor income Kreis
      costCircle = document.createElement("div");
      costCircle.className = "overview-circle-pink";
      costCircle.style.width = costCircle.style.height = "0px";
      costCircle.style.left = costCircle.style.top = "50%";
      costCircle.style.transform = "translate(-50%, -50%)";
      costCircle.style.border = "0px solid #FD96B3";
      costCircle.style.opacity = "0.4";
      costCircle.style.transition = "width 0.6s ease-out, height 0.6s ease-out, border-width 0.6s ease-out";
      group.appendChild(costCircle);
    }

    // Unterernährung
    let underCircle = document.createElement("div");
    underCircle.className = "overview-circle-unter";
    underCircle.style.width = underCircle.style.height = "0px";
    underCircle.style.left = underCircle.style.top = "50%";
    underCircle.style.transform = "translate(-50%, -50%)";
    underCircle.style.transition = "width 0.6s ease-out, height 0.6s ease-out";
    group.appendChild(underCircle);

    // tooltip Interaktion
    group.addEventListener("mouseenter", (event) => {
      tooltip.innerHTML = `<b>${d["Country Name"]}</b><br>Income: $${parseFloat(d.TagGNI).toFixed(2)} Intl $/person/day (PPP, constant 2021)<br>Cost: $${parseFloat(d.Cost).toFixed(2)} Intl $/person/day (PPP, constant 2021)<br>Malnutrition: ${parseFloat(d.Unterernährung).toFixed(2)}%<br>Ratio: ${ratio.toFixed(2)}%`;
      tooltip.style.display = "block";
      positionTooltip(event, tooltip);
      if (incomeCircle) incomeCircle.classList.add("hover");
      if (costCircle) costCircle.classList.add("hover");
      if (underCircle) underCircle.classList.add("hover");
    });
    group.addEventListener("mousemove", (event) => {
      positionTooltip(event, tooltip);
    });
    group.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      if (incomeCircle) incomeCircle.classList.remove("hover");
      if (costCircle) costCircle.classList.remove("hover");
      if (underCircle) underCircle.classList.remove("hover");
    });

    document.querySelector("#renderer").appendChild(group);

    // Verzögerung für sanfte Animation
    setTimeout(() => {
      if (incomeCircle) {
        incomeCircle.style.width = incomeCircle.style.height = `${node.rIncome}px`;
        incomeCircle.style.borderWidth = `${node.border}px`;
        //        incomeCircle.style.borderWidth = `${10}px`;
      }
      if (costCircle) {
        costCircle.style.width = costCircle.style.height = `${node.rCost}px`;
        costCircle.style.borderWidth = `${node.border}px`;
        //  costCircle.style.borderWidth = `${10}px`;
      }
      if (underCircle) {
        underCircle.style.width = underCircle.style.height = `${node.rUnter}px`;
      }
    }, index * 0);
  });
}


// ----------- tooltip & boundary adjustment -----------
function positionTooltip(event, tooltip, offsetX = 10, offsetY = 10) {
  const renderer = document.querySelector('#renderer');
  const rendererRect = renderer.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let left = event.clientX + offsetX;
  let top = event.clientY + offsetY;

  if (left + tooltipRect.width > rendererRect.right) {
    left = event.clientX - tooltipRect.width - offsetX;
    if (left < rendererRect.left) left = rendererRect.left;
  }
  if (top + tooltipRect.height > rendererRect.bottom) {
    top = event.clientY - tooltipRect.height - offsetY;
    if (top < rendererRect.top) top = rendererRect.top;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}