const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

class FileService {
    static #s3Client = new S3Client({
        region: process.env.AWS_REGION 
    });

	static #generateCode() {
        const nameCode = uniqueNamesGenerator({
          dictionaries: [colors, adjectives, animals],
        });	

        return nameCode;
	}

    static async requestPresignedGet(request, response) {
        const nameCode = request.body.nameCode;

        console.log('nameCode received: ', nameCode);

        const getCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: nameCode
        });

        let commandResult;

        try {
            commandResult = await getSignedUrl(this.#s3Client, getCommand);
        } catch (err) {
            console.log(err);
            response.statusCode = 500;
            return;
        }

        console.log(commandResult);

        response.body = JSON.stringify({
            url: commandResult
        });
    }

    static async requestPresignedPost(request, response) {
        console.log('TODO');
    }

    static async upload(response) {
        const nameCode = this.#generateCode();

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: nameCode,
            //ContentType: "model/stl",
            //Body: "test",
        });

        try {
            const response = await this.#s3Client.send(command);
        } catch (err) {
            console.log(err);
            response.statusCode = 500;
            return;
        }

        const body = {
           code: nameCode 
        };

        response.body = JSON.stringify(body);
    }
}

module.exports = FileService;
