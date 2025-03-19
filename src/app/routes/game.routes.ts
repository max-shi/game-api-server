import { Express } from "express";
import { rootUrl } from "./base.routes";
import * as gameController from '../controllers/game.controller';
import * as gameReviewController from '../controllers/game.review.controller';
import * as gameActionController from '../controllers/game.action.controller';
import * as gameImageController from '../controllers/game.image.controller';
import { validateGameRequest, validateGameId, validateAuthToken } from "../middleware/game.middleware";

module.exports = (app: Express) => {
    // Routes without a game id in the URL.
    app.route(rootUrl + '/games')
        .get(gameController.getAllGames)
        .post(validateAuthToken, gameController.addGame); // Requires authentication.

    app.route(rootUrl + '/games/genres')
        .get(gameController.getGenres);

    app.route(rootUrl + '/games/platforms')
        .get(gameController.getPlatforms);

    // Routes with a game id.
    app.route(rootUrl + '/games/:id')
        .get(validateGameId, gameController.getGame)
        .patch(validateGameRequest, gameController.editGame)
        .delete(validateGameRequest, gameController.deleteGame);

    app.route(rootUrl + '/games/:id/reviews')
        .get(validateGameId, gameReviewController.getGameReviews) // Validate game id.
        .post(validateGameRequest, gameReviewController.addGameReview); // Validate game id and auth.

    app.route(rootUrl + '/games/:id/wishlist')
        .post(validateGameRequest, gameActionController.addGameToWishlist)
        .delete(validateGameRequest, gameActionController.removeGameFromWishlist);

    app.route(rootUrl + '/games/:id/owned')
        .post(validateGameRequest, gameActionController.addGameToOwned)
        .delete(validateGameRequest, gameActionController.removeGameFromOwned);

    app.route(rootUrl + '/games/:id/image')
        .get(validateGameId, gameImageController.getImage)
        .put(validateGameRequest, gameImageController.setImage);
};
