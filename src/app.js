import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';

const app = express();

// middlewares básicos
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// rutas
app.use('/', routes);

export default app;