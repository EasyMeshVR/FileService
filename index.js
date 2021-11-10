require('dotenv').config();
const FileService = require("./FileService.js");

exports.handler = async (event) => {
    const response = {
        statusCode: 200
    };

    console.log(event);
    
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
        switch (event.requestContext.http.method) {
            case "GET":
                await FileService.requestPresignedGet(event.requestContext, response);
                break;
            case "POST":
                await FileService.requestPresignedPost(event.requestContext, response);
                break;
            default:
                // Unsupported method
                response.statusCode = 405;
                break;
        }
    }
    
    return response;
};

