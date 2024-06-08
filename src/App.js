
import React, { useEffect, useState } from 'react'


import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason, SpeechSynthesizer, SpeakerAudioDestination } from 'microsoft-cognitiveservices-speech-sdk';
import "./App.css"
function App() {


  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [synthesizer, setSynthesizer] = useState(null);
  const [speechQueue, setSpeechQueue] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConversation, setIsConversation] = useState(false);
  const [shouldStartListening, setShouldStartListening] = useState(false);

  const azureKey = process.env.REACT_APP_AZURE_KEY;
  const azureRegion = process.env.REACT_APP_AZURE_REGION;
  const botId = process.env.REACT_APP_BOT_KEY_ID;
  const botClientId = process.env.REACT_APP_BOT_CLIENT_ID;



  // Botpress Integration
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.botpress.cloud/webchat/v1/inject.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      window.botpressWebChat.init({
        botId: botId,
        hostUrl: 'https://cdn.botpress.cloud/webchat/v1',
        messagingUrl: 'https://messaging.botpress.cloud',
        clientId: botClientId,
        botName: 'Fairy Tales ',
        enableConversationDeletion: true,


      })

      console.log("connected")
       // Listen for chat interface loaded event
   



      
      // Combined event handler
    window.botpressWebChat.onEvent(
      (event) => {
        if (event.type === 'LIFECYCLE.READY') {
          console.log("Chat interface ready", event);
          // Simulate user message to trigger bot response after interface loaded
          const initialMessage = "Conversation Started";
          window.botpressWebChat.sendPayload({
            type: 'text',
            text: initialMessage,
          });
        } else if (event.type === 'MESSAGE.RECEIVED') {

          console.log("A new message was received", event);
          const message = event.value.payload;
          setIsConversation(true);
          if (message && message.text) {
            // Call the speak function for TTS
            setSpeechQueue((prevQueue) => [...prevQueue, message.text]);
          }
        }
      },
      ['LIFECYCLE.READY', 'MESSAGE.RECEIVED']
    );
      
    }


  }, [])




const startConversation = ()=>{

}

  // Initialize Azure Speech Synthesizer
  useEffect(() => {
    if (azureKey && azureRegion) {
      const speechConfig = SpeechConfig.fromSubscription(azureKey, azureRegion);
      const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
      const newSynthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
      setSynthesizer(newSynthesizer);

      return () => {
        newSynthesizer.close();
      };
    }
  }, [azureKey, azureRegion]);
  // TTS Integration
  const speakText = (text) => {
    if (synthesizer) {
      setIsSpeaking(true);
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            console.log('Speech synthesized for text [' + text + ']');
            // Using a delay to ensure TTS completes speaking before starting STT
            setTimeout(() => {
              setIsSpeaking(false);
              setShouldStartListening(true);
            }, text.length * 100); // Adjust timing based on average speech rate
          } else {
            console.error('Speech synthesis canceled, ' + result.errorDetails);
            setIsSpeaking(false);
          }
        },
        (err) => {
          console.trace('Error synthesizing speech:', err);
          setIsSpeaking(false);
        }
      );
    }
  };


  console.log("isSpeaking", isSpeaking)

  // Effect to process the speech queue
  useEffect(() => {
    if (!isSpeaking && speechQueue.length > 0 && isConversation) {
      stopListening()
      const nextText = speechQueue[0];
      console.log("next text", nextText)
      setSpeechQueue((prevQueue) => prevQueue.slice(1));
      speakText(nextText);

    }

    
  }, [isSpeaking, speechQueue, isConversation]);


   // Effect to start listening after TTS completes all messages
   useEffect(() => {
    if (shouldStartListening && !isSpeaking && speechQueue.length === 0 && !isListening) {
      startListening();
      setShouldStartListening(false);
    }
  }, [shouldStartListening, isSpeaking, speechQueue, isListening]);

  console.log("isListening", isListening)




  // STT Integration
  const startListening = () => {
    if (isSpeaking || isListening) {
      return;
    }
    setIsListening(true);

    const speechConfig = SpeechConfig.fromSubscription(azureKey, azureRegion);
    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognized = (s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        setTranscript(e.result.text);
        window.botpressWebChat.sendPayload({ type: 'text', text: e.result.text });
        recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log('Recognition stopped.');
          },
          (err) => {
            console.error('Error stopping recognition:', err);

          }
        );
      } else {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log('Recognition stopped.');
          },
          (err) => {
            console.error('Error stopping recognition:', err);
          }
        );
        console.log('No speech could be recognized.');
      }
    };

    recognizer.startContinuousRecognitionAsync(
      () => {
        console.log('Recognition started.');
        setIsListening(true);
      },
      (err) => {
        console.error('Error starting recognition:', err);
        setIsListening(false);
      }
    );

    recognizer.sessionStopped = (s, e) => {
      console.log('Session stopped.');
      recognizer.stopContinuousRecognitionAsync();
      setIsListening(false);
    };

    recognizer.canceled = (s, e) => {
      console.log('Recognition canceled.');
      recognizer.stopContinuousRecognitionAsync();
      setIsListening(false);
    };

    setRecognizer(recognizer);
  };

  const stopListening = () => {
    setIsListening(false);

    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('Recognition stopped.');
        },
        (err) => {
          console.error('Error stopping recognition:', err);
        }
      );
    }
  };
  return (
    <>
      <div className='body-head'>
        {
          !isListening ? <button className="btn" onClick={startListening} ><box-icon name='microphone' color='#ffffff'></box-icon> </button> :
            <button className="btn-stop" onClick={stopListening} ><box-icon name='microphone-off' color='#ffffff'></box-icon> </button>
        }



      </div>

    </>
  )
}

export default App
