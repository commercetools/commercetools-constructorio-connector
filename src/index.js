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

// express app setup
const app = express();
const port = config.get('port') || 3001;

let routes = {
  extensions: [],
  microservices: [],
  admin_microservices: [],
  subscribers: []
}

let getServices = () => _.flatten(_.concat([], Object.values(routes)))
let getService = key => _.first(_.filter(getServices(), service => service.key === key))

app.listen(port, async () => {
  let loadDir = dir => {
    let service = require(dir)
    let serviceName = _.last(dir.split('/'))

    _.each(Object.keys(service), key => {
      let objects = service[key]
      _.each(objects, obj => {
        obj.type = key
        obj.service = serviceName
        routes[key].push(obj)

        switch (key) {
          case 'extensions':
            app.post(obj.path, async (req, res, next) => {
              let h = _.get(obj, `triggers.${req.body.resource.typeId}.${req.body.action}`)
              if (h) {
                return res.status(200).json({ actions: await h(req, res, next) })
              }
              else {
                  next({ error: `Handler not found for ${req.body.resource.typeId} / ${req.body.action} under path ${req.path}` })
              }
            })
            break;
  
          case 'microservices':
          case 'admin_microservices':
            app[obj.method || 'get'](obj.path, async (req, res) => {
              req.getService = getService
              res.status(200).json(await obj.handle(req, res))
            })
            break;
  
          case 'subscriptions':
            subscriberManager.subscribe(obj)
            break;
  
          default:
            break;
        }  
      })
    })
  }
  
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

  app.use('/ui', express.static(`${__dirname}/common/ui`));
  app.get('/api', (req, res) => res.json(getServices()))

  let serviceDir = `${__dirname}/services`
  if (fs.existsSync(serviceDir)) {
    _.each(_.map(utils.file.getSubdirectories(serviceDir), e => `./services/${e.name}`), loadDir)
  }
  else {
    logger.warn(`Couldn't find a services directory`)
  }

  // load the common services directory
  loadDir('./common/services')

  // global error handler
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json(err);
  });

  logger.info(`Server started on port: ${port}`);
});