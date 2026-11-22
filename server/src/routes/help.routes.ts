import { Router } from 'express';
import { HelpController, publicHelpIdSchema } from '../controllers/help.controller';
import { validate } from '../middlewares/validate';

const helpRoutes = Router();
const controller = new HelpController();

helpRoutes.get('/', controller.listPublic);
helpRoutes.get('/:id', validate({ params: publicHelpIdSchema }), controller.getPublicById);

export { helpRoutes };
