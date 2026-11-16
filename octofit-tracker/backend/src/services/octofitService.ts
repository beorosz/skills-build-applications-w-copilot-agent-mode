import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('Valid userId is required'), { status: 400 });
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('Valid teamId is required'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  const team = await Team.findById(teamId);
  if (!user || !team) {
    throw Object.assign(new Error('Activity references must match existing users and teams'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const validMemberIds = Array.isArray(members)
    ? members.map((member) => String(member)).filter((member) => Types.ObjectId.isValid(member))
    : [];

  if (Array.isArray(members) && members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: validMemberIds,
  });

  if (validMemberIds.length > 0) {
    await User.updateMany({ _id: { $in: validMemberIds } }, { $set: { team: team._id } });
  }

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = String(userEmail ?? '').trim();
  if (!email) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = (user.fitnessGoal || recentActivity?.type || 'endurance').toString().toLowerCase();
  const mappedFocus = preferredFocus.includes('strength') ? 'strength' : preferredFocus.includes('run') || preferredFocus.includes('endurance') || preferredFocus.includes('cardio') ? 'endurance' : preferredFocus;

  const workouts = await Workout.find({ focus: mappedFocus }).lean();
  if (workouts.length === 0) {
    return Workout.find().limit(3).lean();
  }

  return workouts.map((workout) => ({
    ...workout,
    reason: `Your recent ${recentActivity?.type ?? mappedFocus} activity aligns with ${workout.focus} training.`,
  }));
}

export { User };
