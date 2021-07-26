import controller from './controller';
import { PORT } from './constants';
import dotenv from 'dotenv';
dotenv.config();

controller.listen(PORT, () => console.log(`Listening on port: ${PORT}`));