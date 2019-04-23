const cors = require('cors');
const Liana = require('forest-express-sequelize');

module.exports = (app, context) => {
  app.use(cors({
    origin: /forestadmin\.com$|localhost:.*/,
    allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type'],
    credentials: true,
  }));

  app.use(Liana.init({
    modelsDir: context.modelsDir,
    envSecret: context.envSecret,
    authSecret: context.authSecret,
    sequelize: context.sequelize,
  }));
};
