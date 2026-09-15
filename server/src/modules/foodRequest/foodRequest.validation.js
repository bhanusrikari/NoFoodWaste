const ALLOWED_FOOD_TYPES = ['Veg', 'Non-Veg', 'Both'];
const ALLOWED_CATEGORIES = ['Cooked', 'Raw/Groceries', 'Packaged', 'Bakery', 'Other'];
const ALLOWED_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'];

const validateCreateFoodRequestInput = (data) => {
  const errors = [];

  if (!data.customerName || typeof data.customerName !== 'string' || !data.customerName.trim()) {
    errors.push('Customer/Organization name is required');
  }

  if (!data.phone || typeof data.phone !== 'string' || !data.phone.trim()) {
    errors.push('Phone number is required');
  }

  const meals = Number(data.numberOfMeals);
  if (!data.numberOfMeals || isNaN(meals) || meals < 1) {
    errors.push('Number of meals must be a valid positive number');
  }

  if (!data.foodType || !ALLOWED_FOOD_TYPES.includes(data.foodType)) {
    errors.push(`Food type must be one of: ${ALLOWED_FOOD_TYPES.join(', ')}`);
  }

  if (!data.foodCategory || !ALLOWED_CATEGORIES.includes(data.foodCategory)) {
    errors.push(`Food category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (!data.location || typeof data.location !== 'string' || !data.location.trim()) {
    errors.push('Location/Address is required');
  }

  if (!data.requiredDate) {
    errors.push('Required date is required');
  }

  if (!data.requiredTime) {
    errors.push('Required time is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateStatusUpdateInput = (data) => {
  const errors = [];

  if (!data.status || !ALLOWED_STATUSES.includes(data.status)) {
    errors.push(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  if (data.status === 'REJECTED' && (!data.rejectionReason || !data.rejectionReason.trim())) {
    // Make rejection reason required or provide default notice
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateCreateFoodRequestInput,
  validateStatusUpdateInput,
  ALLOWED_FOOD_TYPES,
  ALLOWED_CATEGORIES,
  ALLOWED_STATUSES,
};
