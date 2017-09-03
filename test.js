const helpers = require('./helpers');
const assert = require('assert');
const conversation = require('alexa-conversation');
const app = require('./index.js');

const opts = { // config will be used to generate the requests to skill 
  name: 'Test Conversation',
  appId: process.env.YEAGER_APP_ID,
  app: app,
};

describe('Unit Tests', () => {
  let input = '';
  describe('Extract Root Domain', () => {
    let domain = '';
    it('should return google.com from www.google.com', () => {
      input = 'www.google.com';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return google.com from http://www.google.com', () => {
      input = 'http://www.google.com';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return google.com from http://www.google.com/foo', () => {
      input = 'http://www.google.com/foo';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return google.com from \'www.google.com foo\'', () => {
      input = 'www.google.com foo';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return india-tourism.com from http://india-tourism.com', () => {
      input = 'http://india-tourism.com';
      domain = helpers.extractRootDomain(input);
      assert.equal('india-tourism.com', domain);
    });
    it('should return india-tourism.com from \'foo http://india-tourism.com bar\'', () => {
      input = 'foo http://india-tourism.com bar';
      domain = helpers.extractRootDomain(input);
      assert.equal('india-tourism.com', domain);
    });
    it('should return india-tourism.com from alliedenvelopes.co.uk', () => {
      input = 'alliedenvelopes.co.uk';
      domain = helpers.extractRootDomain(input);
      assert.equal('alliedenvelopes.co.uk', domain);
    });
  });
  describe('Extract email', () => {
    let email = '';
    it('should return elon.musk@spacex.com from elon.musk@spacex.com', () => {
      input = 'elon.musk@spacex.com';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.com', email);
    });
    it('should return elon.musk@spacex.com from \'elon.musk@spacex.com foo\'', () => {
      input = 'elon.musk@spacex.com foo';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.com', email);
    });
    it('should return elon.musk@spacex.co.uk from \'foo elon.musk@spacex.co.uk bar\'', () => {
      input = 'foo elon.musk@spacex.co.uk bar';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.co.uk', email);
    });
  });
});

let email = 'elon.musk@spacex.com';
conversation(opts)
.userSays('LaunchRequest')
  .ssmlResponse
    .shouldEqual(`<speak> ${app.skillMessages.welcomeMessage} </speak>`, `<speak> ${app.skillMessages.welcomeReprompt} </speak>`)
.userSays('getVerifyIntent', {email: email})
  .ssmlResponse
    .shouldEqual(`<speak> The mail server rejected ${email}. </speak>`)
.end();
