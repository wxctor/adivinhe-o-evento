const firebaseConfig = {
  apiKey: "AIzaSyAXuoVd26aPIorOYdYu7b7jaUSUN-tCfVk",
  authDomain: "quizz-9c159.firebaseapp.com",
  projectId: "quizz-9c159",
  storageBucket: "quizz-9c159.firebasestorage.app",
  messagingSenderId: "879995262097",
  appId: "1:879995262097:web:e1a11e2326612067661b30",
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Elementos
const btnEntrar = document.getElementById("btnEntrar");
const loginModal = document.getElementById("loginModal");
const btnLogin = document.getElementById("btnLogin");
const btnCadastro = document.getElementById("btnCadastro");
const quizArea = document.getElementById("quizArea");
const erroLogin = document.getElementById("erroLogin");
const trocarModo = document.getElementById("trocarModo");
const modalTitulo = document.getElementById("modalTitulo");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const nomeUsuario = document.getElementById("nomeUsuario");
const pontuacaoUsuario = document.getElementById("pontuacaoUsuario");
const btnLogout = document.getElementById("btnLogout");
const pontuacaoContainer = document.getElementById("pontuacaoContainer");
const usuarioInfo = document.getElementById("usuarioInfo");
const tituloRanking = document.getElementById("tituloRanking");

let modoCadastro = false;

function isExcecaoEmail(email) {
  return true; // Verificação desabilitada
}

async function obterIPUsuario() {
  try {
    const resposta = await fetch("https://ipinfo.io/json");
    const dados = await resposta.json();
    return dados.ip || "IP-desconhecido";
  } catch (error) {
    console.error("Erro ao obter IP:", error);
    return "Erro-ao-obter-IP";
  }
}

const btnFechar = document.getElementById("btnFechar");
btnFechar.addEventListener("click", () => {
  loginModal.style.display = "none";
  erroLogin.textContent = "";
});

loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) {
    loginModal.style.display = "none";
    erroLogin.textContent = "";
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && loginModal.style.display === "flex") {
    loginModal.style.display = "none";
    erroLogin.textContent = "";
  }
});

trocarModo.addEventListener("click", () => {
  modoCadastro = !modoCadastro;
  erroLogin.textContent = "";

  if (modoCadastro) {
    modalTitulo.textContent = "Cadastro";
    btnLogin.style.display = "none";
    btnCadastro.style.display = "inline-block";
    nomeInput.style.display = "block";
    trocarModo.textContent = "Já tenho conta";
  } else {
    modalTitulo.textContent = "Login";
    btnLogin.style.display = "inline-block";
    btnCadastro.style.display = "none";
    nomeInput.style.display = "none";
    trocarModo.textContent = "Criar nova conta";
  }
});

btnEntrar.addEventListener("click", () => {
  loginModal.style.display = "flex";
});

async function mostrarQuiz(user = null) {
  quizArea.style.display = "block";
  loginModal.style.display = "none";

  if (user) {
    btnEntrar.style.display = "none";
    pontuacaoContainer.style.display = "block";

    try {
      const doc = await db.collection("usuarios").doc(user.uid).get();
      const dados = doc.data();

      usuarioInfo.style.display = "flex";
      const nomeCompleto = dados?.nome || user.email;
      const nomeCurto = nomeCompleto.split(" ").slice(0, 2).join(" "); // pega até 2 primeiros nomes
      nomeUsuario.textContent = nomeCurto;
      pontuacaoUsuario.textContent = dados?.pontuacao || 0;
    } catch (error) {
      console.error("Erro ao carregar os seus dados");
    }
  } else {
    usuarioInfo.style.display = "none";
    nomeUsuario.textContent = "";
    pontuacaoUsuario.textContent = "";
    pontuacaoContainer.style.display = "none";
  }
}

btnLogin.addEventListener("click", async () => {
  const email = emailInput.value;
  const senha = senhaInput.value;
  erroLogin.textContent = "";

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, senha);
    const user = userCredential.user;
    console.log("Usuário logado:", user);

    const ipUsuario = await obterIPUsuario();
    await db.collection("usuarios").doc(user.uid).update({
      ultimoIP: ipUsuario,
    });

    await mostrarQuiz(user);
  } catch (error) {
    erroLogin.textContent = "Email ou senha incorretos!";
  }
});

btnCadastro.addEventListener("click", async () => {
  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  erroLogin.textContent = "";
  erroLogin.style.color = "red";

  if (!nome || !email || !senha) {
    erroLogin.textContent = "Preencha todos os campos!";
    return;
  }

  if (senha.length < 6) {
    erroLogin.textContent = "Crie uma senha com no mínimo 6 caracteres.";
    return;
  }

  try {
    const snapshotNome = await db
      .collection("usuarios")
      .where("nome", "==", nome)
      .get();

    if (!snapshotNome.empty) {
      erroLogin.textContent = "Nome de usuário já está em uso!";
      return;
    }

    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      senha
    );
    const user = userCredential.user;

    const ipUsuario = await obterIPUsuario();
    await db.collection("usuarios").doc(user.uid).set({
      nome,
      email,
      pontuacao: 0,
      criadoEm: new Date(),
      ip: ipUsuario,
    });

    modoCadastro = false;
    modalTitulo.textContent = "Login";
    btnLogin.style.display = "inline-block";
    btnCadastro.style.display = "none";
    nomeInput.style.display = "none";
    trocarModo.style.display = "inline-block";
    trocarModo.textContent = "Criar nova conta";
    erroLogin.textContent = "";

    await auth.signOut(); // desloga
    console.log("👋 Usuário deslogado após cadastro.");

    // Redireciona visualmente para o login (mantém o modal aberto)
    modoCadastro = false;
    modalTitulo.textContent = "Login";
    btnLogin.style.display = "inline-block";
    btnCadastro.style.display = "none";
    nomeInput.style.display = "none";
    trocarModo.style.display = "inline-block";
    trocarModo.textContent = "Criar nova conta";
    erroLogin.style.color = "green";
    erroLogin.textContent = "Faça login para continuar.";
    loginModal.style.display = "flex"; // garante que o modal fique aberto
  } catch (error) {
    console.error("❌ Erro geral no cadastro:", error);
    if (error.code === "auth/email-already-in-use") {
      erroLogin.textContent = "Email já está em uso!";
    } else if (error.code === "auth/invalid-email") {
      erroLogin.textContent = "Email inválido!";
    } else {
      erroLogin.textContent = "Erro ao cadastrar.";
    }
  }
});

btnEntrar.addEventListener("click", () => {
  modoCadastro = true; // 👉 força modo cadastro
  erroLogin.textContent = "";
  loginModal.style.display = "flex";

  // Define elementos visuais para cadastro
  modalTitulo.textContent = "Cadastro";
  btnLogin.style.display = "none";
  btnCadastro.style.display = "inline-block";
  nomeInput.style.display = "block";
  trocarModo.textContent = "Já tenho conta";
});

btnLogout.addEventListener("click", async () => {
  await auth.signOut();
  btnEntrar.style.display = "inline-block";
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const ip = await obterIPUsuario();
    await db.collection("usuarios").doc(user.uid).update({ ip });

    await mostrarQuiz(user);
    btnLogout.style.display = "inline-block";
    btnEntrar.style.display = "none";
  } else {
    mostrarQuiz();
    btnEntrar.style.display = "inline-block";
    btnLogout.style.display = "none";
  }

  carregarRanking();
});

async function carregarRanking() {
  try {
    const snapshot = await db
      .collection("usuarios")
      .where("pontuacao", ">", 0)
      .orderBy("pontuacao", "desc")
      .limit(10)
      .get();

    const rankingArray = [];

    snapshot.forEach((doc) => {
      const dados = doc.data();
      rankingArray.push({
        nome: dados.nome || "Sem nome",
        pontuacao: parseInt(dados.pontuacao) || 0,
      });
    });

    await db.collection("rankings_publicos").doc("top10").set({
      atualizadoEm: new Date(),
      lista: rankingArray,
    });

    console.log("✅ Ranking atualizado no Firestore.");
  } catch (error) {
    console.error("❌ Erro ao atualizar ranking:", error);
  }

  const rankingContainer = document.getElementById("rankingContainer");
  const tituloRanking = document.getElementById("tituloRanking");
  if (rankingContainer) rankingContainer.style.display = "none";
  if (tituloRanking) tituloRanking.style.display = "none";
}

document.getElementById("evento").addEventListener("click", async () => {
  const user = auth.currentUser;

  if (user) {
    window.location.href = "evento.html";
  } else {
    alert("Faça login para jogar.");
    loginModal.style.display = "flex";
    modoCadastro = false;
    modalTitulo.textContent = "Login";
    btnLogin.style.display = "inline-block";
    btnCadastro.style.display = "none";
    nomeInput.style.display = "none";
    trocarModo.style.display = "inline-block";
    trocarModo.textContent = "Criar nova conta";
  }
});
