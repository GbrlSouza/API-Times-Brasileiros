const dataUrl = window.DATA_URL || "./assets/src/data/clubs.json";

let clubs = [];
let filteredClubs = [];

if (!dataUrl) {
  console.error("DATA_URL não definida. Verifique o index.html");
} else {
  fetch(dataUrl)
  .then(res => {
    if (!res.ok) {
      throw new Error("Arquivo JSON não encontrado");
    }
    
    return res.json();
  })
  .then(data => {
    clubs = data;
    filteredClubs = [...clubs];
    renderClubs(filteredClubs); })
    .catch(err => console.error("Erro ao carregar JSON:", err));
}

function renderClubs(list) {
  const container = document.getElementById("clubsContainer");
  if (!container) return;

  container.innerHTML = "";

  list.forEach((club, index) => {
    const badgeClass = club.status === "active" ? "badge-active" : "badge-inactive";
    const logo = club.logo || "assets/img/placeholder.png";

    container.innerHTML += `
      <div class="col-sm-6 col-md-4 col-lg-3">
        <div class="card card-club h-100" data-index="${index}">
          <div class="card-body text-center">
            <img src="${logo}" alt="Escudo do ${club.short_name}"
                 class="img-fluid mb-2"
                 style="max-height: 80px;"
                 onerror="this.src='./assets/imgs/escudos/${club.slug}'">

            <h5 class="card-title">${club.short_name}</h5>
            <p class="mb-1"><strong>Cidade:</strong> ${club.city} - ${club.state}</p>
            <p class="mb-1"><strong>Fundação:</strong> ${club.founded ?? "Não informado"}</p>
            <span class="badge ${badgeClass}">${club.status}</span>
          </div>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".card-club").forEach(card => {
    card.addEventListener("click", () => {
      openModal(card.dataset.index);
    });
  });
}

function openModal(index) {
  const club = filteredClubs[index];
  if (!club) return;

  document.getElementById("modalTitle").innerText = club.full_name;

  const anthem = club.anthem
    ? `
      <p><strong>Hino:</strong> ${club.anthem.title}</p>
      <p><a href="${club.anthem.lyrics_url}" target="_blank">📄 Ver letra</a></p>
      ${club.anthem.audio_url ? `<audio controls src="${club.anthem.audio_url}"></audio>` : ""}
    `
    : `<p><strong>Hino:</strong> Não disponível</p>`;

  document.getElementById("modalBody").innerHTML = `
    <p><strong>Cidade:</strong> ${club.city} - ${club.state}</p>
    <p><strong>Fundação:</strong> ${club.founded ?? "Não informado"}</p>
    <p><strong>Status:</strong> ${club.status}</p>

    <p>
      <a href="https://pt.wikipedia.org/wiki/${club.wikipedia_page}" target="_blank">
        🌐 Wikipedia
      </a>
    </p>

    ${club.site ? `
      <p>
        <a href="https://${club.site}" target="_blank">
          🌐 Site oficial
        </a>
      </p>
    ` : ""}
    ${club.uniforme ? `
      <div class="d-flex gap-3 flex-wrap mb-3">
          <div class="text-center">
            <iframe
              style="height: 190px;"
              src="./assets/imgs/uniformes/${club.uniforme}.html"
              title="Uniforme do ${club.short_name}">
            </iframe>
          </div>
      </div>
    ` : ""}
    <hr>
    ${anthem}
  `;

  new bootstrap.Modal(document.getElementById("clubModal")).show();
}


document.getElementById("searchInput")?.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  filteredClubs = clubs.filter(c =>
    c.short_name.toLowerCase().includes(value)
  );
  renderClubs(filteredClubs);
});

document.querySelectorAll("[data-sort]").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.sort;

    filteredClubs.sort((a, b) => {
      if (type === "founded") {
        return (a.founded ?? 9999) - (b.founded ?? 9999);
      }
      return a[type]?.toString().localeCompare(b[type]?.toString());
    });

    renderClubs(filteredClubs);
  });
});
