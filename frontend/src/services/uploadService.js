import api from "./api";

/**
 * Upload a file to the server.
 * @param {File} file - The file object to upload.
 * @returns {Promise<Object>} - The response data containing file URL and metadata.
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
