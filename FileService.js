const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

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
    
    static async download(response) {
        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: "hungry_red_cat"
        });

        try {
            const response = await this.#s3Client.send(command);
            console.log(response);
        } catch (err) {
            console.log(err);
            response.statusCode = 500;
            return;
        }

        response.body = JSON.stringify("Downloaded file!");
    }
}

module.exports = FileService;
