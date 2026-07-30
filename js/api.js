const API_CONFIG = {
  URL: "https://script.google.com/macros/s/AKfycbyHidF0QOFaSg74hotZfyNse0V1CxsSsyTV_wEcAwA9tNdWf9qTqabVWAcmyux7BhLuZQ/exec",
};

const Api = (() => {
  async function chamar(action, payload = {}) {
    if (!API_CONFIG.URL || API_CONFIG.URL.includes("COLE_AQUI")) {
      throw new ApiError(
        "A URL da API ainda não foi configurada. Edite js/api.js e informe a URL do seu Google Apps Script.",
      );
    }

    const corpo = JSON.stringify({ action, ...payload });

    let resposta;
    try {
      resposta = await fetch(API_CONFIG.URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: corpo,
        redirect: "follow",
      });
    } catch (erroDeRede) {
      throw new ApiError(
        "Não foi possível conectar à API. Verifique sua internet e a URL configurada.",
      );
    }

    if (!resposta.ok) {
      throw new ApiError(`A API respondeu com erro HTTP ${resposta.status}.`);
    }

    let json;
    try {
      json = await resposta.json();
    } catch (erroDeParse) {
      throw new ApiError(
        "A API retornou uma resposta inválida (não é um JSON válido).",
      );
    }

    if (!json || json.sucesso !== true) {
      throw new ApiError(
        (json && json.mensagem) || "A API retornou uma falha desconhecida.",
      );
    }

    return json.dados;
  }

  function loginAdmin(usuario, senhaHash) {
    return chamar("loginAdmin", { usuario, senhaHash });
  }

  function loginAluno(id, senhaHash) {
    return chamar("loginAluno", { id, senhaHash });
  }

  function alterarSenhaAdmin(usuario, senhaAtualHash, novaSenhaHash) {
    return chamar("alterarSenhaAdmin", {
      usuario,
      senhaAtualHash,
      novaSenhaHash,
    });
  }

  function listarAlunos(token) {
    return chamar("listarAlunos", { token });
  }

  function buscarAluno(token, id) {
    return chamar("buscarAluno", { token, id });
  }

  function criarAluno(token, aluno) {
    return chamar("criarAluno", { token, aluno });
  }

  function editarAluno(token, id, aluno) {
    return chamar("editarAluno", { token, id, aluno });
  }

  function excluirAluno(token, id) {
    return chamar("excluirAluno", { token, id });
  }

  function atualizarTreino(token, id, treino) {
    return chamar("atualizarTreino", {
      token,
      id,
      treino: JSON.stringify(treino),
    });
  }

  function getPersonalInfo(token) {
    return chamar("getPersonalInfo", { token });
  }

  function atualizarPersonalInfo(token, usuario, personalNome, personalCREF) {
    return chamar("atualizarPersonalInfo", {
      token,
      usuario,
      personalNome,
      personalCREF,
    });
  }

  function listarAvaliacoes(token, alunoId) {
    return chamar("listarAvaliacoes", { token, alunoId });
  }

  function criarAvaliacao(token, alunoId, dados) {
    return chamar("criarAvaliacao", {
      token,
      alunoId,
      ...dados,
      altura: dados.altura || "",
    });
  }

  function editarAvaliacao(token, id, dados) {
    return chamar("editarAvaliacao", {
      token,
      id,
      ...dados,
      altura: dados.altura || "",
    });
  }

  function excluirAvaliacao(token, id) {
    return chamar("excluirAvaliacao", { token, id });
  }

  function listarAvaliacoesAluno(alunoId) {
    return chamar("listarAvaliacoesAluno", { alunoId });
  }

  return {
    loginAdmin,
    loginAluno,
    alterarSenhaAdmin,
    listarAlunos,
    buscarAluno,
    criarAluno,
    editarAluno,
    excluirAluno,
    atualizarTreino,
    getPersonalInfo,
    atualizarPersonalInfo,
    listarAvaliacoes,
    criarAvaliacao,
    editarAvaliacao,
    excluirAvaliacao,
    listarAvaliacoesAluno,
  };
})();

class ApiError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = "ApiError";
  }
}
