import React from 'react'

export default function Button({children, className='', variant='primary', ...props}){
  const base = 'px-4 py-2 rounded-md font-medium focus:outline-none transition transform'
  const styles = {
    primary: 'bg-primary text-white hover:-translate-y-1 hover:scale-105 hover:opacity-95',
    ghost: 'bg-white border border-slate-200 hover:-translate-y-1 hover:scale-105'
  }
  return (
    <button className={[base, styles[variant]||styles.primary, className].join(' ')} {...props}>
      {children}
    </button>
  )
}
