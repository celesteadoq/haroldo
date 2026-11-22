import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { routes } from './routes';
import { AppError } from './utils/AppError';

const app = express();

if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

app.use((_req, _res, next) => {
  next(new AppError('Rota não encontrada.', 404));
});

app.use(errorHandler);

export { app };
