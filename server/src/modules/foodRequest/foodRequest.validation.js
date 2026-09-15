const ALLOWED_FOOD_TYPES = ['Veg', 'Non-Veg', 'Both'];
const ALLOWED_CATEGORIES = ['Cooked', 'Raw/Groceries', 'Packaged', 'Bakery', 'Other'];
const ALLOWED_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'];

const validateCreateFoodRequestInput = (data, user = null) => {
  // Auto-fill defaults & normalize fields
  if ((!data.customerName || !data.customerName.trim()) && user) {
    data.customerName = user.organizationName || user.name || 'Food Recipient';
  }
  if ((!data.customerName || !data.customerName.trim())) {
    data.customerName = 'Community Beneficiary';
  }

  if ((!data.phone || !data.phone.trim()) && user) {
    data.phone = user.phone || '+91 98765 43210';
  }
  if ((!data.phone || !data.phone.trim())) {
    data.phone = '+91 98765 43210';
  }

  if (!data.numberOfMeals && data.peopleCount) {
    data.numberOfMeals = Number(data.peopleCount);
  }

  if (!data.foodCategory) {
    data.foodCategory = 'Cooked';
  }

  // Normalize foodType select options from frontend
  if (data.foodType === 'Vegetarian') data.foodType = 'Veg';
  else if (data.foodType === 'Non-Vegetarian') data.foodType = 'Non-Veg';
  else if (data.foodType === 'Both (Veg & Non-Veg)' || data.foodType === 'Vegan') data.foodType = 'Both';
  else if (data.foodType === 'Packaged / Dry Rations') {
    data.foodType = 'Veg';
    data.foodCategory = 'Packaged';
  } else if (data.foodType === 'Prepared Meals') {
    data.foodType = 'Veg';
    data.foodCategory = 'Cooked';
  }

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
