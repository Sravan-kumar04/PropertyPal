import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  // const token = req.headers.authorization.split(" ")[1];
  console.log("testcontroller ", token);

  if (!token) {
    return res.status(401).json({
      message: "Not Authenticated bro",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token is not valid" });
    }
    req.userId = payload.id;
    next();

    //   if (!payload.isAdmin) {
    //       return res.status(403).json({
    //           message: "Not authorized"
    //       });
    //   }

    // Only send the response when the token is valid and the user is an admin
    //   res.status(200).json({
    //       message: "You are authenticated"
    //   });
  });
};
