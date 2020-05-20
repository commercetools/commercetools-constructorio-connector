// local utils
global.__basedir = require('app-root-path');
global.utils = require('./common/utils');
global.config = require('./common/config');

// npm packages
const cors = require('cors');
const bodyParser = require('body-parser');
const CT = require('ctvault');
const express = require('express');

const serviceLoader = require('./common/serviceloader');

// express app setup
const app = express();
const port = config.get('port') || 3001;

let commonHandlers = require('./common/common_handlers')

app.listen(port, async () => {
  app.use(bodyParser.text({ type: 'text/plain' }));
  app.use(bodyParser.json());

  // CORS support
  app.use(cors());

  // use the ctvault header middleware
  app.use(CT.middleware.headers);

  // log each HTTP request
  app.use((req, res, next) => {
    if (req.path.indexOf('socket.io') === -1) {
      commonHandlers.log(req, res, next)
    }
    else {
      next()
    }
  });

  // load the UI
  app.use('/ui', express.static(`${__dirname}/common/ui`));

  // load the services
  app.use(serviceLoader)

  // global error handler
  app.use(commonHandlers.error);

  logger.info(`Server started on port: ${port}`);
  logger.info(`Application directory: ${__basedir}`)
});