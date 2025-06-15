import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { trackUserAction, getShopRecommendations, getFoodRecommendations, clearUserHistory } from '../services/recommendationService';
import { z } from 'zod';

const router = Router();

// Track user action
router.post('/track', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      mode: z.enum(['shop', 'food']),
      itemId: z.number(),
      storeId: z.number(),
      action: z.enum(['view', 'search', 'order'])
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request data', details: result.error.issues });
    }

    const { mode, itemId, storeId, action } = result.data;
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const success = await trackUserAction({ 
      userId: req.user.id,
      mode,
      itemId,
      storeId,
      action 
    });
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to track user action' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking user action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recommendations based on user history
router.get('/', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      mode: z.enum(['shop', 'food']).optional().default('shop'),
      limit: z.coerce.number().min(1).max(50).optional().default(10)
    });
    
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: result.error.issues });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { mode, limit } = result.data;
    const recommendations = mode === 'shop'
      ? await getShopRecommendations(req.user.id.toString(), limit)
      : await getFoodRecommendations(req.user.id.toString(), limit);

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear user's recommendation history
router.delete('/history', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      mode: z.enum(['shop', 'food']).optional()
    });
    
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: result.error.issues });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { mode } = result.data;
    const success = await clearUserHistory(req.user.id.toString(), mode);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to clear history' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
