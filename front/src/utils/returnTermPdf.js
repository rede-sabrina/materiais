import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { buildMotivo } from './buildMotivo'


async function loadImageData(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error('Logo not found')
  const blob = await res.blob()
  const dataUrl = await new Promise((resolve, reject)=>{
    const reader = new FileReader()
    reader.onload = ()=> resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  const img = await new Promise((resolve, reject)=>{
    const image = new Image()
    image.onload = ()=> resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
  return { dataUrl, width: img.width, height: img.height }
}

function drawLabeledValue(doc, label, value, x, y, labelWidth){
  doc.setFont('helvetica', 'normal')
  doc.text(label, x, y)
  doc.setFont('helvetica', 'bold')
  doc.text(value || '', x + labelWidth, y)
  doc.setFont('helvetica', 'normal')
}

function drawLabeledValueWrap(doc, label, value, x, y, labelWidth, maxWidth){
  doc.setFont('helvetica', 'normal')
  doc.text(label, x, y)
  doc.setFont('helvetica', 'bold')
  const text = value || ''
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x + labelWidth, y)
  doc.setFont('helvetica', 'normal')
  return lines.length
}

function drawLine(doc, x1, y1, x2, y2){
  doc.setDrawColor(80)
  doc.setLineWidth(0.5)
  doc.line(x1, y1, x2, y2)
}

function drawHighlightText(doc, text, x, y, paddingX, paddingY){
  const textWidth = doc.getTextWidth(text)
  const boxWidth = textWidth + paddingX * 2
  const boxHeight = 12 + paddingY * 2
  doc.setFillColor(255, 244, 153)
  doc.rect(x, y - 9 - paddingY, boxWidth, boxHeight, 'F')
  doc.setTextColor(0, 0, 0)
  doc.text(text, x + paddingX, y)
}

export async function generateReturnTermPdf(returnItem, store){
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 36
  let y = 30

  const razaoSocial = store?.razaoSocial || store?.loja || store?.username || returnItem?.loja || ''
  const cnpj = store?.cnpj || ''
  const endereco = store?.endereco || ''
  const cep = store?.cep || ''
  const cidade = store?.cidade || ''
  const estado = store?.estado || ''
  const numeroLoja = store?.numeroLoja || ''

  const destinatarioRazaoSocial = returnItem?.destinatarioRazaoSocial || returnItem?.distribuidora || ''
  const destinatarioCnpj = returnItem?.destinatarioCnpj || ''
  const destinatarioEndereco = returnItem?.destinatarioEndereco || ''
  const destinatarioCidade = returnItem?.destinatarioCidade || ''
  const destinatarioEstado = returnItem?.destinatarioEstado || ''

  try{
    const logo = await loadImageData('/logo-sabrina.png')
    const maxLogoWidth = 140
    const maxLogoHeight = 60
    const scale = Math.min(maxLogoWidth / logo.width, maxLogoHeight / logo.height, 1)
    const logoWidth = logo.width * scale
    const logoHeight = logo.height * scale
    doc.addImage(logo.dataUrl, 'PNG', margin, y, logoWidth, logoHeight)
  } catch(e){}

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMO DE DEVOLUCAO DE MERCADORIA', pageWidth / 2, y + 18, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  drawHighlightText(doc, '* FAVOR PREENCHER COM AS INFORMACOES SOLICITADAS', pageWidth - margin - 270, y + 40, 6, 3)
  y += 78

  doc.setFontSize(11)
  drawLabeledValue(doc, 'Nome da Empresa: ', razaoSocial, margin, y, 110)
  y += 18
  drawLabeledValue(doc, 'CNPJ: ', cnpj, margin, y, 40)
  y += 18
  const enderecoLines = drawLabeledValueWrap(doc, 'Endereco: ', endereco, margin, y, 70, pageWidth - margin * 2 - 70)
  y += 18 + (enderecoLines - 1) * 12
  drawLabeledValue(doc, 'CEP: ', cep, margin, y, 35)
  y += 12
  drawLine(doc, margin, y, pageWidth - margin, y)
  y += 18

  const intro = 'Atraves do presente termo, fica formalizado o retorno das mercadorias abaixo relacionadas, conforme motivo especificado:'
  const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2)
  doc.text(introLines, margin, y)
  y += introLines.length * 14 + 16

  drawLabeledValue(doc, '1. Razao Social / Nome da empresa: ', destinatarioRazaoSocial, margin, y, 200)
  y += 18
  drawLabeledValue(doc, 'CNPJ: ', destinatarioCnpj, margin, y, 40)
  y += 18
  const destEnderecoLines = drawLabeledValueWrap(doc, 'Endereco: ', destinatarioEndereco, margin, y, 70, pageWidth - margin * 2 - 70)
  y += 18 + (destEnderecoLines - 1) * 12
  const destinatarioCidadeEstado = `${destinatarioCidade}${destinatarioCidade && destinatarioEstado ? ' - ' : ''}${destinatarioEstado}`
  if(destinatarioCidadeEstado){
    drawLabeledValue(doc, 'Cidade/Estado: ', destinatarioCidadeEstado, margin, y, 95)
    y += 18
  }

  const baseItems = returnItem?.items || []
  const sobras = returnItem?.sobras || []
  const sobrasAsItems = sobras.map(s=> ({
    codigo: s.codigo || s.ean || '',
    nome: s.nome || '',
    quantidade: s.quantidade,
    motivo: 'Sobra'
  }))
  const allItems = [...baseItems, ...sobrasAsItems]

  drawLabeledValue(doc, '2. Motivo da Devolucao: ', buildMotivo(allItems), margin, y, 130)
  y += 18
  drawLabeledValue(doc, '3. Nota Fiscal No: ', returnItem?.nota || '', margin, y, 110)
  y += 18
  doc.text('4. Descricao dos Itens - Codigo', margin, y)
  y += 10

  const rows = allItems.map(it=> ([
    it.codigo || '',
    it.nome || '',
    String(it.devolvida ?? it.quantidade ?? ''),
    it.motivo || ''
  ]))

  autoTable(doc, {
    startY: y + 6,
    head: [['Codigo', 'Descricao', 'Quantidade', 'Motivo']],
    body: rows.length ? rows : [['', '', '', '']],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { left: margin, right: margin }
  })

  y = doc.lastAutoTable.finalY + 18
  doc.setFont('helvetica', 'bold')
  doc.text('Campos para preenchimento manual', margin, y)
  doc.setFont('helvetica', 'normal')
  y += 16
  doc.text('* Nome Legivel da Transportadora:', margin, y)
  drawLine(doc, margin + 200, y + 2, pageWidth - margin, y + 2)
  y += 16
  doc.text('* Nome legivel do Resp. pelo Transporte:', margin, y)
  drawLine(doc, margin + 260, y + 2, pageWidth - margin, y + 2)
  y += 16
  doc.text('* CPF:', margin, y)
  drawLine(doc, margin + 50, y + 2, margin + 200, y + 2)
  doc.text('* RG:', margin + 230, y)
  drawLine(doc, margin + 270, y + 2, margin + 420, y + 2)
  y += 24
  doc.text('Assinatura:', margin, y)
  drawLine(doc, margin + 80, y + 2, margin + 260, y + 2)
  const now = new Date()
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Marco',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ]
  const dateText = `${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`

  y += 28
  doc.text(dateText + '.', pageWidth / 2, y, { align: 'center' })
  y += 28

  doc.setFont('helvetica', 'bold')
  const internalText = `Para uso interno da ${razaoSocial} - Loja ${numeroLoja}`
  const internalWidth = doc.getTextWidth(internalText) + 12
  const internalX = (pageWidth - internalWidth) / 2
  drawHighlightText(doc, internalText, internalX, y, 6, 3)
  doc.setFont('helvetica', 'normal')
  y += 18
  doc.setTextColor(200, 0, 0)
  doc.text('Para realizacao da devolucao, devera ser comunicado o comprador.', pageWidth / 2, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  const dateStamp = new Date().toISOString().slice(0, 10)
  const filename = `termo-devolucao-${returnItem?.nota || 'sem-nota'}-${dateStamp}.pdf`
  doc.save(filename)
}
