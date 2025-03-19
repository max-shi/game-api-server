import { Express } from "express";
import { rootUrl } from "./base.routes";
import * as user from '../controllers/user.controller';
import * as userImages from '../controllers/user.image.controller';
import { validateUserId, validateUserAuthToken, authorizeUser } from "../middleware/user.middleware";

module.exports = (app: Express) => {
    app.route(rootUrl + '/users/register')
        .post(user.register);

    app.route(rootUrl + '/users/login')
        .post(user.login);

    app.route(rootUrl + '/users/logout')
        .post(validateUserAuthToken, user.logout);

    app.route(rootUrl + '/users/:id')
        .get(validateUserId, user.view)
        .patch(validateUserId, validateUserAuthToken, authorizeUser, user.update);

    app.route(rootUrl + '/users/:id/image')
        .get(validateUserId, userImages.getImage)
        .put(validateUserId, validateUserAuthToken, authorizeUser, userImages.setImage)
        .delete(validateUserId, validateUserAuthToken, authorizeUser, userImages.deleteImage);
};
