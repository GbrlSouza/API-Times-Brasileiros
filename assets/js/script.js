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
  document.getElementById("clubsContainer").classList.add("d-none");

  const svgObject = document.getElementById("brazilMap");
  if (mapBound) return;

  svgObject.addEventListener("load", () => {
    const svg = svgObject.contentDocument;
    if (!svg) return;

    svg.querySelectorAll("path").forEach((state) => {
      state.addEventListener("click", (e) => {
        e.preventDefault();

        svg
          .querySelectorAll("path.active")
          .forEach((p) => p.classList.remove("active"));

        state.classList.add("active");
        selectState(state.id, state.getAttribute("name"));
      });
    });

    mapBound = true;
  });
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
      const logo = club.logo || "assets/img/placeholder.png";
      const badgeClass =
        club.status === "active" ? "badge-active" : "badge-inactive";

      container.innerHTML += `
        <div class="col-sm-6 col-md-4 col-lg-3">
          <div class="card card-club h-100" data-slug="${club.slug}">
            <div class="card-body text-center">
              <img src="${logo}" style="max-height:80px"
                   onerror="this.src='./assets/imgs/escudos/${club.slug}'">
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
                  const logo = club.slug || "placeholder.png";

                  return `
                    <div class="club-item card-club d-flex align-items-center gap-3"
                        data-slug="${club.slug}">
                      <img
                        src="${logo}"
                        alt="Escudo ${club.short_name}"
                        style="height:40px;width:40px;object-fit:contain"
                        onerror="this.src='./assets/imgs/escudos/${logo}'">

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
              .map(
                (club) => `
                <div class="club-item card-club"
                     data-slug="${club.slug}">
                  <strong>${club.short_name}</strong>
                  <div class="club-city">
                    ${club.city} (${club.state})
                  </div>
                </div>
              `
              )
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

  const anthem = club.anthem
    ? `
      <p><strong>Hino:</strong> ${club.anthem.title}</p>
      <p>
        <a href="${club.anthem.lyrics_url}" target="_blank">📄 Ver letra</a>
      </p>
      ${
        club.anthem.audio_url
          ? `<audio controls src="${club.anthem.audio_url}"></audio>`
          : ""
      }
    `
    : `<p><strong>Hino:</strong> Não disponível</p>`;

  document.getElementById("modalBody").innerHTML = `
    <p><strong>Cidade:</strong> ${club.city} - ${club.state}</p>
    <p><strong>Fundação:</strong> ${club.founded ?? "Não informado"}</p>
    <p><strong>Status:</strong> ${club.status}</p>

    <p>
      <a href="https://pt.wikipedia.org/wiki/${club.wikipedia_page}"
         target="_blank">🌐 Wikipedia</a>
    </p>

    ${
      club.site
        ? `<p><a href="https://${club.site}" target="_blank">🌐 Site oficial</a></p>`
        : ""
    }

    ${
      club.uniforme
        ? `
      <iframe
        style="height:200px;width:400px;border:none"
        src="./assets/imgs/uniformes/${club.uniforme}.html">
      </iframe>
      `
        : ""
    }

    <hr>
    ${anthem}
  `;

  new bootstrap.Modal(document.getElementById("clubModal")).show();
}

/* =========================
   BUSCA
========================= */
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();
  filteredClubs = clubs.filter((c) =>
    c.short_name.toLowerCase().includes(value)
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
      a[type]?.toString().localeCompare(b[type]?.toString())
    );

    renderClubs(filteredClubs);
  });
});
