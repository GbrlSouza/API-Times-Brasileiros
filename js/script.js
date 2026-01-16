let clubs = [];
let filteredClubs = [];

fetch("clubs.json")
  .then(res => res.json())
  .then(data => {
    clubs = data;
    filteredClubs = [...clubs];
    renderClubs(filteredClubs);
  })
  .catch(err => console.error("Erro ao carregar JSON:", err));

function renderClubs(list) {
  const container = document.getElementById("clubsContainer");
  container.innerHTML = "";

  list.forEach((club, index) => {
    const badgeClass = club.status === "active" ? "badge-active" : "badge-inactive";

    container.innerHTML += `
      <div class="col-sm-6 col-md-4 col-lg-3">
        <div class="card card-club h-100" data-index="${index}">
          <div class="card-body">
            <img src="${club.logo}" alt="Escudo" class="img-fluid mb-2" style="max-height: 80px;">
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
    <p><a href="https://pt.wikipedia.org/wiki/${club.wikipedia_page}" target="_blank">🌐 Wikipedia</a></p>
    <hr>
    ${anthem}
  `;

  new bootstrap.Modal(document.getElementById("clubModal")).show();
}

document.getElementById("searchInput").addEventListener("input", e => {
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
