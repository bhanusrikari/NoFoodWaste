const Volunteer = require('./volunteer.model');
const User = require('../auth/auth.model');
const Assignment = require('../assignment/assignment.model');

class VolunteerService {
  /**
   * Get or create volunteer profile for authenticated user.
   * Auto-creates on first access so volunteers don't need a separate registration step.
   */
  async getOrCreateProfile(userId) {
    let volunteer = await Volunteer.findOne({ userId });

    if (!volunteer) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'VOLUNTEER') {
        const error = new Error('User is not a volunteer');
        error.statusCode = 403;
        throw error;
      }

      volunteer = await Volunteer.create({
        userId,
        phone: user.phone || '',
        availability: 'AVAILABLE',
      });
    }

    return volunteer.toJSON();
  }

  /**
   * Get volunteer profile by userId
   */
  async getProfileByUserId(userId) {
    const volunteer = await Volunteer.findOne({ userId });
    if (!volunteer) {
      return this.getOrCreateProfile(userId);
    }
    return volunteer.toJSON();
  }

  /**
   * Update volunteer availability
   * Rule: A volunteer with an active assignment must remain BUSY and cannot become UNAVAILABLE.
   */
  async updateAvailability(userId, availability) {
    const allowed = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'];
    if (!allowed.includes(availability)) {
      const error = new Error(`Availability must be one of: ${allowed.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if volunteer has an active assignment
    const activeAssignment = await Assignment.findOne({
      volunteerId: userId,
      isActive: true,
    });

    if (activeAssignment && availability === 'UNAVAILABLE') {
      const error = new Error('Cannot set availability to UNAVAILABLE while you have an active assignment.');
      error.statusCode = 400;
      throw error;
    }

    if (activeAssignment && availability === 'AVAILABLE') {
      const error = new Error('Cannot set availability to AVAILABLE while you have an active assignment. You must remain BUSY.');
      error.statusCode = 400;
      throw error;
    }

    let volunteer = await Volunteer.findOne({ userId });
    if (!volunteer) {
      await this.getOrCreateProfile(userId);
    }

    const updated = await Volunteer.findOneAndUpdate(
      { userId },
      { availability },
      { new: true, runValidators: true }
    );

    return updated.toJSON();
  }

  /**
   * Update volunteer location
   */
  async updateLocation(userId, latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      const error = new Error('Latitude and longitude must be numbers');
      error.statusCode = 400;
      throw error;
    }

    if (latitude < -90 || latitude > 90) {
      const error = new Error('Latitude must be between -90 and 90');
      error.statusCode = 400;
      throw error;
    }

    if (longitude < -180 || longitude > 180) {
      const error = new Error('Longitude must be between -180 and 180');
      error.statusCode = 400;
      throw error;
    }

    let volunteer = await Volunteer.findOne({ userId });
    if (!volunteer) {
      await this.getOrCreateProfile(userId);
      volunteer = await Volunteer.findOne({ userId });
    }

    volunteer.currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    await volunteer.save();
    return volunteer.toJSON();
  }

  /**
   * Set volunteer to BUSY (used when accepting assignment)
   */
  async setBusy(userId) {
    await Volunteer.findOneAndUpdate({ userId }, { availability: 'BUSY' });
  }

  /**
   * Set volunteer to AVAILABLE (used when task completes or is cancelled)
   */
  async setAvailable(userId) {
    await Volunteer.findOneAndUpdate({ userId }, { availability: 'AVAILABLE' });
  }

  /**
   * Increment volunteer statistics after completion
   */
  async incrementStats(userId, mealsDelivered, distance) {
    await Volunteer.findOneAndUpdate(
      { userId },
      {
        $inc: {
          completedTasks: 1,
          totalMealsDelivered: mealsDelivered || 0,
          totalDistance: distance || 0,
        },
      }
    );
  }

  /**
   * Increment totalTasks when assigned
   */
  async incrementTotalTasks(userId) {
    await Volunteer.findOneAndUpdate({ userId }, { $inc: { totalTasks: 1 } });
  }
}

module.exports = new VolunteerService();
