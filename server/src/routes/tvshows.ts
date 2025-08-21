import { Router } from 'express';
import { getTrendingTvShows } from '../controllers/tvshowController';

const router = Router();

router.get('/trending', getTrendingTvShows);

export default router;