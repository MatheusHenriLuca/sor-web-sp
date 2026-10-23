const fs = require('fs');

const cards = JSON.parse(fs.readFileSync('cards_sequence_complete.json', 'utf8'));

const results = cards.map((c, idx) => {
  const text = c.rawText;

  // Extract Required
  const reqMatch = text.match(/Required:\s*=\s*([^\n]+)/);
  const requiredFormula = reqMatch ? reqMatch[1].trim() : 'false';
  let obrigatorio = 'N';
  let obrigatorioPorVariavel = 'Não';
  if (requiredFormula === 'true') {
    obrigatorio = 'S';
  } else if (requiredFormula.includes('If') || requiredFormula.includes('Parent.Required')) {
    obrigatorio = 'S (Condicional)';
    obrigatorioPorVariavel = requiredFormula;
  }

  // Extract Visible
  const visFormula = c.visible || 'true';
  let visivel = 'S';
  let visivelPorVariavel = 'Não';
  if (visFormula === 'false') {
    visivel = 'N (Oculto)';
    visivelPorVariavel = 'Sempre falso';
  } else if (visFormula.includes('edicao')) {
    visivel = 'N no Novo / S na Edição';
    visivelPorVariavel = 'Depende da variável var edicao = true (Etapa Qualidade)';
  } else if (visFormula.includes('tipoocorrtxt')) {
    visivel = 'Condicional ao Tipo';
    visivelPorVariavel = visFormula;
  } else if (visFormula.includes('reinctxt')) {
    visivel = 'Condicional à Reincidência';
    visivelPorVariavel = visFormula;
  } else if (visFormula.includes('Varperfil')) {
    visivel = 'Condicional ao Perfil';
    visivelPorVariavel = 'Varperfil = "Admin" Or Varperfil = "Adminqual"';
  } else if (visFormula.includes('DisplayMode.Edit')) {
    visivel = 'S';
    visivelPorVariavel = 'Modo de Edição padrão';
  }

  // Determine main control & field type
  let tipoCampo = 'Texto';
  let nomeControle = c.controls.map(x => x.name).join(', ');
  const controlTypes = c.controls.map(x => x.type);

  if (controlTypes.includes('Classic/ComboBox') || controlTypes.includes('ComboBox')) {
    tipoCampo = 'Opção / ComboBox (Seleção)';
  } else if (controlTypes.includes('Radio')) {
    tipoCampo = 'Opção / Radio (Botão Seletor)';
  } else if (controlTypes.includes('Classic/DatePicker') || controlTypes.includes('DatePicker')) {
    tipoCampo = 'Data (Seletor de Data)';
  } else if (controlTypes.includes('AddMedia') || controlTypes.includes('Image')) {
    tipoCampo = 'Foto / Mídia (Anexo de Imagem)';
  } else if (controlTypes.includes('Gallery')) {
    tipoCampo = 'Galeria / Sub-lista (Consulta)';
  } else if (text.includes('Value(DataCardValue') || text.includes('Type: =\"Number\"') || c.dataField === 'field_10') {
    tipoCampo = 'Número (Inteiro / Qtd)';
  }

  // Check automatic info
  let infoAutomatica = 'Manual';
  if (text.includes('colpecasgerais_AA3')) {
    infoAutomatica = 'Sim: Carrega do Catálogo de Peças (colpecasgerais_AA3)';
  } else if (text.includes('Today()') || text.includes('Now()')) {
    infoAutomatica = 'Sim: Preenche data/hora atual (Today / Now)';
  } else if (text.includes('User().FullName') || text.includes('varNome')) {
    infoAutomatica = 'Sim: Preenche usuário logado (varNome / User)';
  } else if (text.includes('cxproduto_1.Selected') || text.includes('cxcomp_1.Selected')) {
    infoAutomatica = 'Sim: Preenchido automaticamente ao selecionar a Peça/Produto';
  } else if (text.includes('tipoocorrtxt.Selected')) {
    infoAutomatica = 'Sim: Depende do Tipo de Ocorrência selecionado';
  } else if (text.includes('Choices(')) {
    infoAutomatica = 'Lista de Opções do SharePoint (Choices)';
  }

  // Check if result is a variable
  let resultadoVariavel = 'Não (Salva direto no SharePoint via SubmitForm)';
  if (text.includes('Set(') || text.includes('UpdateContext(')) {
    resultadoVariavel = 'Sim (Alimenta variável interna além do form)';
  }

  return {
    seq: c.index,
    cardName: c.name,
    labels: c.labels.join(' | ') || c.name,
    dataField: c.dataField || '(Controle visual / Galeria sem coluna direta)',
    tipoCampo,
    obrigatorio,
    obrigatorioPorVariavel,
    visivel,
    visivelPorVariavel,
    infoAutomatica,
    resultadoVariavel,
    update: c.update,
    controls: c.controls
  };
});

fs.writeFileSync('detailed_matrix_output.json', JSON.stringify(results, null, 2));
console.log('Matrix generated successfully with', results.length, 'cards.');
