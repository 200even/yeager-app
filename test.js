const helpers = require('./helpers');
const assert = require('assert');
const conversation = require('alexa-conversation');
const app = require('./index.js');
const emailExistence = require('email-existence');

const opts = { // config will be used to generate the requests to skill 
  name: 'Test Conversation',
  appId: process.env.YEAGER_APP_ID || 'amzn1.ask.skill.5375fd78-2b74-49b8-9675-0c700dca53eb',
  app: app,
};

describe('Unit Tests', function () {
  let input = '';
  describe('Extract Root Domain', function () {
    let domain = '';
    it('should return google.com from www.google.com', function () {
      input = 'www.google.com';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return google.com from http://www.google.com', function () {
      input = 'http://www.google.com';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return google.com from http://www.google.com/foo', function () {
      input = 'http://www.google.com/foo';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return google.com from \'www.google.com foo\'', function () {
      input = 'www.google.com foo';
      domain = helpers.extractRootDomain(input);
      assert.equal('google.com', domain);
    });
    it('should return india-tourism.com from http://india-tourism.com', function () {
      input = 'http://india-tourism.com';
      domain = helpers.extractRootDomain(input);
      assert.equal('india-tourism.com', domain);
    });
    it('should return india-tourism.com from \'foo http://india-tourism.com bar\'', function () {
      input = 'foo http://india-tourism.com bar';
      domain = helpers.extractRootDomain(input);
      assert.equal('india-tourism.com', domain);
    });
    it('should return alliedenvelopes.co.uk from alliedenvelopes.co.uk', function () {
      input = 'alliedenvelopes.co.uk';
      domain = helpers.extractRootDomain(input);
      assert.equal('alliedenvelopes.co.uk', domain);
    });
    it('should return india-tourism.com from \'india dash tourism dot com\'', function () {
      input = 'india dash tourism dot com';
      domain = helpers.extractRootDomain(input);
      assert.equal('india-tourism.com', domain);
    });
  });
  describe('Extract email', function () {
    let email = '';
    it('should return elon.musk@spacex.com from elon.musk@spacex.com', function () {
      input = 'elon.musk@spacex.com';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.com', email);
    });
    it('should return elon.musk@spacex.com from \'elon.musk@spacex.com foo\'', function () {
      input = 'elon.musk@spacex.com foo';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.com', email);
    });
    it('should return elon.musk@spacex.co.uk from \'foo elon.musk@spacex.co.uk bar\'', function () {
      input = 'foo elon.musk@spacex.co.uk bar';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.co.uk', email);
    });
    it('should return elon.musk@spacex.co.uk from \'foo elon dot musk at spacex dot co dot uk bar\'', function () {
      input = 'foo elon dot musk at spacex dot co dot uk bar';
      email = helpers.extractEmail(input);
      assert.equal('elon.musk@spacex.co.uk', email);
    });
    it('should return elon-musk@spacex.co.uk from \'foo elon dash musk at spacex dot co dot uk bar\'', function () {
      input = 'foo elon dash musk at spacex dot co dot uk bar';
      email = helpers.extractEmail(input);
      assert.equal('elon-musk@spacex.co.uk', email);
    });
  });
});

describe('Email Existence Test', function () {
  this.timeout(10000);
  it('should return false', function (done) {
    emailExistence.check('x@doesnotexist', function (err, valid) {
      assert.equal(false, valid);
      done();
    });
  });
  it('should return true', function (done) {
    emailExistence.check('andreas.brekken+spam@gmail.com', function (err, valid) {
      assert.strictEqual(true, valid);
      done();                
    });
  });
});

describe('Conversation Flow Tests', function () {
  let email = 'andreas.brekken+spam@gmail.com';
  conversation(opts)
  .userSays('LaunchRequest')
    .ssmlResponse
      .shouldEqual(`<speak> ${app.skillMessages.welcomeMessage} </speak>`, `<speak> ${app.skillMessages.welcomeReprompt} </speak>`)
  .userSays('getVerifyIntent', {email: email})
    .ssmlResponse
      .shouldEqual(`<speak> ${email} seems to be valid. </speak>`)
  .end();
});
