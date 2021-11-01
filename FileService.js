const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

class FileService {
    static #s3Client = new S3Client({
        credentials: {
            AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
            SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        region: process.env.AWS_REGION 
    });

	static #generateCode() {
        const nameCode = uniqueNamesGenerator({
          dictionaries: [colors, adjectives, animals],
        });	

        return nameCode;
	}

    static async upload(response) {
        const nameCode = this.#generateCode();

        console.log(nameCode);

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: nameCode,
            //ContentType: "model/stl",
            Body: nameCode,
            ContentLength: nameCode.length
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
    
    static async download(response) {
        response.body = JSON.stringify("Downloaded file!");
    }
}

module.exports = FileService;
