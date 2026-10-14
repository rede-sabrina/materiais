/**
 * Catálogo de produtos disponíveis nos pedidos para Fernando.
 * Cada item define quais campos adicionais são necessários.
 *
 * campos possíveis:
 *   tamanho         → TAPETE
 *   degraus         → ESCADA (opções fixas)
 *   cor             → TINTA PARA IMPRESSORA
 *   modelo          → TINTA PARA IMPRESSORA
 *   descricaoOutros → OUTROS
 */
export const PRODUTOS_FERNANDO = [
  { nome: 'Alça para cesta',                              campos: [] },
  { nome: 'Bip com cabo',                                 campos: [] },
  { nome: 'Bip sem fio',                                  campos: [] },
  { nome: 'Caixinha de som',                              campos: [] },
  { nome: 'Cadeira',                                      campos: [] },
  { nome: 'Caneta para identificar nota falsa',           campos: [] },
  { nome: 'Cavalete de sinalização de piso molhado',      campos: [] },
  { nome: 'Cesta',                                        campos: [] },
  { nome: 'Cordão para crachá',                           campos: [] },
  { nome: 'Adesivo para teclado',                         campos: [] },
  { nome: 'Escada',                                       campos: ['degraus'] },
  { nome: 'Etiqueta posologia',                           campos: [] },
  { nome: 'Extensão',                                     campos: [] },
  { nome: 'Filtro para bebedouro',                        campos: ['modeloFiltro'] },
  { nome: 'Fonte USB',                                    campos: [] },
  { nome: 'Luz negra',                                    campos: [] },
  { nome: 'Mouse',                                        campos: [] },
  { nome: 'Palets',                                       campos: [] },
  { nome: 'Suporte para luz negra',                       campos: [] },
  { nome: 'Tapete',                                       campos: ['tamanho'] },
  { nome: 'Teclado',                                      campos: [] },
  { nome: 'Tinta para impressora',                        campos: ['cor', 'modelo'] },
  { nome: 'Outros',                                       campos: ['descricaoOutros'] },
]

export const OPCOES_DEGRAUS = [
  '3 degraus',
  '4 degraus',
  '5 degraus',
  '7 degraus',
  '8 degraus',
]

export const OPCOES_AUTORIZADOR = ['Lucas', 'Adriana', 'Marcelo', 'Supervisor']

export const STATUS_FERNANDO = ['Pendente', 'Em andamento', 'Atendido', 'Cancelado']

/** Retorna os campos extras de um produto pelo nome */
export function getCamposProduto(nomeProduto) {
  const p = PRODUTOS_FERNANDO.find(p => p.nome === nomeProduto)
  return p ? p.campos : []
}

export function getCamposConfiguradosProduto(produto) {
  return [...new Set([
    ...getCamposProduto(produto?.nome),
    ...(Array.isArray(produto?.campos) ? produto.campos : []),
  ])]
}

export function ordenarProdutosFernando(produtos = PRODUTOS_FERNANDO) {
  return [...produtos].sort((a, b) => {
    if (a.nome === 'Outros') return 1
    if (b.nome === 'Outros') return -1
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  })
}

/** Formata a lista de itens para exibição em texto */
export function formatarItens(itens = []) {
  return itens.map(it => {
    const extras = []
    if (it.tamanho)         extras.push(`Tamanho: ${it.tamanho}`)
    if (it.degraus)         extras.push(it.degraus)
    if (it.cor)             extras.push(`Cor: ${it.cor}`)
    if (it.modelo)          extras.push(`Modelo: ${it.modelo}`)
    if (it.descricaoOutros) extras.push(it.descricaoOutros)
    if (it.descricao)       extras.push(`Descrição: ${it.descricao}`)
    if (it.observacao)      extras.push(`Observação: ${it.observacao}`)
    const extra = extras.length ? ` (${extras.join(', ')})` : ''
    return `${it.quantidade}x ${it.produto}${extra}`
  })
}
