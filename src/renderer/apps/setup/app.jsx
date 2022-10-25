import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

// Pages
import StepZero from './components/wizard/step0';
import Network from './components/wizard/network';
import Register from './components/wizard/register';
import Authorize from './components/wizard/authorize'

const App = () => {
  return (
    <div className='bg-gray-200 h-full w-full'>
      <Router>
        <Switch>
          <Route path='/authorize' exact><Authorize /></Route>
          <Route path='/network' exact><Network /></Route>
          <Route path='/register' exact><Register /></Route>
          <Route path='/'><StepZero /></Route>
        </Switch>
      </Router>
    </div>
  )
}

export default App
