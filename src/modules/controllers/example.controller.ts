import { Request, Response } from 'express';
import { asyncHandler } from '../../utils';
import { ExampleService } from '../services/example.service';

const exampleService = new ExampleService();

export class ExampleController {
  getExample = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const example = await exampleService.getExampleById(id);
    
    res.json({
      success: true,
      data: example,
    });
  });

  createExample = asyncHandler(async (req: Request, res: Response) => {
    const example = await exampleService.createExample(req.body);
    
    res.status(201).json({
      success: true,
      data: example,
    });
  });

  getAllExamples = asyncHandler(async (req: Request, res: Response) => {
    const examples = await exampleService.getAllExamples();
    
    res.json({
      success: true,
      data: examples,
    });
  });
}


