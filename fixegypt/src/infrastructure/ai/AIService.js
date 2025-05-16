import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../../config.js';
import logger from '../web/middlewares/logger.js';

/**
 * AI Service for image analysis and urgency detection
 */
class AIService {
  /**
   * Analyze an image to classify the reported issue
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeImage(imagePath) {
    try {
      // Check configuration
      if (!config.ai.apiKey || config.ai.apiKey === 'DEMO_API_KEY') {
        logger.warn('AI API key not properly configured, using fallback classification');
        return this._getFallbackClassification();
      }

      // Check if file exists
      try {
        if (!fs.existsSync(imagePath)) {
          logger.error(`Image file not found at path: ${imagePath}`);
          return this._getFallbackClassification();
        }
      } catch (fsError) {
        logger.error(`Error checking if image exists: ${fsError.message}`);
        return this._getFallbackClassification();
      }

      // Debug log
      if (config.ai.debug) {
        logger.info(`Processing image with AI: ${imagePath}`);
      }

      const imageBase64 = await this._encodeImageToBase64(imagePath);
      
      // Try the configured AI provider with retries
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < (config.ai.maxRetries || 3)) {
        try {
          if (config.ai.provider === 'gemini') {
            return await this._analyzeWithGemini(imageBase64);
          } else if (config.ai.provider === 'openrouter') {
            return await this._analyzeWithOpenRouter(imageBase64);
          } else if (config.ai.provider === 'huggingface') {
            return await this._analyzeWithHuggingFace(imagePath);
          } else {
            throw new Error(`Unsupported AI provider: ${config.ai.provider}`);
          }
        } catch (error) {
          lastError = error;
          retryCount++;
          
          if (config.ai.debug) {
            logger.warn(`AI analysis attempt ${retryCount} failed: ${error.message}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // All retries failed
      logger.error(`All AI analysis attempts failed after ${retryCount} tries: ${lastError.message}`);
      return this._getFallbackClassification();
    } catch (error) {
      logger.error(`Error analyzing image: ${error.message}`);
      return this._getFallbackClassification();
    }
  }

  /**
   * Get a fallback classification when AI processing fails
   * @returns {Object} Fallback classification result
   * @private
   */
  _getFallbackClassification() {
    return {
      classification: 'other',
      confidence: 0.5,
      possibleCategories: ['other'],
      error: 'Used fallback classification due to AI service unavailability'
    };
  }

  /**
   * Detect urgency from report description and image
   * @param {string} description - Report description
   * @param {string} imagePath - Path to the image file (optional)
   * @returns {Promise<Object>} Urgency analysis result
   */
  async detectUrgency(description, imagePath = null) {
    try {
      // Check configuration
      if (!config.ai.apiKey || config.ai.apiKey === 'DEMO_API_KEY') {
        logger.warn('AI API key not properly configured, using fallback urgency');
        return this._getFallbackUrgency();
      }

      // Check description
      if (!description || description.trim().length < 10) {
        logger.warn('Description too short for urgency analysis');
        return this._getFallbackUrgency();
      }

      // Process image if provided
      let imageBase64 = null;
      if (imagePath) {
        try {
          if (!fs.existsSync(imagePath)) {
            logger.error(`Image file not found at path: ${imagePath}`);
            // Continue without image
          } else {
            imageBase64 = await this._encodeImageToBase64(imagePath);
          }
        } catch (fsError) {
          logger.error(`Error checking if image exists: ${fsError.message}`);
          // Continue without image
        }
      }

      // Debug log
      if (config.ai.debug) {
        logger.info(`Detecting urgency for description: "${description.substring(0, 50)}..."`);
      }

      // Try the configured AI provider with retries
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount < (config.ai.maxRetries || 3)) {
        try {
          if (config.ai.provider === 'gemini') {
            return await this._detectUrgencyWithGemini(description, imageBase64);
          } else if (config.ai.provider === 'openrouter') {
            return await this._detectUrgencyWithOpenRouter(description, imageBase64);
          } else if (config.ai.provider === 'huggingface') {
            return await this._detectUrgencyWithHuggingFace(description, imagePath);
          } else {
            throw new Error(`Unsupported AI provider: ${config.ai.provider}`);
          }
        } catch (error) {
          lastError = error;
          retryCount++;
          
          if (config.ai.debug) {
            logger.warn(`Urgency detection attempt ${retryCount} failed: ${error.message}`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // All retries failed
      logger.error(`All urgency detection attempts failed after ${retryCount} tries: ${lastError.message}`);
      return this._getFallbackUrgency();
    } catch (error) {
      logger.error(`Error detecting urgency: ${error.message}`);
      return this._getFallbackUrgency();
    }
  }

  /**
   * Get a fallback urgency when AI processing fails
   * @returns {Object} Fallback urgency result
   * @private
   */
  _getFallbackUrgency() {
    return {
      urgency: 'medium',
      confidence: 0.5,
      factors: ['default due to service error'],
      error: 'Used fallback urgency due to AI service unavailability'
    };
  }

  async _encodeImageToBase64(imagePath) {
    return fs.promises.readFile(imagePath, { encoding: 'base64' });
  }

  async _analyzeWithGemini(imageBase64) {
    // Updated endpoint for Gemini 1.5 Flash
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const mimeType = 'image/jpeg'; // Adjust based on image type
    
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: "Analyze this image of an urban infrastructure issue. Classify it into one of these categories: road_damage, water_issue, electricity_issue, waste_management, public_property_damage, street_lighting, sewage_problem, public_transportation, environmental_issue, other. Provide the classification, confidence level (0-1), and a list of possible alternative categories."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    };

    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.ai.apiKey
      }
    });

    try {
      // Extract the JSON response from Gemini's text output
      const textResponse = response.data.candidates[0].content.parts[0].text;
      const jsonStart = textResponse.indexOf('{');
      const jsonEnd = textResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = textResponse.substring(jsonStart, jsonEnd);
        const parsedResult = JSON.parse(jsonStr);
        
        return {
          classification: parsedResult.classification || 'other',
          confidence: parsedResult.confidence || 0.7,
          possibleCategories: parsedResult.possibleCategories || ['other']
        };
      } else {
        // Fallback parse from text if JSON extraction fails
        const lines = textResponse.split('\n');
        const classification = lines.find(l => l.includes('classification'))?.split(':')[1]?.trim().replace(/"|,/g, '') || 'other';
        const confidence = parseFloat(lines.find(l => l.includes('confidence'))?.split(':')[1]?.trim().replace(/"|,/g, '') || '0.7');
        
        return {
          classification,
          confidence,
          possibleCategories: [classification, 'other']
        };
      }
    } catch (error) {
      logger.error('Error parsing Gemini response:', error);
      return {
        classification: 'other',
        confidence: 0.5,
        possibleCategories: ['other']
      };
    }
  }

  async _detectUrgencyWithGemini(description, imageBase64 = null) {
    // Updated endpoint for Gemini 1.5 Flash
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const parts = [
      {
        text: `Analyze the urgency of this urban infrastructure issue report. Description: "${description}". 
        Classify the urgency as "low", "medium", "high", or "critical". 
        Provide confidence level (0-1), and list the factors that influenced this decision. 
        Format the response as JSON.`
      }
    ];

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageBase64
        }
      });
    }

    const requestData = {
      contents: [
        {
          parts
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    };

    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.ai.apiKey
      }
    });

    try {
      // Extract the JSON response from Gemini's text output
      const textResponse = response.data.candidates[0].content.parts[0].text;
      const jsonStart = textResponse.indexOf('{');
      const jsonEnd = textResponse.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = textResponse.substring(jsonStart, jsonEnd);
        const parsedResult = JSON.parse(jsonStr);
        
        return {
          urgency: parsedResult.urgency || 'medium',
          confidence: parsedResult.confidence || 0.7,
          factors: parsedResult.factors || ['based on text analysis']
        };
      } else {
        // Fallback parse from text if JSON extraction fails
        const lines = textResponse.split('\n');
        const urgency = lines.find(l => l.includes('urgency'))?.split(':')[1]?.trim().replace(/"|,/g, '') || 'medium';
        const confidence = parseFloat(lines.find(l => l.includes('confidence'))?.split(':')[1]?.trim().replace(/"|,/g, '') || '0.7');
        
        return {
          urgency,
          confidence,
          factors: ['based on text analysis']
        };
      }
    } catch (error) {
      logger.error('Error parsing Gemini response:', error);
      return {
        urgency: 'medium',
        confidence: 0.5,
        factors: ['based on text analysis']
      };
    }
  }

  async _analyzeWithOpenRouter(imageBase64) {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    const requestData = {
      model: "anthropic/claude-3-opus:beta",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image of an urban infrastructure issue. Classify it into one of these categories: road_damage, water_issue, electricity_issue, waste_management, public_property_damage, street_lighting, sewage_problem, public_transportation, environmental_issue, other. Provide only a JSON object with these fields: classification (string), confidence (number between 0-1), possibleCategories (array of strings)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    };

    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'HTTP-Referer': config.ai.httpReferrer || 'https://fixegypt.org',
        'X-Title': 'FixEgypt Classification'
      }
    });

    try {
      const jsonResponse = JSON.parse(response.data.choices[0].message.content);
      return {
        classification: jsonResponse.classification || 'other',
        confidence: jsonResponse.confidence || 0.7,
        possibleCategories: jsonResponse.possibleCategories || ['other']
      };
    } catch (error) {
      logger.error('Error parsing OpenRouter response:', error);
      return {
        classification: 'other',
        confidence: 0.5,
        possibleCategories: ['other']
      };
    }
  }

  async _detectUrgencyWithOpenRouter(description, imageBase64 = null) {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    const content = [
      {
        type: "text",
        text: `Analyze the urgency of this urban infrastructure issue report. Description: "${description}". 
        Classify the urgency as "low", "medium", "high", or "critical". 
        Provide only a JSON object with these fields: urgency (string), confidence (number between 0-1), factors (array of strings that influenced this decision).`
      }
    ];

    if (imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }

    const requestData = {
      model: "anthropic/claude-3-opus:beta",
      messages: [
        {
          role: "user",
          content
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    };

    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`,
        'HTTP-Referer': config.ai.httpReferrer || 'https://fixegypt.org',
        'X-Title': 'FixEgypt Urgency Detection'
      }
    });

    try {
      const jsonResponse = JSON.parse(response.data.choices[0].message.content);
      return {
        urgency: jsonResponse.urgency || 'medium',
        confidence: jsonResponse.confidence || 0.7,
        factors: jsonResponse.factors || ['based on text analysis']
      };
    } catch (error) {
      logger.error('Error parsing OpenRouter response:', error);
      return {
        urgency: 'medium',
        confidence: 0.5,
        factors: ['based on text analysis']
      };
    }
  }

  async _analyzeWithHuggingFace(imagePath) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      const response = await axios.post(
        config.ai.huggingfaceEndpoint || 'https://api-inference.huggingface.co/models/facebook/detr-resnet-50-panoptic',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${config.ai.apiKey}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Map Hugging Face object detection results to our categories
      const objects = response.data;
      
      // Mapping of detected objects to our categories
      const categoryMapping = {
        'road': 'road_damage',
        'pothole': 'road_damage',
        'traffic light': 'street_lighting',
        'street light': 'street_lighting',
        'water': 'water_issue',
        'pipe': 'water_issue',
        'leak': 'water_issue',
        'trash': 'waste_management',
        'garbage': 'waste_management',
        'waste': 'waste_management',
        'electricity': 'electricity_issue',
        'power line': 'electricity_issue',
        'sewer': 'sewage_problem',
        'drain': 'sewage_problem',
        'bus': 'public_transportation',
        'train': 'public_transportation',
        'bench': 'public_property_damage',
        'tree': 'environmental_issue'
      };

      // Count occurrences of categories
      const categoryCounts = {};
      
      objects.forEach(obj => {
        const label = obj.label.toLowerCase();
        let category = 'other';
        
        // Find matching category
        for (const [key, value] of Object.entries(categoryMapping)) {
          if (label.includes(key)) {
            category = value;
            break;
          }
        }
        
        categoryCounts[category] = (categoryCounts[category] || 0) + (obj.score || 0);
      });
      
      // Find the category with highest confidence
      let topCategory = 'other';
      let topConfidence = 0;
      const possibleCategories = [];
      
      for (const [category, score] of Object.entries(categoryCounts)) {
        possibleCategories.push(category);
        if (score > topConfidence) {
          topConfidence = score;
          topCategory = category;
        }
      }
      
      // Normalize confidence to 0-1
      topConfidence = Math.min(topConfidence, 1);
      
      return {
        classification: topCategory,
        confidence: topConfidence || 0.7,
        possibleCategories: possibleCategories.length > 0 ? possibleCategories : ['other']
      };
    } catch (error) {
      logger.error(`Error with Hugging Face analysis: ${error.message}`);
      return {
        classification: 'other',
        confidence: 0.5,
        possibleCategories: ['other']
      };
    }
  }

  async _detectUrgencyWithHuggingFace(description, imagePath = null) {
    try {
      // For text-based urgency detection
      const textPayload = {
        inputs: description,
        parameters: {
          candidate_labels: ["low urgency", "medium urgency", "high urgency", "critical urgency"]
        }
      };

      const textResponse = await axios.post(
        config.ai.huggingfaceTextEndpoint || 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
        textPayload,
        {
          headers: {
            'Authorization': `Bearer ${config.ai.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Process text classification results
      const labels = textResponse.data.labels;
      const scores = textResponse.data.scores;
      
      // Find index of highest score
      let maxIndex = 0;
      for (let i = 1; i < scores.length; i++) {
        if (scores[i] > scores[maxIndex]) {
          maxIndex = i;
        }
      }
      
      // Map label to urgency level
      const urgencyMap = {
        'low urgency': 'low',
        'medium urgency': 'medium',
        'high urgency': 'high',
        'critical urgency': 'critical'
      };
      
      const urgency = urgencyMap[labels[maxIndex]] || 'medium';
      const confidence = scores[maxIndex];
      
      return {
        urgency,
        confidence,
        factors: ['text analysis']
      };
    } catch (error) {
      logger.error(`Error with Hugging Face urgency detection: ${error.message}`);
      return {
        urgency: 'medium',
        confidence: 0.5,
        factors: ['default due to service error']
      };
    }
  }
}

export default new AIService(); 