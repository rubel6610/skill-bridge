
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import sendResponse from "../utils/sendResponse";


export enum userRole {
    ADMIN = "ADMIN",
    TUTOR = "TUTOR",
    STUDENT = "STUDENT"
}


const auth = (roles?: userRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: "Unauthorized",
        data: null,
      });
    }
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY as string,
      ) as JwtPayload;

      const userData = await prisma.user.findUnique({
        where: { email: decoded.email },
      });
      if (!userData) {
        return sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "User not found",
          data: null,
        });
      }
      req.user = decoded;

      if (roles && !roles.includes(userData.role as userRole)) {
        return sendResponse(res, {
          statusCode: 403,
          success: false,
          message:
            "Forbidden: You don't have permission to access this resource",
          data: null,
        });
      }

      next();
    } catch (error) {
      console.log(error);
    }
  };
};


export default auth;
