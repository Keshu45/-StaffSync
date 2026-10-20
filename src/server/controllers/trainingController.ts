import { Response } from 'express';
import { dataStore } from '../data/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllTrainings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const trainings = await dataStore.getTrainings();
    const currentEmpId = req.user?.employeeId;

    const data = trainings.map(t => ({
      ...t,
      isEnrolled: currentEmpId ? t.enrolledEmployees.includes(currentEmpId) : false,
      seatsRemaining: Math.max(0, t.capacity - t.enrolledEmployees.length),
      enrolledCount: t.enrolledEmployees.length,
    }));

    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch trainings.', error: err.message });
  }
}

export async function getTrainingById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const training = await dataStore.getTrainingById(id);

    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found.' });
      return;
    }

    const currentEmpId = req.user?.employeeId;
    res.status(200).json({
      success: true,
      data: {
        ...training,
        isEnrolled: currentEmpId ? training.enrolledEmployees.includes(currentEmpId) : false,
        seatsRemaining: Math.max(0, training.capacity - training.enrolledEmployees.length),
        enrolledCount: training.enrolledEmployees.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve training.', error: err.message });
  }
}

export async function createTraining(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { title, description, trainer, category, startDate, endDate, capacity, targetAudience, locationOrUrl } = req.body;

    if (!title || !description || !trainer || !startDate || !endDate || !capacity) {
      res.status(400).json({
        success: false,
        message: 'Title, description, trainer, start date, end date, and capacity are required.',
      });
      return;
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1) {
      res.status(400).json({ success: false, message: 'Capacity must be at least 1 seat.' });
      return;
    }

    const item = await dataStore.createTraining({
      title: title.trim(),
      description: description.trim(),
      trainer: trainer.trim(),
      category: category?.trim() || 'General Development',
      startDate,
      endDate,
      capacity: cap,
      enrolledEmployees: [],
      createdBy: req.user!.userId,
      createdByName: req.user!.name,
      targetAudience: targetAudience || 'All Departments',
      status: 'Upcoming',
      locationOrUrl: locationOrUrl || 'Virtual Room / Tech Lab',
    });

    await dataStore.logAudit(
      'TRAINING_CREATED',
      req.user!.userId,
      req.user!.name,
      'Training',
      item._id,
      `Created training "${title}" with capacity ${cap}`
    );

    res.status(201).json({
      success: true,
      message: 'Training program scheduled successfully.',
      data: item,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create training.', error: err.message });
  }
}

export async function updateTraining(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, trainer, category, startDate, endDate, capacity, status, locationOrUrl } = req.body;

    const existing = await dataStore.getTrainingById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Training not found.' });
      return;
    }

    const isHR = req.user?.role === 'HR';
    const isCreator = existing.createdBy === req.user?.userId;

    if (!isHR && !isCreator) {
      res.status(403).json({ success: false, message: 'Not authorized to modify this training program.' });
      return;
    }

    const updated = await dataStore.updateTraining(id, {
      ...(title ? { title: title.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      ...(trainer ? { trainer: trainer.trim() } : {}),
      ...(category ? { category: category.trim() } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(capacity ? { capacity: parseInt(capacity, 10) } : {}),
      ...(status ? { status } : {}),
      ...(locationOrUrl ? { locationOrUrl: locationOrUrl.trim() } : {}),
    });

    res.status(200).json({
      success: true,
      message: 'Training program updated.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update training.', error: err.message });
  }
}

export async function enrollTraining(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to your account.' });
      return;
    }

    const training = await dataStore.getTrainingById(id);
    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found.' });
      return;
    }

    if (training.enrolledEmployees.includes(employeeId)) {
      res.status(400).json({
        success: false,
        message: 'You are already enrolled in this training session.',
      });
      return;
    }

    if (training.enrolledEmployees.length >= training.capacity) {
      res.status(400).json({
        success: false,
        message: 'This training session has reached maximum capacity. No seats available.',
      });
      return;
    }

    const updatedEnrolled = [...training.enrolledEmployees, employeeId];
    const updated = await dataStore.updateTraining(id, { enrolledEmployees: updatedEnrolled });

    // Send confirmation notification
    await dataStore.createNotification({
      recipientId: employeeId,
      title: 'Training Enrollment Confirmed',
      message: `You are enrolled in "${training.title}" starting ${training.startDate}.`,
      type: 'Training',
      relatedEntityId: training._id,
    });

    await dataStore.logAudit(
      'TRAINING_ENROLLED',
      req.user!.userId,
      req.user!.name,
      'Training',
      id,
      `Enrolled in ${training.title}`
    );

    res.status(200).json({
      success: true,
      message: `You have successfully enrolled in "${training.title}".`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to enroll in training.', error: err.message });
  }
}

export async function cancelEnrollment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const employeeId = req.user?.employeeId;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile found.' });
      return;
    }

    const training = await dataStore.getTrainingById(id);
    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found.' });
      return;
    }

    if (!training.enrolledEmployees.includes(employeeId)) {
      res.status(400).json({ success: false, message: 'You are not enrolled in this training program.' });
      return;
    }

    const updatedEnrolled = training.enrolledEmployees.filter((eId: string) => eId !== employeeId);
    const updated = await dataStore.updateTraining(id, { enrolledEmployees: updatedEnrolled });

    res.status(200).json({
      success: true,
      message: 'Successfully withdrew from training session.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to cancel enrollment.', error: err.message });
  }
}

export async function getTrainingEnrollments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const training = await dataStore.getTrainingById(id);

    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found.' });
      return;
    }

    const allEmps = await dataStore.getEmployees();
    const enrolledDetails = allEmps.filter(e => training.enrolledEmployees.includes(e.employeeId));

    res.status(200).json({
      success: true,
      trainingTitle: training.title,
      capacity: training.capacity,
      enrolledCount: enrolledDetails.length,
      enrolledEmployees: enrolledDetails.map(e => ({
        employeeId: e.employeeId,
        name: `${e.firstName} ${e.lastName}`,
        email: e.email,
        department: e.department,
        designation: e.designation,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments.', error: err.message });
  }
}
