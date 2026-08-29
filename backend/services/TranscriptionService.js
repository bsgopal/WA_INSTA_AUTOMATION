const axios = require('axios');

class TranscriptionService {
  constructor() {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });
  }

  async transcribeVoiceNote(audioUrl) {
    try {
      console.log(`🎤 Downloading voice note from WAHA...`);

      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          ...(process.env.WAHA_API_KEY && { 'X-Api-Key': process.env.WAHA_API_KEY })
        }
      });

      const audioBase64 = Buffer.from(response.data).toString('base64');
      const mimeType = response.headers['content-type'] || 'audio/ogg; codecs=opus';
      const sizeKb = (response.data.length / 1024).toFixed(1);

      console.log(`🎤 Transcribing ${mimeType} (${sizeKb} KB) via Gemini...`);

      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data: audioBase64
          }
        },
        { text: 'Transcribe this voice message exactly, word for word. Return ONLY the transcribed text with no extra commentary.' }
      ]);

      const text = result.response.text().trim();

      if (text) {
        console.log(`🎤 Transcribed: "${text.substring(0, 120)}..."`);
      } else {
        console.warn('🎤 Gemini returned empty transcription');
      }

      return text || null;
    } catch (error) {
      console.error('❌ Voice transcription failed:', error.message);
      if (error.message?.includes('not supported') || error.message?.includes('multimodal')) {
        console.warn('⚠️ Current Gemini model does not support audio. Try gemini-1.5-flash or gemini-1.5-pro.');
      }
      return null;
    }
  }
}

module.exports = new TranscriptionService();
