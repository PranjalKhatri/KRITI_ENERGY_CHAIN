import express from 'express';
import bodyParser from 'body-parser';
import data from './config/server_config.js'
import connectToDb from './config/db_config.js';
import userRoutes from './User/routes/userRoutes.js';
import transactionRouter from './Transaction/routes/transactionRoutes.js';
import cors from 'cors';
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
// app.use(cookieParser());    

app.use("/api/v1/transactions",transactionRouter);
app.use("/api/v1/users", userRoutes);

app.listen(data.PORT, async () => {
    await connectToDb();
    console.info(`Server is running on ${data.PORT}`);
    // logger.info(`Server is running on ${data.PORT}`);
  });
  