const P = require('bluebird');
const agent = require('superagent-promise')(require('superagent'), P);
const UserSerializer = require('../serializers/user');
const UserDeserializer = require('../deserializers/user');
const ProjectSerializer = require('../serializers/project');
const ProjectDeserializer = require('../deserializers/project');
const EnvironmentSerializer = require('../serializers/environment');
const EnvironmentDeserializer = require('../deserializers/environment');

function API() {
  this.endpoint = process.env.FOREST_URL || 'https://api.forestadmin.com';

  this.login = async (email, password) => agent
    .post(`${this.endpoint}/api/sessions`)
    .set('forest-origin', 'Lumber')
    .set('Content-Type', 'application/json')
    .send({ email, password })
    .then(response => response.body.token);

  this.createUser = async user => agent
    .post(`${this.endpoint}/api/users`)
    .set('forest-origin', 'Lumber')
    .set('Content-Type', 'application/json')
    .send(new UserSerializer(user))
    .then(response => UserDeserializer.deserialize(response.body));

  this.createProject = async (sessionToken, project) => {
    let newProject;

    try {
      newProject = await agent
        .post(`${this.endpoint}/api/projects`)
        .set('forest-origin', 'Lumber')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(new ProjectSerializer(project))
        .then(response => ProjectDeserializer.deserialize(response.body));
    } catch (error) {
      if (error.message === 'Conflict') {
        const { projectId } = error.response.body.errors[0].meta;
        newProject = await agent
          .get(`${this.endpoint}/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${sessionToken}`)
          .set('forest-origin', 'Lumber')
          .send()
          .then(response => ProjectDeserializer.deserialize(response.body));

        // NOTICE: Avoid to erase an existing project that has been already initialized.
        if (newProject.initializedAt) { throw error; }
      } else {
        throw error;
      }
    }

    newProject.defaultEnvironment.apiEndpoint = 'http://localhost:3000';
    const updatedEnvironment = await agent
      .put(`${this.endpoint}/api/environments/${newProject.defaultEnvironment.id}`)
      .set('forest-origin', 'Lumber')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(new EnvironmentSerializer(newProject.defaultEnvironment))
      .then(response => EnvironmentDeserializer.deserialize(response.body));

    newProject.defaultEnvironment.secretKey = updatedEnvironment.secretKey;

    return newProject;
  };
}

module.exports = new API();
