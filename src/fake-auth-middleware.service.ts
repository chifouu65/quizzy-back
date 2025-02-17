// import { Injectable, NestMiddleware } from "@nestjs/common";
// import { RequestModel, UserDetails } from "./modules/auth";
// import { NextFunction, Response } from "express";

// @Injectable()
// export class FakeAuthMiddleware implements NestMiddleware {
//   static currentUser: UserDetails | null = null;

//   static SetUser(
//     uid: string | null,
//     email: string | null = null,
//     isEmailVerified = true
//   ): void {
//     if (!uid) {
//       FakeAuthMiddleware.currentUser = null;
//       return;
//     }
//     FakeAuthMiddleware.currentUser = {
//       uid,
//       email: email || `${uid}@mail.com`,
//       isEmailVerified,
//     };
//   }

//   static Reset(): void {
//     FakeAuthMiddleware.currentUser = null;
//   }

//   public async use(
//     req: RequestModel,
//     _: Response,
//     next: NextFunction
//   ): Promise<void> {
//     req.user = FakeAuthMiddleware.currentUser;
//     next();
//   }
// }
