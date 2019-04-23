const os = require('os');
const fs = require('fs');
const P = require('bluebird');
const api = require('./api');

function Authenticator() {
  this.login = async (email, password) => {
    const sessionToken = await api.login(email, password);
    fs.writeFileSync(`${os.homedir()}/.lumberrc`, sessionToken);
  };

  this.logout = async (logger) => {
    const path = `${os.homedir()}/.lumberrc`;

    return new P((resolve, reject) => {
      fs.stat(path, (err) => {
        if (err === null) {
          fs.unlinkSync(path);

          logger.success('Logout successful.');

          resolve();
        } else if (err.code === 'ENOENT') {
          logger.info('Your were not logged in.');

          resolve();
        } else {
          reject(err);
        }
      });
    });
  };
}

module.exports = new Authenticator();
