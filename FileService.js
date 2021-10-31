class FileService {
    static upload(response) {
        response.body = JSON.stringify("Uploaded file!");
    }
    
    static download(response) {
        response.body = JSON.stringify("Downloaded file!");
    }
}

module.exports = FileService;
