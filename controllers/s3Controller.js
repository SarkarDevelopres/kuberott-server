const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const Garbage = require('../db/models/garbage');
const dotenv = require('dotenv');
dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});
function extractS3Key(url) {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

function sixDigit() {
    return Math.floor(100000 + Math.random() * 900000); // 100000–999999
}


exports.getUploadUrl = async ({ contentType, fileName }) => {
    try {

        const cleanKey = String(fileName).trim().replace(/^"+|"+$/g, "");

        console.log(contentType);
        console.log(cleanKey);
        
        // 1. Validate content type
        const [category, ext] = contentType.split("/");

        const allowedCategories = ["image", "video", "audio"];

        if (!allowedCategories.includes(category)) {
            return { ok: false, message: "Invalid file type" };
        }

        // 5. Prepare S3 params
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: cleanKey,
            ContentType: contentType
        };

        const command = new PutObjectCommand(params);

        const uploadUrl = await getSignedUrl(s3, command, {
            expiresIn: 600
        });

        return {
            ok: true,
            uploadUrl,
            fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${cleanKey}`
        };

    } catch (err) {
        console.error(err);
        return { ok: false, message: "Cannot generate signed URL" };
    }
};
exports.deleteFromS3 = async (url) => {
  try {
    const key = extractS3Key(url);
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key, // exact key stored in S3
    });

    await s3.send(command);

    return true;
  } catch (error) {
    return { ok: false, message: error.message };
  }
}
