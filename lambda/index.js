const Alexa = require('ask-sdk');
const constants = require('./constants');
const util = require('./util');

const skillName = 'inThrall';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    // const playbackSetting = await getPlaybackSetting(handlerInput);
    // playbackSetting.loop = true;
    return controller.play(handlerInput);
  },
};



const StartIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'StartIntent' || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent' )
    );
  },

    // const speechText = `<speak>Thanks for using Morning Meditation. Please leave a 5 star review! ${getRandomGoodbye()} <break time="1s"/> <audio src="https://dl.dropboxusercontent.com/s/2zs3b0s8k97jaz5/stcreate_Add.mp3"/></speak>`;
  async handle(handlerInput) {
    // const playbackSetting = await getPlaybackSetting(handlerInput);
    // playbackSetting.loop = true;
    return controller.play(handlerInput);
  },
};



const AudioPlayerEventHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type.startsWith('AudioPlayer.');
  },
  async handle(handlerInput) {
    const {
      requestEnvelope,
      attributesManager,
      responseBuilder
    } = handlerInput;
    const audioPlayerEventName = requestEnvelope.request.type.split('.')[1];
    const {
      playbackSetting,
      playbackInfo
    } = await attributesManager.getPersistentAttributes();

    switch (audioPlayerEventName) {
      case 'PlaybackStarted':
        playbackInfo.token = getToken(handlerInput);
        playbackInfo.index = await getIndex(handlerInput);
        playbackInfo.inPlaybackSession = true;
        playbackInfo.hasPreviousPlaybackSession = true;
        break;
      case 'PlaybackFinished':
        playbackInfo.inPlaybackSession = false;
        playbackInfo.hasPreviousPlaybackSession = false;
        playbackInfo.nextStreamEnqueued = false;
        break;
      case 'PlaybackStopped':
        playbackInfo.token = getToken(handlerInput);
        playbackInfo.index = await getIndex(handlerInput);
        playbackInfo.offsetInMilliseconds = getOffsetInMilliseconds(handlerInput);
        break;
      case 'PlaybackNearlyFinished':
        {
          if (playbackInfo.nextStreamEnqueued) {
            break;
          }

          const enqueueIndex = (playbackInfo.index + 1) % constants.audioData.length;

          if (enqueueIndex === 0 && !playbackSetting.loop) {
            break;
          }

          playbackInfo.nextStreamEnqueued = true;

          const enqueueToken = playbackInfo.playOrder[enqueueIndex];
          const playBehavior = 'ENQUEUE';
          const meditation = constants.audioData[playbackInfo.playOrder[enqueueIndex]];
          const expectedPreviousToken = playbackInfo.token;
          const offsetInMilliseconds = 0;
          
          console.log(meditation.url)
          
          responseBuilder.addAudioPlayerPlayDirective(
            playBehavior,
            meditation.url,
            enqueueToken,
            offsetInMilliseconds,
            expectedPreviousToken,
          );
          break;
        }
      case 'PlaybackFailed':
        playbackInfo.inPlaybackSession = false;
        console.log('Playback Failed : %j', handlerInput.requestEnvelope.request.error);
        return;
      default:
        throw new Error('Should never reach here!');
    }

    return responseBuilder.getResponse();
  },
};

const CheckAudioInterfaceHandler = {
  async canHandle(handlerInput) {
    const audioPlayerInterface = ((((handlerInput.requestEnvelope.context || {}).System || {}).device || {}).supportedInterfaces || {}).AudioPlayer;
    return audioPlayerInterface === undefined
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Sorry, this skill is not supported on this device')
      .withShouldEndSession(true)
      .getResponse();
  },
};


const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    const speechText = `This is ${skillName}!, This skill will show you how to start your day. Once you are ready, just say start, to start meditating. I will guide you throughout the process. How can I help?`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.speak('session ended').getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};



const ExitHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;


    return  request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.StopIntent' ||
        request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.PauseIntent' );
  },
  async handle(handlerInput) {
    // const speechText = `<speak>Thanks for using Morning Meditation. Please leave a 5 star review! ${getRandomGoodbye()} <break time="1s"/> <audio src="https://dl.dropboxusercontent.com/s/2zs3b0s8k97jaz5/stcreate_Add.mp3"/></speak>`;
    return controller.stop(handlerInput);
    // const speechText = `<speak>Thanks for using Morning Meditation. ${getRandomGoodbye()}</speak>`;

    // return handlerInput.responseBuilder
    //   .speak(speechText)
    //   .getResponse();
  },
};

const FallbackIntentHandler = {
  async canHandle(handlerInput) {
    const playbackInfo = await getPlaybackInfo(handlerInput);
    const request = handlerInput.requestEnvelope.request;


    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.FallbackIntent');
  },
  async handle(handlerInput) {
    // const speechText = `<speak>Thanks for using Morning Meditation. Please leave a 5 star review! ${getRandomGoodbye()} <break time="1s"/> <audio src="https://dl.dropboxusercontent.com/s/2zs3b0s8k97jaz5/stcreate_Add.mp3"/></speak>`;
    return controller.stop(handlerInput);
    // const speechText = `<speak>Thanks for using Morning Meditation. ${getRandomGoodbye()}</speak>`;

    // return handlerInput.responseBuilder
    //   .speak(speechText)
    //   .getResponse();
  },
};
const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.log(`System exception encountered: ${handlerInput.requestEnvelope.request.reason}`);
  },
};

// *****************************************
// *********** HELPER FUNCTIONS ************
// *****************************************

function randomize(array) {
  const randomItem = array[Math.floor(Math.random() * array.length)];
  return randomItem;
}

function getRandomGoodbye() {
  const goodbyes = [
    'OK.  Goodbye!',
    'Have a great day!',
    'Come back again soon!',
  ];
  return randomize(goodbyes);
}


// *****************************************
// *********** Interceptors ************
// *****************************************
const LogResponseInterceptor = {
  process(handlerInput) {
    console.log(`RESPONSE = ${JSON.stringify(handlerInput.responseBuilder.getResponse())}`);
  },
};

const LogRequestInterceptor = {
  process(handlerInput) {
    console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
  },
};

const LoadPersistentAttributesRequestInterceptor = {
  async process(handlerInput) {
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();

    // Check if user is invoking the skill the first time and initialize preset values
    if (Object.keys(persistentAttributes).length === 0) {
      handlerInput.attributesManager.setPersistentAttributes({
        playbackSetting: {
          loop: true,
          shuffle: false,
        },
        playbackInfo: {
          playOrder: [...Array(constants.audioData.length).keys()],
          index: 0,
          offsetInMilliseconds: 0,
          playbackIndexChanged: true,
          token: '',
          nextStreamEnqueued: false,
          inPlaybackSession: false,
          hasPreviousPlaybackSession: false,
        },
      });
    }
  },
};

const SavePersistentAttributesResponseInterceptor = {
  async process(handlerInput) {
    await handlerInput.attributesManager.savePersistentAttributes();
  },
};

/* HELPER FUNCTIONS */

async function getPlaybackInfo(handlerInput) {
  const attributes = await handlerInput.attributesManager.getPersistentAttributes();
  return attributes.playbackInfo;
}

async function getPlaybackSetting(handlerInput) {
  const attributes = await handlerInput.attributesManager.getPersistentAttributes();
  return attributes.playbackSetting;
}

async function canThrowCard(handlerInput) {
  const {
    requestEnvelope,
    attributesManager
  } = handlerInput;
  const playbackInfo = await getPlaybackInfo(handlerInput);

  if (requestEnvelope.request.type === 'IntentRequest' && playbackInfo.playbackIndexChanged) {
    playbackInfo.playbackIndexChanged = false;
    return true;
  }
  return false;
}

const controller = {
  async play(handlerInput) {
    const {
      attributesManager,
      responseBuilder
    } = handlerInput;

    const playbackInfo = await getPlaybackInfo(handlerInput);
    const {
      playOrder,
      offsetInMilliseconds,
      index
    } = playbackInfo;

    const playBehavior = 'REPLACE_ALL';
    const meditation = constants.audioData[playOrder[index]];
    const token = playOrder[index];
    playbackInfo.nextStreamEnqueued = false;
    console.log(meditation.url)
    responseBuilder
      .speak(`This is ${meditation.title}`)
      .speak(`This is ${meditation.title}`)
      .withShouldEndSession(true)
      .addAudioPlayerPlayDirective(playBehavior, meditation.url, token, offsetInMilliseconds, null);

    if (await canThrowCard(handlerInput)) {
      const cardTitle = `Playing ${meditation.title}`;
      const cardContent = `Playing ${meditation.title}`;
      responseBuilder.withSimpleCard(cardTitle, cardContent);
    }

    return responseBuilder.getResponse();
  },
  stop(handlerInput) {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
    //   .withShouldEndSession(true)
      .getResponse();
  },
  async playNext(handlerInput) {
    const {
      playbackInfo,
      playbackSetting,
    } = await handlerInput.attributesManager.getPersistentAttributes();

    const nextIndex = (playbackInfo.index + 1) % constants.audioData.length;

    if (nextIndex === 0 && !playbackSetting.loop) {
      return handlerInput.responseBuilder
        .speak('You have reached the end of the playlist')
        .addAudioPlayerStopDirective()
        .getResponse();
    }

    playbackInfo.index = nextIndex;
    playbackInfo.offsetInMilliseconds = 0;
    playbackInfo.playbackIndexChanged = true;

    return this.play(handlerInput);
  },
  async playPrevious(handlerInput) {
    const {
      playbackInfo,
      playbackSetting,
    } = await handlerInput.attributesManager.getPersistentAttributes();

    let previousIndex = playbackInfo.index - 1;

    if (previousIndex === -1) {
      if (playbackSetting.loop) {
        previousIndex += constants.audioData.length;
      } else {
        return handlerInput.responseBuilder
          .speak('You have reached the start of the playlist')
          .addAudioPlayerStopDirective()
          .getResponse();
      }
    }

    playbackInfo.index = previousIndex;
    playbackInfo.offsetInMilliseconds = 0;
    playbackInfo.playbackIndexChanged = true;

    return this.play(handlerInput);
  },
};

function getToken(handlerInput) {
  // Extracting token received in the request.
  return handlerInput.requestEnvelope.request.token;
}

async function getIndex(handlerInput) {
  // Extracting index from the token received in the request.
  const tokenValue = parseInt(handlerInput.requestEnvelope.request.token, 10);
  const attributes = await handlerInput.attributesManager.getPersistentAttributes();

  return attributes.playbackInfo.playOrder.indexOf(tokenValue);
}

function getOffsetInMilliseconds(handlerInput) {
  // Extracting offsetInMilliseconds received in the request.
  return handlerInput.requestEnvelope.request.offsetInMilliseconds;
}

function shuffleOrder() {
  const array = [...Array(constants.audioData.length).keys()];
  let currentIndex = array.length;
  let temp;
  let randomIndex;
  // Algorithm : Fisher-Yates shuffle
  return new Promise((resolve) => {
    while (currentIndex >= 1) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temp = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temp;
    }
    resolve(array);
  });
}

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StartIntentHandler,
    HelpIntentHandler,
    CheckAudioInterfaceHandler,
    SystemExceptionHandler,
    SessionEndedRequestHandler,
    ExitHandler,
    FallbackIntentHandler,
    AudioPlayerEventHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LogRequestInterceptor)
  .addResponseInterceptors(LogResponseInterceptor)
  .addRequestInterceptors(LoadPersistentAttributesRequestInterceptor)
  .addResponseInterceptors(SavePersistentAttributesResponseInterceptor)
  .addErrorHandlers(ErrorHandler)
  .withAutoCreateTable(false)
  .withTableName(constants.skill.dynamoDBTableName)
  .lambda();
