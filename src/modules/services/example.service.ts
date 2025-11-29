import prisma from '../../prisma/client';
import { AppError } from '../../utils/errorHandler';

// Example service demonstrating database operations
export class ExampleService {
  async getExampleById(id: string) {
    const example = await prisma.user.findUnique({
      where: { id },
    });

    if (!example) {
      throw new AppError('Example not found', 404);
    }

    return example;
  }

  async createExample(data: { email: string; name: string }) {
    try {
      const example = await prisma.user.create({
        data,
      });
      return example;
    } catch (error) {
      throw error;
    }
  }

  async getAllExamples() {
    const examples = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return examples;
  }
}

