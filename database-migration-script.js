/**
 * Database Migration Script for Weekly Schedules
 * 
 * This script identifies and fixes users who don't have active WeeklyPlanSchedule documents,
 * which causes 404 errors when the system tries to fetch their schedules.
 * 
 * Usage:
 * node database-migration-script.js
 * 
 * Options:
 * --check-only: Only check and report, don't make changes
 * --user-id=<id>: Fix only specific user
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const WeeklyPlanSchedule = require('./src/models/weekly-plan-schedule.model');
const TrainingFormSubmission = require('./src/models/running-form.model');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/runfitting');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Check for users without active schedules
async function checkUsersWithoutSchedules() {
  console.log('\n🔍 Checking for users without active weekly schedules...\n');
  
  // Get all unique user IDs from form submissions
  const usersWithForms = await TrainingFormSubmission.distinct('userId');
  console.log(`📊 Found ${usersWithForms.length} users with form submissions`);
  
  // Get all unique user IDs with active schedules
  const usersWithSchedules = await WeeklyPlanSchedule.distinct('userId', { isActive: true });
  console.log(`📊 Found ${usersWithSchedules.length} users with active schedules`);
  
  // Find users who have forms but no active schedules
  const usersWithoutSchedules = usersWithForms.filter(userId => !usersWithSchedules.includes(userId));
  console.log(`❗ Found ${usersWithoutSchedules.length} users WITHOUT active schedules`);
  
  if (usersWithoutSchedules.length > 0) {
    console.log('\n📋 Users without active schedules:');
    for (const userId of usersWithoutSchedules) {
      // Get form details
      const form = await TrainingFormSubmission.findOne({ userId })
        .sort({ createdAt: -1 });
      
      const hasValidTrainingDays = form?.dniTreningowe && Array.isArray(form.dniTreningowe) && form.dniTreningowe.length > 0;
      
      console.log(`  - User ID: ${userId}`);
      console.log(`    Latest form: ${form ? form._id : 'NONE'}`);
      console.log(`    Created: ${form ? form.createdAt.toISOString() : 'N/A'}`);
      console.log(`    Training days: ${hasValidTrainingDays ? form.dniTreningowe.join(', ') : 'MISSING/INVALID'}`);
      console.log(`    Form name: ${form?.imieNazwisko || 'N/A'}`);
      console.log('');
    }
  }
  
  return {
    totalUsers: usersWithForms.length,
    usersWithSchedules: usersWithSchedules.length,
    usersWithoutSchedules: usersWithoutSchedules.length,
    affectedUserIds: usersWithoutSchedules
  };
}

// Check for forms with missing training days
async function checkFormsWithMissingTrainingDays() {
  console.log('\n🔍 Checking for forms with missing training days...\n');
  
  const formsWithoutDays = await TrainingFormSubmission.find({
    $or: [
      { dniTreningowe: { $exists: false } },
      { dniTreningowe: { $eq: null } },
      { dniTreningowe: { $eq: [] } },
      { dniTreningowe: { $size: 0 } }
    ]
  }).sort({ createdAt: -1 });
  
  console.log(`❗ Found ${formsWithoutDays.length} forms with missing/empty training days`);
  
  if (formsWithoutDays.length > 0) {
    const userCounts = {};
    formsWithoutDays.forEach(form => {
      userCounts[form.userId] = (userCounts[form.userId] || 0) + 1;
    });
    
    console.log('\n📋 Users with problematic forms:');
    for (const [userId, count] of Object.entries(userCounts)) {
      console.log(`  - User ID: ${userId} (${count} forms with missing training days)`);
    }
  }
  
  return formsWithoutDays;
}

// Create fallback schedule for a user
async function createFallbackScheduleForUser(userId) {
  try {
    // Check if schedule already exists
    const existingSchedule = await WeeklyPlanSchedule.findOne({ userId, isActive: true });
    if (existingSchedule) {
      console.log(`⚠️  User ${userId} already has an active schedule`);
      return { success: false, reason: 'Schedule already exists' };
    }
    
    // Find latest form with valid training days
    const latestForm = await TrainingFormSubmission.findOne({
      userId,
      dniTreningowe: { $exists: true, $ne: [], $ne: null }
    }).sort({ createdAt: -1 });
    
    if (!latestForm) {
      console.log(`❌ User ${userId}: No valid form found with training days`);
      return { success: false, reason: 'No valid form with training days' };
    }
    
    const formData = latestForm.toObject();
    
    // Create user profile (simplified version of mapFormToUserProfile)
    const userProfile = {
      name: formData.imieNazwisko || 'Biegacz',
      age: formData.wiek || 30,
      level: mapExperienceLevel(formData.poziomZaawansowania),
      goal: formData.glownyCel || 'poprawa_kondycji',
      daysPerWeek: formData.dniTreningowe.length,
      weeklyDistance: formData.aktualnyKilometrTygodniowy || 20,
      hasInjuries: formData.kontuzje || false,
      heartRate: formData.restingHr,
      description: formData.opisCelu || '',
      dniTreningowe: formData.dniTreningowe,
      trainingDays: formData.dniTreningowe // Add both for compatibility
    };
    
    // Create schedule
    const schedule = new WeeklyPlanSchedule({
      userId: userId,
      userProfile: userProfile,
      deliveryFrequency: 'weekly',
      deliveryDay: 'sunday',
      deliveryTime: '18:00',
      timezone: 'Europe/Warsaw',
      isActive: true,
      nextDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      progressTracking: {
        weekNumber: 1,
        currentPhase: 'base',
        totalWeeksDelivered: 0,
        lastWeeklyDistance: 0,
        progressionRate: 1.0
      },
      longTermGoal: {
        remainingWeeks: 12,
        targetDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000)
      },
      adaptationSettings: {
        allowAutoAdjustments: true,
        maxWeeklyIncrease: 0.1,
        minRecoveryWeeks: 4
      },
      recentPlans: []
    });
    
    await schedule.save();
    console.log(`✅ Created fallback schedule for user ${userId} (ID: ${schedule._id})`);
    
    return { 
      success: true, 
      scheduleId: schedule._id,
      userProfile: {
        name: userProfile.name,
        daysPerWeek: userProfile.daysPerWeek,
        trainingDays: userProfile.dniTreningowe
      }
    };
    
  } catch (error) {
    console.error(`❌ Error creating schedule for user ${userId}:`, error.message);
    return { success: false, reason: error.message };
  }
}

// Helper function to map experience level
function mapExperienceLevel(level) {
  const levelMap = {
    'beginner': 'początkujący',
    'intermediate': 'średnio-zaawansowany', 
    'advanced': 'zaawansowany',
    'początkujący': 'początkujący',
    'średnio-zaawansowany': 'średnio-zaawansowany',
    'zaawansowany': 'zaawansowany'
  };
  
  return levelMap[level] || 'początkujący';
}

// Fix all users without schedules
async function fixUsersWithoutSchedules(userIds = null) {
  const report = await checkUsersWithoutSchedules();
  const usersToFix = userIds || report.affectedUserIds;
  
  if (usersToFix.length === 0) {
    console.log('✅ No users need schedule fixes');
    return { fixed: 0, failed: 0, results: [] };
  }
  
  console.log(`\n🔧 Attempting to create schedules for ${usersToFix.length} users...\n`);
  
  let fixed = 0;
  let failed = 0;
  const results = [];
  
  for (const userId of usersToFix) {
    console.log(`Processing user: ${userId}`);
    const result = await createFallbackScheduleForUser(userId);
    results.push({ userId, ...result });
    
    if (result.success) {
      fixed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Migration Results:`);
  console.log(`  ✅ Successfully fixed: ${fixed} users`);
  console.log(`  ❌ Failed to fix: ${failed} users`);
  
  if (failed > 0) {
    console.log('\n❌ Failed users:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.userId}: ${r.reason}`);
    });
  }
  
  return { fixed, failed, results };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');
  const userIdArg = args.find(arg => arg.startsWith('--user-id='));
  const specificUserId = userIdArg ? userIdArg.split('=')[1] : null;
  
  console.log('🚀 Weekly Schedule Migration Tool');
  console.log('=====================================');
  
  await connectToDatabase();
  
  // Always run checks first
  const report = await checkUsersWithoutSchedules();
  await checkFormsWithMissingTrainingDays();
  
  if (checkOnly) {
    console.log('\n✅ Check complete (--check-only mode)');
    process.exit(0);
  }
  
  // Fix users
  let usersToFix = null;
  if (specificUserId) {
    console.log(`\n🎯 Fixing specific user: ${specificUserId}`);
    usersToFix = [specificUserId];
  }
  
  const migrationResult = await fixUsersWithoutSchedules(usersToFix);
  
  console.log('\n🎉 Migration complete!');
  
  // Disconnect
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
}

module.exports = {
  checkUsersWithoutSchedules,
  checkFormsWithMissingTrainingDays,
  createFallbackScheduleForUser,
  fixUsersWithoutSchedules
};