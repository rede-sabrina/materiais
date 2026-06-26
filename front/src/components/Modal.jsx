import React, { createContext, useContext, useState } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }){
  const [modal, setModal] = useState(null)
  function showModal(opts){
    setModal(opts)
  }
  function hideModal(){ setModal(null) }
  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg max-w-lg w-full mx-4">
            <div className="p-4">
              {modal.title && <div className="text-lg font-semibold mb-2">{modal.title}</div>}
              <div className="mb-4 text-sm text-slate-700">
                {modal.loading && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                    <span>Processando...</span>
                  </div>
                )}
                {modal.body || modal.children}
              </div>
              {!modal.hideActions && (
                <div className="flex justify-end gap-2">
                  {modal.cancelLabel && (
                    <button className="px-3 py-2 border rounded" onClick={() => { modal.onCancel?.(); hideModal() }}>{modal.cancelLabel}</button>
                  )}
                  <button className="px-4 py-2 bg-primary text-white rounded" onClick={() => { modal.onConfirm?.(); hideModal() }}>{modal.confirmLabel || 'OK'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal(){
  const ctx = useContext(ModalContext)
  if(!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

export default ModalContext
