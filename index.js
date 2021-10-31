const FileService = require("./FileService.js");

exports.handler = async (event) => {
    const response = {
        statusCode: 200
    };
    
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
        switch (event.requestContext.http.method) {
            case "GET":
                FileService.download(response);
                break;
            case "POST":
                FileService.upload(response);
                break;
            default:
                // Unsupported method
                response.statusCode = 405;
                break;
        }
    }
    
    return response;
};

