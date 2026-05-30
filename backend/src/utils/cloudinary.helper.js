const cloudinary = require("../configs/cloudinary");

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 * @param {Buffer} fileBuffer - The file buffer from multer.
 * @param {string} folder - The Cloudinary folder name.
 * @returns {Promise<Object>} The Cloudinary upload response.
 */
function uploadToCloudinary(fileBuffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

/**
 * Extracts public_id from a Cloudinary URL.
 * @param {string} url - The Cloudinary secure/insecure URL.
 * @returns {string|null} The public ID or null if invalid.
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return null;

  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    // parts[1] is e.g. "v123456/folder/public_id.jpg"
    let pathWithFilename = parts[1];
    
    // Remove the version segment (starts with 'v' followed by digits)
    if (pathWithFilename.startsWith("v")) {
      const nextSlashIndex = pathWithFilename.indexOf("/");
      if (nextSlashIndex !== -1) {
        pathWithFilename = pathWithFilename.slice(nextSlashIndex + 1);
      }
    }

    // Remove the file extension
    const dotIndex = pathWithFilename.lastIndexOf(".");
    if (dotIndex !== -1) {
      pathWithFilename = pathWithFilename.slice(0, dotIndex);
    }

    return pathWithFilename;
  } catch (error) {
    console.error("Error parsing public ID from URL:", error);
    return null;
  }
}

/**
 * Deletes a file from Cloudinary based on its URL.
 * @param {string} url - The Cloudinary secure/insecure URL.
 * @returns {Promise<Object|null>} The Cloudinary destroy response or null if not deleted.
 */
async function deleteFromCloudinary(url) {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return null;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        return reject(error);
      }
      resolve(result);
    });
  });
}

module.exports = {
  uploadToCloudinary,
  getPublicIdFromUrl,
  deleteFromCloudinary,
};
