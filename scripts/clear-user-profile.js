#!/usr/bin/env node

/**
 * Skrypt do czyszczenia profilu użytkownika dla testów
 * Resetuje hasFilledRunningForm na false i usuwa formularze treningowe
 * 
 * Użycie:
 * node scripts/clear-user-profile.js [supabaseUserId]
 * 
 * Jeśli nie podano supabaseUserId, skrypt wyczyści wszystkich użytkowników
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const User = require('../src/models/user.model');
const RunningForm = require('../src/models/running-form.model');

async function clearUserProfile(supabaseUserId = null) {
  try {
    console.log('🔄 Łączenie z bazą danych...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/runfitting');
    console.log('✅ Połączono z bazą danych');

    let userFilter = {};
    if (supabaseUserId) {
      userFilter = { supabaseId: supabaseUserId };
      console.log(`🎯 Czyszczenie profilu dla użytkownika: ${supabaseUserId}`);
    } else {
      console.log('🧹 Czyszczenie profili wszystkich użytkowników');
    }

    // 1. Resetuj flagę hasFilledRunningForm i wyczyść dane profilu
    console.log('🔄 Resetowanie flag profilu...');
    const userUpdateResult = await User.updateMany(
      userFilter,
      { 
        $set: {
          hasFilledRunningForm: false
        },
        $unset: {
          mainFitnessGoal: 1,
          experienceLevel: 1,
          age: 1,
          weight: 1,
          height: 1,
          restingHeartRate: 1,
          maxHeartRate: 1,
          waistCircumference: 1,
          dateOfBirth: 1,
          gender: 1
        }
      }
    );

    console.log(`✅ Zaktualizowano ${userUpdateResult.modifiedCount} profili użytkowników`);

    // 2. Usuń formularze treningowe
    console.log('🔄 Usuwanie formularzy treningowych...');
    let formFilter = {};
    if (supabaseUserId) {
      formFilter = { supabaseUserId: supabaseUserId };
    }

    const deleteResult = await RunningForm.deleteMany(formFilter);
    console.log(`✅ Usunięto ${deleteResult.deletedCount} formularzy treningowych`);

    // 3. Pokaż statystyki
    const totalUsers = await User.countDocuments(userFilter);
    const usersWithForms = await User.countDocuments({
      ...userFilter,
      hasFilledRunningForm: true
    });

    console.log('\n📊 Statystyki po czyszczeniu:');
    console.log(`   Użytkownicy: ${totalUsers}`);
    console.log(`   Z wypełnionym formularzem: ${usersWithForms}`);
    console.log(`   Bez wypełnionego formularza: ${totalUsers - usersWithForms}`);

    if (supabaseUserId) {
      console.log(`\n✨ Profil użytkownika ${supabaseUserId} został wyczyszczony!`);
    } else {
      console.log('\n✨ Wszystkie profile zostały wyczyszczone!');
    }

  } catch (error) {
    console.error('❌ Błąd podczas czyszczenia profili:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Rozłączono z bazą danych');
  }
}

// Uruchom skrypt
const supabaseUserId = process.argv[2];

if (supabaseUserId) {
  console.log(`🚀 Uruchamianie skryptu dla użytkownika: ${supabaseUserId}`);
} else {
  console.log('🚀 Uruchamianie skryptu dla wszystkich użytkowników');
  console.log('💡 Tip: Użyj "node scripts/clear-user-profile.js [supabaseUserId]" dla konkretnego użytkownika');
}

clearUserProfile(supabaseUserId);