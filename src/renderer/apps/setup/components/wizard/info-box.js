import React from 'react'

const InfoBox = ({ children, color, className='' }) => {
  return (
    <div className={`p-6 ${color} rounded-xl ${className} w-6/12`} style={{ height: 'min-content' }}>
      <h3 className='text-xl font-bold mb-3'>Info</h3>
      <div>{children}</div>
    </div>
  )
}

export default InfoBox
