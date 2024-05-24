
import React, { useEffect } from 'react'
import regeneratorRuntime from "regenerator-runtime";
import SpeechRecognition, { useSpeechRecognition, resetTranscript } from 'react-speech-recognition';
import "./App.css"
function App() {

  const synth = window.speechSynthesis;



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

  const {
    transcript,
   resetTranscript,
    
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const startListening = async () => {
    await SpeechRecognition.startListening({ continuous: true, language: "en" });
    
  }

  if (!browserSupportsSpeechRecognition) {
    console.log(browserSupportsSpeechRecognition)
    return null;

  }

  const stopListening = ()=>{
    
    SpeechRecognition.stopListening();
    window.botpressWebChat.sendPayload({ type: 'text', text: transcript });
    
  }
  return (
    <>
    <div className='body-head'>
    <button className="btn" onClick={startListening} ><box-icon name='microphone' color='#ffffff'></box-icon> </button>
      <button className="btn-stop" onClick={stopListening} ><box-icon name='microphone-off' color='#ffffff'></box-icon> </button>
    </div>
     
    </>
  )
}

export default App
