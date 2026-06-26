import { XMLParser } from 'fast-xml-parser'

function findItems(obj){
  // try common paths for invoices
  const candidates = []
  function walk(o){
    if(!o || typeof o !== 'object') return
    for(const k of Object.keys(o)){
      if(k.toLowerCase() === 'det' || k.toLowerCase() === 'detalhe' || k.toLowerCase() === 'items' || k.toLowerCase()==='item'){
        candidates.push(o[k])
      }
      walk(o[k])
    }
  }
  walk(obj)
  // choose first array-like
  for(const c of candidates){
    if(Array.isArray(c)) return c
    if(typeof c === 'object') return [c]
  }
  return []
}

function extractInvoice(parsed){
  // attempt to extract distributor, invoice number, date, items
  const invoice = { distribuidora: null, nota: null, data: null, items: [] }

  // Helper: find a node with a given tag name (case-insensitive)
  function findNodeByName(obj, name){
    if(!obj || typeof obj !== 'object') return null
    const lname = name.toLowerCase()
    if(Object.keys(obj).some(k=>k.toLowerCase() === lname)) return obj[Object.keys(obj).find(k=>k.toLowerCase()===lname)]
    for(const k of Object.keys(obj)){
      const r = findNodeByName(obj[k], name)
      if(r) return r
    }
    return null
  }

  // Prefer explicit NFe path: nfeProc -> NFe -> infNFe
  const maybeNfeProc = findNodeByName(parsed, 'nfeProc') || parsed
  const maybeNFe = findNodeByName(maybeNfeProc, 'NFe') || findNodeByName(maybeNfeProc, 'nfe') || maybeNfeProc
  const infNFe = findNodeByName(maybeNFe, 'infNFe') || findNodeByName(parsed, 'infNFe')

  const source = infNFe || parsed

  // extract header
  try{
    invoice.nota = (source.ide && (source.ide.nNF || source.ide['nNF'])) || source.ide?.nNF || source['nNF'] || source.nNF || source['nfe'] || null
  } catch(e){ invoice.nota = null }
  try{
    invoice.data = (source.ide && (source.ide.dhEmi || source.ide['dhEmi'] || source.ide.dEmi || source.ide['dEmi'])) || source.dhEmi || source['dhEmi'] || null
  } catch(e){ invoice.data = null }
  let emit = null
  try{
    emit = source.emit || source.EMIT || findNodeByName(source, 'emit')
    invoice.distribuidora = (emit && (emit.xNome || emit['xNome'])) || source.emit?.xNome || source['xNome'] || null
  } catch(e){ invoice.distribuidora = null }

  // emitente (fornecedor) details to use on return term
  try{
    if(emit){
      const enderEmit = emit.enderEmit || emit.enderemit || findNodeByName(emit, 'enderEmit') || {}
      const cnpj = emit.CNPJ || emit['CNPJ'] || emit.CPF || emit['CPF'] || null
      const xLgr = enderEmit.xLgr || enderEmit['xLgr'] || ''
      const nro = enderEmit.nro || enderEmit['nro'] || ''
      const xCpl = enderEmit.xCpl || enderEmit['xCpl'] || ''
      const xBairro = enderEmit.xBairro || enderEmit['xBairro'] || ''
      const xMun = enderEmit.xMun || enderEmit['xMun'] || ''
      const uf = enderEmit.UF || enderEmit['UF'] || ''
      const cep = enderEmit.CEP || enderEmit['CEP'] || ''

      const enderecoParts = [xLgr, nro].filter(Boolean)
      let endereco = enderecoParts.join(', ')
      if(xCpl) endereco = endereco ? `${endereco} - ${xCpl}` : xCpl
      if(xBairro) endereco = endereco ? `${endereco} - ${xBairro}` : xBairro

      invoice.destinatarioRazaoSocial = emit.xNome || emit['xNome'] || invoice.distribuidora || null
      invoice.destinatarioCnpj = cnpj
      invoice.destinatarioEndereco = endereco
      invoice.destinatarioCidade = xMun
      invoice.destinatarioEstado = uf
      invoice.destinatarioCep = cep
    }
  } catch(e){}

  // items: prefer infNFe.det
  let det = []
  if(infNFe && infNFe.det) det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det]
  if(det.length === 0){
    // fallback to generic detector
    det = findItems(parsed)
  }

  invoice.items = det.map((d)=>{
    const prod = d.prod || d.PROD || findNodeByName(d, 'prod') || d
    const nome = (prod.xProd || prod['xProd'] || prod.xNome || prod['xNome'] || prod.nome || prod['nome'] || prod.description || prod.name) || ''
    const codigo = (prod.cProd || prod['cProd'] || prod.codigo || prod['codigo'] || prod.code) || ''
    const ean = (prod.cEAN || prod['cEAN'] || prod.cEan || prod['cEan'] || prod.cBar || prod.barcode) || ''
    const quantidadeRaw = (prod.qCom || prod['qCom'] || prod.quantity || prod.qtde || prod['q'] ) || 1
    const quantidade = Number(String(quantidadeRaw).replace(',', '.')) || 1
    const rastroRaw = prod.rastro || prod.RASTRO || findNodeByName(d, 'rastro') || findNodeByName(prod, 'rastro')
    const rastro = Array.isArray(rastroRaw) ? rastroRaw[0] : rastroRaw
    const lote = rastro ? (rastro.nLote || rastro['nLote'] || rastro.lote || rastro['lote'] || rastro.batch || '') : ''
    return {
      nome: String(nome).trim(),
      codigo: String(codigo).trim(),
      ean: String(ean).trim(),
      quantidade,
      lote: String(lote || '').trim()
    }
  })

  return invoice
}

export async function handleUpload(req, res, next){
  try{
    const file = req.file
    if(!file) return res.status(400).json({ message: 'file required' })
    const xml = file.buffer.toString('utf8')
    const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix: '@_' })
    const parsed = parser.parse(xml)
    const invoice = extractInvoice(parsed)
    // return parsed structure with filename
    res.json({ filename: file.originalname, invoice })
  } catch(err){ next(err) }
}
