(function () {
  function dataLocalISO(d) {
    const dt = d || new Date();
    const ano = dt.getFullYear();
    const mes = String(dt.getMonth() + 1).padStart(2, "0");
    const dia = String(dt.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function normalizarNumero(valor) {
    if (!valor) return 0;
    let texto = String(valor).trim();
    if (texto.indexOf(",") !== -1) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    }
    const n = parseFloat(texto);
    return isNaN(n) ? 0 : n;
  }

  let cacheAlunos = [];
  let treinoEmEdicao = null;
  let alunoSelecionadoTreinoId = null;
  let contadorIdColuna = 0;

  const MEDIDAS_PADRAO = [
    { chave: "pescoco", nome: "Pescoço" },
    { chave: "ombros", nome: "Ombros" },
    { chave: "peitoral", nome: "Peitoral" },
    { chave: "bracoDireito", nome: "Braço Direito" },
    { chave: "bracoEsquerdo", nome: "Braço Esquerdo" },
    { chave: "antebracoDireito", nome: "Antebraço Direito" },
    { chave: "antebracoEsquerdo", nome: "Antebraço Esquerdo" },
    { chave: "cintura", nome: "Cintura" },
    { chave: "abdomen", nome: "Abdômen" },
    { chave: "quadril", nome: "Quadril" },
    { chave: "coxaDireita", nome: "Coxa Direita" },
    { chave: "coxaEsquerda", nome: "Coxa Esquerda" },
    { chave: "panturrilhaDireita", nome: "Panturrilha Direita" },
    { chave: "panturrilhaEsquerda", nome: "Panturrilha Esquerda" },
    { chave: "toracicaInspiracao", nome: "Torácica (Inspiração)" },
    { chave: "toracicaExpiracao", nome: "Torácica (Expiração)" },
  ];

  const DOBRAS_PADRAO = [
    { chave: "peitoral", nome: "Peitoral" },
    { chave: "axilarMedia", nome: "Axilar Média" },
    { chave: "tricipital", nome: "Tricipital" },
    { chave: "subescapular", nome: "Subescapular" },
    { chave: "abdominal", nome: "Abdominal" },
    { chave: "suprailiaca", nome: "Supra Ilíaca" },
    { chave: "coxa", nome: "Coxa" },
  ];

  const MEDIDAS_TRONCO = [
    { chave: "pescoco", nome: "Pescoço" },
    { chave: "ombros", nome: "Ombros" },
    { chave: "peitoral", nome: "Peitoral" },
    { chave: "cintura", nome: "Cintura" },
    { chave: "abdomen", nome: "Abdômen" },
    { chave: "quadril", nome: "Quadril" },
    { chave: "toracicaInspiracao", nome: "Torácica (Inspiração)" },
    { chave: "toracicaExpiracao", nome: "Torácica (Expiração)" },
  ];

  const MEDIDAS_MEMBROS = [
    { chave: "bracoDireito", nome: "Braço Direito" },
    { chave: "bracoEsquerdo", nome: "Braço Esquerdo" },
    { chave: "antebracoDireito", nome: "Antebraço Direito" },
    { chave: "antebracoEsquerdo", nome: "Antebraço Esquerdo" },
    { chave: "coxaDireita", nome: "Coxa Direita" },
    { chave: "coxaEsquerda", nome: "Coxa Esquerda" },
    { chave: "panturrilhaDireita", nome: "Panturrilha Direita" },
    { chave: "panturrilhaEsquerda", nome: "Panturrilha Esquerda" },
  ];

  document.addEventListener("DOMContentLoaded", () => {
    UI.esconderPageLoader();

    if (Auth.estaLogadoComoAdmin()) {
      entrarNaAreaAdmin();
    }

    configurarToggleSenha();
    configurarLogin();
    configurarNavegacao();
    configurarSidebarMobile();
    configurarLogout();

    configurarAlunos();
    configurarModalAluno();
    configurarTreino();
    configurarDuplicarTreino();
    configurarConfiguracoes();
    configurarPersonalInfo();
    configurarAvaliacoes();
  });

  function configurarToggleSenha() {
    document.querySelectorAll(".toggle-visibility").forEach((btn) => {
      btn.addEventListener("click", () => {
        const alvo = document.getElementById(btn.dataset.toggleFor);
        const mostrando = alvo.type === "text";
        alvo.type = mostrando ? "password" : "text";
        btn.innerHTML = `<i class="fa-solid ${mostrando ? "fa-eye" : "fa-eye-slash"}"></i>`;
      });
    });
  }

  function configurarLogin() {
    const form = document.getElementById("form-login-admin");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usuarioInput = document.getElementById("admin-usuario");
      const senhaInput = document.getElementById("admin-senha");
      const btn = document.getElementById("btn-entrar-admin");

      if (!validarObrigatorio(usuarioInput) || !validarObrigatorio(senhaInput))
        return;

      UI.setBotaoCarregando(btn, true);
      try {
        await Auth.loginAdmin(usuarioInput.value.trim(), senhaInput.value);
        UI.toast("success", "Login realizado", "Bem-vindo(a) de volta!");
        entrarNaAreaAdmin();
      } catch (erro) {
        UI.toast("danger", "Não foi possível entrar", erro.message);
      } finally {
        UI.setBotaoCarregando(btn, false);
      }
    });
  }

  function entrarNaAreaAdmin() {
    document.getElementById("view-login").classList.add("hidden");
    document.getElementById("view-admin-area").classList.remove("hidden");

    const usuario = Auth.getUsuarioAdmin() || "Administrador";
    document.getElementById("admin-nome-sidebar").textContent = usuario;
    document.getElementById("admin-avatar-iniciais").textContent =
      UI.iniciais(usuario);

    const personalNome = Auth.getPersonalNome();
    if (personalNome) {
      document.getElementById("sidebar-user-role").textContent = personalNome;
    }

    carregarAlunos();
  }

  function configurarLogout() {
    document.getElementById("btn-sair-admin").addEventListener("click", async () => {
      const confirmado = await UI.confirmar({
        titulo: "Sair",
        mensagem: "Deseja realmente sair da sua conta?",
        textoConfirmar: "Sair",
        tipo: "danger",
      });
      if (confirmado) Auth.logoutAdmin();
    });
  }

  const TITULOS_VIEW = {
    dashboard: ["Dashboard", "Visão geral do sistema"],
    alunos: ["Alunos", "Gerencie os alunos cadastrados"],
    treino: ["Fichas de treino", "Monte a ficha de treino de cada aluno"],
    configuracoes: ["Configurações", "Preferências da conta"],
    avaliacoes: ["Avaliações", "Avaliações físicas dos alunos"],
  };

  function configurarNavegacao() {
    document.querySelectorAll(".sidebar__nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        const viewId = item.dataset.view;
        navegarPara(viewId);
        fecharSidebarMobile();
      });
    });
  }

  function navegarPara(viewId) {
    document.querySelectorAll(".sidebar__nav-item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.view === viewId);
    });
    document.querySelectorAll(".view").forEach((el) => {
      el.classList.toggle("is-active", el.id === `view-${viewId}`);
    });
    const [titulo, subtitulo] = TITULOS_VIEW[viewId] || ["", ""];
    document.getElementById("topbar-titulo").textContent = titulo;
    document.getElementById("topbar-subtitulo").textContent = subtitulo;

    if (viewId === "treino") preencherSelectAlunosTreino();
    if (viewId === "configuracoes") {
      document.getElementById("personal-nome").value = Auth.getPersonalNome();
      document.getElementById("personal-cref").value = Auth.getPersonalCREF();
    }
    if (viewId === "avaliacoes") preencherSelectAlunosAvaliacoes();
  }

  function configurarSidebarMobile() {
    document
      .getElementById("btn-toggle-sidebar")
      .addEventListener("click", () => {
        document.getElementById("sidebar").classList.add("is-open");
        document.getElementById("sidebar-backdrop").classList.add("is-open");
      });
    document
      .getElementById("sidebar-backdrop")
      .addEventListener("click", fecharSidebarMobile);
  }

  function fecharSidebarMobile() {
    document.getElementById("sidebar").classList.remove("is-open");
    document.getElementById("sidebar-backdrop").classList.remove("is-open");
  }

  async function carregarAlunos() {
    try {
      const resultado = await Api.listarAlunos(Auth.getTokenAdmin());
      cacheAlunos = resultado.alunos || [];
      renderizarTabelaAlunos(cacheAlunos);
      renderizarDashboard(cacheAlunos);
    } catch (erro) {
      UI.toast("danger", "Erro ao carregar alunos", erro.message);
    }
  }

  function renderizarDashboard(alunos) {
    const total = alunos.length;
    const comTreino = alunos.filter((a) => temTreino(a)).length;
    const semTreino = total - comTreino;
    const idadeMedia = total
      ? Math.round(
          alunos.reduce((soma, a) => soma + (Number(a.idade) || 0), 0) / total,
        )
      : 0;

    document.getElementById("stat-total-alunos").textContent = total;
    document.getElementById("stat-com-treino").textContent = comTreino;
    document.getElementById("stat-sem-treino").textContent = semTreino;
    document.getElementById("stat-idade-media").textContent = idadeMedia;

    const tbody = document.querySelector("#tabela-ultimos-alunos tbody");
    tbody.innerHTML = "";
    const ultimos = [...alunos].slice(-5).reverse();

    if (ultimos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding: 24px;">Nenhum aluno cadastrado ainda.</td></tr>`;
      return;
    }

    ultimos.forEach((aluno) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="avatar-chip">
            <div class="avatar-chip__circle">${UI.iniciais(aluno.nome)}</div>
            <span>${UI.escapeHtml(aluno.nome)}</span>
          </div>
        </td>
        <td><span class="badge badge--id">${UI.escapeHtml(aluno.id)}</span></td>
        <td>${UI.escapeHtml(String(aluno.idade))}</td>
        <td>${
          temTreino(aluno)
            ? '<span class="badge" style="background: var(--color-success-soft); color: var(--color-success);">Cadastrada</span>'
            : '<span class="badge" style="background: var(--color-gray-100); color: var(--color-gray-700);">Pendente</span>'
        }</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function temTreino(aluno) {
    try {
      const t =
        typeof aluno.treino === "string"
          ? JSON.parse(aluno.treino)
          : aluno.treino;
      return Boolean(t && t.colunas && t.colunas.length > 0);
    } catch (e) {
      return false;
    }
  }

  function renderizarTabelaAlunos(alunos) {
    const tbody = document.querySelector("#tabela-alunos tbody");
    const vazio = document.getElementById("alunos-vazio");
    tbody.innerHTML = "";

    document.getElementById("contador-alunos").textContent =
      `(${alunos.length})`;

    if (alunos.length === 0) {
      document.getElementById("tabela-alunos").classList.add("hidden");
      vazio.classList.remove("hidden");
      return;
    }
    document.getElementById("tabela-alunos").classList.remove("hidden");
    vazio.classList.add("hidden");

    alunos.forEach((aluno) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="avatar-chip">
            <div class="avatar-chip__circle">${UI.iniciais(aluno.nome)}</div>
            <span>${UI.escapeHtml(aluno.nome)}</span>
          </div>
        </td>
        <td><span class="badge badge--id">${UI.escapeHtml(aluno.id)}</span></td>
        <td>${UI.escapeHtml(String(aluno.idade))}</td>
        <td>${
          temTreino(aluno)
            ? '<span class="badge" style="background: var(--color-success-soft); color: var(--color-success);">Cadastrada</span>'
            : '<span class="badge" style="background: var(--color-gray-100); color: var(--color-gray-700);">Pendente</span>'
        }</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon js-avaliar-aluno" title="Avaliações físicas" data-id="${UI.escapeHtml(aluno.id)}"><i class="fa-solid fa-heart-pulse"></i></button>
            <button class="btn-icon js-editar-treino" title="Ficha de treino" data-id="${UI.escapeHtml(aluno.id)}"><i class="fa-solid fa-clipboard-list"></i></button>
            <button class="btn-icon js-editar-aluno" title="Editar" data-id="${UI.escapeHtml(aluno.id)}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon btn-icon--danger js-excluir-aluno" title="Excluir" data-id="${UI.escapeHtml(aluno.id)}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".js-editar-aluno").forEach((btn) => {
      btn.addEventListener("click", () =>
        abrirModalEdicaoAluno(btn.dataset.id),
      );
    });
    tbody.querySelectorAll(".js-excluir-aluno").forEach((btn) => {
      btn.addEventListener("click", () => excluirAluno(btn.dataset.id));
    });
    tbody.querySelectorAll(".js-avaliar-aluno").forEach((btn) => {
      btn.addEventListener("click", () => {
        navegarPara("avaliacoes");
        document
          .querySelectorAll(".sidebar__nav-item")
          .forEach((el) =>
            el.classList.toggle("is-active", el.dataset.view === "avaliacoes"),
          );
        preencherSelectAlunosAvaliacoes();
        document.getElementById("select-aluno-avaliacao").value =
          btn.dataset.id;
        var evt = new Event("change");
        document.getElementById("select-aluno-avaliacao").dispatchEvent(evt);
      });
    });
    tbody.querySelectorAll(".js-editar-treino").forEach((btn) => {
      btn.addEventListener("click", () => {
        navegarPara("treino");
        document
          .querySelectorAll(".sidebar__nav-item")
          .forEach((el) =>
            el.classList.toggle("is-active", el.dataset.view === "treino"),
          );
        preencherSelectAlunosTreino();
        document.getElementById("select-aluno-treino").value = btn.dataset.id;
        carregarTreinoParaEdicao(btn.dataset.id);
      });
    });
  }

  function configurarAlunos() {
    const input = document.getElementById("input-pesquisa-alunos");
    input.addEventListener(
      "input",
      UI.debounce(() => {
        const termo = input.value.trim().toLowerCase();
        const filtrados = cacheAlunos.filter(
          (a) =>
            a.nome.toLowerCase().includes(termo) ||
            a.id.toLowerCase().includes(termo),
        );
        renderizarTabelaAlunos(filtrados);
      }, 200),
    );

    document
      .getElementById("btn-atualizar-alunos")
      .addEventListener("click", () => {
        carregarAlunos();
        UI.toast("info", "Lista atualizada");
      });
  }

  function configurarModalAluno() {
    document
      .getElementById("btn-novo-aluno")
      .addEventListener("click", abrirModalNovoAluno);
    document
      .getElementById("form-aluno")
      .addEventListener("submit", salvarAluno);
    UI.registrarFechamentoModal(document.getElementById("modal-aluno"));
    UI.mascaraNumero(document.getElementById("aluno-form-idade"), 3);
  }

  function abrirModalNovoAluno() {
    document.getElementById("modal-aluno-titulo").textContent =
      "Cadastrar aluno";
    document.getElementById("aluno-form-modo").value = "criar";
    document.getElementById("aluno-form-id-original").value = "";
    document.getElementById("form-aluno").reset();
    document.getElementById("aluno-form-id").disabled = false;
    document.getElementById("label-senha-opcional").style.display = "none";
    document.getElementById("aluno-form-senha").required = true;
    limparValidacaoFormAluno();
    UI.abrirModal("modal-aluno");
  }

  async function abrirModalEdicaoAluno(id) {
    var aluno = cacheAlunos.find((a) => a.id === id);
    if (!aluno) return;

    if (!aluno.nascimento || !aluno.altura || !aluno.sexo || !aluno.objetivo) {
      try {
        var dados = await Api.buscarAluno(Auth.getTokenAdmin(), id);
        if (dados) aluno = dados;
      } catch (_) {}
    }

    document.getElementById("modal-aluno-titulo").textContent = "Editar aluno";
    document.getElementById("aluno-form-modo").value = "editar";
    document.getElementById("aluno-form-id-original").value = aluno.id;

    document.getElementById("aluno-form-id").value = aluno.id;
    document.getElementById("aluno-form-id").disabled = true;
    document.getElementById("aluno-form-nome").value = aluno.nome;
    document.getElementById("aluno-form-idade").value = aluno.idade;
    document.getElementById("aluno-form-sexo").value = aluno.sexo || "";
    document.getElementById("aluno-form-nascimento").value = aluno.nascimento
      ? String(aluno.nascimento).split("T")[0]
      : "";
    document.getElementById("aluno-form-altura").value = aluno.altura || "";
    document.getElementById("aluno-form-objetivo").value = aluno.objetivo || "";
    document.getElementById("aluno-form-obs").value = aluno.observacoes || "";
    document.getElementById("aluno-form-senha").value = "";
    document.getElementById("aluno-form-senha").required = false;
    document.getElementById("label-senha-opcional").style.display = "";

    limparValidacaoFormAluno();
    UI.abrirModal("modal-aluno");
  }

  function limparValidacaoFormAluno() {
    document
      .querySelectorAll("#form-aluno .field")
      .forEach((f) => f.classList.remove("is-invalid"));
  }

  async function salvarAluno(e) {
    e.preventDefault();

    const modo = document.getElementById("aluno-form-modo").value;
    const idOriginal = document.getElementById("aluno-form-id-original").value;

    const idInput = document.getElementById("aluno-form-id");
    const nomeInput = document.getElementById("aluno-form-nome");
    const idadeInput = document.getElementById("aluno-form-idade");
    const senhaInput = document.getElementById("aluno-form-senha");
    const obsInput = document.getElementById("aluno-form-obs");
    const btn = document.getElementById("btn-salvar-aluno");

    let valido = true;
    valido = validarObrigatorio(idInput) && valido;
    valido = validarObrigatorio(nomeInput) && valido;
    valido = validarObrigatorio(idadeInput) && valido;
    if (modo === "criar") valido = validarObrigatorio(senhaInput) && valido;
    if (!valido) return;

    if (
      modo === "criar" &&
      cacheAlunos.some(
        (a) => a.id.toLowerCase() === idInput.value.trim().toLowerCase(),
      )
    ) {
      idInput.closest(".field").classList.add("is-invalid");
      idInput.closest(".field").querySelector(".field-error").textContent =
        "Já existe um aluno com esse ID.";
      return;
    }

    UI.setBotaoCarregando(btn, true);
    try {
      const dadosAluno = {
        id: idInput.value.trim(),
        nome: nomeInput.value.trim(),
        idade: idadeInput.value.trim(),
        sexo: document.getElementById("aluno-form-sexo").value,
        nascimento: document
          .getElementById("aluno-form-nascimento")
          .value.trim(),
        altura: document.getElementById("aluno-form-altura").value.trim(),
        objetivo: document.getElementById("aluno-form-objetivo").value.trim(),
        observacoes: obsInput.value.trim(),
      };

      if (senhaInput.value) {
        dadosAluno.senhaHash = await CryptoUtil.hashComSalt(
          dadosAluno.id,
          senhaInput.value,
        );
      }

      if (modo === "criar") {
        await Api.criarAluno(Auth.getTokenAdmin(), dadosAluno);
        UI.toast(
          "success",
          "Aluno cadastrado",
          `${dadosAluno.nome} foi adicionado com sucesso.`,
        );
      } else {
        await Api.editarAluno(Auth.getTokenAdmin(), idOriginal, dadosAluno);
        UI.toast(
          "success",
          "Aluno atualizado",
          `Os dados de ${dadosAluno.nome} foram salvos.`,
        );
      }

      UI.fecharModal("modal-aluno");
      carregarAlunos();
    } catch (erro) {
      UI.toast("danger", "Erro ao salvar aluno", erro.message);
    } finally {
      UI.setBotaoCarregando(btn, false);
    }
  }

  async function excluirAluno(id) {
    const aluno = cacheAlunos.find((a) => a.id === id);
    if (!aluno) return;

    const confirmado = await UI.confirmar({
      titulo: "Excluir aluno",
      mensagem: `Tem certeza que deseja excluir ${aluno.nome}? Essa ação não pode ser desfeita.`,
      textoConfirmar: "Excluir",
      tipo: "danger",
    });
    if (!confirmado) return;

    try {
      await Api.excluirAluno(Auth.getTokenAdmin(), id);
      UI.toast(
        "success",
        "Aluno excluído",
        `${aluno.nome} foi removido do sistema.`,
      );
      carregarAlunos();
    } catch (erro) {
      UI.toast("danger", "Erro ao excluir aluno", erro.message);
    }
  }

  function validarObrigatorio(inputEl) {
    const campo = inputEl.closest(".field");
    const valido = inputEl.value.trim().length > 0;
    campo.classList.toggle("is-invalid", !valido);
    return valido;
  }

  function configurarTreino() {
    document
      .getElementById("select-aluno-treino")
      .addEventListener("change", (e) => {
        const id = e.target.value;
        if (id) {
          carregarTreinoParaEdicao(id);
        } else {
          document.getElementById("card-editor-treino").classList.add("hidden");
        }
      });

    document
      .getElementById("btn-add-coluna")
      .addEventListener("click", () => adicionarColuna());
    document
      .getElementById("btn-add-linha")
      .addEventListener("click", () => adicionarLinha());
    document
      .getElementById("btn-salvar-treino")
      .addEventListener("click", salvarTreino);
    document
      .getElementById("btn-exportar-pdf-admin")
      .addEventListener("click", exportarTreinoPdf);

    let dragSourceIndex = null;
    const thead = document.querySelector("#tabela-treino-editor thead");

    thead.addEventListener("dragstart", (e) => {
      const handle = e.target.closest(".drag-handle");
      if (!handle) { e.preventDefault(); return; }
      dragSourceIndex = Number(handle.dataset.colIndex);
      const th = handle.closest("th");
      if (th) th.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(dragSourceIndex));
    });

    thead.addEventListener("dragover", (e) => {
      const th = e.target.closest("th");
      if (!th || th.classList.contains("col-actions") || dragSourceIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = th.getBoundingClientRect();
      const x = e.clientX - rect.left;
      th.classList.toggle("drag-over-left", x < rect.width / 2);
      th.classList.toggle("drag-over-right", x >= rect.width / 2);
    });

    thead.addEventListener("dragleave", (e) => {
      const th = e.target.closest("th");
      if (!th) return;
      th.classList.remove("drag-over-left", "drag-over-right");
    });

    thead.addEventListener("drop", (e) => {
      e.preventDefault();
      const th = e.target.closest("th");
      if (!th || th.classList.contains("col-actions") || dragSourceIndex === null) return;
      const targetIndex = Number(th.dataset.colIndex);
      if (dragSourceIndex === targetIndex) return;

      const rect = th.getBoundingClientRect();
      const insertAfter = e.clientX - rect.left >= rect.width / 2;
      let toIndex = insertAfter ? targetIndex + 1 : targetIndex;

      const [col] = treinoEmEdicao.colunas.splice(dragSourceIndex, 1);
      if (toIndex > dragSourceIndex) toIndex--;
      treinoEmEdicao.colunas.splice(toIndex, 0, col);

      dragSourceIndex = null;
      renderizarEditorTreino();
    });

    thead.addEventListener("dragend", () => {
      dragSourceIndex = null;
      thead.querySelectorAll("th").forEach((th) => {
        th.classList.remove("dragging", "drag-over-left", "drag-over-right");
      });
    });
  }

  function preencherSelectAlunosTreino() {
    const select = document.getElementById("select-aluno-treino");
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione...</option>';
    cacheAlunos.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.nome} (${a.id})`;
      select.appendChild(opt);
    });
    select.value = valorAtual;
  }

  function carregarTreinoParaEdicao(id) {
    const aluno = cacheAlunos.find((a) => a.id === id);
    if (!aluno) return;

    alunoSelecionadoTreinoId = id;
    document.getElementById("treino-nome-aluno").textContent = aluno.nome;
    document.getElementById("treino-idade-aluno").textContent =
      `${aluno.idade} anos • ID: ${aluno.id}`;

    let treino;
    try {
      treino =
        typeof aluno.treino === "string"
          ? JSON.parse(aluno.treino)
          : aluno.treino;
    } catch (e) {
      treino = null;
    }

    if (!treino || !treino.colunas || treino.colunas.length === 0) {
      treino = {
        colunas: [
          "Exercício",
          "Séries",
          "Repetições",
          "Carga",
          "Descanso",
          "Vídeos de referência",
        ],
        linhas: [],
      };
    }

    const colVideos = "Vídeos de referência";
    if (!treino.colunas.includes(colVideos)) {
      treino.colunas.push(colVideos);
      treino.linhas.forEach(function (linha) {
        linha[colVideos] = "";
      });
    }

    treinoEmEdicao = treino;
    document.getElementById("card-editor-treino").classList.remove("hidden");
    renderizarEditorTreino();
  }

  function renderizarEditorTreino() {
    const thead = document.querySelector("#tabela-treino-editor thead");
    const tbody = document.querySelector("#tabela-treino-editor tbody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const trHead = document.createElement("tr");
    treinoEmEdicao.colunas.forEach((col, colIndex) => {
      const th = document.createElement("th");
      th.dataset.colIndex = colIndex;
      th.innerHTML = `
        <span class="drag-handle" draggable="true" data-col-index="${colIndex}">⠿</span>
        <input type="text" value="${UI.escapeHtml(col)}" data-col-index="${colIndex}" class="js-input-coluna">
        <button class="col-remove js-remover-coluna" data-col-index="${colIndex}" title="Remover coluna"><i class="fa-solid fa-xmark"></i></button>
      `;
      trHead.appendChild(th);
    });
    const thAcoes = document.createElement("th");
    thAcoes.className = "col-actions";
    trHead.appendChild(thAcoes);
    thead.appendChild(trHead);

    treinoEmEdicao.linhas.forEach((linha, linhaIndex) => {
      const tr = document.createElement("tr");
      treinoEmEdicao.colunas.forEach((col) => {
        const td = document.createElement("td");
        td.innerHTML = `<input type="text" value="${UI.escapeHtml(linha[col] || "")}" data-linha-index="${linhaIndex}" data-col-nome="${UI.escapeHtml(col)}" class="js-input-celula">`;
        tr.appendChild(td);
      });
      const tdAcoes = document.createElement("td");
      tdAcoes.className = "col-actions";
      tdAcoes.innerHTML = `<button class="btn-icon btn-icon--danger js-remover-linha" data-linha-index="${linhaIndex}" title="Remover linha"><i class="fa-solid fa-trash" style="font-size:11px;"></i></button>`;
      tr.appendChild(tdAcoes);
      tbody.appendChild(tr);
    });

    thead.querySelectorAll(".js-input-coluna").forEach((input) => {
      input.addEventListener("change", (e) => {
        const idx = Number(e.target.dataset.colIndex);
        const nomeAntigo = treinoEmEdicao.colunas[idx];
        const novoNome = e.target.value.trim() || nomeAntigo;
        treinoEmEdicao.colunas[idx] = novoNome;
        treinoEmEdicao.linhas.forEach((linha) => {
          if (nomeAntigo !== novoNome) {
            linha[novoNome] = linha[nomeAntigo];
            delete linha[nomeAntigo];
          }
        });
      });
    });

    thead.querySelectorAll(".js-remover-coluna").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.colIndex);
        const nomeCol = treinoEmEdicao.colunas[idx];
        if (nomeCol === "Vídeos de referência") {
          UI.toast(
            "warning",
            "Coluna fixa",
            'A coluna "Vídeos de referência" não pode ser removida.',
          );
          return;
        }
        treinoEmEdicao.colunas.splice(idx, 1);
        treinoEmEdicao.linhas.forEach((linha) => delete linha[nomeCol]);
        renderizarEditorTreino();
      });
    });

    tbody.querySelectorAll(".js-input-celula").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = Number(e.target.dataset.linhaIndex);
        const col = e.target.dataset.colNome;
        treinoEmEdicao.linhas[idx][col] = e.target.value;
      });
    });

    tbody.querySelectorAll(".js-remover-linha").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.linhaIndex);
        treinoEmEdicao.linhas.splice(idx, 1);
        renderizarEditorTreino();
      });
    });

  }

  function adicionarColuna() {
    contadorIdColuna += 1;
    let nomeBase = "Nova coluna";
    let nome = nomeBase;
    let sufixo = 1;
    while (treinoEmEdicao.colunas.includes(nome)) {
      sufixo += 1;
      nome = `${nomeBase} ${sufixo}`;
    }
    treinoEmEdicao.colunas.push(nome);
    renderizarEditorTreino();
  }

  function adicionarLinha() {
    if (treinoEmEdicao.colunas.length === 0) {
      UI.toast(
        "warning",
        "Crie ao menos uma coluna antes de adicionar linhas.",
      );
      return;
    }
    const novaLinha = {};
    treinoEmEdicao.colunas.forEach((col) => {
      novaLinha[col] = "";
    });
    treinoEmEdicao.linhas.push(novaLinha);
    renderizarEditorTreino();
  }

  async function salvarTreino() {
    if (!alunoSelecionadoTreinoId) return;
    const btn = document.getElementById("btn-salvar-treino");
    UI.setBotaoCarregando(btn, true);
    try {
      await Api.atualizarTreino(
        Auth.getTokenAdmin(),
        alunoSelecionadoTreinoId,
        treinoEmEdicao,
      );
      UI.toast(
        "success",
        "Ficha salva",
        "A ficha de treino foi atualizada com sucesso.",
      );
      const aluno = cacheAlunos.find((a) => a.id === alunoSelecionadoTreinoId);
      if (aluno) aluno.treino = JSON.stringify(treinoEmEdicao);
      renderizarTabelaAlunos(cacheAlunos);
      renderizarDashboard(cacheAlunos);
    } catch (erro) {
      UI.toast("danger", "Erro ao salvar ficha", erro.message);
    } finally {
      UI.setBotaoCarregando(btn, false);
    }
  }

  function exportarTreinoPdf() {
    if (!treinoEmEdicao || treinoEmEdicao.colunas.length === 0) {
      UI.toast(
        "warning",
        "Nada para exportar",
        "Monte a ficha antes de exportar.",
      );
      return;
    }
    const aluno = cacheAlunos.find((a) => a.id === alunoSelecionadoTreinoId);
    const personalNome =
      Auth.getPersonalNome() || "Profissional de Educação Física";
    const personalCREF = Auth.getPersonalCREF()
      ? "CREF: " + Auth.getPersonalCREF()
      : "";
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = UI.adicionarLogoPDF(doc, 10);

    y += 1;
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(20);
    doc.setTextColor(11, 37, 69);
    doc.text("FICHA DE TREINO", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(personalNome, 105, y, { align: "center" });
    y += 5;
    if (personalCREF) {
      doc.text(personalCREF, 105, y, { align: "center" });
      y += 5;
    }

    y += 3;
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      '"Treinamento personalizado elaborado para seu objetivo, com acompanhamento profissional e foco em resultados consistentes."',
      105,
      y,
      { align: "center", maxWidth: 170 },
    );
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(11, 37, 69);
    doc.text("Dados do Aluno", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(50);
    if (aluno) {
      doc.text(`Nome: ${aluno.nome}`, 14, y);
      y += 5;
      doc.text(`Idade: ${aluno.idade} anos`, 14, y);
      y += 5;
      doc.text(`ID: ${aluno.id}`, 14, y);
      y += 5;
      if (aluno.observacoes) {
        doc.text(`Observações: ${aluno.observacoes}`, 14, y);
        y += 5;
      }
    }

    if (aluno && aluno.ultimaAtualizacao) {
      const d = new Date(aluno.ultimaAtualizacao);
      if (!isNaN(d.getTime())) {
        const dataStr =
          d.toLocaleDateString("pt-BR") +
          " às " +
          d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        doc.text(`Atualizado em: ${dataStr}`, 14, y);
        y += 5;
      }
    }

    y += 4;

    const bodyData = treinoEmEdicao.linhas.map(function (linha) {
      return treinoEmEdicao.colunas.map(function (col) {
        if (col === "Vídeos de referência") {
          const urls = (linha[col] || "")
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          if (urls.length === 0) return "";
          return urls
            .map(function (_, i) {
              return "Vídeo " + (i + 1);
            })
            .join("\n");
        }
        return linha[col] || "";
      });
    });

    var videoUrlsMap = {};
    treinoEmEdicao.linhas.forEach(function (linha, i) {
      videoUrlsMap[i] = (linha["Vídeos de referência"] || "")
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
    });

    const colVideosIndex = treinoEmEdicao.colunas.indexOf(
      "Vídeos de referência",
    );

    doc.autoTable({
      startY: y,
      head: [treinoEmEdicao.colunas],
      body: bodyData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [11, 37, 69],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      didDrawCell: function (data) {
        if (colVideosIndex >= 0 && data.column.index === colVideosIndex) {
          const raw = data.cell.raw;
          if (!raw || raw === "") return;
          var urls = videoUrlsMap[data.row.index] || [];
          urls.forEach(function (url, vi) {
            var linkY = data.cell.y + 3 + vi * 4.5;
            doc.link(data.cell.x + 1, linkY, data.cell.width - 2, 4, {
              url: url,
            });
          });
        }
      },
      margin: { top: 20 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(personalNome + " " + personalCREF, 14, 285);
      doc.text("Página " + i + " de " + pageCount, 196, 285, {
        align: "right",
      });
    }

    doc.save(`ficha-treino-${alunoSelecionadoTreinoId}.pdf`);
    UI.toast("success", "PDF gerado com sucesso");
  }

  function configurarDuplicarTreino() {
    document
      .getElementById("btn-duplicar-treino")
      .addEventListener("click", () => {
        const select = document.getElementById("select-duplicar-origem");
        select.innerHTML = '<option value="">Selecione um aluno...</option>';
        cacheAlunos
          .filter((a) => a.id !== alunoSelecionadoTreinoId && temTreino(a))
          .forEach((a) => {
            const opt = document.createElement("option");
            opt.value = a.id;
            opt.textContent = `${a.nome} (${a.id})`;
            select.appendChild(opt);
          });
        UI.abrirModal("modal-duplicar-treino");
      });

    UI.registrarFechamentoModal(
      document.getElementById("modal-duplicar-treino"),
    );

    document
      .getElementById("btn-confirmar-duplicar")
      .addEventListener("click", () => {
        const idOrigem = document.getElementById(
          "select-duplicar-origem",
        ).value;
        if (!idOrigem) {
          UI.toast("warning", "Selecione um aluno de origem.");
          return;
        }
        const alunoOrigem = cacheAlunos.find((a) => a.id === idOrigem);
        let treinoOrigem;
        try {
          treinoOrigem =
            typeof alunoOrigem.treino === "string"
              ? JSON.parse(alunoOrigem.treino)
              : alunoOrigem.treino;
        } catch (e) {
          treinoOrigem = null;
        }
        if (!treinoOrigem) {
          UI.toast("danger", "Este aluno não possui ficha de treino.");
          return;
        }

        treinoEmEdicao = JSON.parse(JSON.stringify(treinoOrigem));

        if (!treinoEmEdicao.colunas.includes("Vídeos de referência")) {
          treinoEmEdicao.colunas.push("Vídeos de referência");
          treinoEmEdicao.linhas.forEach(function (linha) {
            linha["Vídeos de referência"] = "";
          });
        }

        renderizarEditorTreino();
        UI.fecharModal("modal-duplicar-treino");
        UI.toast(
          "success",
          "Ficha duplicada",
          'Não esqueça de clicar em "Salvar ficha" para confirmar.',
        );
      });
  }

  let alunoAvaliacaoId = null;
  let cacheAvaliacoes = [];

  function configurarAvaliacoes() {
    document
      .getElementById("select-aluno-avaliacao")
      .addEventListener("change", (e) => {
        const id = e.target.value;
        if (id) {
          alunoAvaliacaoId = id;
          carregarAvaliacoes(id);
        } else {
          alunoAvaliacaoId = null;
          document
            .getElementById("avaliacoes-card-lista")
            .classList.add("hidden");
        }
      });

    document
      .getElementById("btn-nova-avaliacao")
      .addEventListener("click", abrirModalNovaAvaliacao);
    document
      .getElementById("form-avaliacao")
      .addEventListener("submit", salvarAvaliacao);
    UI.registrarFechamentoModal(document.getElementById("modal-avaliacao"));

    document
      .getElementById("avaliacao-peso")
      .addEventListener("input", recalcularIMC);
    document
      .getElementById("avaliacao-peso")
      .addEventListener("input", recalcularComposicao);
    document
      .getElementById("avaliacao-altura-imc")
      .addEventListener("input", recalcularIMC);
    document
      .getElementById("tabela-dobras-avaliacao")
      .addEventListener("input", function (e) {
        if (e.target.classList.contains("input-dobra"))
          recalcularComposicao();
      });

    UI.registrarFechamentoModal(
      document.getElementById("modal-avaliacao-detalhes"),
    );

    document
      .getElementById("btn-exportar-pdf-avaliacao")
      .addEventListener("click", exportarAvaliacaoPdf);

    document
      .getElementById("btn-relatorio-comparativo-admin")
      .addEventListener("click", abrirModalComparativo);

    document
      .getElementById("btn-gerar-comparativo")
      .addEventListener("click", gerarComparativoPdf);

    UI.registrarFechamentoModal(document.getElementById("modal-comparativo-avaliacoes"));

    document
      .getElementById("btn-proximo-avaliacao")
      .addEventListener("click", proximoPasso);
    document
      .getElementById("btn-voltar-avaliacao")
      .addEventListener("click", passoAnterior);

    document.querySelectorAll(".step-indicator").forEach(function (el) {
      el.addEventListener("click", function () {
        irParaPasso(parseInt(this.dataset.step, 10));
      });
    });
  }

  function preencherSelectAlunosAvaliacoes() {
    const select = document.getElementById("select-aluno-avaliacao");
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione um aluno...</option>';
    cacheAlunos.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.nome} (${a.id})`;
      select.appendChild(opt);
    });
    select.value = valorAtual;
  }

  async function carregarAvaliacoes(alunoId) {
    try {
      const resultado = await Api.listarAvaliacoes(
        Auth.getTokenAdmin(),
        alunoId,
      );
      cacheAvaliacoes = resultado.avaliacoes || [];
      renderizarTabelaAvaliacoes();
    } catch (erro) {
      UI.toast("danger", "Erro ao carregar avaliações", erro.message);
    }
  }

  function renderizarTabelaAvaliacoes() {
    const tbody = document.querySelector("#tabela-avaliacoes tbody");
    const vazio = document.getElementById("avaliacoes-vazio");
    tbody.innerHTML = "";

    document.getElementById("avaliacoes-card-lista").classList.remove("hidden");
    document.getElementById("avaliacoes-total").textContent =
      `(${cacheAvaliacoes.length})`;

    const btnComparativo = document.getElementById("btn-relatorio-comparativo-admin");
    if (cacheAvaliacoes.length >= 2) {
      btnComparativo.classList.remove("hidden");
    } else {
      btnComparativo.classList.add("hidden");
    }

    if (cacheAvaliacoes.length === 0) {
      document.getElementById("tabela-avaliacoes").classList.add("hidden");
      vazio.classList.remove("hidden");
      return;
    }

    document.getElementById("tabela-avaliacoes").classList.remove("hidden");
    vazio.classList.add("hidden");

    cacheAvaliacoes.forEach((av) => {
      const tr = document.createElement("tr");
      const dataStr = av.data
        ? new Date(av.data).toLocaleDateString("pt-BR")
        : "—";
      const imcClass = obterClasseIMC(av.classificacaoIMC);
      tr.innerHTML = `
        <td>${dataStr}</td>
        <td><strong>${av.peso || "—"}</strong> kg</td>
        <td>${av.imc || "—"}</td>
        <td><span class="badge imc-badge ${imcClass}">${av.classificacaoIMC || "—"}</span></td>
        <td>${av.percentualGordura || "—"}%</td>
        <td>${av.massaMagra || "—"} kg</td>
        <td>
          <div class="row-actions">
            <button class="btn-icon js-ver-avaliacao" title="Ver avaliação" data-id="${av.id}"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-icon btn-icon--edit js-editar-avaliacao" title="Editar" data-id="${av.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon btn-icon--danger js-excluir-avaliacao" title="Excluir" data-id="${av.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".js-ver-avaliacao").forEach((btn) => {
      btn.addEventListener("click", () =>
        abrirDetalheAvaliacao(btn.dataset.id),
      );
    });
    tbody.querySelectorAll(".js-editar-avaliacao").forEach((btn) => {
      btn.addEventListener("click", () =>
        abrirModalEditarAvaliacao(btn.dataset.id),
      );
    });
    tbody.querySelectorAll(".js-excluir-avaliacao").forEach((btn) => {
      btn.addEventListener("click", () => excluirAvaliacao(btn.dataset.id));
    });
  }

  function obterClasseIMC(classificacao) {
    if (!classificacao) return "";
    if (classificacao === "Baixo peso") return "imc-baixo";
    if (classificacao === "Normal") return "imc-normal";
    if (classificacao === "Sobrepeso") return "imc-sobrepeso";
    if (classificacao === "Obesidade") return "imc-obesidade";
    return "";
  }

  function preencherTabelaPasso(selector, itens, dadosExistentes) {
    const tbody = document.querySelector(selector + " tbody");
    tbody.innerHTML = "";
    itens.forEach(function (item) {
      const tr = document.createElement("tr");
      const val =
        dadosExistentes && dadosExistentes[item.chave]
          ? dadosExistentes[item.chave]
          : "";
      tr.innerHTML =
        "<td>" +
        item.nome +
        '</td><td><input type="text" class="input-medida" data-chave="' +
        item.chave +
        '" placeholder="cm" value="' +
        val +
        '"></td>';
      tbody.appendChild(tr);
    });
  }

  function preencherTabelaDobras(dadosExistentes) {
    const tbody = document.querySelector("#tabela-dobras-avaliacao tbody");
    tbody.innerHTML = "";
    DOBRAS_PADRAO.forEach(function (d) {
      const tr = document.createElement("tr");
      const val =
        dadosExistentes && dadosExistentes[d.chave]
          ? dadosExistentes[d.chave]
          : "";
      tr.innerHTML =
        "<td>" +
        d.nome +
        '</td><td><input type="text" class="input-dobra" data-chave="' +
        d.chave +
        '" placeholder="mm" value="' +
        val +
        '"></td>';
      tbody.appendChild(tr);
    });
  }

  function irParaPasso(passo) {
    document.querySelectorAll(".step-content").forEach(function (el) {
      el.classList.remove("active");
    });
    document.querySelectorAll(".step-indicator").forEach(function (el) {
      el.classList.remove("active", "done");
    });

    document
      .querySelector('.step-content[data-step="' + passo + '"]')
      .classList.add("active");
    for (var i = 1; i <= 5; i++) {
      var ind = document.querySelector(
        '.step-indicator[data-step="' + i + '"]',
      );
      if (i < passo) ind.classList.add("done");
      else if (i === passo) ind.classList.add("active");
    }

    document.getElementById("avaliacao-step-atual").value = passo;
    document.getElementById("btn-voltar-avaliacao").style.display =
      passo > 1 ? "" : "none";
    document.getElementById("btn-proximo-avaliacao").style.display =
      passo < 5 ? "" : "none";
    document.getElementById("btn-salvar-avaliacao").style.display =
      passo === 5 ? "" : "none";

    if (passo === 5) atualizarRevisao();
  }

  function proximoPasso() {
    var atual = parseInt(
      document.getElementById("avaliacao-step-atual").value,
      10,
    );
    if (atual >= 5) return;
    irParaPasso(atual + 1);
  }

  function passoAnterior() {
    var atual = parseInt(
      document.getElementById("avaliacao-step-atual").value,
      10,
    );
    if (atual <= 1) return;
    irParaPasso(atual - 1);
  }

  function atualizarRevisao() {
    var peso = document.getElementById("avaliacao-peso").value.trim() || "—";
    var gordura = document.getElementById("avaliacao-gordura").value.trim();
    var massa = document.getElementById("avaliacao-massa-magra").value.trim();

    document.getElementById("rev-peso").textContent = peso + " kg";
    document.getElementById("rev-gordura").textContent = gordura
      ? gordura + "%"
      : "—";
    document.getElementById("rev-massa-magra").textContent = massa
      ? massa + " kg"
      : "—";

    recalcularIMC();
    document.getElementById("rev-imc").textContent =
      document.getElementById("avaliacao-imc").value || "—";
    var classIMC = document.getElementById("avaliacao-classificacao-imc").value;
    document.getElementById("rev-classificacao").textContent = classIMC || "—";

    var medidasStr = "";
    var medidas = {};
    document.querySelectorAll(".input-medida").forEach(function (inp) {
      if (inp.value.trim()) medidas[inp.dataset.chave] = inp.value.trim();
    });
    var chaves = Object.keys(medidas);
    if (chaves.length > 0) {
      medidasStr =
        '<h4 style="font-size:14px; color:var(--color-primary); margin-bottom:var(--space-2);">Medidas</h4>' +
        '<table class="eval-detail-table"><thead><tr><th>Medida</th><th>Valor</th></tr></thead><tbody>';
      var todasMedidas = MEDIDAS_TRONCO.concat(MEDIDAS_MEMBROS);
      todasMedidas.forEach(function (m) {
        if (medidas[m.chave]) {
          medidasStr +=
            "<tr><td>" +
            m.nome +
            "</td><td>" +
            medidas[m.chave] +
            " cm</td></tr>";
        }
      });
      medidasStr += "</tbody></table>";
    }
    document.getElementById("avaliacao-revisao-medidas").innerHTML = medidasStr;

    var dobrasStr = "";
    var dobras = {};
    document.querySelectorAll(".input-dobra").forEach(function (inp) {
      if (inp.value.trim()) dobras[inp.dataset.chave] = inp.value.trim();
    });
    var chavesDobras = Object.keys(dobras);
    if (chavesDobras.length > 0) {
      dobrasStr =
        '<h4 style="font-size:14px; color:var(--color-primary); margin-bottom:var(--space-2);">Dobras Cutâneas</h4>' +
        '<table class="eval-detail-table"><thead><tr><th>Dobra</th><th>Valor</th></tr></thead><tbody>';
      DOBRAS_PADRAO.forEach(function (d) {
        if (dobras[d.chave]) {
          dobrasStr +=
            "<tr><td>" +
            d.nome +
            "</td><td>" +
            dobras[d.chave] +
            " mm</td></tr>";
        }
      });
      dobrasStr += "</tbody></table>";
    }
    document.getElementById("avaliacao-revisao-dobras").innerHTML = dobrasStr;
  }

  async function abrirModalNovaAvaliacao() {
    if (!alunoAvaliacaoId) {
      UI.toast("warning", "Selecione um aluno primeiro.");
      return;
    }

    document.getElementById("avaliacao-form-modo").value = "criar";
    document.getElementById("avaliacao-form-id").value = "";
    document.getElementById("avaliacao-modal-titulo").textContent =
      "Nova avaliação física";
    document.getElementById("form-avaliacao").reset();

    document.getElementById("avaliacao-data").value = dataLocalISO();
    document.getElementById("avaliacao-peso").value = "";
    document.getElementById("avaliacao-gordura").value = "";
    document.getElementById("avaliacao-massa-magra").value = "";
    document.getElementById("avaliacao-imc").value = "";
    document.getElementById("avaliacao-classificacao-imc").value = "";

    var alturaAluno = "";
    var aluno = cacheAlunos.find((a) => a.id === alunoAvaliacaoId);
    if (aluno && aluno.altura) {
      alturaAluno = aluno.altura;
    } else {
      try {
        var dadosAluno = await Api.buscarAluno(
          Auth.getTokenAdmin(),
          alunoAvaliacaoId,
        );
        if (dadosAluno && dadosAluno.altura) alturaAluno = dadosAluno.altura;
      } catch (_) {}
    }
    document.getElementById("avaliacao-altura-imc").value = alturaAluno;

    var medidasAnteriores = null;
    var dobrasAnteriores = null;

    if (cacheAvaliacoes.length > 0) {
      const ultima = cacheAvaliacoes[cacheAvaliacoes.length - 1];
      if (ultima.peso)
        document.getElementById("avaliacao-peso").value = ultima.peso;
      if (ultima.percentualGordura)
        document.getElementById("avaliacao-gordura").value =
          ultima.percentualGordura;
      if (ultima.massaMagra)
        document.getElementById("avaliacao-massa-magra").value =
          ultima.massaMagra;
      if (ultima.medidasJSON && ultima.medidasJSON !== "{}") {
        medidasAnteriores =
          typeof ultima.medidasJSON === "string"
            ? JSON.parse(ultima.medidasJSON)
            : ultima.medidasJSON;
      }
      if (ultima.dobrasJSON && ultima.dobrasJSON !== "{}") {
        dobrasAnteriores =
          typeof ultima.dobrasJSON === "string"
            ? JSON.parse(ultima.dobrasJSON)
            : ultima.dobrasJSON;
      }
    }

    preencherTabelaPasso(
      "#tabela-medidas-tronco",
      MEDIDAS_TRONCO,
      medidasAnteriores,
    );
    preencherTabelaPasso(
      "#tabela-medidas-membros",
      MEDIDAS_MEMBROS,
      medidasAnteriores,
    );
    preencherTabelaDobras(dobrasAnteriores);

    recalcularComposicao();
    irParaPasso(1);
    UI.abrirModal("modal-avaliacao");
  }

  async function abrirModalEditarAvaliacao(id) {
    const av = cacheAvaliacoes.find((a) => String(a.id) === String(id));
    if (!av) return;

    document.getElementById("avaliacao-form-modo").value = "editar";
    document.getElementById("avaliacao-form-id").value = av.id;
    document.getElementById("avaliacao-modal-titulo").textContent =
      "Editar avaliação física";

    document.getElementById("avaliacao-data").value = av.data
      ? av.data.split("T")[0]
      : "";
    document.getElementById("avaliacao-peso").value = av.peso || "";
    document.getElementById("avaliacao-gordura").value =
      av.percentualGordura || "";
    document.getElementById("avaliacao-massa-magra").value =
      av.massaMagra || "";
    document.getElementById("avaliacao-imc").value = av.imc || "";
    document.getElementById("avaliacao-classificacao-imc").value =
      av.classificacaoIMC || "";

    var alturaAluno = "";
    const aluno = cacheAlunos.find((a) => a.id === alunoAvaliacaoId);
    if (aluno && aluno.altura) {
      alturaAluno = aluno.altura;
    } else {
      try {
        var dadosAluno = await Api.buscarAluno(
          Auth.getTokenAdmin(),
          alunoAvaliacaoId,
        );
        if (dadosAluno && dadosAluno.altura) alturaAluno = dadosAluno.altura;
      } catch (_) {}
    }
    document.getElementById("avaliacao-altura-imc").value = alturaAluno;

    const medidasExistentes =
      av.medidasJSON && av.medidasJSON !== "{}"
        ? typeof av.medidasJSON === "string"
          ? JSON.parse(av.medidasJSON)
          : av.medidasJSON
        : {};
    preencherTabelaPasso(
      "#tabela-medidas-tronco",
      MEDIDAS_TRONCO,
      medidasExistentes,
    );
    preencherTabelaPasso(
      "#tabela-medidas-membros",
      MEDIDAS_MEMBROS,
      medidasExistentes,
    );

    const dobrasExistentes =
      av.dobrasJSON && av.dobrasJSON !== "{}"
        ? typeof av.dobrasJSON === "string"
          ? JSON.parse(av.dobrasJSON)
          : av.dobrasJSON
        : {};
    preencherTabelaDobras(dobrasExistentes);

    recalcularComposicao();
    irParaPasso(1);
    UI.abrirModal("modal-avaliacao");
  }

  async function salvarAvaliacao(e) {
    e.preventDefault();

    var stepAtual = parseInt(
      document.getElementById("avaliacao-step-atual").value,
      10,
    );
    if (stepAtual < 5) {
      UI.toast("warning", "Revise os dados antes de salvar.");
      return;
    }

    const peso = document.getElementById("avaliacao-peso").value.trim();
    const data = document.getElementById("avaliacao-data").value;
    const btn = document.getElementById("btn-salvar-avaliacao");

    if (!peso) {
      UI.toast("warning", "Informe o peso.");
      return;
    }

    const medidas = {};
    document.querySelectorAll(".input-medida").forEach((inp) => {
      medidas[inp.dataset.chave] = inp.value.trim();
    });

    const dobras = {};
    document.querySelectorAll(".input-dobra").forEach((inp) => {
      dobras[inp.dataset.chave] = inp.value.trim();
    });

    const payload = {
      data: data || undefined,
      peso: peso,
      percentualGordura: document
        .getElementById("avaliacao-gordura")
        .value.trim(),
      massaMagra: document.getElementById("avaliacao-massa-magra").value.trim(),
      altura: document.getElementById("avaliacao-altura-imc").value.trim(),
      medidasJSON: JSON.stringify(medidas),
      dobrasJSON: JSON.stringify(dobras),
    };

    const modo = document.getElementById("avaliacao-form-modo").value;
    const avaliacaoId = document.getElementById("avaliacao-form-id").value;

    UI.setBotaoCarregando(btn, true);
    try {
      if (modo === "editar" && avaliacaoId) {
        payload.alunoId = alunoAvaliacaoId;
        await Api.editarAvaliacao(Auth.getTokenAdmin(), avaliacaoId, payload);
        UI.toast("success", "Avaliação atualizada com sucesso.");
      } else {
        await Api.criarAvaliacao(
          Auth.getTokenAdmin(),
          alunoAvaliacaoId,
          payload,
        );
        UI.toast("success", "Avaliação cadastrada com sucesso.");
      }
      UI.fecharModal("modal-avaliacao");
      carregarAvaliacoes(alunoAvaliacaoId);
    } catch (erro) {
      UI.toast("danger", "Erro ao salvar avaliação", erro.message);
    } finally {
      UI.setBotaoCarregando(btn, false);
    }
  }

  function recalcularComposicao() {
    const peso = normalizarNumero(
      document.getElementById("avaliacao-peso").value,
    );
    const gorduraInput = document.getElementById("avaliacao-gordura");
    const massaInput = document.getElementById("avaliacao-massa-magra");
    const info = document.getElementById("avaliacao-composicao-info");

    const aluno = cacheAlunos.find((a) => a.id === alunoAvaliacaoId);
    const sexo = aluno ? String(aluno.sexo || "").trim().toLowerCase() : "";
    const feminino = sexo.indexOf("f") === 0;
    const masculino = sexo.indexOf("m") === 0;
    const idade = normalizarNumero(aluno ? aluno.idade : "");

    let soma = 0;
    let incompletas = false;
    document.querySelectorAll(".input-dobra").forEach(function (inp) {
      const valor = normalizarNumero(inp.value);
      if (valor > 0) soma += valor;
      else incompletas = true;
    });

    const semDadosCadastrais = (!feminino && !masculino) || idade <= 0;
    const calculavel = peso > 0 && !incompletas && !semDadosCadastrais;

    let usarAuto = false;
    if (calculavel) {
      const dc = masculino
        ? 1.112 -
          0.00043499 * soma +
          0.00000055 * soma * soma -
          0.00028826 * idade
        : 1.097 -
          0.00046971 * soma +
          0.00000056 * soma * soma -
          0.00012828 * idade;
      if (dc > 0) {
        const gordura = (4.95 / dc - 4.5) * 100;
        if (gordura >= 0) {
          const massaGorda = peso * (gordura / 100);
          gorduraInput.value = gordura.toFixed(1).replace(".", ",");
          massaInput.value = (peso - massaGorda).toFixed(1).replace(".", ",");
          usarAuto = true;
        }
      }
    }

    gorduraInput.readOnly = usarAuto;
    massaInput.readOnly = usarAuto;
    const tituloAuto = "Calculado automaticamente pelas dobras cutâneas.";
    gorduraInput.title = usarAuto ? tituloAuto : "";
    massaInput.title = usarAuto ? tituloAuto : "";

    if (!info) return;
    if (usarAuto) {
      info.textContent = tituloAuto;
      info.style.display = "";
    } else if (peso > 0 && !incompletas && semDadosCadastrais) {
      info.textContent =
        "Informe o sexo e a idade do aluno para o cálculo automático de composição corporal.";
      info.style.display = "";
    } else {
      info.textContent = "";
      info.style.display = "none";
    }
  }

  function recalcularIMC() {
    const peso = normalizarNumero(
      document.getElementById("avaliacao-peso").value,
    );
    const altura = normalizarNumero(
      document.getElementById("avaliacao-altura-imc").value,
    );
    const imcInput = document.getElementById("avaliacao-imc");
    const classInput = document.getElementById("avaliacao-classificacao-imc");

    if (peso > 0 && altura > 0) {
      const imc = (peso / (altura * altura)).toFixed(2);
      imcInput.value = imc;
      const imcNum = parseFloat(imc);
      if (imcNum < 18.5) classInput.value = "Baixo peso";
      else if (imcNum < 25) classInput.value = "Normal";
      else if (imcNum < 30) classInput.value = "Sobrepeso";
      else classInput.value = "Obesidade";
    } else {
      imcInput.value = "";
      classInput.value = "";
    }
  }

  async function excluirAvaliacao(id) {
    const confirmado = await UI.confirmar({
      titulo: "Excluir avaliação",
      mensagem: "Tem certeza que deseja excluir esta avaliação?",
      textoConfirmar: "Excluir",
      tipo: "danger",
    });
    if (!confirmado) return;

    try {
      await Api.excluirAvaliacao(Auth.getTokenAdmin(), id);
      UI.toast("success", "Avaliação excluída.");
      carregarAvaliacoes(alunoAvaliacaoId);
    } catch (erro) {
      UI.toast("danger", "Erro ao excluir avaliação", erro.message);
    }
  }

  function abrirDetalheAvaliacao(id) {
    const av = cacheAvaliacoes.find((a) => String(a.id) === String(id));
    if (!av) return;

    const aluno = cacheAlunos.find((a) => a.id === alunoAvaliacaoId);
    const dataStr = av.data
      ? new Date(av.data).toLocaleDateString("pt-BR")
      : "—";

    document.getElementById("detalhe-avaliacao-aluno").textContent = aluno
      ? aluno.nome
      : "—";
    document.getElementById("detalhe-avaliacao-data").textContent = dataStr;
    document.getElementById("detalhe-avaliacao-peso").textContent =
      av.peso || "—";
    document.getElementById("detalhe-avaliacao-gordura").textContent =
      av.percentualGordura ? av.percentualGordura + "%" : "—";
    document.getElementById("detalhe-avaliacao-massa-magra").textContent =
      av.massaMagra ? av.massaMagra + " kg" : "—";
    document.getElementById("detalhe-avaliacao-imc").textContent =
      av.imc || "—";
    document.getElementById("detalhe-avaliacao-classificacao").textContent =
      av.classificacaoIMC || "—";
    document.getElementById("detalhe-avaliacao-classificacao").className =
      "badge imc-badge " + obterClasseIMC(av.classificacaoIMC);

    let medidasStr = "";
    if (av.medidasJSON && av.medidasJSON !== "{}") {
      const medidas =
        typeof av.medidasJSON === "string"
          ? JSON.parse(av.medidasJSON)
          : av.medidasJSON;
      medidasStr =
        '<table class="eval-detail-table"><thead><tr><th>Medida</th><th>Valor</th></tr></thead><tbody>';
      MEDIDAS_PADRAO.forEach((m) => {
        if (medidas[m.chave]) {
          medidasStr += `<tr><td>${m.nome}</td><td>${medidas[m.chave]} cm</td></tr>`;
        }
      });
      medidasStr += "</tbody></table>";
    } else {
      medidasStr = '<p class="text-muted">Nenhuma medida cadastrada.</p>';
    }
    document.getElementById("detalhe-avaliacao-medidas").innerHTML = medidasStr;

    let dobrasStr = "";
    if (av.dobrasJSON && av.dobrasJSON !== "{}") {
      const dobras =
        typeof av.dobrasJSON === "string"
          ? JSON.parse(av.dobrasJSON)
          : av.dobrasJSON;
      dobrasStr =
        '<table class="eval-detail-table"><thead><tr><th>Dobra Cutânea</th><th>Valor</th></tr></thead><tbody>';
      DOBRAS_PADRAO.forEach((d) => {
        if (dobras[d.chave]) {
          dobrasStr += `<tr><td>${d.nome}</td><td>${dobras[d.chave]} mm</td></tr>`;
        }
      });
      dobrasStr += "</tbody></table>";
    } else {
      dobrasStr = '<p class="text-muted">Nenhuma dobra cutânea cadastrada.</p>';
    }
    document.getElementById("detalhe-avaliacao-dobras").innerHTML = dobrasStr;

    window.__dadosAvaliacaoAtual = av;
    UI.abrirModal("modal-avaliacao-detalhes");
  }

  function exportarAvaliacaoPdf() {
    const av = window.__dadosAvaliacaoAtual;
    const aluno = cacheAlunos.find((a) => a.id === alunoAvaliacaoId);
    if (!av || !aluno) {
      UI.toast("warning", "Nada para exportar");
      return;
    }

    const personalNome =
      Auth.getPersonalNome() || "Profissional de Educação Física";
    const personalCREF = Auth.getPersonalCREF()
      ? "CREF: " + Auth.getPersonalCREF()
      : "";
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = UI.adicionarLogoPDF(doc, 10);

    y += 1;
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(20);
    doc.setTextColor(11, 37, 69);
    doc.text("AVALIAÇÃO FÍSICA", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(personalNome, 105, y, { align: "center" });
    y += 5;
    if (personalCREF) {
      doc.text(personalCREF, 105, y, { align: "center" });
      y += 5;
    }

    y += 3;
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      '"Treinamento personalizado elaborado para seu objetivo, com acompanhamento profissional e foco em resultados consistentes."',
      105,
      y,
      { align: "center", maxWidth: 170 },
    );
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(11, 37, 69);
    doc.text("Dados do Aluno", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Nome: " + aluno.nome, 14, y);
    y += 5;
    doc.text("Idade: " + aluno.idade + " anos", 14, y);
    y += 5;
    doc.text("ID: " + aluno.id, 14, y);
    y += 5;
    const dataStr = av.data
      ? new Date(av.data).toLocaleDateString("pt-BR")
      : "—";
    doc.text("Data da avaliação: " + dataStr, 14, y);
    y += 5;

    y += 4;

    doc.setFontSize(11);
    doc.setTextColor(11, 37, 69);
    doc.text("Indicadores", 14, y);
    y += 2;

    const indicadoresBody = [
      ["Peso", (av.peso || "—") + " kg"],
      ["% Gordura", (av.percentualGordura || "—") + "%"],
      ["Massa Magra", (av.massaMagra || "—") + " kg"],
      ["IMC", av.imc || "—"],
      ["Classificação IMC", av.classificacaoIMC || "—"],
    ];

    doc.autoTable({
      startY: y,
      head: [["Indicador", "Valor"]],
      body: indicadoresBody,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [11, 37, 69],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    });

    y = doc.lastAutoTable.finalY + 8;

    if (av.medidasJSON && av.medidasJSON !== "{}") {
      const medidas =
        typeof av.medidasJSON === "string"
          ? JSON.parse(av.medidasJSON)
          : av.medidasJSON;
      const medBody = [];
      MEDIDAS_PADRAO.forEach((m) => {
        if (medidas[m.chave]) medBody.push([m.nome, medidas[m.chave] + " cm"]);
      });
      if (medBody.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(11, 37, 69);
        doc.text("Medidas Corporais", 14, y);
        y += 2;
        doc.autoTable({
          startY: y,
          head: [["Medida", "Valor"]],
          body: medBody,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: [11, 37, 69],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [245, 245, 250] },
        });
        y = doc.lastAutoTable.finalY + 8;
      }
    }

    if (av.dobrasJSON && av.dobrasJSON !== "{}") {
      const dobras =
        typeof av.dobrasJSON === "string"
          ? JSON.parse(av.dobrasJSON)
          : av.dobrasJSON;
      const dobBody = [];
      DOBRAS_PADRAO.forEach((d) => {
        if (dobras[d.chave]) dobBody.push([d.nome, dobras[d.chave] + " mm"]);
      });
      if (dobBody.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(11, 37, 69);
        doc.text("Dobras Cutâneas", 14, y);
        y += 2;
        doc.autoTable({
          startY: y,
          head: [["Dobra", "Valor"]],
          body: dobBody,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: {
            fillColor: [11, 37, 69],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [245, 245, 250] },
        });
      }
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(personalNome + " " + personalCREF, 14, 285);
      doc.text("Página " + i + " de " + pageCount, 196, 285, {
        align: "right",
      });
    }

    doc.save("avaliacao-fisica-" + aluno.id + ".pdf");
    UI.toast("success", "PDF gerado com sucesso.");
  }

  var selectedComparativoIds = {};

  function preencherTabelaComparativo(lista) {
    var tbody = document.querySelector("#tabela-selecao-avaliacoes tbody");
    tbody.innerHTML = "";

    lista.forEach(function (av) {
      var tr = document.createElement("tr");
      var dataStr = av.data ? new Date(av.data).toLocaleDateString("pt-BR") : "—";
      var imcClass = obterClasseIMC(av.classificacaoIMC);
      var checked = selectedComparativoIds[av.id] ? "checked" : "";
      tr.innerHTML =
        '<td><input type="checkbox" class="check-avaliacao" value="' + av.id + '" ' + checked + '></td>' +
        '<td>' + dataStr + '</td>' +
        '<td><strong>' + (av.peso || "—") + '</strong> kg</td>' +
        '<td>' + (av.imc || "—") + '</td>' +
        '<td><span class="badge imc-badge ' + imcClass + '">' + (av.classificacaoIMC || "—") + '</span></td>' +
        '<td>' + (av.percentualGordura || "—") + '%</td>' +
        '<td>' + (av.massaMagra || "—") + ' kg</td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".check-avaliacao").forEach(function (cb) {
      cb.addEventListener("change", function () {
        if (this.checked) {
          selectedComparativoIds[this.value] = true;
          var ids = Object.keys(selectedComparativoIds);
          if (ids.length > 2) {
            var toRemove = null;
            for (var i = 0; i < ids.length; i++) {
              if (ids[i] !== this.value) {
                toRemove = ids[i];
                break;
              }
            }
            delete selectedComparativoIds[toRemove];
            var cbUncheck = tbody.querySelector('.check-avaliacao[value="' + toRemove + '"]');
            if (cbUncheck) cbUncheck.checked = false;
          }
        } else {
          delete selectedComparativoIds[this.value];
        }
      });
    });
  }

  function abrirModalComparativo() {
    if (cacheAvaliacoes.length < 2) {
      UI.toast("warning", "Sao necessarias ao menos 2 avaliacoes.");
      return;
    }

    var sorted = cacheAvaliacoes.slice().sort(function (a, b) {
      return new Date(a.data) - new Date(b.data);
    });

    selectedComparativoIds = {};
    selectedComparativoIds[sorted[sorted.length - 1].id] = true;
    selectedComparativoIds[sorted[sorted.length - 2].id] = true;

    var filtroInput = document.getElementById("filtro-data-texto");
    filtroInput.value = "";
    preencherTabelaComparativo(sorted);

    function aplicarFiltroTexto() {
      var termo = filtroInput.value.trim();
      if (!termo) {
        preencherTabelaComparativo(sorted);
        return;
      }
      var filtradas = sorted.filter(function (av) {
        if (!av.data) return false;
        var d = new Date(av.data).toLocaleDateString("pt-BR");
        return d.indexOf(termo) !== -1;
      });
      preencherTabelaComparativo(filtradas);
    }

    filtroInput.removeEventListener("input", aplicarFiltroTexto);
    filtroInput.addEventListener("input", aplicarFiltroTexto);

    UI.abrirModal("modal-comparativo-avaliacoes");
  }

  function gerarComparativoPdf() {
    var checkboxes = document.querySelectorAll("#tabela-selecao-avaliacoes tbody .check-avaliacao:checked");
    if (checkboxes.length < 2) {
      UI.toast("warning", "Selecione ao menos 2 avaliacoes.");
      return;
    }

    var selecionados = [];
    checkboxes.forEach(function (cb) {
      var av = cacheAvaliacoes.find(function (a) { return String(a.id) === String(cb.value); });
      if (av) selecionados.push(av);
    });

    UI.fecharModal("modal-comparativo-avaliacoes");
    exportarRelatorioComparativoPdf(selecionados);
  }

  function exportarRelatorioComparativoPdf(selecionados) {
    const aluno = cacheAlunos.find(function (a) { return a.id === alunoAvaliacaoId; });
    if (!aluno || !selecionados || selecionados.length < 2) return;

    var sorted = selecionados.slice().sort(function (a, b) {
      return new Date(a.data) - new Date(b.data);
    });
    var maisAntiga = sorted[0];
    var maisRecente = sorted[sorted.length - 1];

    var personalNome = Auth.getPersonalNome() || "Profissional de Educação Física";
    var personalCREF = Auth.getPersonalCREF() ? "CREF: " + Auth.getPersonalCREF() : "";
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    var y = UI.adicionarLogoPDF(doc, 10);

    y += 1;
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(20);
    doc.setTextColor(11, 37, 69);
    doc.text("RELATÓRIO COMPARATIVO", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(personalNome, 105, y, { align: "center" });
    y += 5;
    if (personalCREF) {
      doc.text(personalCREF, 105, y, { align: "center" });
      y += 5;
    }

    y += 3;
    doc.setDrawColor(11, 37, 69);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      '"Treinamento personalizado elaborado para seu objetivo, com acompanhamento profissional e foco em resultados consistentes."',
      105, y, { align: "center", maxWidth: 170 }
    );
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(11, 37, 69);
    doc.text("Dados do Aluno", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Nome: " + aluno.nome, 14, y);
    y += 5;
    doc.text("Idade: " + aluno.idade + " anos", 14, y);
    y += 5;
    doc.text("ID: " + aluno.id, 14, y);
    y += 5;
    var dataGeracao = new Date().toLocaleDateString("pt-BR");
    doc.text("Relatório gerado em: " + dataGeracao, 14, y);
    y += 5;
    var datasAvaliacoes = sorted.map(function (a) {
      return new Date(a.data).toLocaleDateString("pt-BR");
    });
    doc.text("Avaliacoes: " + sorted.length + " (" + datasAvaliacoes.join(" ate ") + ")", 14, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(11, 37, 69);
    doc.text("Comparação de Indicadores", 14, y);
    y += 2;

    function formatarDiferenca(atual, anterior, unidade) {
      var a = parseFloat(atual);
      var ant = parseFloat(anterior);
      if (isNaN(a) || isNaN(ant)) return { texto: "—", cor: [100, 100, 100], positivo: null };
      var diff = a - ant;
      if (diff === 0) return { texto: "0" + unidade, cor: [100, 100, 100], positivo: null };
      var prefixo = diff > 0 ? "+" : "-";
      return { texto: prefixo + Math.abs(diff).toFixed(1) + unidade.replace(" ", ""), cor: null, positivo: diff > 0 };
    }

    var indicadores = [
      { label: "Peso", chave: "peso", unidade: " kg" },
      { label: "IMC", chave: "imc", unidade: "" },
      { label: "% Gordura", chave: "percentualGordura", unidade: "%" },
      { label: "Massa Magra", chave: "massaMagra", unidade: " kg" },
    ];

    var indicadoresBody = [];
    var diffs = [];

    indicadores.forEach(function (ind) {
      var ant = maisAntiga[ind.chave];
      var rec = maisRecente[ind.chave];
      var diffInfo = formatarDiferenca(rec, ant, ind.unidade);
      var cor = diffInfo.cor;
      if (cor === null && diffInfo.positivo !== null) {
        cor = diffInfo.positivo ? [40, 167, 69] : [220, 53, 69];
      }
      diffs.push({ label: ind.label, ant: ant, rec: rec, diff: diffInfo, unidade: ind.unidade });
      indicadoresBody.push([
        ind.label,
        (ant || "—") + ind.unidade,
        (rec || "—") + ind.unidade,
        { content: diffInfo.texto !== "—" ? diffInfo.texto : "—", styles: { textColor: cor || [100, 100, 100] } },
      ]);
    });

    var dataAntiga = maisAntiga.data ? new Date(maisAntiga.data).toLocaleDateString("pt-BR") : "R1";
    var dataRecente = maisRecente.data ? new Date(maisRecente.data).toLocaleDateString("pt-BR") : "R2";

    doc.autoTable({
      startY: y,
      head: [["Indicador", dataAntiga, dataRecente, "Evolução"]],
      body: indicadoresBody,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [11, 37, 69], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    });

    y = doc.lastAutoTable.finalY + 8;

    var medAnt = {};
    if (maisAntiga.medidasJSON && maisAntiga.medidasJSON !== "{}") {
      medAnt = typeof maisAntiga.medidasJSON === "string" ? JSON.parse(maisAntiga.medidasJSON) : maisAntiga.medidasJSON;
    }
    var medRec = {};
    if (maisRecente.medidasJSON && maisRecente.medidasJSON !== "{}") {
      medRec = typeof maisRecente.medidasJSON === "string" ? JSON.parse(maisRecente.medidasJSON) : maisRecente.medidasJSON;
    }

    var medBody = [];
    MEDIDAS_PADRAO.forEach(function (m) {
      var vAnt = medAnt[m.chave];
      var vRec = medRec[m.chave];
      if (vAnt || vRec) {
        var diffMed = formatarDiferenca(vRec, vAnt, " cm");
        var corMed = diffMed.cor;
        if (corMed === null && diffMed.positivo !== null) {
          corMed = diffMed.positivo ? [40, 167, 69] : [220, 53, 69];
        }
        medBody.push([
          m.nome,
          vAnt ? vAnt + " cm" : "—",
          vRec ? vRec + " cm" : "—",
          { content: diffMed.texto !== "—" ? diffMed.texto : "—", styles: { textColor: corMed || [100, 100, 100] } },
        ]);
      }
    });

    if (medBody.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(11, 37, 69);
      doc.text("Medidas Corporais", 14, y);
      y += 2;
      doc.autoTable({
        startY: y,
        head: [["Medida", dataAntiga, dataRecente, "Evolução"]],
        body: medBody,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [11, 37, 69], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 250] },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    var dobAnt = {};
    if (maisAntiga.dobrasJSON && maisAntiga.dobrasJSON !== "{}") {
      dobAnt = typeof maisAntiga.dobrasJSON === "string" ? JSON.parse(maisAntiga.dobrasJSON) : maisAntiga.dobrasJSON;
    }
    var dobRec = {};
    if (maisRecente.dobrasJSON && maisRecente.dobrasJSON !== "{}") {
      dobRec = typeof maisRecente.dobrasJSON === "string" ? JSON.parse(maisRecente.dobrasJSON) : maisRecente.dobrasJSON;
    }

    var dobBody = [];
    DOBRAS_PADRAO.forEach(function (d) {
      var vAnt = dobAnt[d.chave];
      var vRec = dobRec[d.chave];
      if (vAnt || vRec) {
        var diffDob = formatarDiferenca(vRec, vAnt, " mm");
        var corDob = diffDob.cor;
        if (corDob === null && diffDob.positivo !== null) {
          corDob = diffDob.positivo ? [40, 167, 69] : [220, 53, 69];
        }
        dobBody.push([
          d.nome,
          vAnt ? vAnt + " mm" : "—",
          vRec ? vRec + " mm" : "—",
          { content: diffDob.texto !== "—" ? diffDob.texto : "—", styles: { textColor: corDob || [100, 100, 100] } },
        ]);
      }
    });

    if (dobBody.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(11, 37, 69);
      doc.text("Dobras Cutâneas", 14, y);
      y += 2;
      doc.autoTable({
        startY: y,
        head: [["Dobra", dataAntiga, dataRecente, "Evolução"]],
        body: dobBody,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [11, 37, 69], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 250] },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(11, 37, 69);
    doc.text("Resumo da Evolução", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(50);

    var resumoItens = [];
    diffs.forEach(function (d) {
      if (d.diff.texto === "—") return;
      var ant = parseFloat(d.ant);
      var rec = parseFloat(d.rec);
      if (isNaN(ant) || isNaN(rec)) return;
      var diff = rec - ant;
      var absDiff = Math.abs(diff);
      var verbo = diff > 0 ? "aumentou" : "reduziu";
      var label = d.label === "Massa Magra" ? "Massa muscular" : d.label;
      resumoItens.push(label + ": " + verbo + " " + absDiff.toFixed(1) + d.unidade + ".");
    });

    resumoItens.forEach(function (item) {
      doc.text("- " + item, 14, y);
      y += 6;
    });

    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(personalNome + " " + personalCREF, 14, 285);
      doc.text("Página " + i + " de " + pageCount, 196, 285, { align: "right" });
    }

    doc.save("relatorio-comparativo-" + aluno.id + ".pdf");
    UI.toast("success", "Relatório comparativo gerado com sucesso.");
  }

  function configurarPersonalInfo() {
    document.getElementById("personal-nome").value = Auth.getPersonalNome();
    document.getElementById("personal-cref").value = Auth.getPersonalCREF();

    document
      .getElementById("form-personal-info")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const nomeInput = document.getElementById("personal-nome");
        const creffInput = document.getElementById("personal-cref");
        const btn = document.getElementById("btn-salvar-personal-info");

        UI.setBotaoCarregando(btn, true);
        try {
          await Auth.atualizarPersonalInfo(
            nomeInput.value.trim(),
            creffInput.value.trim(),
          );
          UI.toast(
            "success",
            "Dados salvos",
            "Suas informações profissionais foram atualizadas.",
          );

          const personalNome = Auth.getPersonalNome();
          if (personalNome) {
            document.getElementById("sidebar-user-role").textContent =
              personalNome;
          }
        } catch (erro) {
          UI.toast("danger", "Erro ao salvar", erro.message);
        } finally {
          UI.setBotaoCarregando(btn, false);
        }
      });
  }

  function configurarConfiguracoes() {
    document
      .getElementById("form-alterar-senha")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const atualInput = document.getElementById("senha-atual");
        const novaInput = document.getElementById("senha-nova");
        const confirmaInput = document.getElementById("senha-nova-confirma");
        const btn = document.getElementById("btn-salvar-senha");

        let valido = true;
        valido = validarObrigatorio(atualInput) && valido;

        const novaValida = novaInput.value.trim().length >= 6;
        novaInput.closest(".field").classList.toggle("is-invalid", !novaValida);
        valido = novaValida && valido;

        const confirmaValida =
          confirmaInput.value === novaInput.value &&
          confirmaInput.value.length > 0;
        confirmaInput
          .closest(".field")
          .classList.toggle("is-invalid", !confirmaValida);
        valido = confirmaValida && valido;

        if (!valido) return;

        UI.setBotaoCarregando(btn, true);
        try {
          await Auth.alterarSenhaAdmin(atualInput.value, novaInput.value);
          UI.toast("success", "Senha alterada com sucesso");
          document.getElementById("form-alterar-senha").reset();
        } catch (erro) {
          UI.toast("danger", "Erro ao alterar senha", erro.message);
        } finally {
          UI.setBotaoCarregando(btn, false);
        }
      });
  }
})();
