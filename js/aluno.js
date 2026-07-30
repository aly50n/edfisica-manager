(function () {
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

  document.addEventListener("DOMContentLoaded", () => {
    UI.esconderPageLoader();

    const sessao = Auth.getDadosAluno();
    if (sessao) {
      mostrarAreaAluno(sessao);
    }

    configurarToggleSenha();
    configurarFormularioLogin();
    configurarBotaoSair();
    configurarExportacaoPdf();
    configurarAvaliacoesAluno();
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

  function configurarFormularioLogin() {
    const form = document.getElementById("form-login-aluno");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const idInput = document.getElementById("aluno-id");
      const senhaInput = document.getElementById("aluno-senha");
      const btn = document.getElementById("btn-entrar-aluno");

      const id = idInput.value.trim();
      const senha = senhaInput.value;

      if (
        !validarCampoObrigatorio(idInput) ||
        !validarCampoObrigatorio(senhaInput)
      )
        return;

      UI.setBotaoCarregando(btn, true);
      try {
        const dados = await Auth.loginAluno(id, senha);
        UI.toast(
          "success",
          "Bem-vindo(a)!",
          `Olá, ${dados.nome.split(" ")[0]}.`,
        );
        mostrarAreaAluno(dados);
      } catch (erro) {
        UI.toast("danger", "Não foi possível entrar", erro.message);
      } finally {
        UI.setBotaoCarregando(btn, false);
      }
    });
  }

  function validarCampoObrigatorio(inputEl) {
    const campo = inputEl.closest(".field");
    const valido = inputEl.value.trim().length > 0;
    campo.classList.toggle("is-invalid", !valido);
    return valido;
  }

  function mostrarAreaAluno(dados) {
    document.getElementById("view-login").classList.add("hidden");
    document.getElementById("view-aluno-area").classList.remove("hidden");
    document.getElementById("aluno-nome-topbar").textContent = dados.nome;
    document.getElementById("aluno-nome-card").textContent = dados.nome;
    document.getElementById("aluno-idade-card").textContent = dados.idade;
    document.getElementById("aluno-id-card").textContent = dados.id;

    if (dados.sexo) {
      document.getElementById("aluno-sexo-card").classList.remove("hidden");
      document.getElementById("aluno-sexo-valor").textContent = dados.sexo;
    }
    if (dados.altura) {
      document.getElementById("aluno-altura-card").classList.remove("hidden");
      document.getElementById("aluno-altura-valor").textContent =
        dados.altura + " m";
    }
    if (dados.objetivo) {
      document.getElementById("aluno-objetivo-card").classList.remove("hidden");
      document.getElementById("aluno-objetivo-valor").textContent =
        dados.objetivo;
    }

    if (dados.observacoes && dados.observacoes.trim()) {
      document.getElementById("aluno-observacoes-card").style.display = "";
      document.getElementById("aluno-observacoes-texto").textContent =
        dados.observacoes;
    }

    if (dados.personalNome && dados.personalNome.trim()) {
      document.getElementById("personal-card").classList.remove("hidden");
      document.getElementById("personal-nome-aluno").textContent =
        dados.personalNome;
      document.getElementById("personal-cref-aluno").textContent =
        dados.personalCREF ? "CREF: " + dados.personalCREF : "";
    }

    if (dados.ultimaAtualizacao) {
      var d = new Date(dados.ultimaAtualizacao);
      if (!isNaN(d.getTime())) {
        document.getElementById("update-badge").classList.remove("hidden");
        document.getElementById("ultima-atualizacao-aluno").textContent =
          d.toLocaleDateString("pt-BR") +
          " às " +
          d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      }
    }

    renderizarTreinoSomenteLeitura(dados.treino);
    carregarAvaliacoesAluno(dados.id);
  }

  function renderizarTreinoSomenteLeitura(treinoJson) {
    const thead = document.querySelector("#tabela-treino-aluno thead");
    const tbody = document.querySelector("#tabela-treino-aluno tbody");
    const vazio = document.getElementById("treino-vazio-aluno");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    let treino;
    try {
      treino =
        typeof treinoJson === "string" ? JSON.parse(treinoJson) : treinoJson;
    } catch (e) {
      treino = null;
    }

    if (!treino || !treino.colunas || treino.colunas.length === 0) {
      document.getElementById("tabela-treino-aluno").classList.add("hidden");
      vazio.classList.remove("hidden");
      return;
    }

    document.getElementById("tabela-treino-aluno").classList.remove("hidden");
    vazio.classList.add("hidden");

    const colVideos = "Vídeos de referência";
    const colunasEstreitas = ["Séries", "Repetições", "Carga", "Descanso"];
    const colunasMedias = ["Exercício", colVideos];

    const trHead = document.createElement("tr");
    treino.colunas.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      if (colunasEstreitas.includes(col)) th.classList.add("col-narrow");
      else if (colunasMedias.includes(col)) th.classList.add("col-medium");
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    (treino.linhas || []).forEach((linha) => {
      const tr = document.createElement("tr");
      treino.colunas.forEach((col) => {
        const td = document.createElement("td");
        if (col === colVideos) {
          var urls = (linha[col] || "")
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          if (urls.length === 0) {
            td.textContent = "-";
            td.style.textAlign = "center";
            td.style.color = "var(--color-text-muted)";
          } else {
            td.className = "video-cell";
            urls.forEach(function (url, i) {
              var btn = document.createElement("button");
              btn.className = "video-btn";
              btn.textContent =
                urls.length === 1 ? "Ver vídeo" : "Ver vídeo " + (i + 1);
              btn.addEventListener("click", function () {
                UI.abrirVideoModal(url);
              });
              td.appendChild(btn);
            });
          }
        } else {
          td.textContent = linha[col] ?? "";
          if (colunasEstreitas.includes(col)) td.classList.add("col-narrow");
          else if (colunasMedias.includes(col)) td.classList.add("col-medium");
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    window.__treinoAtualAluno = treino;
  }

  function configurarBotaoSair() {
    document.getElementById("btn-sair-aluno").addEventListener("click", async () => {
      const confirmado = await UI.confirmar({
        titulo: "Sair",
        mensagem: "Deseja realmente sair da sua conta?",
        textoConfirmar: "Sair",
        tipo: "danger",
      });
      if (confirmado) Auth.logoutAluno();
    });
  }

  function configurarAvaliacoesAluno() {
    document
      .getElementById("btn-exportar-pdf-avaliacao-aluno")
      .addEventListener("click", exportarAvaliacaoPdfAluno);
    UI.registrarFechamentoModal(
      document.getElementById("modal-avaliacao-detalhes-aluno"),
    );
  }

  async function carregarAvaliacoesAluno(alunoId) {
    try {
      const resultado = await Api.listarAvaliacoesAluno(alunoId);
      const avaliacoes = resultado.avaliacoes || [];
      if (avaliacoes.length === 0) return;
      renderizarAvaliacoesAluno(avaliacoes);
    } catch (e) {}
  }

  function renderizarAvaliacoesAluno(avaliacoes) {
    document.getElementById("card-avaliacoes-aluno").classList.remove("hidden");
    const tbody = document.querySelector("#tabela-avaliacoes-aluno tbody");
    tbody.innerHTML = "";

    avaliacoes.forEach((av) => {
      const tr = document.createElement("tr");
      const dataStr = av.data
        ? new Date(av.data).toLocaleDateString("pt-BR")
        : "—";
      tr.innerHTML = `
        <td><button class="btn btn-ghost-user btn-sm js-ver-avaliacao-aluno" data-id="${av.id}"><i class="fa-solid fa-eye"></i> Ver</button></td>
        <td><strong>${av.peso || "—"}</strong> kg</td>
        <td>${av.imc || "—"}</td>
        <td>${av.massaMagra || "—"} kg</td>
        <td>${av.percentualGordura || "—"}%</td>
        <td>${dataStr}</td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".js-ver-avaliacao-aluno").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const av = avaliacoes.find((a) => String(a.id) === String(id));
        if (av) abrirDetalheAvaliacaoAluno(av);
      });
    });
  }

  function abrirDetalheAvaliacaoAluno(av) {
    const dataStr = av.data
      ? new Date(av.data).toLocaleDateString("pt-BR")
      : "—";

    document.getElementById("aluno-avaliacao-data").textContent = dataStr;
    document.getElementById("aluno-avaliacao-peso").textContent = av.peso
      ? av.peso + " kg"
      : "—";
    document.getElementById("aluno-avaliacao-gordura").textContent =
      av.percentualGordura ? av.percentualGordura + "%" : "—";
    document.getElementById("aluno-avaliacao-massa-magra").textContent =
      av.massaMagra ? av.massaMagra + " kg" : "—";
    document.getElementById("aluno-avaliacao-imc").textContent = av.imc || "—";

    const classEl = document.getElementById("aluno-avaliacao-classificacao");
    classEl.textContent = av.classificacaoIMC || "—";
    classEl.className = "eval-highlight__value";

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
    document.getElementById("aluno-avaliacao-medidas").innerHTML = medidasStr;

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
    document.getElementById("aluno-avaliacao-dobras").innerHTML = dobrasStr;

    window.__dadosAvaliacaoAluno = av;
    UI.abrirModal("modal-avaliacao-detalhes-aluno");
  }

  function exportarAvaliacaoPdfAluno() {
    const av = window.__dadosAvaliacaoAluno;
    const dados = Auth.getDadosAluno();
    if (!av || !dados) {
      UI.toast("warning", "Nada para exportar");
      return;
    }

    const personalNome =
      dados.personalNome || "Profissional de Educação Física";
    const personalCREF = dados.personalCREF
      ? "CREF: " + dados.personalCREF
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
    doc.text("Nome: " + dados.nome, 14, y);
    y += 5;
    doc.text("Idade: " + dados.idade + " anos", 14, y);
    y += 5;
    doc.text("ID: " + dados.id, 14, y);
    y += 5;
    const dataStr = av.data
      ? new Date(av.data).toLocaleDateString("pt-BR")
      : "—";
    doc.text("Data da avaliação: " + dataStr, 14, y);
    y += 5;

    y += 4;

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

    doc.save("avaliacao-fisica-" + dados.id + ".pdf");
    UI.toast("success", "PDF gerado com sucesso.");
  }

  function configurarExportacaoPdf() {
    document
      .getElementById("btn-exportar-pdf-aluno")
      .addEventListener("click", () => {
        const dados = Auth.getDadosAluno();
        const treino = window.__treinoAtualAluno;

        if (
          !dados ||
          !treino ||
          !treino.colunas ||
          treino.colunas.length === 0
        ) {
          UI.toast(
            "warning",
            "Nada para exportar",
            "Ainda não há uma ficha de treino cadastrada.",
          );
          return;
        }

        const personalNome =
          dados.personalNome || "Profissional de Educação Física";
        const personalCREF = dados.personalCREF
          ? "CREF: " + dados.personalCREF
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
        doc.text("Nome: " + dados.nome, 14, y);
        y += 5;
        doc.text("Idade: " + dados.idade + " anos", 14, y);
        y += 5;
        doc.text("ID: " + dados.id, 14, y);
        y += 5;
        if (dados.observacoes && dados.observacoes.trim()) {
          doc.text("Observações: " + dados.observacoes, 14, y);
          y += 5;
        }
        if (dados.ultimaAtualizacao) {
          var d = new Date(dados.ultimaAtualizacao);
          if (!isNaN(d.getTime())) {
            var dataStr =
              d.toLocaleDateString("pt-BR") +
              " às " +
              d.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
            doc.text("Atualizado em: " + dataStr, 14, y);
            y += 5;
          }
        }

        y += 4;

        var colVideos = treino.colunas.indexOf("Vídeos de referência");
        var colVideosNome = "Vídeos de referência";
        var videoUrlsMap = {};
        var bodyData = (treino.linhas || []).map(function (linha, i) {
          videoUrlsMap[i] = (linha[colVideosNome] || "")
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean);
          return treino.colunas.map(function (col) {
            if (col === colVideosNome) {
              var urls = (linha[col] || "")
                .split(",")
                .map(function (s) {
                  return s.trim();
                })
                .filter(Boolean);
              if (urls.length === 0) return "";
              return urls
                .map(function (_, j) {
                  return "Vídeo " + (j + 1);
                })
                .join("\n");
            }
            return linha[col] ?? "";
          });
        });

        doc.autoTable({
          startY: y,
          head: [treino.colunas],
          body: bodyData,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: {
            fillColor: [11, 37, 69],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: { fillColor: [245, 245, 250] },
          didDrawCell: function (data) {
            if (colVideos >= 0 && data.column.index === colVideos) {
              var raw = data.cell.raw;
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
        });

        var pageCount = doc.internal.getNumberOfPages();
        for (var i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(personalNome + " " + personalCREF, 14, 285);
          doc.text("Página " + i + " de " + pageCount, 196, 285, {
            align: "right",
          });
        }

        doc.save("ficha-treino-" + dados.id + ".pdf");
        UI.toast(
          "success",
          "PDF gerado",
          "Sua ficha foi exportada com sucesso.",
        );
      });
  }
})();
