import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import * as noteService from '../services/noteService';

const router = Router();

// Public list
router.get('/', async (_req, res) => {
  const notes = await noteService.listNotes(100);
  res.json(notes);
});

// Create (authenticated)
router.post('/', authMiddleware,
  body('text').isString().notEmpty().withMessage('text required'),
  body('categorize').optional().isBoolean(),
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const shouldCategorize = req.body.categorize === true;
      const saved = shouldCategorize 
        ? await noteService.createNoteWithCategories({ text: req.body.text, url: req.body.url, createdBy: req.user?._id })
        : await noteService.createNote({ text: req.body.text, url: req.body.url, createdBy: req.user?._id });
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Invalid' });
    }
  });

// Get one
router.get('/:id', async (req, res) => {
  const n = await noteService.getNote(req.params.id);
  if (!n) return res.status(404).json({ message: 'Not found' });
  res.json(n);
});

// Update (owner only)
router.put('/:id', authMiddleware,
  body('text').optional().isString().notEmpty().withMessage('text must be non-empty if provided'),
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const existing: any = await noteService.getNote(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    if (existing.createdBy && String(existing.createdBy) !== String(req.user?._id)) return res.status(403).json({ message: 'Forbidden' });
    const updated = await noteService.updateNote(req.params.id, { text: req.body.text, url: req.body.url });
    res.json(updated);
  });

// Delete (owner only)
router.delete('/:id', authMiddleware, async (req: any, res) => {
  const existing: any = await noteService.getNote(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  if (existing.createdBy && String(existing.createdBy) !== String(req.user?._id)) return res.status(403).json({ message: 'Forbidden' });
  await noteService.deleteNote(req.params.id);
  res.json({ ok: true });
});

// Recent notes for user
router.get('/recent/user', authMiddleware, async (req: any, res) => {
  try {
    const all = await noteService.listNotes(1000);
    const userNotes = all.filter((n: any) => n.createdBy && String(n.createdBy) === String(req.user?._id)).slice(0,50);
    res.json(userNotes);
  } catch (err: any) { res.status(500).json({ message: err.message || 'Error' }); }
});

export default router;
