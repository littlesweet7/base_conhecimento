let dados = JSON.parse(localStorage.getItem("minhaBaseConhecimento")) || [];
let itemEmEdicaoId = null;

function salvarNoLocalStorage() {
    try {
        localStorage.setItem("minhaBaseConhecimento", JSON.stringify(dados));
    } catch (e) {
        alert("Limite de armazenamento atingido. Tente enviar imagens menores.");
    }
}

function alternarFormulario() {
    const areaCadastro = document.getElementById("areaCadastro");
    const btnToggle = document.getElementById("btnToggle");

    areaCadastro.classList.toggle("escondido");

    if (areaCadastro.classList.contains("escondido")) {
        btnToggle.textContent = "+ Adicionar Nova Informação";
        limparEFecharFormulario();
    } else {
        btnToggle.textContent = "✕ Fechar Formulário";
    }
}

// Cria dinamicamente um novo campo de Passo no formulário
function adicionarCampoPasso(texto = "", imagemExistente = "") {
    const container = document.getElementById("containerPassos");
    const index = container.children.length + 1;

    const div = document.createElement("div");
    div.className = "card-passo-form";
    div.dataset.imgExistente = imagemExistente;

    div.innerHTML = `
        <button type="button" class="btn-remover-passo" onclick="this.parentElement.remove()">✕ Remover</button>
        <label class="rotulo-passo-topo">Passo ${index}:</label>
        <textarea class="texto-passo" placeholder="Descreva esta etapa..." rows="3" required>${texto}</textarea>
        <div class="campo-upload espaco-topo">
            <label class="rotulo-imagem">📸 Imagem:</label>
            <input type="file" class="img-passo" accept="image/*">
        </div>
    `;

    container.appendChild(div);
}

function lerImagemComoBase64(file) {
    return new Promise((resolve) => {
        if (!file) { resolve(""); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
}

function alternarTexto(idDoElemento, btn) {
    const elementoTexto = document.getElementById(idDoElemento);
    
    if (elementoTexto.classList.contains("descricao-curta")) {
        elementoTexto.classList.remove("descricao-curta");
        btn.textContent = "Ver menos ▴";
    } else {
        elementoTexto.classList.add("descricao-curta");
        btn.textContent = "Ver mais... ▾";
    }
}

// Função de busca com botão "Ver mais... / Ver menos" integrado na descrição e passos
function pesquisar() {
    const termo = document.getElementById("campoBusca").value.toLowerCase().trim();
    const filtro = document.getElementById("filtroCategoria").value;
    const containerResultados = document.getElementById("resultados");

    containerResultados.innerHTML = "";

    // 1. Filtragem por palavra-chave (se o campo estiver vazio, traz tudo)
    let resultadosEncontrados = dados.filter(item => {
        if (termo === "") return true;

        const tituloMatch = item.titulo.toLowerCase().includes(termo);
        const descricaoMatch = item.descricao.toLowerCase().includes(termo);
        const palavrasChaveMatch = item.palavrasChave.some(palavra => palavra.toLowerCase().includes(termo));
        return tituloMatch || descricaoMatch || palavrasChaveMatch;
    });

    // 2. Aplicação do Filtro
    if (filtro === "favoritos") {
        resultadosEncontrados = resultadosEncontrados.filter(item => item.favorito);
    } else if (filtro === "guias") {
        resultadosEncontrados = resultadosEncontrados.filter(item => item.passos && item.passos.length > 0);
    }

    // 3. Ordenação
    resultadosEncontrados.sort((a, b) => (b.favorito ? 1 : 0) - (a.favorito ? 1 : 0));

    // 4. Renderização
    if (resultadosEncontrados.length > 0) {
        resultadosEncontrados.forEach(item => {
            const divCartao = document.createElement("div");
            divCartao.className = `cartao ${item.favorito ? 'cartao-favorito' : ''}`;

            const tagImagem = item.imagem ? `<img src="${item.imagem}" class="imagem-cartao">` : "";

            let htmlPassos = "";
            if (item.passos && item.passos.length > 0) {
                htmlPassos = `<div class="lista-passos">`;
                item.passos.forEach((p, idx) => {
                    const imgP = p.imagem ? `<img src="${p.imagem}" class="imagem-cartao">` : "";
                    htmlPassos += `
                        <div class="item-passo">
                            <span class="numero-passo">Passo ${idx + 1}</span>
                            <p>${p.texto}</p>
                            ${imgP}
                        </div>
                    `;
                });
                htmlPassos += `</div>`;
            }

            const iconeFav = item.favorito ? "⭐" : "☆";

            divCartao.innerHTML = `
                <!-- Botões no topo direito -->
                <div class="acoes-cartao-topo">
                    <button class="btn-editar" onclick="carregarParaEdicao(${item.id})">✏️ Editar</button>
                    <button class="btn-excluir" onclick="excluirItem(${item.id})">✕ Excluir</button>
                </div>

                <!-- Título -->
                <h3>${item.titulo}</h3>

                <!-- Conteúdo direto (sem botão Ver Mais) -->
                <div class="conteudo-cartao">
                    <p>${item.descricao}</p>
                    ${tagImagem}
                    ${htmlPassos}
                </div>

                <!-- Botões no canto inferior direito -->
                <div class="acoes-cartao-base">
                    <button class="btn-copiar" onclick="copiarConteudo(${item.id})" title="Copiar Texto">📋</button>
                    <button class="btn-favorito" onclick="alternarFavorito(${item.id})" title="Favoritar">${iconeFav}</button>
                </div>
            `;
            containerResultados.appendChild(divCartao);
        });
    } else {
        containerResultados.innerHTML = "<p style='color: white;'>Nenhum item cadastrado ou encontrado.</p>";
    }
}

// Alterna o status de favorito (marcado/desmarcado)
function alternarFavorito(id) {
    const item = dados.find(i => i.id === id);
    if (item) {
        item.favorito = !item.favorito;
        salvarNoLocalStorage();
        pesquisar();
    }
}

// Copia a descrição e os passos do cartão para a área de transferência
function copiarConteudo(id) {
    const item = dados.find(i => i.id === id);
    if (!item) return;

    let textoParaCopiar = `${item.titulo}\n\n${item.descricao}`;

    if (item.passos && item.passos.length > 0) {
        textoParaCopiar += "\n\nPasso a Passo:\n";
        item.passos.forEach((p, idx) => {
            textoParaCopiar += `${idx + 1}. ${p.texto}\n`;
        });
    }

    navigator.clipboard.writeText(textoParaCopiar).then(() => {
        alert("Conteúdo copiado para a área de transferência!");
    }).catch(() => {
        alert("Não foi possível copiar o texto.");
    });
}

async function carregarParaEdicao(id) {
    const item = dados.find(i => i.id === id);
    if (!item) return;

    itemEmEdicaoId = id;

    document.getElementById("novoTitulo").value = item.titulo;
    document.getElementById("novaDescricao").value = item.descricao;
    document.getElementById("novasPalavrasChave").value = item.palavrasChave.join(", ");

    document.getElementById("containerPassos").innerHTML = "";
    if (item.passos && item.passos.length > 0) {
        item.passos.forEach(p => adicionarCampoPasso(p.texto, p.imagem));
    }

    document.querySelector("#areaCadastro h2").textContent = "Editar Informação";
    document.querySelector("#formCadastro button[type='submit']").textContent = "💾 Atualizar Alterações";

    const areaCadastro = document.getElementById("areaCadastro");
    if (areaCadastro.classList.contains("escondido")) {
        alternarFormulario();
    }
    areaCadastro.scrollIntoView({ behavior: 'smooth' });
}

async function adicionarItem(event) {
    event.preventDefault();

    const titulo = document.getElementById("novoTitulo").value.trim();
    const descricao = document.getElementById("novaDescricao").value.trim();
    const palavrasChaveTexto = document.getElementById("novasPalavrasChave").value;
    const palavrasChave = palavrasChaveTexto.split(",").map(p => p.trim().toLowerCase());

    const arquivoImagem = document.getElementById("novaImagem").files[0];
    let imagemBase64 = await lerImagemComoBase64(arquivoImagem);

    const elementosPassos = document.querySelectorAll(".card-passo-form");
    const listaPassos = [];

    for (let card of elementosPassos) {
        const textoPasso = card.querySelector(".texto-passo").value.trim();
        const fileInput = card.querySelector(".img-passo").files[0];
        let imgPassoBase64 = await lerImagemComoBase64(fileInput);

        if (!imgPassoBase64 && card.dataset.imgExistente) {
            imgPassoBase64 = card.dataset.imgExistente;
        }

        if (textoPasso !== "") {
            listaPassos.push({ texto: textoPasso, imagem: imgPassoBase64 });
        }
    }

    if (itemEmEdicaoId !== null) {
        const index = dados.findIndex(i => i.id === itemEmEdicaoId);
        if (index !== -1) {
            dados[index].titulo = titulo;
            dados[index].descricao = descricao;
            dados[index].palavrasChave = palavrasChave;
            if (imagemBase64 !== "") dados[index].imagem = imagemBase64;
            dados[index].passos = listaPassos;
        }
        alert("Informação atualizada com sucesso!");
    } else {
        const novoItem = {
            id: Date.now(),
            titulo: titulo,
            descricao: descricao,
            palavrasChave: palavrasChave,
            imagem: imagemBase64,
            passos: listaPassos
        };
        dados.push(novoItem);
        alert("Informação salva com sucesso!");
    }

    salvarNoLocalStorage();
    limparEFecharFormulario();
    document.getElementById("campoBusca").value = titulo;
    pesquisar();
}

function limparEFecharFormulario() {
    itemEmEdicaoId = null;
    document.getElementById("formCadastro").reset();
    document.getElementById("containerPassos").innerHTML = "";
    document.querySelector("#areaCadastro h2").textContent = "Cadastrar Nova Informação";
    document.querySelector("#formCadastro button[type='submit']").textContent = "+ Salvar no Sistema";
    
    const areaCadastro = document.getElementById("areaCadastro");
    if (!areaCadastro.classList.contains("escondido")) {
        areaCadastro.classList.add("escondido");
        document.getElementById("btnToggle").textContent = "+ Adicionar Nova Informação";
    }
}

function excluirItem(id) {
    if (confirm("Tem certeza que deseja excluir esta informação?")) {
        dados = dados.filter(item => item.id !== id);
        salvarNoLocalStorage();
        pesquisar();
    }
}

document.getElementById("campoBusca").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        pesquisar();
    }
});

function exportarDados() {
    if (dados.length === 0) {
        alert("Não há dados para exportar!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dados, null, 2));
    const elementoDownload = document.createElement('a');
    elementoDownload.setAttribute("href", dataStr);
    elementoDownload.setAttribute("download", `backup_conhecimento_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(elementoDownload);
    elementoDownload.click();
    elementoDownload.remove();
}

function importarDados(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            if (Array.isArray(dadosImportados)) {
                if (confirm("Isso vai substituir/adicionar as informações atuais pelas do arquivo. Deseja continuar?")) {
                    dados = dadosImportados;
                    salvarNoLocalStorage();
                    alert("Backup restaurado com sucesso!");
                    location.reload();
                }
            } else {
                alert("O arquivo selecionado não é um backup válido.");
            }
        } catch (erro) {
            alert("Erro ao ler o arquivo de backup.");
        }
    };
    leitor.readAsText(arquivo);
}