import React from 'react'
import { Link } from "react-router-dom";

const Register = () => {

  const authorizeRequest = async () => {
    const res = await window.api.send('auth', { action: 'authorize' });
  }

  return (
    <div>
      <h1 className='text-5xl text-gray-900'>DCH is now ready to be registered</h1>
      <div className='text-gray-700'>Press the button below to continue</div>
      {/* <button onClick={authorizeRequest} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Register
      </button> */}
      <Link to="/authorize" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Regiser</Link>
    </div>
  )
}

export default Register
