const fs = require('fs');
const _ = require('lodash');
const cors = require('cors');
const mkdirp = require('mkdirp');
const Liana = require('forest-express-sequelize');

exports.run = function (app, context) {
  app.use(cors({
    origin: /forestadmin\.com$/,
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

exports.dump = async (schema) => {
  mkdirp.sync(`${process.cwd()}/middlewares/forestadmin`);

  const templatePath = `${__dirname}/templates/middleware.txt`;
  const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

  fs.writeFileSync(`${process.cwd()}/middlewares/forestadmin/index.js`, template({}));
};
