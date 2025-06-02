// admin_script.js (Para a página da Merendeira - admin.html)

document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section')
  const adminPanelSection = document.getElementById('admin-panel-section')

  const loginForm = document.getElementById('login-form')
  const cadastroForm = document.getElementById('cadastro-form')
  const showCadastroBtn = document.getElementById('show-cadastro-btn')
  const hideCadastroBtn = document.getElementById('hide-cadastro-btn')
  const authMessage = document.getElementById('auth-message')
  const logoutBtn = document.getElementById('logout-btn')

  const relatorioContagemDiv = document.getElementById(
    'relatorio-contagem-merendeira'
  )
  const gerarRelatorioPdfBtn = document.getElementById(
    'gerar-relatorio-pdf-merendeira'
  )
  const resetDadosBtn = document.getElementById('reset-dados-btn')

  const addItemForm = document.getElementById('add-item-form')
  const itemNomeInput = document.getElementById('item-nome')
  const itemTipoSelect = document.getElementById('item-tipo')
  const itemPeriodoSelect = document.getElementById('item-periodo')
  const cardapioListAdmin = document.getElementById('cardapio-list-admin')

  let merendaChart // Gráfico de demanda geral por item
  let demandaPorPeriodoChartInstance // Novo gráfico de demanda por período

  function registerUser(username, password) {
    if (localStorage.getItem('merendeira_' + username)) {
      if (authMessage) {
        authMessage.textContent = 'Usuário já existe!'
        authMessage.style.color = 'var(--error-red)'
      }
      return false
    }
    localStorage.setItem('merendeira_' + username, password)
    if (authMessage) {
      authMessage.textContent = 'Cadastro realizado com sucesso! Faça login.'
      authMessage.style.color = 'var(--accent-color)'
    }
    return true
  }

  function loginUser(username, password) {
    if (localStorage.getItem('merendeira_' + username) === password) {
      sessionStorage.setItem('loggedInUser', username)
      if (authMessage) authMessage.textContent = ''
      return true
    }
    if (authMessage) {
      authMessage.textContent = 'Usuário ou senha inválidos.'
      authMessage.style.color = 'var(--error-red)'
    }
    return false
  }

  function checkLogin() {
    if (sessionStorage.getItem('loggedInUser')) {
      if (authSection) authSection.style.display = 'none'
      if (adminPanelSection) adminPanelSection.style.display = 'flex'
      document.body.classList.add('admin-logged-in') // Adiciona classe ao body
      carregarCardapioAdmin()
      atualizarRelatorioAdmin()
      return true
    }
    // Se não estiver logado
    if (authSection) authSection.style.display = 'block'
    if (adminPanelSection) adminPanelSection.style.display = 'none'
    document.body.classList.remove('admin-logged-in') // Remove classe do body
    return false
  }

  function logout() {
    sessionStorage.removeItem('loggedInUser')
    if (authSection) authSection.style.display = 'block'
    if (adminPanelSection) adminPanelSection.style.display = 'none'
    if (authMessage) {
      authMessage.textContent = 'Você saiu.'
      authMessage.style.color = 'var(--text-dark)'
    }
    if (loginForm) loginForm.reset()
    document.body.classList.remove('admin-logged-in') // Remove classe do body ao sair
    if (merendaChart) {
      merendaChart.destroy()
      merendaChart = null
    }
    if (demandaPorPeriodoChartInstance) {
      demandaPorPeriodoChartInstance.destroy()
      demandaPorPeriodoChartInstance = null
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

  function saveCardapioToLocalStorage(cardapio) {
    try {
      localStorage.setItem('cardapioDoDia', JSON.stringify(cardapio))
    } catch (e) {
      console.error('Erro ao salvar cardápio no localStorage:', e)
      alert('Não foi possível salvar o cardápio localmente.')
    }
  }

  function carregarCardapioAdmin() {
    if (!cardapioListAdmin) return
    const cardapio = getCardapioFromLocalStorage()
    cardapioListAdmin.innerHTML = ''
    if (cardapio.length === 0) {
      cardapioListAdmin.innerHTML =
        '<p class="info-message">Nenhum item no cardápio. Adicione novos itens acima.</p>'
    } else {
      cardapio.forEach((item) => {
        const itemDiv = document.createElement('div')
        itemDiv.classList.add('cardapio-item-admin')
        itemDiv.dataset.id = item.id
        itemDiv.innerHTML = `
                    <span class="item-info">
                        ${item.nome}
                        <span class="item-type">(${
                          item.tipo === 'unidade' ? 'Unidade' : 'Porção'
                        })</span>
                        <span class="item-periodo-tag">[${
                          item.periodo || 'N/D'
                        }]</span>
                    </span>
                    <button class="delete-btn" data-id="${
                      item.id
                    }">Remover</button>
                `
        cardapioListAdmin.appendChild(itemDiv)
      })
    }
  }

  if (addItemForm) {
    addItemForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const nome = itemNomeInput.value.trim()
      const icone = `placeholder_icon.png` // Usar um placeholder, já que a imagem do aluno foi removida
      const tipo = itemTipoSelect.value
      const periodo = itemPeriodoSelect.value

      if (nome && periodo) {
        let cardapio = getCardapioFromLocalStorage()
        const newId =
          nome
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/gi, '') +
          '_' +
          Date.now()
        cardapio.push({
          id: newId,
          nome: nome,
          icone: icone,
          tipo: tipo,
          periodo: periodo,
        })
        saveCardapioToLocalStorage(cardapio)
        carregarCardapioAdmin()
        atualizarRelatorioAdmin()
        itemNomeInput.value = ''
        itemTipoSelect.value = 'porcao'
        itemPeriodoSelect.value = 'Manhã'
        alert('Item adicionado ao cardápio!')
      } else {
        alert('Por favor, preencha o nome do alimento e selecione o período.')
      }
    })
  }

  if (cardapioListAdmin) {
    cardapioListAdmin.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const itemIdToDelete = e.target.dataset.id
        if (confirm('Tem certeza que deseja remover este item do cardápio?')) {
          let cardapio = getCardapioFromLocalStorage()
          cardapio = cardapio.filter((item) => item.id !== itemIdToDelete)
          saveCardapioToLocalStorage(cardapio)
          carregarCardapioAdmin()
          atualizarRelatorioAdmin()
          alert('Item removido do cardápio!')
        }
      }
    })
  }

  function loadMerendaDataForReport() {
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
      console.error('Erro ao carregar dados de merenda para relatório:', e)
    }
    return { contagemMerenda, numConfirmacoes }
  }

  function atualizarRelatorioAdmin() {
    if (
      !relatorioContagemDiv &&
      !document.getElementById('merendaChart') &&
      !document.getElementById('demandaPorPeriodoChart')
    )
      return

    const { contagemMerenda, numConfirmacoes } = loadMerendaDataForReport()
    const cardapioDoDia = getCardapioFromLocalStorage()

    if (relatorioContagemDiv) relatorioContagemDiv.innerHTML = ''
    let totalPorcoesGeral = 0

    const demandaPorPeriodoData = { Manhã: 0, Tarde: 0, Noite: 0 }

    if (cardapioDoDia.length === 0) {
      if (relatorioContagemDiv)
        relatorioContagemDiv.innerHTML =
          '<p class="info-message">O cardápio do dia não foi definido.</p>'
      if (merendaChart) {
        merendaChart.destroy()
        merendaChart = null
      }
      if (demandaPorPeriodoChartInstance) {
        demandaPorPeriodoChartInstance.destroy()
        demandaPorPeriodoChartInstance = null
      }
      return
    }

    const chartLabels = []
    const chartData = []
    const defaultColors = [
      'rgba(74, 59, 49, 0.7)',
      'rgba(160, 124, 91, 0.7)',
      'rgba(142, 140, 90, 0.7)',
      'rgba(198, 169, 105, 0.7)',
      'rgba(120, 120, 120, 0.7)',
      'rgba(180, 150, 130, 0.7)',
    ]
    const defaultBorderColors = [
      'rgba(74, 59, 49, 1)',
      'rgba(160, 124, 91, 1)',
      'rgba(142, 140, 90, 1)',
      'rgba(198, 169, 105, 1)',
      'rgba(120, 120, 120, 1)',
      'rgba(180, 150, 130, 1)',
    ]
    let colorIndex = 0

    cardapioDoDia.forEach((item) => {
      const count = contagemMerenda[item.id] || 0
      totalPorcoesGeral += count
      if (relatorioContagemDiv) {
        const p = document.createElement('p')
        p.innerHTML = `${item.nome} (${
          item.tipo === 'unidade' ? 'unidades' : 'porções'
        }): <span>${count}</span> <span class="item-periodo-tag-relatorio">[${
          item.periodo
        }]</span>`
        relatorioContagemDiv.appendChild(p)
      }
      if (count > 0) {
        chartLabels.push(item.nome)
        chartData.push(count)
      }

      if (item.periodo === 'Todos' && count > 0) {
        demandaPorPeriodoData['Manhã'] += count
        demandaPorPeriodoData['Tarde'] += count
        demandaPorPeriodoData['Noite'] += count
      } else if (
        item.periodo &&
        demandaPorPeriodoData.hasOwnProperty(item.periodo) &&
        count > 0
      ) {
        demandaPorPeriodoData[item.periodo] += count
      }
    })
    if (relatorioContagemDiv) {
      const pTotalAlunos = document.createElement('p')
      pTotalAlunos.innerHTML = `<strong>Total de Pratos Solicitados: <span>${numConfirmacoes}</span></strong>`
      relatorioContagemDiv.appendChild(pTotalAlunos)
      const pTotalPorcoes = document.createElement('p')
      pTotalPorcoes.innerHTML = `<strong>Total Geral de Unidades/Porções Solicitadas: <span>${totalPorcoesGeral}</span></strong>`
      relatorioContagemDiv.appendChild(pTotalPorcoes)
    }

    // Gráfico de Demanda Geral por Item
    const merendaChartCanvas = document.getElementById('merendaChart')
    if (merendaChartCanvas) {
      const ctx = merendaChartCanvas.getContext('2d')
      if (merendaChart) merendaChart.destroy()
      if (chartData.length > 0) {
        merendaChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: 'Quantidade Consumida',
                data: chartData,
                backgroundColor: chartData.map(
                  (_, i) => defaultColors[i % defaultColors.length]
                ),
                borderColor: chartData.map(
                  (_, i) => defaultBorderColors[i % defaultBorderColors.length]
                ),
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Quantidade' },
              },
              x: { title: { display: true, text: 'Item de Merenda' } },
            },
            plugins: { legend: { display: false }, title: { display: false } },
          },
        })
      } else {
        if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      }
    }

    // Gráfico de Demanda Agregada por Período
    const demandaPeriodoCanvas = document.getElementById(
      'demandaPorPeriodoChart'
    )
    if (demandaPeriodoCanvas) {
      const ctxPeriodo = demandaPeriodoCanvas.getContext('2d')
      if (demandaPorPeriodoChartInstance)
        demandaPorPeriodoChartInstance.destroy()
      const periodosLabels = Object.keys(demandaPorPeriodoData)
      const periodosDataValues = Object.values(demandaPorPeriodoData)

      if (periodosDataValues.some((d) => d > 0)) {
        demandaPorPeriodoChartInstance = new Chart(ctxPeriodo, {
          type: 'pie',
          data: {
            labels: periodosLabels,
            datasets: [
              {
                label: 'Demanda Agregada',
                data: periodosDataValues,
                backgroundColor: [
                  'rgba(255, 159, 64, 0.7)', // Laranja para Manhã
                  'rgba(54, 162, 235, 0.7)', // Azul para Tarde
                  'rgba(75, 192, 192, 0.7)', // Verde-água para Noite
                ],
                borderColor: [
                  'rgba(255, 159, 64, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, title: { display: false } },
          },
        })
      } else {
        if (ctxPeriodo)
          ctxPeriodo.clearRect(
            0,
            0,
            ctxPeriodo.canvas.width,
            ctxPeriodo.canvas.height
          )
      }
    }
  }

  if (gerarRelatorioPdfBtn) {
    gerarRelatorioPdfBtn.addEventListener('click', async () => {
      const { jsPDF } = window.jspdf
      const doc = new jsPDF('p', 'mm', 'a4')
      let y = 20
      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        dateStyle: 'full',
      })
      const horaAtual = new Date().toLocaleTimeString('pt-BR')

      doc.setFont('Playfair Display', 'bold')
      doc.setFontSize(24)
      doc.text('Relatório de Demanda de Merenda', 105, y, null, null, 'center')
      y += 10
      doc.setFont('Montserrat', 'normal')
      doc.setFontSize(14)
      doc.text(
        `Baú da Merenda Digital - ${dataAtual}`,
        105,
        y,
        null,
        null,
        'center'
      )
      y += 7
      doc.text(`Hora: ${horaAtual}`, 105, y, null, null, 'center')
      y += 15

      doc.setFontSize(16)
      doc.text('Resumo das Solicitações:', 20, y)
      y += 10
      doc.setLineWidth(0.5)
      doc.line(20, y - 2, 190, y - 2)

      const { contagemMerenda, numConfirmacoes } = loadMerendaDataForReport()
      const cardapioDoDia = getCardapioFromLocalStorage()
      let totalPorcoesGeral = 0
      doc.setFont('Montserrat', 'normal')
      doc.setFontSize(10) // Fonte menor para a lista de itens
      cardapioDoDia.forEach((item) => {
        const count = contagemMerenda[item.id] || 0
        totalPorcoesGeral += count
        doc.text(
          `${item.nome} (${item.tipo}, ${item.periodo}): ${count}`,
          25,
          y
        )
        y += 6
        if (y > 270) {
          doc.addPage()
          y = 20
        }
      })
      y += 5
      doc.line(20, y, 190, y)
      y += 10
      doc.setFont('Montserrat', 'bold')
      doc.setFontSize(12)
      doc.text('Total de Pratos Solicitados (Alunos):', 20, y)
      doc.text(`${numConfirmacoes}`, 190, y, null, null, 'right')
      y += 7
      doc.text('Total Geral de Unidades/Porções:', 20, y)
      doc.text(`${totalPorcoesGeral}`, 190, y, null, null, 'right')
      y += 15

      async function addChartToPdf(canvasId, chartInstance, title, currentY) {
        let newY = currentY
        const chartCanvas = document.getElementById(canvasId)
        if (chartCanvas && chartInstance && chartInstance.chartArea) {
          if (newY > 190) {
            doc.addPage()
            newY = 20
          } // Verifica espaço para título + gráfico
          doc.setFont('Montserrat', 'bold')
          doc.setFontSize(14)
          doc.text(title, 105, newY, null, null, 'center')
          newY += 10
          try {
            await chartInstance.update('none')
            const imgData = chartCanvas.toDataURL('image/png', 1.0)
            const imgProps = doc.getImageProperties(imgData)
            const pdfWidth = 160
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
            if (newY + pdfHeight > 280) {
              doc.addPage()
              newY = 20
            } // Nova página se não couber
            doc.addImage(
              imgData,
              'PNG',
              (210 - pdfWidth) / 2,
              newY,
              pdfWidth,
              pdfHeight
            )
            newY += pdfHeight + 10
          } catch (error) {
            console.error(`Erro ao adicionar ${canvasId} ao PDF:`, error)
            doc.text(`Erro ao gerar ${title}.`, 20, newY)
            newY += 10
          }
        } else {
          doc.setFont('Montserrat', 'italic')
          doc.setFontSize(10)
          doc.text(
            `${title} não disponível ou não renderizado.`,
            105,
            newY,
            null,
            null,
            'center'
          )
          newY += 10
        }
        return newY
      }

      y = await addChartToPdf(
        'merendaChart',
        merendaChart,
        'Gráfico: Demanda Geral por Item',
        y
      )
      y = await addChartToPdf(
        'demandaPorPeriodoChart',
        demandaPorPeriodoChartInstance,
        'Gráfico: Demanda Agregada por Período',
        y
      )

      doc.setFont('Montserrat', 'italic')
      doc.setFontSize(10)
      doc.text(
        'Relatório gerado automaticamente pelo Baú da Merenda Digital.',
        105,
        doc.internal.pageSize.height - 10,
        null,
        null,
        'center'
      )
      doc.save(`relatorio_merenda_${new Date().toISOString().slice(0, 10)}.pdf`)
    })
  }

  if (resetDadosBtn) {
    resetDadosBtn.addEventListener('click', () => {
      if (
        confirm(
          'Tem certeza que deseja ZERAR TODOS OS DADOS de merenda do dia? Esta ação não pode ser desfeita.'
        )
      ) {
        localStorage.removeItem('bauMerendaContagem')
        localStorage.removeItem('bauMerendaNumConfirmacoes')
        atualizarRelatorioAdmin()
        alert('Dados da merenda do dia zerados com sucesso!')
      }
    })
  }

  if (showCadastroBtn) {
    showCadastroBtn.addEventListener('click', () => {
      if (loginForm) loginForm.style.display = 'none'
      if (cadastroForm) cadastroForm.style.display = 'block'
      if (authMessage) authMessage.textContent = ''
    })
  }

  if (hideCadastroBtn) {
    hideCadastroBtn.addEventListener('click', () => {
      if (loginForm) loginForm.style.display = 'block'
      if (cadastroForm) cadastroForm.style.display = 'none'
      if (authMessage) authMessage.textContent = ''
    })
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const usuario = document.getElementById('login-usuario').value
      const senha = document.getElementById('login-senha').value
      if (loginUser(usuario, senha)) {
        checkLogin()
      }
    })
  }

  if (cadastroForm) {
    cadastroForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const usuario = document.getElementById('cadastro-usuario').value
      const senha = document.getElementById('cadastro-senha').value
      const confirmarSenha = document.getElementById('confirmar-senha').value

      if (senha !== confirmarSenha) {
        if (authMessage) {
          authMessage.textContent = 'As senhas não coincidem!'
          authMessage.style.color = 'var(--error-red)'
        }
        return
      }
      if (registerUser(usuario, senha)) {
        if (loginForm) loginForm.style.display = 'block'
        if (cadastroForm) {
          cadastroForm.style.display = 'none'
          cadastroForm.reset()
        }
      }
    })
  }

  if (logoutBtn) logoutBtn.addEventListener('click', logout)

  checkLogin()

  window.addEventListener('storage', (event) => {
    if (
      event.key === 'bauMerendaContagem' ||
      event.key === 'bauMerendaNumConfirmacoes' ||
      event.key === 'cardapioDoDia'
    ) {
      if (sessionStorage.getItem('loggedInUser')) {
        atualizarRelatorioAdmin()
        carregarCardapioAdmin()
      }
    }
  })
})
