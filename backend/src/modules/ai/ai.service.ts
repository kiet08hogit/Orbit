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
}
