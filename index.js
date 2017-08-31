const Alexa = require('alexa-sdk');
const getFromAPI = require('./api-fetch');

const hunterAPIKey = process.env.hunterAPIKey;
let domain = 'spacex.com';
const skillMessages = {
  welcomeMessage: 'Yeager email finder. You can ask what emails are associated with any domain or ask me to verify an email',
  welcomeReprompt: 'You can ask what emails are associated with any domain or ask me to verify an email',
  helpMessage: 'Here are some things you can say. What emails are associated with the domain spacex.com? Is elon.musk@spacex.com a valid email?',
  noResultsError: 'I couldn\'t find any results for that domain.',
  tryAgain: 'Try saying the domain name again or try another domain. For example tesla.com',
  goodbyeMessage: 'OK. Happy email hunting from Yeager!',
  skillOverview: 'Yeager allows you to identify the people associated with a website and verify their email addresses.',
  emailResultIntro: `These are the emails I've found associated with ${domain}`,
};
const maxResults = process.env.MAX_RESULTS;
const states = {
  SEARCHMODE: '_SEARCHMODE',
};


let output = '';

const newSessionHandlers = {
  LaunchRequest() {
    this.handler.state = states.SEARCHMODE;
    output = skillMessages.welcomeMessage;
    this.emit(':ask', output, skillMessages.welcomeReprompt);
  },
  getOverview() {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getOverview');
  },
  getEmailsIntent() {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getEmailsIntent');
  },
  getVerifyIntent() {
    this.handler.state = states.SEARCHMODE;
    this.emitWithState('getVerifyIntent');
  },
  'AMAZON.StopIntent': () => {
    this.emit(':tell', skillMessages.goodbyeMessage);
  },
  'AMAZON.CancelIntent': () => {
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
};

const startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
  getOverview() {
    this.emit(':tellWithCard', skillMessages.skillOverview);
  },
  getEmailsIntent(request) {
    console.log(request);
    domain = 'spacex.com';

    if (domain) {
      const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterAPIKey}`;
      getFromAPI.httpGet(url, (response) => {
        // Parse the response into a JSON object ready to be formatted.
        console.log(JSON.stringify(response));
        const emails = response.data.emails;
        let cardContent = 'Data provided by Hunter\n\n';

        // Check if there are data, If not create an error speech out to try again.
        if (response == null) {
          output = 'There was a problem with getting data please try again';
        } else {
          output = skillMessages.emailResultIntro;

          // If we have data.
          for (let i = 0; i < emails.length; i += 1) {
            if (i < maxResults) {
              const value = emails[i].value;
              const firstName = emails[i].first_name;
              const lastName = emails[i].last_name;
              const position = emails[i].position;
              const twitter = emails[i].twitter;

              output += `Result ${i + 1}: ${value}`;
              // TODO: implement the rest of the fields

              cardContent += `Result ${i + 1}\n`;
              cardContent += `${value}\n\n`;
            }
          }

          output += ' See your Alexa app for more information.';
        }

        const cardTitle = `Email Results for ${domain}`;
        this.emit(':tellWithCard', output, cardTitle, cardContent);
      });
    } else {
      this.emit(':tell', skillMessages.noResultsError, skillMessages.tryAgain);
    }
  },
  getVerifyIntent(request) {
    const email = 'fergusonic85@gmail.com';
    console.log(request);

    if (email) {
      const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${hunterAPIKey}`;
      getFromAPI.httpGet(url, (response) => {
        // Parse the response into a JSON object ready to be formatted.
        console.log(JSON.stringify(response));
        const smtpServer = response.data.smtp_server;
        const smtpCheck = response.data.smtp_check;

        // Check if there are data, If not create an error speech out to try again.
        if (response == null) {
          output = 'There was a problem with getting data please try again';
        } else {
          output = 'OK. Here\'s what I\'ve found.';
          if (smtpServer) {
            output += smtpCheck ? `The mail server accepted ${email}` : `The mail server rejected ${email}.`;
          } else {
            output += `The server (the part after the @) for ${email} doesn't seem to be valid`;
          }
        }
        this.emit(':tell', output);
      });
    } else {
      this.emit(':ask', skillMessages.noResultsError, skillMessages.tryAgain);
    }
  },
  'AMAZON.YesIntent': () => {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.NoIntent': () => {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.StopIntent': () => {
    this.emit(':tell', skillMessages.goodbyeMessage);
  },
  'AMAZON.HelpIntent': () => {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.RepeatIntent': () => {
    this.emit(':ask', skillMessages.helpMessage);
  },
  'AMAZON.CancelIntent': () => {
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
