module.exports = (req, res) => {
  res.status(200).json({ hello: "world", url: req.url, method: req.method });
};
