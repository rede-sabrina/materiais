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
  { nome: 'Tapete',                                       campos: ['tamanho'] },
  { nome: 'Filtro para bebedouro',                        campos: [] },
  { nome: 'Cadeira',                                      campos: [] },
  { nome: 'Cesta',                                        campos: [] },
  { nome: 'Alça para cesta',                              campos: [] },
  { nome: 'Bip com cabo',                                 campos: [] },
  { nome: 'Bip sem fio',                                  campos: [] },
  { nome: 'Etiqueta posologia',                           campos: [] },
  { nome: 'Cavalete de sinalização de piso molhado',      campos: [] },
  { nome: 'Caneta para identificar nota falsa',           campos: [] },
  { nome: 'Suporte para luz negra',                       campos: [] },
  { nome: 'Extensão',                                     campos: [] },
  { nome: 'Palets',                                       campos: [] },
  { nome: 'Escada',                                       campos: ['degraus'] },
  { nome: 'Cordão para crachá',                           campos: [] },
  { nome: 'Mouse',                                        campos: [] },
  { nome: 'Teclado',                                      campos: [] },
  { nome: 'Luz negra',                                    campos: [] },
  { nome: 'Adesivo para techado',                         campos: [] },
  { nome: 'Fonte USB',                                    campos: [] },
  { nome: 'Tinta para impressora',                        campos: ['cor', 'modelo'] },
  { nome: 'Caixinha de som',                              campos: [] },
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

/** Formata a lista de itens para exibição em texto */
export function formatarItens(itens = []) {
  return itens.map(it => {
    const extras = []
    if (it.tamanho)         extras.push(`Tamanho: ${it.tamanho}`)
    if (it.degraus)         extras.push(it.degraus)
    if (it.cor)             extras.push(`Cor: ${it.cor}`)
    if (it.modelo)          extras.push(`Modelo: ${it.modelo}`)
    if (it.descricaoOutros) extras.push(it.descricaoOutros)
    const extra = extras.length ? ` (${extras.join(', ')})` : ''
    return `${it.quantidade}x ${it.produto}${extra}`
  })
}
