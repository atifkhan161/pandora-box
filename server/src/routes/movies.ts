import { Router } from 'express';
import { getTrendingMovies } from '../controllers/movieController';

const router = Router();

router.get('/trending', getTrendingMovies);

export default router;