const CryptoUtil = (() => {
  async function sha256(texto) {
    const encoder = new TextEncoder();
    const dados = encoder.encode(texto);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", dados);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function hashComSalt(id, senha) {
    return sha256(`${id.trim().toLowerCase()}::${senha}`);
  }

  return { sha256, hashComSalt };
})();
