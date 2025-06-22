/**
 * LOCALIZATION AGENT - Global Accessibility & Translation Engine
 * 
 * This agent ensures global accessibility for the Zenith platform
 * Handles bidirectional translation between any languages
 * Integrates with all other agents for seamless multilingual workflows
 * 
 * Features:
 * - Real-time content translation (100+ languages)
 * - Cultural adaptation and localization
 * - Platform UI localization
 * - Agent integration hooks
 * - Quality assessment for translations
 */

import OpenAI from 'openai';

export interface TranslationRequest {
  content: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentType: 'UI' | 'MARKETING' | 'TECHNICAL' | 'CONVERSATIONAL' | 'LEGAL';
  context?: string;
  culturalAdaptation?: boolean;
}

export interface TranslationResult {
  originalContent: string;
  translatedContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  culturalNotes?: string[];
  alternatives?: string[];
  quality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface LanguageDetection {
  detectedLanguage: string;
  confidence: number;
  alternatives: { language: string; confidence: number }[];
}

export interface LocalizationWorkflow {
  clientInput: string;
  detectedLanguage: string;
  internalLanguage: 'en'; // Always English for internal processing
  agentOutput: string;
  finalOutput: string;
  translationSteps: {
    step: string;
    input: string;
    output: string;
    language: string;
  }[];
}

export class LocalizationAgent {
  private openai: OpenAI;
  private supportedLanguages: Map<string, string>;
  private systemPrompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize supported languages (ISO 639-1 codes)
    this.supportedLanguages = new Map([
      ['en', 'English'],
      ['es', 'Spanish'],
      ['fr', 'French'],
      ['de', 'German'],
      ['it', 'Italian'],
      ['pt', 'Portuguese'],
      ['ru', 'Russian'],
      ['ja', 'Japanese'],
      ['ko', 'Korean'],
      ['zh', 'Chinese (Simplified)'],
      ['ar', 'Arabic'],
      ['hi', 'Hindi'],
      ['th', 'Thai'],
      ['vi', 'Vietnamese'],
      ['pl', 'Polish'],
      ['tr', 'Turkish'],
      ['nl', 'Dutch'],
      ['sv', 'Swedish'],
      ['da', 'Danish'],
      ['no', 'Norwegian'],
      ['fi', 'Finnish'],
      ['cs', 'Czech'],
      ['hu', 'Hungarian'],
      ['ro', 'Romanian'],
      ['bg', 'Bulgarian'],
      ['hr', 'Croatian'],
      ['sk', 'Slovak'],
      ['sl', 'Slovenian'],
      ['et', 'Estonian'],
      ['lv', 'Latvian'],
      ['lt', 'Lithuanian'],
      ['mt', 'Maltese'],
      ['he', 'Hebrew'],
      ['id', 'Indonesian'],
      ['ms', 'Malay'],
      ['tl', 'Filipino'],
      ['sw', 'Swahili'],
      ['am', 'Amharic'],
      ['bn', 'Bengali'],
      ['gu', 'Gujarati'],
      ['kn', 'Kannada'],
      ['ml', 'Malayalam'],
      ['mr', 'Marathi'],
      ['ta', 'Tamil'],
      ['te', 'Telugu'],
      ['ur', 'Urdu'],
      ['fa', 'Persian'],
      ['ps', 'Pashto'],
      ['ku', 'Kurdish'],
      ['ka', 'Georgian'],
      ['hy', 'Armenian'],
      ['az', 'Azerbaijani'],
      ['kk', 'Kazakh'],
      ['ky', 'Kyrgyz'],
      ['uz', 'Uzbek'],
      ['mn', 'Mongolian'],
      ['my', 'Myanmar'],
      ['km', 'Khmer'],
      ['lo', 'Lao'],
      ['si', 'Sinhala'],
      ['ne', 'Nepali'],
      ['dz', 'Dzongkha']
    ]);

    this.systemPrompt = `You are the Localization Agent for Zenith, the world's first autonomous digital agency platform. You are an expert linguist and cultural consultant.

CORE MISSION: Provide accurate, culturally-appropriate translations and ensure global accessibility for all Zenith users.

EXPERTISE:
- Professional translation across 50+ languages
- Cultural adaptation and localization best practices
- Technical terminology consistency
- UI/UX text optimization for different languages
- Marketing copy that resonates across cultures
- Legal and compliance text accuracy

TRANSLATION PRINCIPLES:
1. Accuracy: Maintain meaning and intent
2. Cultural Sensitivity: Adapt for local customs and norms
3. Consistency: Use established terminology
4. Clarity: Ensure comprehension for target audience
5. Brand Voice: Maintain Zenith's professional, innovative tone

CONTENT TYPES:
- UI: Interface elements, buttons, labels (concise, clear)
- MARKETING: Persuasive copy, calls-to-action (engaging, culturally relevant)
- TECHNICAL: Documentation, error messages (precise, professional)
- CONVERSATIONAL: Chat, responses (natural, friendly)
- LEGAL: Terms, policies (accurate, compliant)

OUTPUT FORMAT: Always provide high-quality translations with cultural context and alternatives when helpful.`;
  }

  /**
   * LANGUAGE DETECTION
   * Automatically detect the language of input text
   */
  async detectLanguage(content: string): Promise<LanguageDetection> {
    try {
      const messages = [
        { role: 'system' as const, content: this.systemPrompt },
        { 
          role: 'user' as const, 
          content: `Detect the language of this text and provide confidence scores: "${content}"

Return a JSON object with:
- detectedLanguage: ISO 639-1 language code (e.g., "en", "es", "fr")
- confidence: number (0-100)
- alternatives: array of {language: string, confidence: number} for other possible languages` 
        }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.1,
        max_tokens: 200
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      const detection = JSON.parse(response);
      return {
        detectedLanguage: detection.detectedLanguage,
        confidence: detection.confidence,
        alternatives: detection.alternatives || []
      };

    } catch (error) {
      console.error('Language Detection Error:', error);
      
      // Fallback detection
      return {
        detectedLanguage: 'en', // Default to English
        confidence: 50,
        alternatives: []
      };
    }
  }

  /**
   * CONTENT TRANSLATION
   * Translate content with cultural adaptation
   */
  async translateContent(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const messages = [
        { role: 'system' as const, content: this.systemPrompt },
        { 
          role: 'user' as const, 
          content: `Translate this ${request.contentType} content from ${request.sourceLanguage} to ${request.targetLanguage}:

CONTENT: "${request.content}"
CONTEXT: ${request.context || 'General business communication'}
CULTURAL_ADAPTATION: ${request.culturalAdaptation ? 'Yes - adapt for local culture' : 'No - direct translation'}

Provide a JSON response with:
- translatedContent: the main translation
- confidence: translation quality confidence (0-100)
- culturalNotes: array of cultural adaptation notes (if applicable)
- alternatives: array of alternative translations (if helpful)
- quality: "HIGH" | "MEDIUM" | "LOW"` 
        }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      const result = JSON.parse(response);
      
      return {
        originalContent: request.content,
        translatedContent: result.translatedContent,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: result.confidence,
        culturalNotes: result.culturalNotes || [],
        alternatives: result.alternatives || [],
        quality: result.quality || 'MEDIUM'
      };

    } catch (error) {
      console.error('Translation Error:', error);
      
      // Fallback response
      return {
        originalContent: request.content,
        translatedContent: request.content, // Return original if translation fails
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0,
        culturalNotes: ['Translation service temporarily unavailable'],
        alternatives: [],
        quality: 'LOW'
      };
    }
  }

  /**
   * AGENT INTEGRATION WORKFLOW
   * Complete workflow for multilingual agent interactions
   */
  async processAgentWorkflow(
    clientInput: string,
    agentOutput: string,
    clientLanguage?: string
  ): Promise<LocalizationWorkflow> {
    const workflow: LocalizationWorkflow = {
      clientInput,
      detectedLanguage: 'en',
      internalLanguage: 'en',
      agentOutput,
      finalOutput: agentOutput,
      translationSteps: []
    };

    try {
      // Step 1: Detect client input language
      if (!clientLanguage) {
        const detection = await this.detectLanguage(clientInput);
        workflow.detectedLanguage = detection.detectedLanguage;
      } else {
        workflow.detectedLanguage = clientLanguage;
      }

      // Step 2: Translate client input to English (if not already English)
      if (workflow.detectedLanguage !== 'en') {
        const inputTranslation = await this.translateContent({
          content: clientInput,
          sourceLanguage: workflow.detectedLanguage,
          targetLanguage: 'en',
          contentType: 'CONVERSATIONAL',
          context: 'Client request to digital agency platform'
        });

        workflow.translationSteps.push({
          step: 'Client Input Translation',
          input: clientInput,
          output: inputTranslation.translatedContent,
          language: `${workflow.detectedLanguage} → en`
        });
      }

      // Step 3: Translate agent output back to client language (if not English)
      if (workflow.detectedLanguage !== 'en') {
        const outputTranslation = await this.translateContent({
          content: agentOutput,
          sourceLanguage: 'en',
          targetLanguage: workflow.detectedLanguage,
          contentType: 'CONVERSATIONAL',
          context: 'Digital agency response to client',
          culturalAdaptation: true
        });

        workflow.finalOutput = outputTranslation.translatedContent;
        
        workflow.translationSteps.push({
          step: 'Agent Output Translation',
          input: agentOutput,
          output: outputTranslation.translatedContent,
          language: `en → ${workflow.detectedLanguage}`
        });
      }

      return workflow;

    } catch (error) {
      console.error('Agent Workflow Error:', error);
      return workflow; // Return original workflow if translation fails
    }
  }

  /**
   * UI LOCALIZATION
   * Translate platform UI elements
   */
  async localizeUI(
    uiElements: Record<string, string>,
    targetLanguage: string
  ): Promise<Record<string, string>> {
    try {
      const messages = [
        { role: 'system' as const, content: this.systemPrompt },
        { 
          role: 'user' as const, 
          content: `Translate these UI elements to ${targetLanguage}. Keep translations concise and user-friendly:

${JSON.stringify(uiElements, null, 2)}

Return a JSON object with the same keys but translated values. Maintain the professional, modern tone of a SaaS platform.` 
        }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.2,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      return JSON.parse(response);

    } catch (error) {
      console.error('UI Localization Error:', error);
      return uiElements; // Return original if translation fails
    }
  }

  /**
   * QUALITY ASSESSMENT
   * Assess translation quality and suggest improvements
   */
  async assessTranslationQuality(
    original: string,
    translation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{
    quality: 'HIGH' | 'MEDIUM' | 'LOW';
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      const messages = [
        { role: 'system' as const, content: this.systemPrompt },
        { 
          role: 'user' as const, 
          content: `Assess this translation quality:

ORIGINAL (${sourceLanguage}): "${original}"
TRANSLATION (${targetLanguage}): "${translation}"

Provide JSON response with:
- quality: "HIGH" | "MEDIUM" | "LOW"
- score: number (0-100)
- issues: array of specific problems found
- suggestions: array of improvement recommendations` 
        }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.2,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from OpenAI');

      return JSON.parse(response);

    } catch (error) {
      console.error('Quality Assessment Error:', error);
      return {
        quality: 'MEDIUM',
        score: 70,
        issues: ['Unable to assess quality automatically'],
        suggestions: ['Manual review recommended']
      };
    }
  }

  /**
   * GET SUPPORTED LANGUAGES
   */
  getSupportedLanguages(): Map<string, string> {
    return this.supportedLanguages;
  }

  /**
   * CHECK LANGUAGE SUPPORT
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.has(languageCode.toLowerCase());
  }
}
