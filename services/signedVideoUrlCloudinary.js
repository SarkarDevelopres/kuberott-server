const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractCloudinaryPublicId(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/");

  // Remove leading empty string
  parts.shift();

  // Remove resource type (video/image), upload, and version
  // Format: video/upload/v1234/path/to/file.mp4
  const uploadIndex = parts.indexOf("upload");
  const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");

  // Remove extension
  return publicIdWithExt.replace(/\.[^/.]+$/, "");
}

exports.cloudinaryVideoUploadURL = async (filename) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadParams = {
      timestamp,
      folder: `movies/uploads`,
      public_id: filename,
    };

    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: uploadParams.folder,
      public_id: filename,
      resource_type: "video",
    };
  } catch (err) {
    console.error(err);
    return { error: "Internal Server Error" };
  }
};

exports.deleteFromCloudinary = async (url) => {

  console.log("Came upto here");
  
  const publicId = extractCloudinaryPublicId(url);

  console.log("publicID Video: ",publicId);
  

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "video", // IMPORTANT
  });

  console.log("Cloudinary Deletd Data: ",result);
  
  let cloudinaryDeleted = false;

  if (result.result === "ok" || result.result === "not found") {
    cloudinaryDeleted = true;
  }

  return cloudinaryDeleted;
}

