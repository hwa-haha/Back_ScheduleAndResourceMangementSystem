import { config } from 'dotenv';
import { createLiveDataSource } from './live-database.config';

config();

export default createLiveDataSource();
