import React from 'react'

export default function Select({children, ...props}){
  return (
    <select className="border rounded-md px-3 py-2 w-full" {...props}>{children}</select>
  )
}
