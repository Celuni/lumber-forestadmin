const chalk = require('chalk');
const auth = require('./services/authenticator');

module.exports = async (command, logger, inquirer) => {
  let authConfig;

  switch (command) {
    case 'login':
      authConfig = await inquirer.prompt([{
        type: 'input',
        name: 'email',
        message: 'What\'s your email address?',
        validate: (input) => {
          if (input) { return true; }
          return 'Please enter your email address.';
        },
      }, {
        type: 'password',
        name: 'password',
        message: 'What\'s your password?',
        validate: (input) => {
          if (input) { return true; }
          return 'Please enter your password.';
        },
      }]);

      try {
        await auth.login(authConfig.email, authConfig.password);
        logger.success('Login successful.');
      } catch (err) {
        if (err.message === 'Unauthorized') {
          logger.error('Incorrect email or password.');
        } else {
          logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(err)}`);
        }

        process.exit(1);
      }

      break;
    case 'logout':
      await auth.logout(logger);
      break;

    default:
      logger.error(`Unknown command: ${command}`);
      process.exit(1);
  }
};
