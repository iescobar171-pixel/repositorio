// ── CONFIGURACIÓN ──────────────────────────────────────────────
const GITHUB_USER = "iescobar171-pixel";
const GITHUB_REPO = "repositorio";
const BRANCH      = "main";
const RAW_BASE    = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}`;

// ── DATOS ──────────────────────────────────────────────────────
let allFiles   = [];
let activeFilter = "all";

// ── ICONOS ─────────────────────────────────────────────────────
const TYPE_ICON = {
  pdf:   "📄",
  word:  "📝",
  excel: "📊",
  pptx:  "📑",
  other: "📎",
};

const TYPE_LABEL = {
  pdf:   "PDF",
  word:  "Word",
  excel: "Excel",
  pptx:  "PowerPoint",
  other: "Archivo",
};

const SECTION_ICON = "📁";

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadFiles();

  document.getElementById("search").addEventListener("input", render);

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      render();
    });
  });
});

// ── CARGA ──────────────────────────────────────────────────────
async function loadFiles() {
  try {
    const res = await fetch("files.json");
    if (!res.ok) throw new Error("No se pudo cargar files.json");
    const data = await res.json();
    allFiles = data.files;
    updateStats();
    render();
  } catch (e) {
    document.getElementById("content").innerHTML = `
      <div class="empty">
        <div class="empty-icon">❌</div>
        <h3>Error al cargar documentos</h3>
        <p>${e.message}</p>
      </div>`;
  }
}

// ── ESTADÍSTICAS ───────────────────────────────────────────────
function updateStats() {
  const counts = { pdf: 0, word: 0, excel: 0, pptx: 0 };
  allFiles.forEach(f => { if (counts[f.type] !== undefined) counts[f.type]++; });

  document.getElementById("count-total").textContent = `${allFiles.length} documentos`;
  document.getElementById("count-pdf").textContent   = counts.pdf;
  document.getElementById("count-word").textContent  = counts.word;
  document.getElementById("count-excel").textContent = counts.excel;
  document.getElementById("count-pptx").textContent  = counts.pptx;
}

// ── FILTRADO ───────────────────────────────────────────────────
function getFiltered() {
  const q = document.getElementById("search").value.trim().toLowerCase();

  return allFiles.filter(f => {
    const matchType    = activeFilter === "all" || f.type === activeFilter;
    const matchSearch  = !q ||
      f.name.toLowerCase().includes(q) ||
      f.section.toLowerCase().includes(q);
    return matchType && matchSearch;
  });
}

// ── RENDER ─────────────────────────────────────────────────────
function render() {
  const filtered = getFiltered();
  const container = document.getElementById("content");

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <h3>Sin resultados</h3>
        <p>No se encontraron documentos para tu búsqueda.</p>
      </div>`;
    return;
  }

  // Agrupar por sección
  const sections = {};
  filtered.forEach(f => {
    if (!sections[f.section]) sections[f.section] = [];
    sections[f.section].push(f);
  });

  // Orden natural de secciones
  const sectionOrder = Object.keys(sections).sort((a, b) => {
    const numA = parseFloat(a.replace(/[^\d.]/g, "")) || 999;
    const numB = parseFloat(b.replace(/[^\d.]/g, "")) || 999;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, "es");
  });

  container.innerHTML = sectionOrder.map(section => {
    const files = sections[section];
    return `
      <div class="section">
        <div class="section-header">
          <span class="section-icon">${SECTION_ICON}</span>
          <span class="section-title">${section}</span>
          <span class="section-badge">${files.length} doc${files.length !== 1 ? "s" : ""}</span>
        </div>
        <div class="cards-grid">
          ${files.map(f => cardHTML(f)).join("")}
        </div>
      </div>`;
  }).join("");
}

// ── TARJETA ────────────────────────────────────────────────────
function cardHTML(file) {
  const rawUrl   = `${RAW_BASE}/${encodePath(file.path)}`;
  const viewUrl  = viewerUrl(file.type, rawUrl);
  const icon     = TYPE_ICON[file.type]  || TYPE_ICON.other;
  const label    = TYPE_LABEL[file.type] || "Archivo";

  return `
    <div class="card">
      <div class="card-top">
        <div class="card-icon ${file.type}">${icon}</div>
        <div class="card-meta">
          <div class="card-name">${file.name}</div>
          <div class="card-section">${file.section}</div>
        </div>
      </div>
      <span class="type-badge ${file.type}">${label}</span>
      <div class="card-actions">
        <a class="btn btn-view" href="${viewUrl}" target="_blank" rel="noopener">
          👁 Ver
        </a>
        <a class="btn btn-download" href="${rawUrl}" target="_blank" rel="noopener">
          ⬇ Descargar
        </a>
      </div>
    </div>`;
}

// ── VER ARCHIVO ────────────────────────────────────────────────
function viewerUrl(type, rawUrl) {
  if (type === "pdf") return rawUrl;
  // Office Online viewer para Word, Excel, PowerPoint
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(rawUrl)}`;
}

// ── DESCARGAR ARCHIVO ──────────────────────────────────────────
function descargar(url) {
  window.open(url, "_blank");
}

// ── UTILIDADES ─────────────────────────────────────────────────
function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}
