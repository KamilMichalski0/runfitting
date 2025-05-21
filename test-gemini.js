require('dotenv').config();
const GeminiService = require('./src/services/gemini.service');
const knowledgeBase = require('./src/knowledge/running-knowledge-base');
const correctiveExercisesKnowledgeBase = require('./src/knowledge/corrective-knowledge-base');

async function testGeminiService() {
    try {
        console.log('Starting GeminiService test...');
        
        const geminiService = new GeminiService(knowledgeBase, correctiveExercisesKnowledgeBase);
        
        // Base test data
        const baseUserData = {
            age: 35,
            weight: 75,
            height: 180,
            gender: 'male',
            experience: 'intermediate',
            goals: ['improve endurance', 'prepare for marathon'],
            availability: {
                monday: { morning: true, afternoon: false, evening: true },
                tuesday: { morning: false, afternoon: true, evening: false },
                wednesday: { morning: true, afternoon: false, evening: true },
                thursday: { morning: false, afternoon: true, evening: false },
                friday: { morning: true, afternoon: false, evening: true },
                saturday: { morning: true, afternoon: true, evening: false },
                sunday: { morning: true, afternoon: false, evening: false }
            },
            preferences: {
                preferredWorkoutTypes: ['running', 'strength training'],
                preferredWorkoutDuration: 60,
                preferredWorkoutIntensity: 'moderate',
                preferredWorkoutLocation: 'outdoor'
            },
            health: {
                injuries: ['knee pain'],
                medicalConditions: ['none'],
                medications: ['none']
            }
        };

        // Test 1: Both dates provided
        console.log('\n=== Test 1: Both race date and plan start date ===');
        const userDataWithBothDates = {
            ...baseUserData,
            raceDate: '2025-09-15',
            planStartDate: '2025-05-24'
        };
        const resultWithBothDates = await geminiService.generateTrainingPlan(userDataWithBothDates);
        console.log('\nGenerated Training Plan (Both dates):');
        console.log(JSON.stringify(resultWithBothDates, null, 2));

        // Test 2: Only race date
        console.log('\n=== Test 2: Only race date ===');
        const userDataWithRaceDate = {
            ...baseUserData,
            raceDate: '2025-09-15'
        };
        const resultWithRaceDate = await geminiService.generateTrainingPlan(userDataWithRaceDate);
        console.log('\nGenerated Training Plan (Race date only):');
        console.log(JSON.stringify(resultWithRaceDate, null, 2));

        // Test 3: Only plan start date
        console.log('\n=== Test 3: Only plan start date ===');
        const userDataWithStartDate = {
            ...baseUserData,
            planStartDate: '2025-05-24'
        };
        const resultWithStartDate = await geminiService.generateTrainingPlan(userDataWithStartDate);
        console.log('\nGenerated Training Plan (Start date only):');
        console.log(JSON.stringify(resultWithStartDate, null, 2));
        
    } catch (error) {
        console.error('Error during test:', error);
    }
}

// Run the test
testGeminiService(); 