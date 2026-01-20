const dataUrl = window.DATA_URL || "./assets/src/data/clubs.json";

let clubs = [];
let filteredClubs = [];
let mapBound = false;

/* =========================
   CARREGAR JSON
========================= */
if (!dataUrl) {
  console.error("DATA_URL não definida. Verifique o index.html");
} else {
  fetch(dataUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Arquivo JSON não encontrado");
      return res.json();
    })
    .then((data) => {
      clubs = data;
      filteredClubs = [...clubs];
      renderClubs(filteredClubs);
    })
    .catch((err) => console.error("Erro ao carregar JSON:", err));
}

/* =========================
   FILTRO POR ESTADO (MAPA)
========================= */
function selectState(uf, stateName) {
  document.getElementById("stateTitle").innerText = stateName;

  const list = document.getElementById("stateClubList");
  list.innerHTML = "";

  const clubsByState = clubs
    .filter((c) => c.state === uf)
    .sort((a, b) => a.short_name.localeCompare(b.short_name));

  if (!clubsByState.length) {
    list.innerHTML = `
      <li class="list-group-item text-muted">
        Nenhum clube encontrado
      </li>`;
    return;
  }

  clubsByState.forEach((club, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action";
    li.innerText = club.short_name;

    li.addEventListener("click", () => {
      filteredClubs = clubsByState;
      openModal(index);
    });

    list.appendChild(li);
  });
}

/* =========================
   MAPA
========================= */
function renderMapView() {
  document.getElementById("mapContainer")?.classList.remove("d-none");
  document.getElementById("clubsContainer")?.classList.add("d-none");

  const svgObject = document.getElementById("brazilMap");

  const bindMap = () => {
    const svg = svgObject.contentDocument;
    if (!svg || mapBound) return;

    svg.querySelectorAll("a, path").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();

        const link = el.closest("a");
        const title =
          link?.querySelector("title")?.textContent ||
          el.querySelector("title")?.textContent;

        if (!title) return;

        const uf = title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .slice(0, 2)
          .toUpperCase();

        svg
          .querySelectorAll(".active")
          .forEach((n) => n.classList.remove("active"));

        (link || el).classList.add("active");

        selectState(uf, title);
      });
    });

    mapBound = true;
  };

  if (svgObject.contentDocument) {
    bindMap();
  } else {
    svgObject.addEventListener("load", bindMap, { once: true });
  }
}

/* =========================
   RENDERIZAÇÃO
========================= */
function renderClubs(list, mode = "grid") {
  const container = document.getElementById("clubsContainer");
  if (!container) return;

  container.innerHTML = "";
  container.className = "";

  /* ===== GRID PADRÃO ===== */
  if (mode !== "timeline") {
    container.className = "row g-3";

    list.forEach((club) => {
      const logo = club.slug + club.typeSlug;
      const badgeClass =
        club.status === "active" ? "badge-active" : "badge-inactive";

      container.innerHTML += `
        <div class="col-sm-6 col-md-4 col-lg-3">
          <div class="card card-club h-100" data-slug="${club.slug}">
            <div class="card-body text-center">
              <img src="./assets/imgs/escudos/${logo}" style="max-height:80px"
                   onerror="./assets/imgs/escudos/placeholder.png">
              <h5>${club.short_name}</h5>
              <p>${club.city} - ${club.state}</p>
              <span class="badge ${badgeClass}">${club.status}</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  /* ===== TIMELINE NORMAL ===== */
  if (mode === "timeline") {
    container.className = "timeline";

    const known = {};
    const unknown = [];

    list.forEach((club) => {
      if (club.founded) {
        if (!known[club.founded]) known[club.founded] = [];
        known[club.founded].push(club);
      } else {
        unknown.push(club);
      }
    });

    Object.keys(known)
      .sort((a, b) => b - a)
      .forEach((year) => {
        container.innerHTML += `
          <div class="timeline-year">
            <div class="year-title">${year}</div>
            <div class="club-list">
              ${known[year]
                .sort((a, b) => a.short_name.localeCompare(b.short_name))
                .map((club) => {
                  const logo = club.slug + club.typeSlug;

                  return `
                    <div class="club-item card-club d-flex align-items-center gap-3"
                        data-slug="${club.slug}">
                      <img
                        src="./assets/imgs/escudos/${logo}"
                        alt="Escudo ${club.short_name}"
                        style="height:40px;width:40px;object-fit:contain"
                        onerror="./assets/imgs/escudos/placeholder.png">

                      <div>
                        <strong>${club.short_name}</strong>
                        <div class="club-city">
                          ${club.city} (${club.state})
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        `;
      });

    if (unknown.length) {
      container.innerHTML += `
        <div class="timeline-year">
          <div class="year-title">
            Ano de fundação desconhecido (${unknown.length})
          </div>
          <div class="club-list">
            ${unknown
              .sort((a, b) => a.short_name.localeCompare(b.short_name))
              .map((club) => {
                const logo = club.slug + club.typeSlug;

                return `
                  <div class="club-item card-club"
                      data-slug="${club.slug}">
                      <img
                        src="./assets/imgs/escudos/${logo}"
                        alt="Escudo ${club.short_name}"
                        style="height:40px;width:40px;object-fit:contain"
                        onerror="./assets/imgs/escudos/placeholder.png">
                    <strong>${club.short_name}</strong>
                    <div class="club-city">
                      ${club.city} (${club.state})
                    </div>
                  </div>
              `;
              })
              .join("")}
          </div>
        </div>
      `;
    }
  }

  document.querySelectorAll(".card-club").forEach((card) => {
    card.addEventListener("click", () => {
      openModalBySlug(card.dataset.slug);
    });
  });
}

/* =========================
   MODAL
========================= */
function openModal(index) {
  const club = filteredClubs[index];
  if (!club) return;
  openModalBySlug(club.slug);
}

function openModalBySlug(slug) {
  const club = clubs.find((c) => c.slug === slug);
  if (!club) return;

  document.getElementById("modalTitle").innerText = club.full_name;

  const logo = club.slug + club.typeSlug;

  const anthem = club.anthem
    ? `
      <div class="mt-3">
        <h6>🎵 Hino</h6>
        <p class="mb-1"><strong>${club.anthem.title}</strong></p>
        <a href="${club.anthem.lyrics_url}" target="_blank" class="btn btn-sm btn-outline-primary">
          📄 Ver letra
        </a>
        ${
          club.anthem.audio_url
            ? `<div class="mt-2"><audio controls src="${club.anthem.audio_url}"></audio></div>`
            : ""
        }
      </div>
    `
    : `<p><strong>Hino:</strong> Não disponível</p>`;

  document.getElementById("modalBody").innerHTML = `
    <div class="container-fluid">
      <div class="row g-4">

        <!-- COLUNA ESQUERDA -->
        <div class="col-md-4 text-center">
          <img src="./assets/imgs/escudos/${logo}"
              alt="Escudo ${club.short_name}"
              class="img-fluid mb-3"
              style="max-height:120px"
              onerror="./assets/imgs/escudos/placeholder.png">
          <span class="badge ${
            club.status === "active" ? "bg-success" : "bg-danger"
          } mb-3">
            ${club.status}
          </span>

          <div class="mt-3">
            <a href="https://pt.wikipedia.org/wiki/${club.wikipedia_page}"
              target="_blank"
              class="btn btn-sm btn-outline-secondary w-100 mb-2">
              🌐 Wikipedia
            </a>

            ${
              club.site
                ? `
              <a href="https://${club.site}"
                target="_blank"
                class="btn btn-sm btn-outline-primary w-100 mb-2">
                🌐 Site oficial
              </a>
            `
                : ""
            }
          </div>

          <!-- FUNDAÇÃO ABAIXO DOS LINKS -->
          <div class="mt-3">
            <p class="mb-1">🔰 <strong>Fundação</strong></p>
            <p class="fs-5">${club.founded ?? "Não informado"}</p>
          </div>
        </div>

        <!-- COLUNA DIREITA -->
        <div class="col-md-8">

          <div class="mb-3">
            <p class="mb-1">📍 <strong>Cidade</strong></p>
            <p>${club.city} - ${club.state}</p>
          </div>

          ${
            club.uniforme
              ? `
            <h6 class="mb-3">👕 Uniformes</h6>
            <div class="d-flex gap-4 flex-wrap justify-content-start mb-3">
              <iframe
                style="height:200px;width:100%;border:none"
                src="./assets/imgs/uniformes/${club.uniforme}.html"
                title="Uniformes do ${club.short_name}">
              </iframe>
            </div>
          `
              : ""
          }

          ${anthem}

        </div>
      </div>
    </div>
  `;

  new bootstrap.Modal(document.getElementById("clubModal")).show();
}

/* =========================
   BUSCA
========================= */
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  filteredClubs = clubs.filter((c) =>
    c.short_name.toLowerCase().includes(value),
  );
  renderClubs(filteredClubs);
});

/* =========================
   ORDENAÇÃO
========================= */
document.querySelectorAll("[data-sort]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.sort;

    document.getElementById("mapContainer")?.classList.add("d-none");
    document.getElementById("clubsContainer")?.classList.remove("d-none");

    if (type === "state") {
      renderMapView();
      return;
    }

    if (type === "founded") {
      renderClubs(filteredClubs, "timeline");
      return;
    }

    filteredClubs.sort((a, b) =>
      a[type]?.toString().localeCompare(b[type]?.toString()),
    );

    renderClubs(filteredClubs);
  });
});
