const os = require('os');
const fs = require('fs');
const chalk = require('chalk');
const KeyGenerator = require('./services/key-generator');
const api = require('./services/api');
const auth = require('./services/authenticator');

const FORMAT_PASSWORD = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{8,}$/;

module.exports = async (logger, inquirer, argv) => {
  let sessionToken;

  logger.info('Forest Admin Installation\n');

  async function loginWithEmailArgv() {
    try {
      const passwordConfig = await inquirer.prompt([{
        type: 'password',
        name: 'password',
        message: 'What\'s your Forest Admin password:',
        validate: (input) => {
          if (input) { return true; }
          return 'Please enter your password.';
        },
      }]);

      sessionToken = await api.login(argv.email, passwordConfig.password);
      fs.writeFileSync(`${os.homedir()}/.lumberrc`, sessionToken);

      logger.success('Login successful.');
    } catch (error) {
      if (error.message === 'Unauthorized') {
        logger.error('Incorrect email or password.');
      } else {
        logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(error)}`);
      }

      process.exit(1);
    }
  }

  async function createAccount() {
    await createAccount();
    logger.info('Create an account:');
    const authConfig = await inquirer.prompt([{
      type: 'input',
      name: 'firstName',
      message: 'What\'s your first name?',
      validate: (input) => {
        if (input) { return true; }
        return 'Please enter your first name.';
      },
    }, {
      type: 'input',
      name: 'lastName',
      message: 'What\'s your last name?',
      validate: (input) => {
        if (input) { return true; }
        return 'Please enter your last name.';
      },
    }, {
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
      message: 'Choose a password:',
      validate: (password) => {
        if (password) {
          if (FORMAT_PASSWORD.test(password)) { return true; }
          return `🔓  Your password security is too weak 🔓\n
          \tPlease make sure it contains at least:\n
          \t> 8 characters\n
          \t> Upper and lower case letters\n
          \t> Numbers`;
        }

        return 'Please, choose a password.';
      },
    }]);

    try {
      await api.createUser(authConfig);
    } catch (error) {
      if (error.message === 'Conflict') {
        logger.error(`Your account already exists. Please, use the command ${chalk.cyan('lumber run lumber-forestadmin:login')}.`);
      } else {
        logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(error)}`);
      }

      process.exit(1);
    }

    sessionToken = await api.login(authConfig.email, authConfig.password);
    fs.writeFileSync(`${os.homedir()}/.lumberrc`, sessionToken);

    logger.success('\nAccount successfully created.\n');
  }

  try {
    sessionToken = fs.readFileSync(`${os.homedir()}/.lumberrc`);
  } catch (err) {
    if (argv.email) {
      await loginWithEmailArgv();
    } else {
      await createAccount();
    }
  }

  logger.info('Create your admin panel:');
  let projectConfig = {};

  if (argv.projectName) {
    projectConfig.name = argv.projectName;
  } else {
    projectConfig = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Choose a name for your admin panel:',
    }]);
  }

  try {
    const newProject = await api.createProject(sessionToken, projectConfig);
    const [rendering] = newProject.defaultEnvironment.renderings;

    logger.success(`Hooray, ${chalk.green('installation success')}!\n`);
    logger.info(`Open your admin panel: ${chalk.cyan(`https://app.forestadmin.com/${rendering.id}`)}\n`);

    return {
      envSecret: newProject.defaultEnvironment.secretKey,
      authSecret: await new KeyGenerator().generate(),
    };
  } catch (error) {
    if (error.message === 'Unauthorized') {
      logger.error(`Your session has expired. Please, relogin with the command ${chalk.cyan('lumber run lumber-forestadmin:login')}.`);
    } else {
      logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(error)}`);
    }

    return process.exit(1);
  }
};
