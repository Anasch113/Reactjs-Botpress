
import React, { useEffect, useState } from 'react'

import SpeechRecognition, { useSpeechRecognition, resetTranscript } from 'react-speech-recognition';
import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import "./App.css"
function App() {

  const synth = window.speechSynthesis;
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);



  // Botpress Integration
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.botpress.cloud/webchat/v1/inject.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      window.botpressWebChat.init({
        botId: 'babd50aa-97f1-4941-9a13-6b0e3c12c18a',
        hostUrl: 'https://cdn.botpress.cloud/webchat/v1',
        messagingUrl: 'https://messaging.botpress.cloud',
        clientId: 'babd50aa-97f1-4941-9a13-6b0e3c12c18a',
      })

      window.botpressWebChat.onEvent(
        (event) => {
          if (event.type === 'MESSAGE.RECEIVED') {
            console.log("event", event)
            const message = event.value.payload;
            console.log('A new message was received!')
            if (message && message.text) {
              // Call the speak function for TTS
              speakText(message.text);
            }
          }
        },
        ['MESSAGE.RECEIVED']
      )

    }


  }, [])

  // TTS Integration

  function speakText(text) {
    window.responsiveVoice.speak(text)
    
  }

  // STT Integration

  const startListening = () => {

    setIsListening(true)
    const speechConfig = SpeechConfig.fromSubscription('381cba4fbffc487e8e9b47de5887d40d', 'eastus');
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

    setRecognizer(recognizer)
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
