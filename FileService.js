const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

class FileService {
    static #s3Client = new S3Client({
        region: process.env.AWS_REGION 
    });

    static #generateCode() {
        const nameCode = uniqueNamesGenerator({
          dictionaries: [colors, adjectives, animals],
          separator: '-'
        });	

        return nameCode;
    }

    static async requestPresignedGet(params, response) {
        const nameCode = params.nameCode;

        const getCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: nameCode + ".stl"
        });

        const options = {
            expiresIn: 300 // 5 minute expiration time
        };

        let commandResult;

        try {
            commandResult = await getSignedUrl(this.#s3Client, getCommand, options);
        } catch (err) {
            console.log(err);
            response.statusCode = 500;
            return;
        }

        response.body = JSON.stringify({
            url: commandResult
        });
    }

    static async requestPresignedPost(request, response) {
        const nameCode = this.#generateCode();

        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: nameCode + ".stl",
            Conditions: [
             ['content-length-range', 0, 1e8] // 100 MB file limit
            ],
            Expires: 300 // 5 minute expiration time
        };

        let commandResult;

        try {
            commandResult = await createPresignedPost(this.#s3Client, params);
        } catch (err) {
            console.log(err);
            response.statusCode = 500;
            return;
        }

        response.body = JSON.stringify({
            nameCode: nameCode,
            data: commandResult
        });
    }
}

module.exports = FileService;
