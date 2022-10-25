import React from 'react'
import { Link } from "react-router-dom";

const StepZero = () => {

  // TODO: Check if device already has a configuration

  return (
    <div className='h-full flex flex-col justify-center items-center'>
      <div className='text-center text-gray-800 justify-center items-center'>
        <h1 className='text-5xl'>DIGITAL CINEMA HUB</h1>
        <h3 className='text-2xl'>Installation guide</h3>
      </div>

      <Link to='/network' className='mt-12 text-xl bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer w-min-content'>Start</Link>
    </div>
  )
}

export default StepZero
