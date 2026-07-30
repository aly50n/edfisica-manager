const UI = (() => {
  let toastStack;

  function getToastStack() {
    if (!toastStack) {
      toastStack = document.createElement("div");
      toastStack.className = "toast-stack";
      toastStack.setAttribute("aria-live", "polite");
      document.body.appendChild(toastStack);
    }
    return toastStack;
  }

  const TOAST_ICONS = {
    success: "fa-solid fa-circle-check",
    danger: "fa-solid fa-circle-exclamation",
    warning: "fa-solid fa-triangle-exclamation",
    info: "fa-solid fa-circle-info",
  };

  function toast(tipo, titulo, mensagem = "") {
    const stack = getToastStack();
    const el = document.createElement("div");
    el.className = `toast toast--${tipo}`;
    el.innerHTML = `
      <i class="toast__icon ${TOAST_ICONS[tipo] || TOAST_ICONS.info}"></i>
      <div>
        <div class="toast__title">${escapeHtml(titulo)}</div>
        ${mensagem ? `<div class="toast__message">${escapeHtml(mensagem)}</div>` : ""}
      </div>
      <button class="toast__close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
    `;
    stack.appendChild(el);

    const remover = () => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 220);
    };

    el.querySelector(".toast__close").addEventListener("click", remover);
    setTimeout(remover, 5000);
  }

  function esconderPageLoader() {
    const loader = document.querySelector(".page-loader");
    if (loader) loader.classList.add("is-hidden");
  }

  function setBotaoCarregando(botao, carregando) {
    if (!botao) return;
    botao.disabled = carregando;
    botao.classList.toggle("is-loading", carregando);
  }

  function abrirModal(idOuElemento) {
    const el =
      typeof idOuElemento === "string"
        ? document.getElementById(idOuElemento)
        : idOuElemento;
    if (el) el.classList.add("is-open");
  }

  function fecharModal(idOuElemento) {
    const el =
      typeof idOuElemento === "string"
        ? document.getElementById(idOuElemento)
        : idOuElemento;
    if (el) el.classList.remove("is-open");
  }

  function registrarFechamentoModal(overlayEl) {
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) fecharModal(overlayEl);
    });
    overlayEl.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => fecharModal(overlayEl));
    });
  }

  let confirmTemplate = null;

  function confirmar({
    titulo,
    mensagem,
    textoConfirmar = "Confirmar",
    tipo = "danger",
  }) {
    return new Promise((resolve) => {
      let overlay = document.getElementById("modal-confirmacao");

      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "modal-confirmacao";
        overlay.className = "modal-overlay";
        document.body.appendChild(overlay);
      }

      if (!confirmTemplate) confirmTemplate = overlay.innerHTML;
      if (
        !overlay.querySelector(".js-confirm-ok") ||
        !overlay.querySelector(".js-confirm-cancel")
      ) {
        overlay.innerHTML = confirmTemplate;
      }

      let btnConfirmar = overlay.querySelector(".js-confirm-ok");
      let btnCancelar = overlay.querySelector(".js-confirm-cancel");

      if (!btnConfirmar || !btnCancelar) {
        overlay.innerHTML = confirmTemplate;
        btnConfirmar = overlay.querySelector(".js-confirm-ok");
        btnCancelar = overlay.querySelector(".js-confirm-cancel");
      }

      const titleEl = overlay.querySelector(".modal__title");
      const msgEl = overlay.querySelector(".js-confirm-msg");
      const icone = overlay.querySelector(".js-confirm-icon");
      if (titleEl) titleEl.textContent = titulo;
      if (msgEl) msgEl.textContent = mensagem;

      btnConfirmar.textContent = textoConfirmar;
      btnConfirmar.className = `btn ${tipo === "danger" ? "btn-danger" : "btn-primary"}`;

      if (icone) {
        icone.className = `modal__icon-badge js-confirm-icon modal__icon-badge--${tipo === "danger" ? "danger" : "success"}`;
        icone.innerHTML = `<i class="fa-solid ${tipo === "danger" ? "fa-trash" : "fa-check"}"></i>`;
      }

      const btnFechar = overlay.querySelector("[data-modal-close]");

      const onClickOverlay = (e) => {
        if (e.target === overlay) onCancelar();
      };

      const limpar = () => {
        btnConfirmar.removeEventListener("click", onConfirmar);
        btnCancelar.removeEventListener("click", onCancelar);
        if (btnFechar) btnFechar.removeEventListener("click", onCancelar);
        overlay.removeEventListener("click", onClickOverlay);
      };

      const onConfirmar = () => {
        limpar();
        fecharModal(overlay);
        resolve(true);
      };
      const onCancelar = () => {
        limpar();
        fecharModal(overlay);
        resolve(false);
      };

      btnConfirmar.addEventListener("click", onConfirmar);
      btnCancelar.addEventListener("click", onCancelar);
      if (btnFechar) btnFechar.addEventListener("click", onCancelar);
      overlay.addEventListener("click", onClickOverlay);

      abrirModal(overlay);
    });
  }

  function escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Retorna as iniciais de um nome (ex: "João Silva" -> "JS") */
  function iniciais(nome = "") {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /** Aplica uma máscara simples de "apenas números" a um input, em tempo real */
  function mascaraNumero(inputEl, maxLength = 3) {
    inputEl.addEventListener("input", () => {
      inputEl.value = inputEl.value.replace(/\D/g, "").slice(0, maxLength);
    });
  }

  // ---------------------------------------------------------------------
  // VIDEO MODAL (YouTube embed inline)
  // ---------------------------------------------------------------------
  let videoModalOverlay = null;

  function extrairIdYouTube(url) {
    var match;
    // https://www.youtube.com/watch?v=ID
    match = url.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    // https://youtu.be/ID
    match = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    // https://www.youtube.com/embed/ID
    match = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    // https://www.youtube.com/shorts/ID
    match = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
    return null;
  }

  function abrirVideoModal(url) {
    var videoId = extrairIdYouTube(url);
    if (!videoId) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (videoModalOverlay) {
      fecharVideoModal();
    }

    videoModalOverlay = document.createElement("div");
    videoModalOverlay.className = "video-modal-overlay";

    var embedUrl =
      "https://www.youtube.com/embed/" +
      encodeURIComponent(videoId) +
      "?autoplay=1&rel=0";

    var urlEscaped = escapeHtml(url);

    videoModalOverlay.innerHTML =
      '\
      <div class="video-modal__content">\
        <button class="video-modal__close" aria-label="Fechar video">\
          <i class="fa-solid fa-xmark"></i>\
        </button>\
        <div class="video-modal__wrapper">\
          <iframe src="' +
      embedUrl +
      '" \
            frameborder="0" \
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" \
            allowfullscreen>\
          </iframe>\
          <div class="video-modal__fallback">\
            <svg class="video-modal__fallback-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>\
            <span>Não carregou?</span>\
            <a href="' +
      urlEscaped +
      '" target="_blank" rel="noopener noreferrer">Abrir no YouTube</a>\
          </div>\
        </div>\
      </div>';

    document.body.appendChild(videoModalOverlay);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(function () {
      videoModalOverlay.classList.add("is-open");
    });

    function fecharVideoModal() {
      if (!videoModalOverlay) return;
      videoModalOverlay.classList.remove("is-open");
      document.body.style.overflow = "";
      var iframe = videoModalOverlay.querySelector("iframe");
      if (iframe) iframe.src = "";
      setTimeout(function () {
        if (videoModalOverlay && videoModalOverlay.parentNode) {
          videoModalOverlay.parentNode.removeChild(videoModalOverlay);
        }
        videoModalOverlay = null;
      }, 250);
    }

    videoModalOverlay.addEventListener("click", function (e) {
      if (e.target === videoModalOverlay) fecharVideoModal();
    });

    videoModalOverlay
      .querySelector(".video-modal__close")
      .addEventListener("click", fecharVideoModal);

    var escHandler = function (e) {
      if (e.key === "Escape") {
        fecharVideoModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  // ---------------------------------------------------------------------
  // PDF LOGO HELPER
  // ---------------------------------------------------------------------
  var _logoDataURL = "";

  function _obterLogoDataURL() {
    var img = document.getElementById("img-logo-pdf");
    if (!img || !img.naturalWidth) return "";

    try {
      var c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d").drawImage(img, 0, 0);
      var data = c.toDataURL("image/png");
      c = null;
      return data;
    } catch (e) {
      return "";
    }
  }

  function adicionarLogoPDF(doc, yInicial) {
    var url = _logoDataURL || _obterLogoDataURL();
    if (!url) return yInicial;

    var largura = 38;
    var altura = 38;

    var tmp = new Image();
    tmp.src = url;
    if (tmp.naturalWidth > 0) {
      altura = largura * (tmp.naturalHeight / tmp.naturalWidth);
    }

    try {
      doc.addImage(url, "PNG", 105 - largura / 2, yInicial, largura, altura);
      _logoDataURL = url;
      return yInicial + altura + 2;
    } catch (e) {
      return yInicial;
    }
  }

  /** Debounce simples, usado na pesquisa instantânea */
  function debounce(fn, atraso = 250) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), atraso);
    };
  }

  return {
    toast,
    esconderPageLoader,
    setBotaoCarregando,
    abrirModal,
    fecharModal,
    registrarFechamentoModal,
    confirmar,
    escapeHtml,
    iniciais,
    mascaraNumero,
    debounce,
    extrairIdYouTube,
    abrirVideoModal,
    adicionarLogoPDF,
  };
})();
