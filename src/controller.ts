import express, { Application }from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import STOREX from 'mongoose';
import { STORE } from './constants';
import Routes from './routes';

class controller {
    public controller: Application;
    public router: Routes;

    constructor() {
        this.controller = express();
        this.config();
        this.storeConfig();

        // Controllers
        this.router = new Routes(this.controller);
    }

    private config() {
        // API configuration
        this.controller.use(bodyParser.json({ limit: '50mb' })); // Allow Json Data
        this.controller.use(bodyParser.urlencoded({ limit: '50mb', extended: false })); // Enable URL Encoded Data
        this.controller.use(cors()); // Enable Cross Origin Resource Sharing (CORS)
    }

    private storeConfig() {
        STOREX.Promise = global.Promise;
        STOREX.connect(STORE, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
    }
}

export default new controller().controller;
