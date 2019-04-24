const cors = require('cors');

module.exports = (app, context) => {
  let liana;
  const lianaOpts = {
    modelsDir: context.modelsDir,
    envSecret: context.envSecret,
    authSecret: context.authSecret,
  };

  if (context.sequelize) {
    lianaOpts.sequelize = context.sequelize;
    liana = require('forest-express-sequelize');
  } else if (context.mongoose) {
    lianaOpts.mongoose = context.mongoose;
    liana = require('forest-express-mongoose');
  }

  app.use(cors({
    origin: /forestadmin\.com$|localhost:.*/,
    allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type'],
    credentials: true,
  }));

  app.use(liana.init(lianaOpts));
};
