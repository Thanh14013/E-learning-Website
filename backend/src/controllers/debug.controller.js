// Debug email endpoint removed — email verification flow disabled
export const sendTestEmail = async (req, res) => {
  return res.status(404).json({ message: "Not found" });
};
