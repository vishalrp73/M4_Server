const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const port = 4000;
const app = express();
const AWS = require('aws-sdk');

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

// Importing Watson Discovery and Authentication
const Discovery = require('ibm-watson/discovery/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
// Setting Watson Discovery param details
const APIversion = '2019-04-30';
const api_key = process.env.API_KEY;
const cloudURL = 'https://api.eu-gb.discovery.watson.cloud.ibm.com';
const envID = process.env.ENV_ID_TWO;
const collectionID = process.env.COL_ID_TWO;

// Calls new Discovery class and authenticates using the params
// I called it DISCO 🤩
const disco = new Discovery({
    version: APIversion,
    authenticator: new IamAuthenticator({
        apikey: api_key,
    }),
    serviceUrl: cloudURL,
});

// Setting AWS credentials for Rekognition
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-southeast-2'
});


// Basic endpoint to check if server is functioning
app.get('/', (req, res) => {
    console.log('connection established to client');
    res.status(200).send('Successfully connected to server');
});


// AWS Rekognition Functionality
app.post('/postImg', (req, res) => {

    const userUpload = req.body.queryImage;
    const imageBytes = new ArrayBuffer(userUpload.length);
    const ua = new Uint8Array(imageBytes);

    for (let i = 0; i < userUpload.length; i++) {
        ua[i] = userUpload.charCodeAt(i);
    }

    // Query
    const params = {
        Image: {
            Bytes: imageBytes
        },
        MinConfidence: 0,
        ProjectVersionArn: process.env.AWS_MODELARN
    }

    const rekognition = new AWS.Rekognition();
    rekognition.detectCustomLabels(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else res.status(201).send(data);
    });

});

// IBM Watson Discovery Functionality
app.post('/query', (req, res) => {

    const userQuery = req.body.queryText;
    const queryParams = {
        environmentId: envID,
        collectionId: collectionID,
        query: userQuery,
    };

    disco.query(queryParams)
    .then (queryResponse => {
        const discoResponse = JSON.stringify(queryResponse, null, 2);
        res.status(201).send(discoResponse);
    })
    .catch (err => console.log(err));

});

/* Testing endpoint with mock data for use instead of starting Rekognition model
    Swap out order of objects (move to top) to test different vehicle body types
*/
app.get('/test', (req, res) => {

    const mockData = {"CustomLabels":
                        [
                            {"Name":"sedan","Confidence":51.724998474121094},
                            {"Name":"SUV","Confidence":11.993000030517578},
                            {"Name":"van","Confidence":8.499000549316406},
                            {"Name":"utility","Confidence":2.302999973297119},
                            {"Name":"hatchback","Confidence":19.632999420166016},
                            {"Name":"coupe","Confidence":5.8470001220703125},
                        ]
                    }

    res.status(200).send(mockData);
});


app.listen(port, () => console.log('Express running on port ', port));