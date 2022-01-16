const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');
const { customAlphabet } = require('nanoid');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

class FileService {
    static #nanoid = customAlphabet('1234567890', 6);
    static #DIGIT_CODE_REGEX = /^\d{6}$/;
    static #WORD_CODE_REGEX = /^[a-z]+-[a-z]+-[a-z]+$/;
    static #DIGIT_CODE_FILE_DIR = 'DigitCodeFiles/';
    static #WORD_CODE_FILE_DIR = 'WordCodeFiles/';
    static #DIGIT_CODE_TYPE = 'digit';
    static #WORD_CODE_TYPE = 'word';

    static #s3Client = new S3Client({
        region: process.env.AWS_REGION 
    });

    static #generateCode(codeType) {
        let code;

        if (codeType === this.#DIGIT_CODE_TYPE) {
            code = this.#nanoid();
        }
        else if (codeType === this.#WORD_CODE_TYPE) {
            code = uniqueNamesGenerator({
                dictionaries: [colors, adjectives, animals],
                separator: '-'
            });
        }

        return code;
    }

    static async requestPresignedGet(params, response) {
        if (!params || !params.code) {
            response.statusCode = 400;
            return response;
        }

        let code = params.code;
        
        if (code.match(this.#DIGIT_CODE_REGEX)) {
            code = this.#DIGIT_CODE_FILE_DIR + code;
        }
        else if (code.match(this.#WORD_CODE_REGEX)) {
            code = this.#WORD_CODE_FILE_DIR + code;
        }
        else {
            response.statusCode = 400;
            return response;
        }

        const getCommand = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: code + ".stl"
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
        const body = request.body;

        if (!body || (body.codeType !== this.#DIGIT_CODE_TYPE && body.codeType !== this.#WORD_CODE_TYPE)) {
            response.statusCode = 400;
            return response;
        }

        const dir = (body.codeType === this.#DIGIT_CODE_TYPE) ? this.#DIGIT_CODE_FILE_DIR : this.#WORD_CODE_FILE_DIR;
        const code = this.#generateCode(body.codeType);

        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: dir + code + ".stl",
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
            code: code,
            data: commandResult
        });
    }
}

module.exports = FileService;
