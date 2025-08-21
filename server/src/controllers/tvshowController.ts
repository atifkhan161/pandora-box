import { Request, Response } from 'express';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const getTrendingTvShows = async (req: Request, res: Response) => {
  try {
    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB API key not configured' });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/trending/tv/week`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });

    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching trending TV shows:', error);
    res.status(500).json({ error: 'Failed to fetch trending TV shows' });
  }
};