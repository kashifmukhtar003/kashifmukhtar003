# DCH-P

DCH-P is the software running on the machines in the cinema. It is responsible for orchestrating execution of blocks and any other canvas element.

<img width="568" alt="Screenshot 2022-03-28 at 12 08 11" src="https://user-images.githubusercontent.com/6972570/160376184-9c91b9b9-572d-4643-b401-42ede2da4b5d.png">

DCH-P is the central hub, connecting the audience to the online gaming platform. It runs on a physical machine and is connected to each projector for audio and video playback. It maintains a constant connection to our cloud, polling for new configurations on a regular heartbeat. 

All machines are managed centrally from our cloud interface at https://cloud.cinemataztic.com.

More info about DCH and Cloud [here](https://docs.cinemataztic.com/dch/0-index.html#setup-the-dch).


## Quickstart
To run DCH-P locally, you'll need to have Node v14 installed. Then you can create a local development instance of the application by running*:
```bash
npm start
```

*requires that you have the dependencies installed already (run: ```npm install```).

## Build
TODO: Add build instructions
See https://github.com/cinemataztic/cinead-p/blob/main/package.json for inspiration. 

## Tech
DCH-P is an [Electron](https://www.electronjs.org/) application based on the [Electron React Boilerplate (ERB) repository](https://github.com/electron-react-boilerplate/electron-react-boilerplate).

### Render
The render process is a [React](https://reactjs.org/) application. It is styled primarily with the use of [Tailwind](https://tailwindcss.com/), but also supports Sass. State management is done using the built-in React tools (local state and context). The app is capable of swithcing between different sub-apps (in the /apps directory), determined by the value in the ```getApp``` function exposed by the preload script in ```window.api```. 

### Styling
Use [cine-ui](https://www.npmjs.com/package/@cinemataztic/cine-ui) for UI elements.

### Brain
The backend part of the application (ie. the Electron main process) is called brain. Brain is where the orchestration and main logic of the application lies. Brain uses MongoDB Realm as a local persitent database to store the configuration of the machine. 

It's also here renderer processes are created and managed. A render process is launched in a new window along with a preload script that exposes communication channels between the render process and the main process (Inter-Process Communication (IPC) channels). The preload script only allows for certain channels to be available to the render process, creating better separation between processes and thus greater security. 
