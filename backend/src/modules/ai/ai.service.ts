import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    // We use the latest embedding model which generates 768-dimensional vectors
    private embeddingModelName = 'embedding-001';

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey || apiKey === 'INSERT_YOUR_GEMINI_KEY_HERE') {
            this.logger.warn('Gemini API Key is missing or invalid. Smart Search features will fail.');
            this.genAI = new GoogleGenerativeAI('DUMMY_KEY');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    /**
     * Translates human text into a mathematical vector mapping its meaning.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.embeddingModelName });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error) {
            this.logger.error(`Failed to generate embedding: ${error}`);
            throw error;
        }
    }

    /**
     * Analyzes an image and suggests listing details (title, description, price, category).
     */
    async generateListingSuggestion(imageBuffer: Buffer, mimeType: string): Promise<{ title: string, description: string, price: string, category: string }> {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: 'gemini-flash-latest',
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const prompt = `You are an expert marketplace seller. Analyze this image and recommend details for a listing. 
Return a JSON object with strictly these keys:
- "title": A catchy, concise title for the item.
- "description": A short, clear, and trendy description written in Gen-Z style (casual, straight to the point, lowercase friendly, maybe an emoji).
- "price": A realistic suggested price in USD as a string (e.g. "25").
- "category": The most appropriate category. Must be one of: "DORM", "SUBLEASE", "TUTORING", "CLOTHING", "ELECTRONICS", "BOOKS", "FURNITURE", "TICKETS", "SERVICES", "OTHER".
- "colors": (Optional) The primary color(s) of the item. Do NOT provide this if the category is SUBLEASE or TICKETS.
- "size": (Optional) The size of the item. ONLY provide this if the category is CLOTHING.
- "material": (Optional) The material of the item. ONLY provide this if the category is CLOTHING.
- "brand": (Optional) The brand of the item. ONLY provide this if the category is CLOTHING or it's a pair of shoes, and ONLY if you are highly confident. Do not guess randomly.`;

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();
            
            return JSON.parse(text);
        } catch (error) {
            this.logger.error(`Failed to generate listing suggestion: ${error}`);
            throw error;
        }
    }
}
