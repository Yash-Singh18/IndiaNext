its time we create a new ai based service - a deep fake detection tool 
what it does is take video / audio from the users and detect if the (if user inputs the video we extract audio and use same pipeline as the audio one while on the other hand if user inputs the audio we use the audio pipeline) and a seperate pipeline for the video

video pipeline:
Video Upload
   ↓
Extract Frames (1 fps)
   ↓
Face Detection (MTCNN / RetinaFace)
   ↓
Crop Faces
   ↓
EfficientNet Deepfake Classifier
   ↓
Average confidence

Output : Video Fake Probability


audio:
Extract audio from video / direct audio
     ↓
Convert to spectrogram
     ↓
Wav2Vec2 fake speech classifier
     ↓
Fake probability

image:
User uploads image
      ↓
Face detection (RetinaFace / MTCNN)
      ↓
Crop face
      ↓
Deepfake classifier (EfficientNet)
      ↓
Fake probability



replace our logs in navbar that is at :frontend to this new page:
frontend should look like a option for user to put a video or audio or a image to use for classification 

use this models :
prithivMLmods/Deep-Fake-Detector-Model just replicate api key i will provide

use this same model for video 
Video upload
     ↓
Extract 10 frames (ffmpeg / OpenCV)
     ↓
Run image deepfake detector
     ↓
Average fake probability

for audio :
asvspoof/wav2vec2-deepfake-detection - use replicate api key or any other provider of any choice 

overall architechture:
            USER INPUT
         /      |      \
       Image   Video   Audio
        ↓       ↓       ↓
Deepfake CNN  Frame CNN  Wav2Vec2
        ↓       ↓       ↓
   Fake Score  Fake Score  Fake Score
          \      |      /
           SafeScore Engine
                 ↓
        Llama 70B Explanation
                 ↓
            Dashboard

llm will be running on groq i will provide api key for it 

output should look like :

Indicators
✔ Facial warping detected
✔ GAN artifact patterns
✔ Voice spectral anomalies
✔ Lip-sync mismatch

Final SafeScore: 32/100
Risk Level: HIGH


you are like a senior dev to me soo you can recommend me any other way as we will need to deploy this models soo i need all models running on the cloud - for freee as we wont need much - groq is good as we have used but other models are not hosted there 
you tell me exactly what thing you require from my side and i will give you everything you need


hugging face   REDACTED_HF_TOKEN
Groq  REDACTED_GROQ_KEY