const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');

module.exports = async (schema, config) => {
  mkdirp.sync(`${process.cwd()}/middlewares/forestadmin`);

  const templatePath = `${__dirname}/templates/middleware.txt`;
  const template = _.template(fs.readFileSync(templatePath, 'utf-8'));

  fs.writeFileSync(`${process.cwd()}/middlewares/forestadmin/index.js`, template(config));
};
