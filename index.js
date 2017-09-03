const Alexa = require('alexa-sdk');
const helpers = require('./helpers');

const hunterAPIKey = process.env.hunterAPIKey;
const skillMessages = {
  welcomeMessage: 'Yeager email finder. You can ask what emails are associated with any domain or ask me to verify an email',
  welcomeReprompt: 'You can ask what emails are associated with any domain or ask me to verify an email',
  helpMessage: 'Here are some things you can say. What emails are associated with the domain spacex.com? Is elon.musk@spacex.com a valid email?',
  noResultsError: 'I couldn\'t find any results for that domain.',
  tryAgain: 'Try saying the domain name again or try another domain. For example tesla.com',
  goodbyeMessage: 'OK. Happy email hunting from Yeager!',
  skillOverview: 'Yeager allows you to identify the people associated with a website and verify their email addresses.',
};
const maxResults = process.env.MAX_RESULTS;
const states = {
  SEARCHMODE: '_SEARCHMODE',
};


let output = '';

const newSessionHandlers = {
  LaunchRequest: function () {
    this.handler.state = states.SEARCHMODE;
    output = skillMessages.welcomeMessage;
    this.emit(':ask', output, skillMessages.welcomeReprompt);
  },
  getOverview: function () {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getOverview');
  },
  getEmailsIntent: function () {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getEmailsIntent');
  },
  getVerifyIntent: function () {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getVerifyIntent');
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', skillMessages.goodbyeMessage);
  },
  'AMAZON.CancelIntent': function () {
    // Use this function to clear up and save any data needed between sessions
    this.emit(':tell', skillMessages.goodbyeMessage);
  },
  SessionEndedRequest: function () {
    // Use this function to clear up and save any data needed between sessions
    this.emit('AMAZON.StopIntent');
  },
  Unhandled: function () {
    output = skillMessages.helpMessage;
    this.emit(':ask', output, skillMessages.welcomeReprompt);
  },
};

const startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
  'getOverview': function () {
    this.emit(':tellWithCard', skillMessages.skillOverview);
  },
  'getEmailsIntent': function () {
    const domain = helpers.extractRootDomain(this.event.request.intent.slots.domain.value);

    if (domain) {
      const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterAPIKey}`;
      helpers.httpsGet(url, (response) => {
        console.log(`Response: ${JSON.stringify(response)}`);
        // Parse the response into a JSON object ready to be formatted.
        response = JSON.parse(response);
        const emails = response.data.emails;
        let cardContent = 'Data provided by Hunter\n\n';

        // Check if there are data, If not create an error speech out to try again.
        if (response == null) {
          output = 'There was a problem with getting data please try again';
        } else {
          output = `These are the emails I've found associated with ${domain}`;

          // If we have data.
          for (let i = 0; i < emails.length; i += 1) {
            if (i < maxResults) {
              const value = emails[i].value;
              const firstName = emails[i].first_name;
              const lastName = emails[i].last_name;
              const position = emails[i].position;
              const twitter = emails[i].twitter;

              output += `<break time='1s'/>Result ${i + 1} is<break time='1s'/>`;
              if (firstName || lastName) output += `Name <break time='1s'/> ${firstName} ${lastName}`;
              output += `<break time='1s'/> Email <break time='1s'/> ${value}`;
              if (position) output += `<break time='1s'/>Position <break time='1s'/> ${position}`;
              if (twitter) output += `<break time='1s'/>Twitter handle <break time='1s'/> ${twitter}`;

              cardContent += `Result ${i + 1}\n`;
              if (firstName) cardContent += firstName;
              cardContent += lastName ? ` ${lastName}\n` : '\n';
              cardContent += ` ${value}\n`;
              if (position) cardContent += `${position}\n`;
              if (twitter) cardContent += `${twitter}\n`;
              cardContent += '\n';
            }
          }
          output += '<break time=\'2s\'/> See your Alexa app for more information.';
        }

        const cardTitle = `Email Results for ${domain}`;
        this.emit(':tellWithCard', output, cardTitle, cardContent);
      });
    } else {
      this.emit(':tell', skillMessages.noResultsError, skillMessages.tryAgain);
    }
  },
  'getVerifyIntent': function () {
    const email = helpers.extractEmail(this.event.request.intent.slots.email.value);
    console.log(`Email: ${email}`);

    if (email) {
      const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterAPIKey}`;
      helpers.httpsGet(url, (response) => {
        // Parse the response into a JSON object ready to be formatted.
        response = JSON.parse(response);
        console.log(JSON.stringify(response));
        const smtpServer = response.data.smtp_server;
        const smtpCheck = response.data.smtp_check;

        // Check if there are data, If not create an error speech out to try again.
        if (response == null) {
          output = 'There was a problem with getting data please try again';
        } else {
          output = 'OK. Here\'s what I\'ve found.\'<break time=\'1s\'/>';
          if (smtpServer) {
            output += smtpCheck ? `${email} seems to be valid.` : `The mail server rejected ${email}.`;
          } else {
            output += `The server for ${email} doesn't seem to be valid`;
          }
        }
        this.emit(':tell', output);
      });
    } else {
      this.emit(':ask', skillMessages.noResultsError, skillMessages.tryAgain);
    }
  },
  'AMAZON.YesIntent': function () {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.NoIntent': function () {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', skillMessages.goodbyeMessage);
  },
  'AMAZON.HelpIntent': function () {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.RepeatIntent': function () {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.CancelIntent': function () {
    // Use this function to clear up and save any data needed between sessions
    this.emit(':tell', skillMessages.goodbyeMessage);
  },
  SessionEndedRequest() {
    // Use this function to clear up and save any data needed between sessions
    this.emit('AMAZON.StopIntent');
  },
  Unhandled() {
    output = skillMessages.helpMessage;
    this.emit(':ask', output, skillMessages.welcomeReprompt);
  },
});

exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(newSessionHandlers, startSearchHandlers);
  alexa.execute();
};
