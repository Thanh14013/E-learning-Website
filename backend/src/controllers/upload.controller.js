/**
 * Handle file upload
 * @param {Object} req 
 * @param {Object} res 
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Cloudinary processing is handled by multer-storage-cloudinary middleware
    // req.file contains the result from Cloudinary
    
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        format: req.file.format,
        resourceType: req.file.resource_type
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
