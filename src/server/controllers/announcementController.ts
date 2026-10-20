import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllAnnouncements(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const role = req.user?.role;
    let audienceFilter: string | undefined;

    if (role === 'EMPLOYEE') audienceFilter = 'Employees';
    else if (role === 'MANAGER') audienceFilter = 'Managers';
    // HR can view all

    const announcements = await dataStore.getAnnouncements(audienceFilter);
    res.status(200).json({ success: true, data: announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.', error: err.message });
  }
}

export async function getAnnouncementById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const announcements = await dataStore.getAnnouncements();
    const item = announcements.find(a => a._id === id);

    if (!item) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    res.status(200).json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve announcement.', error: err.message });
  }
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, content, category = 'General', audience = 'All', priority = 'Medium', expiryDate } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required.' });
      return;
    }

    const item = await dataStore.createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category,
      audience,
      priority,
      expiryDate: expiryDate || null,
      authorId: req.user!.userId,
      authorName: `${req.user!.name} (${req.user!.role})`,
      publishedAt: new Date(),
      isPublished: true,
      isArchived: false,
    });

    // Send broadcast notification
    await dataStore.createNotification({
      recipientId: audience === 'All' ? 'ALL' : audience,
      title: `Announcement: ${title}`,
      message: content.length > 100 ? content.substring(0, 97) + '...' : content,
      type: 'Announcement',
      relatedEntityId: item._id,
    });

    await dataStore.logAudit(
      'ANNOUNCEMENT_CREATED',
      req.user!.userId,
      req.user!.name,
      'Announcement',
      item._id,
      `Published "${title}" to audience: ${audience}`
    );

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      data: item,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create announcement.', error: err.message });
  }
}

export async function updateAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, content, category, audience, priority, expiryDate } = req.body;

    const updated = await dataStore.updateAnnouncement(id, {
      ...(title ? { title: title.trim() } : {}),
      ...(content ? { content: content.trim() } : {}),
      ...(category ? { category } : {}),
      ...(audience ? { audience } : {}),
      ...(priority ? { priority } : {}),
      ...(expiryDate !== undefined ? { expiryDate } : {}),
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update announcement.', error: err.message });
  }
}

export async function archiveAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await dataStore.updateAnnouncement(id, { isArchived: true });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    await dataStore.logAudit(
      'ANNOUNCEMENT_ARCHIVED',
      req.user!.userId,
      req.user!.name,
      'Announcement',
      id,
      'Archived announcement'
    );

    res.status(200).json({
      success: true,
      message: 'Announcement archived.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to archive announcement.', error: err.message });
  }
}

export async function deleteAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await dataStore.deleteAnnouncement(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Announcement not found.' });
      return;
    }

    await dataStore.logAudit(
      'ANNOUNCEMENT_DELETED',
      req.user!.userId,
      req.user!.name,
      'Announcement',
      id,
      'Permanently deleted announcement'
    );

    res.status(200).json({
      success: true,
      message: 'Announcement permanently deleted.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete announcement.', error: err.message });
  }
}
