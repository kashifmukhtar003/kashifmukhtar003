import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

// Pages
import Root from './components/pages/root'

const App = () => {
  return (
    <div className='h-full w-full bg-black'>
      <Router>
        <Switch>
          <Route path='/'>
            <Root />
          </Route>
        </Switch>
      </Router>
    </div>
  )
}

export default App
