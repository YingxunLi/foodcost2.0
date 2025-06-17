let stageHeight;
let stageWidth;
const margin = { top: 150, right: 80, bottom: 88, left: 80 }; 

// ----------- Checkbox ----------- 
const fields = [
  { key: "Cost", label: "Total Cost" },
  { key: "Fruits", label: "Fruits" },
  { key: "Vegetables", label: "Vegetables" },
  { key: "Starchy Staples", label: "Starchy Staples" },
  { key: "Animal-source Foods", label: "Animal-source Foods" },
  { key: "Nuts", label: "Nuts" },
  { key: "Oils and Fats", label: "Oils and Fats" }
];
let currentField = "Cost";
let currentTopField = "Cost";
let currentPage = "bar"; // "bar" | "afford" | "overview"

const topFields = [
  { key: "Cost", label: "Cost" },
  { key: "TagGNI", label: "Income" },
  { key: "Vergleich", label: "Ratio" }
];

// 新增：记录当前选中的食物类型
let selectedFoodKey = null;

// ----------- top-area ----------- 
function renderTopArea(mode) {
  // mode: "bar" | "afford" | "overview"
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
  topArea.style.display = "flex";
  topArea.style.flexDirection = "column"; // 竖排，主标题在上
  topArea.style.justifyContent = "flex-start";
  topArea.style.alignItems = "flex-start";

  // 主标题
  let mainTitle = document.createElement("div");
  mainTitle.className = "main-title";
  mainTitle.textContent = "Can Everyone Afford to Eat Healthy?";
  topArea.appendChild(mainTitle);

  // 按钮行
  let btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.width = "100%";
  btnRow.style.justifyContent = "space-between";
  btnRow.style.alignItems = "center";

  // 左侧主按钮
  let leftArea = document.createElement("div");
  leftArea.style.display = "flex";
  leftArea.style.gap = "12px";

  // Healthy Diet Cost
  let title = document.createElement("button");
  title.textContent = "Healthy Diet Cost";
  title.classList.add("top-btn", "main");
  if (mode === "bar") title.classList.add("active");
  else title.classList.add("inactive");
  title.onclick = () => switchPage("bar");
  leftArea.appendChild(title);

  // Affordability
  let affordabilityBtn = document.createElement("button");
  affordabilityBtn.textContent = "Affordability";
  affordabilityBtn.classList.add("top-btn", "main", "affordability");
  if (mode === "afford") affordabilityBtn.classList.add("active");
  else affordabilityBtn.classList.add("inactive");
  affordabilityBtn.onclick = () => switchPage("afford");
  leftArea.appendChild(affordabilityBtn);

  // Overview
  let overviewBtn = document.createElement("button");
  overviewBtn.textContent = "Overview";
  overviewBtn.classList.add("top-btn", "main", "overview");
  if (mode === "overview") overviewBtn.classList.add("active");
  else overviewBtn.classList.add("inactive");
  overviewBtn.onclick = () => switchPage("overview");
  leftArea.appendChild(overviewBtn);

  btnRow.appendChild(leftArea);

  // 右侧选项按钮（仅 bar 页显示）
  if (mode === "bar") {
    let topOptions = document.createElement("div");
    topOptions.style.display = "flex";
    topOptions.style.gap = "12px";
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
          // 过渡动画
          if (prevField === "Cost" && currentField === "TagGNI") {
            drawCountryCostChart("costToIncome");
          } else if (prevField === "Cost" && currentField === "Vergleich") {
            drawCountryCostChart("costToRatio");
          } else if (prevField === "TagGNI" && currentField === "Vergleich") {
            drawCountryCostChart("incomeToRatio");
          } else if (prevField === "Vergleich" && currentField === "Cost") {
            drawCountryCostChart("ratioToCost");
          } else if (prevField === "Vergleich" && currentField === "TagGNI") {
            drawCountryCostChart("ratioToIncome");
          } else if (prevField === "TagGNI" && currentField === "Cost") {
            drawCountryCostChart("incomeToCost");
          } else {
            drawCountryCostChart();
          }
        }
      };
      topOptions.appendChild(btn);
    });
    btnRow.appendChild(topOptions);
  }

  // scatter 顶部按钮（仅 afford 页显示）
  if (mode === "afford") {
    const scatterFields = [
      { key: "Vergleich", label: "Ratio" },
      { key: "Percent cannot afford", label: "Unaffordability" },
      { key: "Unterernährung", label: "Malnutrition" }
    ];
    let scatterTop = document.createElement("div");
    scatterTop.style.display = "flex";
    scatterTop.style.gap = "18px";
    scatterTop.style.zIndex = "30";
    scatterTop.id = "scatter-top-btns";
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
      scatterTop.appendChild(btn);
    });
    btnRow.appendChild(scatterTop);
  }

  topArea.appendChild(btnRow);

  // 挂载
  renderer.parentNode.appendChild(topArea);
}

// ----------- 统一页面切换入口 ----------- 
function switchPage(mode) {
  // mode: "bar" | "afford" | "overview"
  currentPage = mode;
  if (mode === "bar") {
    currentField = "Cost";
    currentTopField = "Cost";
    // --- 新增：scatter->bar 动画 ---
    const dots = document.querySelectorAll(".bar-to-dot");
    if (dots.length > 0) {
      // 按 TagGNI 排序，和 bar 顺序一致
      const data = [...jsonData].sort((a, b) => parseFloat(b.TagGNI) - parseFloat(a.TagGNI));
      const chartWidth = stageWidth - margin.left - margin.right;
      const chartHeight = stageHeight - margin.top - margin.bottom;
      const gap = 6;
      const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;
      const maxCost = Math.max(...data.map(d => parseFloat(d["Cost"])));
      // 动画 dot->bar
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
      // 动画结束后再渲染 bar
      setTimeout(() => {
        renderTopArea("bar");
        drawCountryCostChart();
      }, 900);
      return;
    }
    renderTopArea("bar");
    drawCountryCostChart();
  } else if (mode === "afford") {
    // 初始化 scatter 字段
    if (!barToScatterUltraSmoothTransition.currentScatterField) {
      barToScatterUltraSmoothTransition.currentScatterField = "Vergleich";
      barToScatterUltraSmoothTransition.prevRField = "Vergleich";
    }
    renderTopArea("afford");
    barToScatterUltraSmoothTransition();
  } else if (mode === "overview") {
    renderTopArea("overview");
    drawOverviewChart();
  }
}

// ----------- 初始化入口 ----------- 
function init() {
  renderer = document.querySelector('#renderer');
  stageWidth = renderer.clientWidth;
  stageHeight = renderer.clientHeight;
  switchPage("bar");
}

// ----------- 文件末尾添加 -----------
init();

// ----------- healthy diet cost ----------- 
function drawCountryCostChart(transitionMode) {

  let topOptions = document.querySelector("#top-area > div:last-child");
  if (topOptions) topOptions.style.display = "flex";

  document.querySelector("#renderer").innerHTML = "";

  // ----------- 添加底部图例区域 -----------
  // 仅在 currentField === "Cost" 时显示
  if (currentField === "Cost") {
    // 计算颜色透明度
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

    const baseColor = [253, 150, 179];
    const minAlpha = 0.10, maxAlpha = 1;
    const alphas = foodAverages.map((_, i) =>
      minAlpha + (maxAlpha - minAlpha) * (foodAverages.length - 1 - i) / (foodAverages.length - 1)
    );

    // 移除旧的legend
    let oldLegend = document.getElementById("food-legend-area");
    if (oldLegend) oldLegend.remove();

    // 创建legend区域
    const chartWidth = stageWidth - margin.left - margin.right;
    let legendArea = document.createElement("div");
    legendArea.id = "food-legend-area";
    legendArea.style.position = "absolute";
    legendArea.style.left = `${margin.left}px`;
    legendArea.style.top = `${stageHeight - margin.bottom + 20}px`;
    legendArea.style.width = `${chartWidth}px`;
    legendArea.style.display = "flex";
    legendArea.style.flexWrap = "wrap";
    legendArea.style.gap = "24px";
    legendArea.style.alignItems = "center";
    legendArea.style.fontSize = "16px"; // 原复选框字体
    legendArea.style.color = "#6B7C8D"; // 原复选框未选中颜色

    foodAverages.forEach((food, idx) => {
      let item = document.createElement("div");
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.cursor = "pointer";
      // 高亮选中
      if (selectedFoodKey === food.key) {
        item.style.background = "rgba(253,150,179,0.15)";
        item.style.borderRadius = "6px";
        item.style.boxShadow = "0 0 0 2px #FD96B3";
      }
      // 色块
      let colorBox = document.createElement("span");
      colorBox.style.display = "inline-block";
      colorBox.style.width = "22px";
      colorBox.style.height = "22px";
      colorBox.style.marginRight = "8px";
      colorBox.style.borderRadius = "4px";
      colorBox.style.background = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alphas[idx]})`;
      item.appendChild(colorBox);
      // 名称
      let label = document.createElement("span");
      label.textContent = food.key;
      item.appendChild(label);

      // 点击事件
      item.onclick = () => {
        // 再次点击已选中则取消选中
        if (selectedFoodKey === food.key) {
          selectedFoodKey = null;
        } else {
          selectedFoodKey = food.key;
        }
        drawCountryCostChart(); // 重新渲染
      };

      legendArea.appendChild(item);
    });

    renderer.parentNode.appendChild(legendArea);
  } else {
    // 非cost视图时移除legend
    let oldLegend = document.getElementById("food-legend-area");
    if (oldLegend) oldLegend.remove();
    // 退出cost视图时清空选中
    selectedFoodKey = null;
  }

  const data = [...jsonData].sort((a, b) => parseFloat(b.TagGNI) - parseFloat(a.TagGNI));
  const chartWidth = stageWidth - margin.left - margin.right;
  const chartHeight = stageHeight - margin.top - margin.bottom;
  const gap = 6;
  const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;

  let maxCost = Math.max(...data.map(d => parseFloat(d["Cost"])));
  let maxIncome = Math.max(...data.map(d => parseFloat(d["TagGNI"])));
  let maxVergleich = Math.max(...data.map(d => parseFloat(d["Vergleich"])));

  const bars = [];

  // ----------- 堆叠 bar 作为 Cost 视图的唯一表现形式 -----------
  if (currentField === "Cost") {
    // 1. 计算六种食物的平均价格
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
    // 2. 按均价降序排序
    foodAverages.sort((a, b) => b.avg - a.avg);

    // 3. 分配透明度（最高均价最低透明度）
    const baseColor = [253, 150, 179]; // 粉色RGB
    const minAlpha = 0.10, maxAlpha = 1;
    const alphas = foodAverages.map((_, i) =>
      minAlpha + (maxAlpha - minAlpha) * (foodAverages.length - 1 - i) / (foodAverages.length - 1)
    );

    // 4. 绘制每个国家的堆积bar
    let tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    document.body.appendChild(tooltip);

    data.forEach((country, i) => {
      let yStack = margin.top + chartHeight;
      const xPos = margin.left + i * (barWidth + gap);

      // 如果有选中某个食物类型，只渲染灰色底bar和该食物类型的bar
      if (selectedFoodKey) {
        // 1. 灰色底bar（总cost）
        let total = parseFloat(country["Cost"]);
        let totalBarHeight = gmynd.map(total, 0, maxCost, 0, chartHeight);
        let totalBarTop = margin.top + (chartHeight - totalBarHeight);
        let bgBar = document.createElement("div");
        bgBar.className = "bar cost-background";
        bgBar.style.position = "absolute";
        bgBar.style.left = `${xPos}px`;
        bgBar.style.top = `${totalBarTop}px`;
        bgBar.style.width = `${barWidth}px`;
        bgBar.style.height = `${totalBarHeight}px`;
        bgBar.style.background = "#eee";
        bgBar.style.transition = "height 0.5s, top 0.5s";
        document.querySelector("#renderer").appendChild(bgBar);

        // 2. 选中食物类型的bar（粉色）
        let idx = foodAverages.findIndex(f => f.key === selectedFoodKey);
        let value = parseFloat(country[selectedFoodKey]);
        let barHeight = gmynd.map(value, 0, maxCost, 0, chartHeight);
        let barTop = margin.top + (chartHeight - barHeight);
        let seg = document.createElement("div");
        seg.className = "bar food-segment";
        seg.style.position = "absolute";
        seg.style.left = `${xPos}px`;
        seg.style.top = `${barTop}px`;
        seg.style.width = `${barWidth}px`;
        seg.style.height = `${barHeight}px`;
        seg.style.background = `rgba(253,150,179,${alphas[idx]})`;
        seg.style.transition = "height 0.5s, top 0.5s";
        seg.title = `${selectedFoodKey}: $${value.toFixed(2)}`;

        // tooltip
        seg.addEventListener("mouseenter", (event) => {
          tooltip.innerHTML = `
            <b>${country["Country Name"]}</b><br>
            ${selectedFoodKey}: $${value.toFixed(2)}
          `;
          tooltip.style.display = "block";
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;
        });
        seg.addEventListener("mousemove", (event) => {
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;
        });
        seg.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });

        document.querySelector("#renderer").appendChild(seg);
      } else {
        // 没有选中，正常堆叠渲染全部
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
          seg.style.background = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alphas[idx]})`;
          seg.style.transition = "height 0.5s, top 0.5s";
          seg.title = `${food.key}: $${value.toFixed(2)}`;

          // 添加tooltip交互
          seg.addEventListener("mouseenter", (event) => {
            tooltip.innerHTML = `
              <b>${country["Country Name"]}</b><br>
              ${food.key}: $${value.toFixed(2)}
            `;
            tooltip.style.display = "block";
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
          });
          seg.addEventListener("mousemove", (event) => {
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
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

  // cost->income时，cost bar高度过渡
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

  // cost->ratio时，cost bar高度过渡
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
      // 不再设置 backgroundColor
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

  // income->ratio时，income bar过渡到ratio灰色100bar，cost bar过渡到ratio粉色bar
  if (transitionMode === "incomeToRatio") {
    // Zuerst income-Seite rendern: income-Balken (grau) und cost-Balken (rosa), beide mit income-Maximalwert abbilden
    data.forEach((country, i) => {
      const income = parseFloat(country["TagGNI"]);
      const cost = parseFloat(country["Cost"]);
      const vergleich = parseFloat(country["Vergleich"]);
      const barHeightIncome = gmynd.map(income, 0, maxIncome, 0, chartHeight);
      const barHeightCost = gmynd.map(cost, 0, maxIncome, 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);

      // income bar（灰色，目标是 ratio 的 100% bar）
      let barBg = document.createElement("div");
      barBg.classList.add("bar", "ratio-bg");
      barBg.style.width = `${barWidth}px`;
      barBg.style.height = `${barHeightIncome}px`;
      barBg.style.left = `${xPos}px`;
      barBg.style.top = `${margin.top + (chartHeight - barHeightIncome)}px`;
      barBg.style.position = "absolute";
      barBg.style.transition = "height 0.5s, top 0.5s";
      // 不再设置背景Color
      document.querySelector("#renderer").appendChild(barBg);
      bars.push(barBg);

      // cost bar（粉色，目标是 ratio 的 vergleich bar）
      let pinkBar = document.createElement("div");
      pinkBar.classList.add("bar", "ratio-fg");
      pinkBar.style.width = `${barWidth}px`;
      pinkBar.style.height = `${barHeightCost}px`;
      pinkBar.style.left = `${xPos}px`;
      pinkBar.style.top = `${margin.top + (chartHeight - barHeightCost)}px`;
      pinkBar.style.position = "absolute";
      pinkBar.style.transition = "height 0.5s, top 0.5s";
      // 不再设置背景Color
      document.querySelector("#renderer").appendChild(pinkBar);
      bars.push(pinkBar);
    });

    // Erzwinge Reflow
    void document.querySelector("#renderer").offsetHeight;

    // income bar 过渡到 ratio 的 100% bar，cost bar 过渡到 ratio 的 vergleich bar
    data.forEach((country, i) => {
      // 灰色底bar
      const barHeightBg = gmynd.map(100, 0, maxVergleich, 0, chartHeight);
      const yPosBg = margin.top + (chartHeight - barHeightBg);
      const barBg = bars[i * 2];
      barBg.style.height = `${barHeightBg}px`;
      barBg.style.top = `${yPosBg}px`;

      // 粉色bar
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

  // ratio->income时，灰色100bar过渡到income bar，粉色bar过渡到cost bar（以income最大值映射）
  if (transitionMode === "ratioToIncome") {
    data.forEach((country, i) => {
      const vergleich = parseFloat(country["Vergleich"]);
      const barHeightGray = gmynd.map(100, 0, maxVergleich, 0, chartHeight);
      const barHeightPink = gmynd.map(vergleich, 0, maxVergleich, 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);

      // 灰色底bar
      let barBg = document.createElement("div");
      barBg.classList.add("bar", "ratio-bg");
      barBg.style.width = `${barWidth}px`;
      barBg.style.height = `${barHeightGray}px`;
      barBg.style.left = `${xPos}px`;
      barBg.style.top = `${margin.top + (chartHeight - barHeightGray)}px`;
      barBg.style.position = "absolute";
      barBg.style.transition = "height 0.5s, top 0.5s";
      // 不再设置背景Color
      document.querySelector("#renderer").appendChild(barBg);
      bars.push(barBg);

      // 粉色bar
      let pinkBar = document.createElement("div");
      pinkBar.classList.add("bar", "ratio-fg");
      pinkBar.style.width = `${barWidth}px`;
      pinkBar.style.height = `${barHeightPink}px`;
      pinkBar.style.left = `${xPos}px`;
      pinkBar.style.top = `${margin.top + (chartHeight - barHeightPink)}px`;
      pinkBar.style.position = "absolute";
      pinkBar.style.transition = "height 0.5s, top 0.5s";
      // 不再设置背景Color
      document.querySelector("#renderer").appendChild(pinkBar);
      bars.push(pinkBar);
    });

    // Erzwinge Reflow
    void document.querySelector("#renderer").offsetHeight;

    // 灰色bar过渡到income bar，粉色bar过渡到cost bar（以income最大值映射）
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

  // ...existing code for data.forEach...
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
        tooltip.innerText = `${country["Country Name"]}: Income $${income.toFixed(2)}`;
        tooltip.style.display = "block";
        const barRect = barIncome.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
        barIncome.classList.add('active');
      });
      barIncome.addEventListener('mousemove', () => {
        const barRect = barIncome.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
      });
      barIncome.addEventListener('mouseleave', () => {
        tooltip.style.display = "none";
        barIncome.classList.remove('active');
      });

      // Interaktion: cost
      barCost.addEventListener('mouseenter', () => {
        tooltip.innerText = `${country["Country Name"]}: Cost $${cost}`;
        tooltip.style.display = "block";
        const barRect = barCost.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
        barCost.classList.add('active');
      });
      barCost.addEventListener('mousemove', () => {
        const barRect = barCost.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
      });
      barCost.addEventListener('mouseleave', () => {
        tooltip.style.display = "none";
        barCost.classList.remove('active');
      });

      document.querySelector("#renderer").appendChild(barIncome);
      document.querySelector("#renderer").appendChild(barCost);
      bars.push(barIncome, barCost);
    } else if (["Cost", "Vergleich"].includes(currentField)) {
      // Ratio-Seite: zuerst grauer背景balken (100%), 然后 rosa Balken (tatsächliches Verhältnis)
      if (currentField === "Vergleich") {
        // Grauer Hintergrundbalken (100%)
        let barBg = document.createElement("div");
        barBg.classList.add("bar", "ratio-bg");
        barBg.style.width = `${barWidth}px`;
        barBg.style.height = `${gmynd.map(100, 0, maxVergleich, 0, chartHeight)}px`;
        barBg.style.left = `${xPos}px`;
        barBg.style.top = `${margin.top + (chartHeight - gmynd.map(100, 0, maxVergleich, 0, chartHeight))}px`;
        barBg.style.position = "absolute";
        // 不再设置背景Color
        document.querySelector("#renderer").appendChild(barBg);
      }

      // Rosa Balken
      let bar = document.createElement("div");
      bar.classList.add("bar");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;
      bar.style.position = "absolute";
      // 不再设置 backgroundColor、borderRadius、zIndex
      bar.dataset.baseColor = "#FED5E1";
      bar.dataset.activeColor = "#FD96B3";

      bar.addEventListener('mouseenter', () => {
        let val = fieldValue;
        if (currentField === "Cost") val = `$${fieldValue}`;
        if (currentField === "Vergleich") val = `${fieldValue.toFixed(1)}%`;
        tooltip.innerText = `${country["Country Name"]}: ${val}`;
        tooltip.style.display = "block";
        const barRect = bar.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;

        // 只高亮当前 bar
        bars.forEach(b => b.classList.remove('active'));
        bar.classList.add('active');
      });
      bar.addEventListener('mousemove', () => {
        const barRect = bar.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
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
      // cost-Balken（灰色/半透明，底层）
      let costBar = document.createElement("div");
      costBar.classList.add("bar", "cost-background");
      costBar.style.width = `${barWidth}px`;
      const costBarHeight = gmynd.map(cost, 0, maxCost, 0, chartHeight);
      costBar.style.height = `${costBarHeight}px`;
      costBar.style.left = `${xPos}px`;
      costBar.style.top = `${margin.top + (chartHeight - costBarHeight)}px`;
      costBar.style.position = "absolute";
      document.querySelector("#renderer").appendChild(costBar);

      // 普通粉色bar（顶层）
      let bar = document.createElement("div");
      bar.classList.add("bar");
      bar.style.width = `${barWidth}px`;
      bar.style.height = `${barHeight}px`;
      bar.style.left = `${xPos}px`;
      bar.style.top = `${yPos}px`;
      bar.style.position = "absolute";
      // 不再设置背景颜色、圆角、层级
      bar.dataset.baseColor = "#FED5E1";
      bar.dataset.activeColor = "#FD96B3";

      bar.addEventListener('mouseenter', () => {
        tooltip.innerText = `${country["Country Name"]}: ${cost}`;
        tooltip.style.display = "block";
        const barRect = bar.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;

        bar.classList.add('active');
      });
      bar.addEventListener('mousemove', () => {
        const barRect = bar.getBoundingClientRect();
        tooltip.style.left = `${barRect.right + 10}px`;
        tooltip.style.top = `${barRect.top}px`;
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

// ----------- Affordability ----------- 
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
  scatterTop.style.display = "flex";
  scatterTop.style.gap = "18px";
  scatterTop.style.zIndex = "30";
  scatterTop.id = "scatter-top-btns";

  // drei Schaltflächen erstellen
  scatterFields.forEach(f => {
    let btn = document.createElement("button");
    btn.textContent = f.label;
    btn.classList.add("top-btn");
    if (f.key === currentScatterField) btn.classList.add("active");
    btn.addEventListener("mouseenter", () => btn.classList.add("active"));
    btn.addEventListener("mouseleave", () => {
      if (barToScatterUltraSmoothTransition.currentScatterField !== f.key) btn.classList.remove("active");
    });

    btn.addEventListener("click", () => {
      barToScatterUltraSmoothTransition.prevRField = barToScatterUltraSmoothTransition.currentScatterField;
      barToScatterUltraSmoothTransition.currentScatterField = f.key;
      Array.from(scatterTop.children).forEach((b, idx) => {
        if (scatterFields[idx].key === f.key) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });
      barToScatterUltraSmoothTransition.hasEnteredScatter = true;
      barToScatterUltraSmoothTransition();
    });
    scatterTop.appendChild(btn);
  });

  // old area entfernen
  let oldScatterTop = document.getElementById("scatter-top-btns");
  if (oldScatterTop) oldScatterTop.remove();
  document.querySelector("#top-area").appendChild(scatterTop);

  // Daten vorbereiten
  const data = [...jsonData].sort((a, b) => parseFloat(b.TagGNI) - parseFloat(a.TagGNI));
  const chartWidth = stageWidth - margin.left - margin.right;
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

// X轴刻度点和数字
const xTicks = 5;
for (let i = 0; i <= xTicks; i++) {
  const t = i / xTicks;
  // 对数轴
  const logMinX = Math.log10(minX);
  const logMaxX = Math.log10(maxX);
  const logVal = logMinX + t * (logMaxX - logMinX);
  const val = Math.pow(10, logVal);
  const x = gmynd.map(logVal, logMinX, logMaxX, 0, chartWidth);

  // 刻度点
  let tick = document.createElement("div");
  tick.style.position = "absolute";
  tick.style.left = `${margin.left + x - 3}px`;
  tick.style.top = `${margin.top + chartHeight - 3 + 2}px`;
  tick.style.width = "6px";
  tick.style.height = "6px";
  tick.style.borderRadius = "50%";
  tick.style.background = "#bbb";
  tick.style.display = "none";
  tick.className = "axis-x-tick";
  document.querySelector("#renderer").appendChild(tick);

  // 刻度数字
  let label = document.createElement("div");
  label.style.position = "absolute";
  label.style.left = `${margin.left + x - 15}px`;
  label.style.top = `${margin.top + chartHeight + 10}px`;
  label.style.color = "#6B7C8D";
  label.style.fontSize = "12px";
  label.style.display = "none";
  label.className = "axis-x-tick-label";
  label.textContent = val >= 1000 ? Math.round(val) : val.toFixed(1);
  document.querySelector("#renderer").appendChild(label);
}

// Y轴刻度点和数字
const yTicks = 5;
for (let i = 0; i <= yTicks; i++) {
  const t = i / yTicks;
  // 对数轴
  const logMinY = Math.log10(minY);
  const logMaxY = Math.log10(maxY);
  const logVal = logMinY + t * (logMaxY - logMinY);
  const val = Math.pow(10, logVal);
  const y = gmynd.map(logVal, logMinY, logMaxY, chartHeight, 0);

  // 刻度点
  let tick = document.createElement("div");
  tick.style.position = "absolute";
  tick.style.left = `${margin.left - 6}px`;
  tick.style.top = `${margin.top + y - 3}px`;
  tick.style.width = "6px";
  tick.style.height = "6px";
  tick.style.borderRadius = "50%";
  tick.style.background = "#bbb";
  tick.style.display = "none";
  tick.className = "axis-y-tick";
  document.querySelector("#renderer").appendChild(tick);

  // 刻度数字
  let label = document.createElement("div");
  label.style.position = "absolute";
  label.style.left = `${margin.left - 45}px`;
  label.style.top = `${margin.top + y - 8}px`;
  label.style.color = "#6B7C8D";
  label.style.fontSize = "12px";
  label.style.display = "none";
  label.className = "axis-y-tick-label";
  label.textContent = val >= 1000 ? Math.round(val) : val.toFixed(1);
  document.querySelector("#renderer").appendChild(label);
}

  // tooltip
  let tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  document.body.appendChild(tooltip);

  // 只在第一次 bar->scatter 时执行动画，后续切换仅变大小
  if (!barToScatterUltraSmoothTransition.hasEnteredScatter) {
    // 先画bar，后变成dot
    let barDots = [];
    let startStates = [];
    let endStates = [];
    data.forEach((country, i) => {
      const cost = parseFloat(country["Cost"]);
      const barHeight = gmynd.map(cost, 0, Math.max(...data.map(d => parseFloat(d["Cost"]))), 0, chartHeight);
      const xPos = margin.left + i * (barWidth + gap);
      const yPos = margin.top + (chartHeight - barHeight);

      // 目标位置和大小
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
      bar.style.position = "absolute";
      bar.style.cursor = "pointer";
      bar.style.transition = "width 0.9s cubic-bezier(0.4, 0, 0.2, 1), height 0.9s cubic-bezier(0.4, 0, 0.2, 1), left 0.9s cubic-bezier(0.4, 0, 0.2, 1), top 0.9s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.9s cubic-bezier(0.4, 0, 0.2, 1)";
      document.querySelector("#renderer").appendChild(bar);
      barDots.push(bar);

      // 记录起始和目标状态
      bar.style.transition = "none";
      void bar.offsetHeight;  // 强制reflow
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
        left: margin.left + x - r / 2,
        top: margin.top + y - r / 2,
        borderRadius: r
      });
    });

    // 绑定交互
    data.forEach((country, i) => {
      let bar = barDots[i];
      bar.onmouseenter = () => {
  document.querySelectorAll(".axis-x-tick").forEach(e => e.style.display = "");
  document.querySelectorAll(".axis-x-tick-label").forEach(e => e.style.display = "");
  document.querySelectorAll(".axis-y-tick").forEach(e => e.style.display = "");
  document.querySelectorAll(".axis-y-tick-label").forEach(e => e.style.display = "");

        bar.classList.add("active");
        let rLabel = "";
        if (rField === "Vergleich") rLabel = `Ratio: ${country["Vergleich"]}%`;
        else if (rField === "Percent cannot afford") rLabel = `Unaffordability: ${country["Percent cannot afford"]}%`;
        else if (rField === "Unterernährung") rLabel = `Malnutrition: ${country["Unterernährung"]}%`;
        tooltip.innerText = `${country["Country Name"]}\nIncome: $${country["TagGNI"]}\nCost: $${country["Cost"]}\n${rLabel}`;
        tooltip.style.display = "block";
        tooltip.style.left = `${bar.getBoundingClientRect().right + 10}px`;
        tooltip.style.top = `${bar.getBoundingClientRect().top}px`;
      };
      bar.onmousemove = () => {
        tooltip.style.left = `${bar.getBoundingClientRect().right + 10}px`;
        tooltip.style.top = `${bar.getBoundingClientRect().top}px`;
      };
      bar.onmouseleave = () => {
  document.querySelectorAll(".axis-x-tick").forEach(e => e.style.display = "none");
  document.querySelectorAll(".axis-x-tick-label").forEach(e => e.style.display = "none");
  document.querySelectorAll(".axis-y-tick").forEach(e => e.style.display = "none");
  document.querySelectorAll(".axis-y-tick-label").forEach(e => e.style.display = "none");

        bar.classList.remove("active");
        tooltip.style.display = "none";
      };
    });

    // 强制reflow
    void document.querySelector("#renderer").offsetHeight;

    // 设置目标状态，触发动画
    barDots.forEach((bar, i) => {
      const e = endStates[i];
      bar.style.width = `${e.width}px`;
      bar.style.height = `${e.height}px`;
      bar.style.left = `${e.left}px`;
      bar.style.top = `${e.top}px`;
      bar.style.borderRadius = `${e.borderRadius}px`;
    });

    // 标记已进入scatter
    barToScatterUltraSmoothTransition.hasEnteredScatter = true;
    return;
  }

  // 已在scatter页面，切换字段时，仅变大小
  const existingDots = document.querySelectorAll(".bar-to-dot");

  // 重新绘制所有散点，带动画，仅变大小
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

    // 上一次的半径
    const prevR = gmynd.map(parseFloat(country[prevRField]), prevMinR, prevMaxR, 20, 160);
    // 目标半径
    const r = gmynd.map(parseFloat(country[rField]), minR, maxR, 20, 160);

    let dot = document.createElement("div");
    dot.classList.add("bar", "bar-to-dot");
    dot.style.position = "absolute";
    dot.style.left = `${margin.left + x - prevR / 2}px`;
    dot.style.top = `${margin.top + y - prevR / 2}px`;
    dot.style.width = `${prevR}px`;
    dot.style.height = `${prevR}px`;
    dot.style.cursor = "pointer";
    dot.style.borderRadius = `50%`;
    dot.style.transition = "width 0.6s cubic-bezier(0.4, 0, 0.2, 1), height 0.6s cubic-bezier(0.4, 0, 0.2, 1), left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    document.querySelector("#renderer").appendChild(dot);
    dots.push({ dot, x, y, prevR, r });
  });

  // 绑定交互
  data.forEach((country, i) => {
    let bar = dots[i].dot;
    bar.onmouseenter = () => {
      bar.style.opacity = "1";
      let rLabel = "";
      if (rField === "Vergleich") rLabel = `Ratio: ${country["Vergleich"]}%`;
      else if (rField === "Percent cannot afford") rLabel = `Unaffordability: ${country["Percent cannot afford"]}%`;
      else if (rField === "Unterernährung") rLabel = `Malnutrition: ${country["Unterernährung"]}%`;
      tooltip.innerText = `${country["Country Name"]}\nIncome: $${country["TagGNI"]}\nCost: $${country["Cost"]}\n${rLabel}`;
      tooltip.style.display = "block";
      tooltip.style.left = `${bar.getBoundingClientRect().right + 10}px`;
      tooltip.style.top = `${bar.getBoundingClientRect().top}px`;
    };
    bar.onmousemove = () => {
      tooltip.style.left = `${bar.getBoundingClientRect().right + 10}px`;
      tooltip.style.top = `${bar.getBoundingClientRect().top}px`;
    };
    bar.onmouseleave = () => {
      bar.style.opacity = "0.8";
      tooltip.style.display = "none";
    };
  });

  // 强制reflow
  void document.querySelector("#renderer").offsetHeight;

  // 更新目标尺寸
  dots.forEach(({ dot, x, y, r }) => {
    dot.style.width = `${r}px`;
    dot.style.height = `${r}px`;
    dot.style.left = `${margin.left + x - r / 2}px`;
    dot.style.top = `${margin.top + y - r / 2}px`;
  });

  // 记录字段
  if (barToScatterUltraSmoothTransition.prevRField !== rField) {
    barToScatterUltraSmoothTransition.prevRField = rField;
  }
}


// ----------- Overview Chart ----------- 
function drawOverviewChart() {
  document.querySelector("#renderer").innerHTML = "";
    
  // unter weg
  let oldLegend = document.getElementById("food-legend-area");
  if (oldLegend) oldLegend.remove();


  const chartWidth = stageWidth - margin.left - margin.right;
  const chartHeight = stageHeight - margin.top - margin.bottom;

  // Daten & Bereich
  const data = [...jsonData].sort((a, b) => parseFloat(b.TagGNI) - parseFloat(a.TagGNI));
  const minCost = Math.min(...data.map(d => parseFloat(d["Cost"])));
  const maxCost = Math.max(...data.map(d => parseFloat(d["Cost"])));
  const minIncome = Math.min(...data.map(d => parseFloat(d["TagGNI"])));
  const maxIncome = Math.max(...data.map(d => parseFloat(d["TagGNI"])));
  const minUnter = Math.min(...data.map(d => parseFloat(d["Unterernährung"])));
  const maxUnter = Math.max(...data.map(d => parseFloat(d["Unterernährung"])));

  const minCostArea = Math.PI * 80 * 80;
  const maxCostArea = Math.PI * 200 * 200;
  const minIncomeArea = Math.PI * 80 * 80;
  const maxIncomeArea = Math.PI * 200 * 200;
  const minUnterArea = Math.PI * 10 * 10;
  const maxUnterArea = Math.PI * 60 * 60;

  // Position
  const nodes = data.map((country, i) => {
    const cost = parseFloat(country.Cost);
    const income = parseFloat(country.TagGNI);
    const unter = parseFloat(country.Unterernährung);

    // const difference = income - cost;
    // const mindifference = Math.min(...data.map(d => parseFloat(d.TagGNI) - parseFloat(d.Cost)));
    // const maxdifference = Math.max(...data.map(d => parseFloat(d.TagGNI) - parseFloat(d.Cost)));


    // original radius calculation
    let rCost = Math.sqrt(gmynd.map(cost, minCost, maxCost, minCostArea, maxCostArea) / Math.PI);
    let rIncome = Math.sqrt(gmynd.map(income, minIncome, maxIncome, minIncomeArea, maxIncomeArea) / Math.PI);
    let rUnter = Math.sqrt(gmynd.map(unter, minUnter, maxUnter, minUnterArea, maxUnterArea) / Math.PI);

    // garantieren, dass der Bodenkreis größer ist
    // if (ratio > 50 && rCost <= rIncome) {
    //   [rCost, rIncome] = [Math.max(rCost, rIncome + 8), Math.min(rCost - 8, rIncome)];
    // } else if (ratio < 50 && rIncome <= rCost) {
    //   [rIncome, rCost] = [Math.max(rIncome, rCost + 8), Math.min(rIncome - 8, rCost)];
    // } 

    // //log
    const logMinIncome = Math.log10(minIncome);
    const logMaxIncome = Math.log10(maxIncome);
    const xBase = gmynd.map(Math.log10(income), logMinIncome, logMaxIncome, margin.left, margin.left + chartWidth);
    const x = xBase + (Math.random() - 0.5) * 40; 
    const y = margin.top + Math.random() * chartHeight;

    return {
      country,
      rCost,
      rIncome,
      rUnter,
      x,
      y
      
      //falls random:
      //x: margin.left + Math.random() * chartWidth,
      //y: margin.top + Math.random() * chartHeight
    };
  });

  // 统一计算 difference
const differences = nodes.map(n => Math.abs(n.rIncome - n.rCost));
const mindifference = Math.min(...differences);
const maxdifference = Math.max(...differences);


  // Vermeidung von Überlappungen durch Kraftfeldsimulation
  function simulate(nodes, iterations = 300) {
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        let n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          let n2 = nodes[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          let minDist = (n1.rCost + n2.rCost) / 2 + 8;
          if (dist < minDist && dist > 0) {
            let move = (minDist - dist) / 2;
            let mx = (dx / dist) * move;
            let my = (dy / dist) * move;
            n1.x -= mx;
            n1.y -= my;
            n2.x += mx;
            n2.y += my;
          }
        }
        // nicht aus dem Chartbereich heraus
        n1.x = Math.max(margin.left + n1.rCost / 2, Math.min(margin.left + chartWidth - n1.rCost / 2, n1.x));
        n1.y = Math.max(margin.top + n1.rCost / 2, Math.min(margin.top + chartHeight - n1.rCost / 2, n1.y));
      }
    }
  }
  simulate(nodes, 300);

  // tooltip
  let tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  document.body.appendChild(tooltip);

  // Kreise
  nodes.forEach(node => {
    let difference = Math.abs(node.rIncome - node.rCost);
    node.border = gmynd.map(
    Math.sqrt(Math.max(0, difference)),
    Math.sqrt(Math.max(0, mindifference)),
    Math.sqrt(Math.max(0, maxdifference)),
    5, 50
  );

  const d = node.country;
  const ratio = parseFloat(d.Vergleich);

  // Group Container
  let group = document.createElement("div");
  group.style.position = "absolute";
  group.style.left = `${node.x}px`;
  group.style.top = `${node.y}px`;
  group.style.transform = "translate(-50%, -50%)";
  group.style.cursor = "pointer";
    group.style.width = `${node.rIncome * 1.1}px`;
    group.style.height = `${node.rIncome * 1.1}px`;

    if (ratio < 50) {
      // income > cost, zeichen income Kreis vor cost Kreis
      let incomeCircle = document.createElement("div");
      incomeCircle.className = "overview-circle-green";
      incomeCircle.style.width = incomeCircle.style.height = `${node.rIncome}px`;
      incomeCircle.style.left = incomeCircle.style.top = "50%";
      incomeCircle.style.transform = "translate(-50%, -50%)";
      incomeCircle.style.border = `${node.border}px solid #02947B`;
      incomeCircle.style.opacity = "0.5";
      group.appendChild(incomeCircle);
    } else {
      // income < cost, zeichen cost Kreis vor income Kreis
      let costCircle = document.createElement("div");
      costCircle.className = "overview-circle-pink";
      costCircle.style.width = costCircle.style.height = `${node.rCost}px`;
      costCircle.style.left = costCircle.style.top = "50%";
      costCircle.style.transform = "translate(-50%, -50%)";
      costCircle.style.border = `${node.border}px solid #FD96B3`;
      costCircle.style.opacity = "0.4";
      group.appendChild(costCircle);
    }

    // Unterernährung
    let underCircle = document.createElement("div");
    underCircle.className = "overview-circle-unter";
    underCircle.style.width = underCircle.style.height = `${node.rUnter}px`;
    underCircle.style.left = underCircle.style.top = "50%";
    underCircle.style.transform = "translate(-50%, -50%)";
    group.appendChild(underCircle);

    // tooltip Interaktion
    group.addEventListener("mouseenter", (event) => {
      tooltip.innerHTML = `${d["Country Name"]}<br>Income (GNI): ${d.TagGNI}<br>Cost: ${d.Cost}<br>Undernourishment: ${d.Unterernährung}<br>Ratio: ${ratio.toFixed(1)}%`;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX + 15}px`;
      tooltip.style.top = `${event.clientY + 15}px`;
    });
    group.addEventListener("mousemove", (event) => {
      tooltip.style.left = `${event.clientX + 15}px`;
      tooltip.style.top = `${event.clientY + 15}px`;
    });
    group.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    document.querySelector("#renderer").appendChild(group);
  });
}