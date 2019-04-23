const P = require('bluebird');
const agent = require('superagent-promise')(require('superagent'), P);
const UserSerializer = require('../serializers/user');
const UserDeserializer = require('../deserializers/user');
const ProjectSerializer = require('../serializers/project');
const ProjectDeserializer = require('../deserializers/project');
const EnvironmentSerializer = require('../serializers/environment');

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
    const newProject = await agent
      .post(`${this.endpoint}/api/projects`)
      .set('forest-origin', 'Lumber')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(new ProjectSerializer(project))
      .then(response => ProjectDeserializer.deserialize(response.body));

    newProject.defaultEnvironment.apiEndpoint = 'http://localhost:3000';
    await agent
      .put(`${this.endpoint}/api/environments/${newProject.defaultEnvironment.id}`)
      .set('forest-origin', 'Lumber')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(new EnvironmentSerializer(newProject.defaultEnvironment));

    return newProject;
  };
}

module.exports = new API();
