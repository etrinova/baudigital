// script.js (Para a página do Aluno - index.html)

document.addEventListener('DOMContentLoaded', () => {
  const cardapioItensDiv = document.getElementById('cardapio-itens-aluno')
  const confirmarEscolhaBtn = document.getElementById('confirmar-escolha-aluno')
  const currentDateSpan = document.getElementById('current-date')
  const currentTimeSpan = document.getElementById('current-time')
  const turnosButtons = document.querySelectorAll('.btn-turno')
  const loadingMessageAluno = document.getElementById('loading-message-aluno')

  const btnAtivarModoContagem = document.getElementById('btnAtivarModoContagem')
  const btnSairModoContagem = document.getElementById('btnSairModoContagem')
  const modoContagemTitulo = document.querySelector('.modo-contagem-titulo')

  let selectedTurno = 'Manhã'

  turnosButtons.forEach((button) => {
    if (button.classList.contains('active')) {
      selectedTurno = button.dataset.turno
    }
  })

  function updateDateTime() {
    const now = new Date()
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }
    if (currentDateSpan)
      currentDateSpan.textContent = now.toLocaleDateString('pt-BR', dateOptions)
    if (currentTimeSpan)
      currentTimeSpan.textContent = now.toLocaleTimeString('pt-BR', timeOptions)
  }
  setInterval(updateDateTime, 1000)
  updateDateTime()

  function entrarModoContagem() {
    document.body.classList.add('modo-contagem-ativo')
    if (btnSairModoContagem) btnSairModoContagem.style.display = 'inline-block'
    if (modoContagemTitulo) modoContagemTitulo.style.display = 'block'
    if (btnAtivarModoContagem) btnAtivarModoContagem.style.display = 'none' // Esconde o botão de ativar
    // Forçar recálculo de layout para alguns navegadores em modo fullscreen ou com position:fixed
    window.dispatchEvent(new Event('resize'))
    carregarCardapioAluno() // Recarrega para aplicar estilos maiores se necessário
  }

  function sairModoContagem() {
    document.body.classList.remove('modo-contagem-ativo')
    if (btnSairModoContagem) btnSairModoContagem.style.display = 'none'
    if (modoContagemTitulo) modoContagemTitulo.style.display = 'none'
    if (btnAtivarModoContagem)
      btnAtivarModoContagem.style.display = 'inline-block' // Mostra o botão de ativar novamente
    window.dispatchEvent(new Event('resize'))
    carregarCardapioAluno() // Recarrega para aplicar estilos normais
  }

  if (btnAtivarModoContagem) {
    btnAtivarModoContagem.addEventListener('click', entrarModoContagem)
  }
  if (btnSairModoContagem) {
    btnSairModoContagem.addEventListener('click', sairModoContagem)
  }

  turnosButtons.forEach((button) => {
    button.addEventListener('click', () => {
      turnosButtons.forEach((btn) => btn.classList.remove('active'))
      button.classList.add('active')
      selectedTurno = button.dataset.turno
      carregarCardapioAluno()
    })
  })

  function loadMerendaData() {
    let contagemMerenda = {}
    let numConfirmacoes = 0
    try {
      const savedContagem = localStorage.getItem('bauMerendaContagem')
      if (savedContagem) contagemMerenda = JSON.parse(savedContagem)
      const savedNumConfirmacoes = localStorage.getItem(
        'bauMerendaNumConfirmacoes'
      )
      if (savedNumConfirmacoes) numConfirmacoes = parseInt(savedNumConfirmacoes)
    } catch (e) {
      console.error('Erro ao carregar dados do localStorage para merenda:', e)
    }
    return { contagemMerenda, numConfirmacoes }
  }

  function saveMerendaData(contagemMerenda, numConfirmacoes) {
    try {
      localStorage.setItem(
        'bauMerendaContagem',
        JSON.stringify(contagemMerenda)
      )
      localStorage.setItem(
        'bauMerendaNumConfirmacoes',
        numConfirmacoes.toString()
      )
    } catch (e) {
      console.error('Erro ao salvar dados de merenda no localStorage:', e)
    }
  }

  function getCardapioFromLocalStorage() {
    try {
      const savedCardapio = localStorage.getItem('cardapioDoDia')
      return savedCardapio ? JSON.parse(savedCardapio) : []
    } catch (e) {
      console.error('Erro ao carregar cardápio do localStorage:', e)
      return []
    }
  }

  function carregarCardapioAluno() {
    if (loadingMessageAluno) loadingMessageAluno.style.display = 'block'
    if (cardapioItensDiv) cardapioItensDiv.innerHTML = ''
    if (confirmarEscolhaBtn) {
      confirmarEscolhaBtn.disabled = true
      confirmarEscolhaBtn.classList.add('disabled')
    }

    const cardapioCompleto = getCardapioFromLocalStorage()
    const cardapioFiltrado = cardapioCompleto.filter(
      (item) => item.periodo === selectedTurno || item.periodo === 'Todos'
    )

    if (cardapioFiltrado.length === 0) {
      if (cardapioItensDiv)
        cardapioItensDiv.innerHTML = `<p class="info-message">Nenhum item de merenda disponível para o turno da ${selectedTurno.toLowerCase()} hoje.</p>`
      if (confirmarEscolhaBtn) {
        confirmarEscolhaBtn.disabled = true
        confirmarEscolhaBtn.classList.add('disabled')
      }
    } else {
      if (confirmarEscolhaBtn) {
        confirmarEscolhaBtn.disabled = false
        confirmarEscolhaBtn.classList.remove('disabled')
      }
      cardapioFiltrado.forEach((item) => {
        const card = document.createElement('div')
        card.classList.add('item-merenda-chic', 'item-sem-imagem')
        card.dataset.id = item.id
        card.innerHTML = `<p class="nome-alimento-destacado">${item.nome}</p>`

        if (item.tipo === 'unidade') {
          const quantityControl = document.createElement('div')
          quantityControl.classList.add('quantity-control')
          quantityControl.innerHTML = `
                      <button class="quantity-btn decrease-btn" data-item-id="${item.id}">-</button>
                      <span class="item-quantity" id="quantity-${item.id}">0</span>
                      <button class="quantity-btn increase-btn" data-item-id="${item.id}">+</button>
                  `
          card.appendChild(quantityControl)
          quantityControl
            .querySelector('.increase-btn')
            .addEventListener('click', (event) => {
              /* ... (lógica existente) ... */
              event.stopPropagation()
              const itemId = event.target.dataset.itemId
              const quantitySpan = document.getElementById(`quantity-${itemId}`)
              if (quantitySpan) {
                let currentQuantity = parseInt(quantitySpan.textContent)
                currentQuantity++
                quantitySpan.textContent = currentQuantity
                card.classList.add('selected')
              }
            })
          quantityControl
            .querySelector('.decrease-btn')
            .addEventListener('click', (event) => {
              /* ... (lógica existente) ... */
              event.stopPropagation()
              const itemId = event.target.dataset.itemId
              const quantitySpan = document.getElementById(`quantity-${itemId}`)
              if (quantitySpan) {
                let currentQuantity = parseInt(quantitySpan.textContent)
                if (currentQuantity > 0) {
                  currentQuantity--
                  quantitySpan.textContent = currentQuantity
                  if (currentQuantity === 0) card.classList.remove('selected')
                }
              }
            })
        } else {
          const checkmark = document.createElement('div')
          checkmark.classList.add('selection-checkmark')
          checkmark.innerHTML = '✓'
          card.appendChild(checkmark)
          card.addEventListener('click', () =>
            toggleSelecaoMerenda(card, item.id)
          )
        }
        if (cardapioItensDiv) cardapioItensDiv.appendChild(card)
      })
    }
    if (loadingMessageAluno) loadingMessageAluno.style.display = 'none'
  }

  function toggleSelecaoMerenda(card, itemId) {
    card.classList.toggle('selected')
  }

  if (confirmarEscolhaBtn) {
    confirmarEscolhaBtn.addEventListener('click', () => {
      let { contagemMerenda, numConfirmacoes } = loadMerendaData()
      const cardapioCompleto = getCardapioFromLocalStorage()
      const cardapioVisivel = cardapioCompleto.filter(
        (item) => item.periodo === selectedTurno || item.periodo === 'Todos'
      )
      let totalItensEscolhidos = 0

      cardapioVisivel.forEach((item) => {
        const cardElement = document.querySelector(
          `.item-merenda-chic[data-id="${item.id}"]`
        )
        if (!cardElement) return
        if (item.tipo === 'unidade') {
          const quantitySpan = document.getElementById(`quantity-${item.id}`)
          if (quantitySpan) {
            const quantity = parseInt(quantitySpan.textContent)
            if (quantity > 0) {
              contagemMerenda[item.id] =
                (contagemMerenda[item.id] || 0) + quantity
              totalItensEscolhidos += quantity
            }
          }
        } else {
          if (cardElement.classList.contains('selected')) {
            contagemMerenda[item.id] = (contagemMerenda[item.id] || 0) + 1
            totalItensEscolhidos++
          }
        }
      })

      if (totalItensEscolhidos > 0) {
        numConfirmacoes++
        saveMerendaData(contagemMerenda, numConfirmacoes)
        alert('Sua escolha foi registrada com sucesso! Bom apetite!')
        document
          .querySelectorAll('.item-merenda-chic.selected')
          .forEach((card) => card.classList.remove('selected'))
        document
          .querySelectorAll('.item-quantity')
          .forEach((span) => (span.textContent = '0'))

        // Sair do modo contagem automaticamente após confirmar, se estiver ativo
        if (document.body.classList.contains('modo-contagem-ativo')) {
          setTimeout(sairModoContagem, 300) // Pequeno delay para o alert ser visto
        }
      } else {
        alert(
          'Por favor, selecione ao menos um item da merenda ou defina a quantidade.'
        )
      }
    })
  }

  carregarCardapioAluno()

  window.addEventListener('storage', (event) => {
    if (event.key === 'cardapioDoDia') {
      carregarCardapioAluno()
    }
  })
})
