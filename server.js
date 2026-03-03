const controllers = require('./controllers');
const AppServer = require('./appServer.js');

const controllerInstances = Object.values(controllers).map((Controller) => new Controller());

const app = new AppServer(controllerInstances);
app.startListening();
