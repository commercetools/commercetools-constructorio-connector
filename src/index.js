// npm packages
const cors = require('cors');
const bodyParser = require('body-parser');
const CT = require('ctvault');
const express = require('express');
const fs = require('fs-extra')
const _ = require('lodash')

// local utils
global.utils = require('./common/utils');
global.config = require('./common/config');

const subscriberManager = require('./common/managers/subscriptionManager')
const extensionManager = require('./common/managers/extensionManager')

// express app setup
const app = express();
const port = config.get('port') || 3001;
app.listen(port, async () => {
  // use body-parser since we are expecting JSON input
  app.use(bodyParser.text({ type: 'text/plain' }));
  app.use(bodyParser.json());

  // CORS support
  app.use(cors());

  // use the ctvault header middleware
  app.use(CT.middleware.headers);

  // log each HTTP request
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // K8s liveness/readiness probe
  app.get('/isready', async (req, res) => {
    res.status(200).send('Ready');
  });

  let serviceDir = `${__dirname}/services`
  if (fs.existsSync(serviceDir)) {
    _.each(_.map(utils.file.getSubdirectories(serviceDir), e => `./services/${e.name}`), dir => {
      let service = require(dir)
      _.each(service.extensions, extension => {
        extensionManager.register(extension)
        app.post(extension.path, extensionManager.handle)
      })

      _.each(service.subscribers, subscriber => {
        subscriberManager.subscribe(subscriber)
      })
    })
  }
  else {
    logger.warn(`Couldn't find a services directory`)
  }

  // global error handler
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json(err);
  });

  logger.info(`Server started on port: ${port}`);
});