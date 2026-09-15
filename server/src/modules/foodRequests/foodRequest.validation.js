const validateFoodRequestInput = (data) => {
  const errors = [];
  const { peopleCount, foodType, location, requiredDate, requiredTime, notes } = data;

  // peopleCount validation
  if (peopleCount === undefined || peopleCount === null || peopleCount === '') {
    errors.push('People count is required');
  } else {
    const num = Number(peopleCount);
    if (!Number.isInteger(num) || num < 1) {
      errors.push('People count must be an integer of at least 1');
    }
  }

  // foodType validation
  if (!foodType || typeof foodType !== 'string' || foodType.trim() === '') {
    errors.push('Food type is required');
  }

  // location validation
  if (!location || typeof location !== 'string' || location.trim() === '') {
    errors.push('Location is required');
  }

  // requiredDate validation
  if (!requiredDate) {
    errors.push('Required date is required');
  } else {
    const parsedDate = new Date(requiredDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid required date format');
    }
  }

  // requiredTime validation
  if (!requiredTime || typeof requiredTime !== 'string' || requiredTime.trim() === '') {
    errors.push('Required time is required');
  }

  // notes validation (optional)
  if (notes && typeof notes === 'string' && notes.length > 1000) {
    errors.push('Notes cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateFoodRequestInput,
};
