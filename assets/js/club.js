const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) {
  document.getElementById("clubPage").innerHTML =
    "<p class='text-danger'>Clube não encontrado.</p>";
  throw new Error("Slug não informado");
}

fetch(window.DATA_URL)
  .then((res) => res.json())
  .then((clubs) => {
    const club = clubs.find((c) => c.slug === slug);
    if (!club) throw new Error("Clube não encontrado");

    renderClubPage(club);
  })
  .catch((err) => {
    document.getElementById("clubPage").innerHTML =
      "<p class='text-danger'>Erro ao carregar clube.</p>";
    console.error(err);
  });

function renderClubPage(club) {
  document.title = club.full_name;
  document.getElementById("clubName").innerText = club.short_name;

  const logo = club.slug + club.typeSlug;

  document.getElementById("clubPage").innerHTML = `
    <div class="row g-5">

      <!-- COLUNA ESQUERDA -->
      <aside class="col-md-4 text-center">
        <img
          src="./assets/imgs/escudos/${logo}"
          class="img-fluid mb-3"
          style="max-height:160px"
          onerror="this.src='./assets/imgs/escudos/placeholder.png'">
        <br>

        <p class="mt-3">
          🔰 <strong>Fundado em</strong><br>
          <span class="fs-4">${club.founded ?? "Não informado"}</span>
        </p>

        <div class="d-grid gap-2 mt-3">
          <a href="https://pt.wikipedia.org/wiki/${club.wikipedia_page}"
             target="_blank"
             class="btn btn-outline-secondary">
             🌐 Wikipedia
          </a>

          ${
            club.site
              ? `<a href="https://${club.site}" target="_blank"
                   class="btn btn-outline-primary">
                   🌐 Site oficial
                 </a>`
              : ""
          }
        </div>
      </aside>

      <!-- COLUNA DIREITA -->
      <section class="col-md-7">

        <h3 class="mb-3">
          ${club.full_name}
          <span class="badge ${
            club.status === "active" ? "bg-success" : "bg-danger"
          } fs-5 float-end text-capitalize">
          ${club.status}
        </span>
        </h3>

        <p class="text-muted">
          📍 ${club.city} - ${club.state}
        </p>

        ${
          club.uniforme
            ? `
          <h5 class="mt-4">👕 Uniformes</h5>
          <iframe
            style="height:220px;width:100%;border:none"
            src="./assets/imgs/uniformes/${club.uniforme}.html">
          </iframe>
        `
            : ""
        }

        ${
          club.anthem
            ? `
          <div class="mt-4">
            <h5>🎵 Hino</h5>
            <p><strong>${club.anthem.title}</strong></p>

            <a href="${club.anthem.lyrics_url}"
               target="_blank"
               class="btn btn-sm btn-outline-secondary mb-2">
               📄 Ver letra
            </a>

            ${
              club.anthem.audio_url
                ? `<audio controls class="w-100 mt-2"
                     src="${club.anthem.audio_url}"></audio>`
                : ""
            }
          </div>
        `
            : ""
        }

      </section>
    </div>
  `;
}
