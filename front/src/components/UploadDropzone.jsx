import React, {useState} from 'react'
import { uploadXML } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function UploadDropzone(){
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState(null)

  function onDrop(e){
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    setFile(f)
    handleUpload(f)
  }

  async function handleUpload(f){
    setLoading(true)
    try{
      setError(null)
      const res = await uploadXML(f)
      if(!res || !res.invoice){
        setError('Arquivo processado, mas não foi possível extrair a nota.')
        setParsed(res)
        return
      }
      // store parsed invoice to localStorage and navigate to new return form
      localStorage.setItem('lastParsedInvoice', JSON.stringify(res.invoice))
      setParsed(res.invoice)
      // notify other components in the same tab that a new invoice was parsed
      try{ window.dispatchEvent(new CustomEvent('invoiceParsed', { detail: res.invoice })) }catch(e){}
      // navigate to new return automatically
      nav('/devolucoes/novo')
    } catch(e){
      console.error(e)
      setError(e.message || 'Erro ao enviar XML')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div onDrop={onDrop} onDragOver={(e)=>e.preventDefault()} className="border-dashed border-2 border-slate-200 rounded-xl p-6 text-center">
        <p className="mb-2">Arraste o XML aqui ou clique para selecionar</p>
        <input type="file" accept=".xml" onChange={(e)=>{ const f=e.target.files[0]; setFile(f); handleUpload(f) }} className="w-full" />
        {loading && <div className="text-sm text-slate-500 mt-2">Processando XML...</div>}
      </div>
      {file && <div className="mt-3 text-sm text-slate-700">Arquivo: {file.name}</div>}
      {loading && <div className="mt-2 text-sm text-slate-500">Processando...</div>}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      {parsed && parsed.invoice && (
        <div className="mt-2 p-3 border rounded bg-slate-50">
          <div className="text-sm">Preview: <strong>{parsed.invoice.nota}</strong> — {parsed.invoice.distribuidora}</div>
          <div className="mt-2"><button onClick={()=>{ localStorage.setItem('lastParsedInvoice', JSON.stringify(parsed.invoice)); nav('/devolucoes/novo') }} className="px-3 py-1 bg-primary text-white rounded transition transform hover:-translate-y-1 hover:scale-105">Abrir nota</button></div>
        </div>
      )}
    </div>
  )
}
