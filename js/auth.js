const Auth = (() => {
  const CHAVE_ADMIN_TOKEN = "edfisica_admin_token";
  const CHAVE_ADMIN_USUARIO = "edfisica_admin_usuario";
  const CHAVE_ADMIN_PERSONAL_NOME = "edfisica_admin_personal_nome";
  const CHAVE_ADMIN_PERSONAL_CREF = "edfisica_admin_personal_cref";
  const CHAVE_ALUNO_DADOS = "edfisica_aluno_dados";

  async function loginAdmin(usuario, senha) {
    const senhaHash = await CryptoUtil.hashComSalt(usuario, senha);
    const dados = await Api.loginAdmin(usuario, senhaHash);
    sessionStorage.setItem(CHAVE_ADMIN_TOKEN, dados.token);
    sessionStorage.setItem(CHAVE_ADMIN_USUARIO, dados.usuario);
    sessionStorage.setItem(CHAVE_ADMIN_PERSONAL_NOME, dados.personalNome || "");
    sessionStorage.setItem(CHAVE_ADMIN_PERSONAL_CREF, dados.personalCREF || "");
    return dados;
  }

  function logoutAdmin() {
    sessionStorage.removeItem(CHAVE_ADMIN_TOKEN);
    sessionStorage.removeItem(CHAVE_ADMIN_USUARIO);
    window.location.href = "admin-edfisica.html";
  }

  function getTokenAdmin() {
    return sessionStorage.getItem(CHAVE_ADMIN_TOKEN);
  }

  function getUsuarioAdmin() {
    return sessionStorage.getItem(CHAVE_ADMIN_USUARIO);
  }

  function estaLogadoComoAdmin() {
    return Boolean(getTokenAdmin());
  }

  function exigirAdmin() {
    if (!estaLogadoComoAdmin()) {
      window.location.href = "admin-edfisica.html";
      return false;
    }
    return true;
  }

  function getPersonalNome() {
    return sessionStorage.getItem(CHAVE_ADMIN_PERSONAL_NOME) || "";
  }

  function getPersonalCREF() {
    return sessionStorage.getItem(CHAVE_ADMIN_PERSONAL_CREF) || "";
  }

  async function atualizarPersonalInfo(personalNome, personalCREF) {
    const usuario = getUsuarioAdmin();
    const dados = await Api.atualizarPersonalInfo(
      getTokenAdmin(),
      usuario,
      personalNome,
      personalCREF,
    );
    sessionStorage.setItem(CHAVE_ADMIN_PERSONAL_NOME, personalNome);
    sessionStorage.setItem(CHAVE_ADMIN_PERSONAL_CREF, personalCREF);
    return dados;
  }

  async function alterarSenhaAdmin(senhaAtual, novaSenha) {
    const usuario = getUsuarioAdmin();
    const senhaAtualHash = await CryptoUtil.hashComSalt(usuario, senhaAtual);
    const novaSenhaHash = await CryptoUtil.hashComSalt(usuario, novaSenha);
    return Api.alterarSenhaAdmin(usuario, senhaAtualHash, novaSenhaHash);
  }

  async function loginAluno(id, senha) {
    const senhaHash = await CryptoUtil.hashComSalt(id, senha);
    const dados = await Api.loginAluno(id, senhaHash);
    sessionStorage.setItem(CHAVE_ALUNO_DADOS, JSON.stringify(dados));
    return dados;
  }

  function getDadosAluno() {
    const raw = sessionStorage.getItem(CHAVE_ALUNO_DADOS);
    return raw ? JSON.parse(raw) : null;
  }

  function logoutAluno() {
    sessionStorage.removeItem(CHAVE_ALUNO_DADOS);
    window.location.href = "index.html";
  }

  function exigirAluno() {
    if (!getDadosAluno()) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  return {
    loginAdmin,
    logoutAdmin,
    getTokenAdmin,
    getUsuarioAdmin,
    getPersonalNome,
    getPersonalCREF,
    atualizarPersonalInfo,
    estaLogadoComoAdmin,
    exigirAdmin,
    alterarSenhaAdmin,
    loginAluno,
    getDadosAluno,
    logoutAluno,
    exigirAluno,
  };
})();
