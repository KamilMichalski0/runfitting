const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');
const heartRateCalculator = require('../algorithms/heart-rate-calculator');
const paceCalculator = require('../algorithms/pace-calculator');
const SubscriptionService = require('../services/subscription.service');
const WeeklyPlanDeliveryService = require('../services/weekly-plan-delivery.service');
const { logInfo, logError } = require('../utils/logger');

// Helper functions for mapping form data
const mapFormToUserProfile = (formData, user) => {
  return {
    name: formData.imieNazwisko || formData.name || user?.name || 'Biegacz',
    age: formData.wiek || formData.age || user?.age || 30,
    level: mapExperienceLevel(formData.poziomZaawansowania || formData.level),
    goal: formData.glownyCel || formData.goal || 'poprawa_kondycji',
    daysPerWeek: formData.dniTreningowe?.length || formData.daysPerWeek || 3,
    weeklyDistance: formData.aktualnyKilometrTygodniowy || formData.weeklyDistance || 20,
    hasInjuries: formData.obecneKontuzje || formData.kontuzje || formData.hasInjuries || false,
    restingHeartRate: formData.restingHr || formData.heartRate || user?.restingHeartRate,
    maxHeartRate: formData.maxHr || user?.maxHeartRate,
    vo2max: formData.vo2max,
    targetDistance: formData.dystansDocelowy,
    description: formData.opisCelu || formData.description || '',
    trainingDays: formData.dniTreningowe || ['monday', 'wednesday', 'friday'],
    preferredTrainingTime: formData.preferowanyCzasTreningu || formData.preferowanaGodzinaTreningu || 'rano',
    availableTime: formData.czasTreningu || 60
  };
};

const mapExperienceLevel = (level) => {
  const levelMap = {
    'beginner': 'początkujący',
    'intermediate': 'średnio-zaawansowany', 
    'advanced': 'zaawansowany',
    'początkujący': 'początkujący',
    'średnio-zaawansowany': 'średnio-zaawansowany',
    'zaawansowany': 'zaawansowany',
    // Mapping from running form values
    'poczatkujacy': 'początkujący',
    'sredniozaawansowany': 'średnio-zaawansowany',
    'zaawansowany': 'zaawansowany'
  };
  return levelMap[level] || level || 'początkujący';
};

const mapFormToLongTermGoal = (formData) => {
  const longTermGoal = {};
  
  // Map target distance to event
  if (formData.dystansDocelowy && formData.dystansDocelowy !== 'inny') {
    longTermGoal.targetEvent = `Zawody ${formData.dystansDocelowy}`;
  }
  
  if (formData.raceDate || formData.dataZawodow) {
    longTermGoal.targetDate = new Date(formData.raceDate || formData.dataZawodow);
  }
  
  // Map personal records as time goals
  if (formData.dystansDocelowy === '5km' && formData.rekord5km) {
    longTermGoal.targetTime = formData.rekord5km;
  } else if (formData.dystansDocelowy === '10km' && formData.rekord10km) {
    longTermGoal.targetTime = formData.rekord10km;
  } else if (formData.dystansDocelowy === 'polmaraton' && formData.rekordPolmaraton) {
    longTermGoal.targetTime = formData.rekordPolmaraton;
  } else if (formData.dystansDocelowy === 'maraton' && formData.rekordMaraton) {
    longTermGoal.targetTime = formData.rekordMaraton;
  }
  
  // Calculate remaining weeks to goal
  if (longTermGoal.targetDate) {
    const now = new Date();
    const diffTime = longTermGoal.targetDate - now;
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    longTermGoal.remainingWeeks = diffWeeks > 0 ? diffWeeks : 12; // default 12 weeks
  } else {
    longTermGoal.remainingWeeks = 12;
  }
  
  return longTermGoal;
};

/**
 * Pobieranie profilu zalogowanego użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getProfile = async (req, res, next) => {
  try {
    // Sprawdź, czy obiekt req.user i req.user.sub istnieją
    if (!req.user || !req.user.sub) {
      return next(new AppError('Informacje o użytkowniku nie są dostępne w żądaniu. Upewnij się, że użytkownik jest uwierzytelniony.', 401));
    }

    const supabaseUserId = req.user.sub;

    // Znajdź użytkownika w bazie MongoDB na podstawie supabaseId
    const user = await User.findOne({ supabaseId: supabaseUserId });

    if (!user) {
      // Możesz zdecydować, co zrobić, jeśli użytkownik istnieje w Supabase, ale nie ma go w Twojej lokalnej bazie MongoDB.
      // Na przykład, możesz zwrócić 404 lub spróbować go utworzyć/zsynchronizować.
      // Na razie zwrócimy 404.
      return next(new AppError('Nie znaleziono profilu użytkownika w bazie danych aplikacji.', 404));
    }

    // Spróbuj pobrać dane z formularza biegowego
    let runningFormData = null;
    try {
      console.log(`[getProfile] Searching for running form for userId: ${supabaseUserId}`);
      const TrainingFormSubmission = require('../models/running-form.model');
      
      // First, let's see all forms for this user - sort by updatedAt to get most recently modified
      const allForms = await TrainingFormSubmission.find({ userId: supabaseUserId })
        .sort({ updatedAt: -1, createdAt: -1 });
      console.log(`[getProfile] Found ${allForms.length} forms for user`);
      allForms.forEach((form, index) => {
        console.log(`[getProfile] Form ${index + 1}: ID=${form._id}, createdAt=${form.createdAt}, glownyCel=${form.glownyCel}`);
      });
      
      // Check if the newest form has the expected data
      if (allForms.length > 0) {
        const newestForm = allForms[0];
        console.log(`[getProfile] NEWEST FORM DEBUG - ID: ${newestForm._id}`);
        console.log(`[getProfile] NEWEST FORM DEBUG - createdAt: ${newestForm.createdAt}`);
        console.log(`[getProfile] NEWEST FORM DEBUG - glownyCel: ${newestForm.glownyCel}`);
        console.log(`[getProfile] NEWEST FORM DEBUG - has glownyCel field:`, newestForm.glownyCel !== undefined);
        
        // Look for our expected form
        const expectedForm = allForms.find(form => form._id.toString() === '6818a2ab0c11d20684a7040f');
        if (expectedForm) {
          console.log(`[getProfile] EXPECTED FORM FOUND at index:`, allForms.indexOf(expectedForm));
          console.log(`[getProfile] EXPECTED FORM - createdAt: ${expectedForm.createdAt}`);
          console.log(`[getProfile] EXPECTED FORM - glownyCel: ${expectedForm.glownyCel}`);
        } else {
          console.log(`[getProfile] EXPECTED FORM NOT FOUND in results`);
        }
      }
      
      const latestForm = allForms[0]; // Get the first one (most recent)
      console.log(`[getProfile] Running form search result:`, latestForm ? 'Found' : 'Not found');
      
      if (latestForm) {
        console.log(`[getProfile] Running form data found, ID: ${latestForm._id}`);
        console.log(`[getProfile] All form fields:`, Object.keys(latestForm.toObject()));
        console.log(`[getProfile] Sample field values:`, {
          poziomZaawansowania: latestForm.poziomZaawansowania,
          dystansDocelowy: latestForm.dystansDocelowy,
          aktualnyKilometrTygodniowy: latestForm.aktualnyKilometrTygodniowy,
          doswiadczenieBiegowe: latestForm.doswiadczenieBiegowe
        });
        
        // Map old field names to new ones and fill missing data from user profile
        runningFormData = {
          id: latestForm._id,
          dateOfBirth: latestForm.dateOfBirth || user.dateOfBirth,
          wiek: latestForm.wiek || user.age,
          plec: latestForm.plec,
          wzrost: latestForm.wzrost || user.height,
          masaCiala: latestForm.masaCiala || user.weight,
          obwodTalii: latestForm.obwodTalii || user.waistCircumference,
          glownyCel: latestForm.glownyCel || user.mainFitnessGoal,
          // Map old/missing fields with fallbacks
          poziomZaawansowania: latestForm.poziomZaawansowania || user.experienceLevel || 'poczatkujacy',
          dystansDocelowy: latestForm.dystansDocelowy || '5km',
          aktualnyKilometrTygodniowy: latestForm.aktualnyKilometrTygodniowy || 10,
          dniTreningowe: latestForm.dniTreningowe || ['poniedzialek', 'sroda', 'piatek'],
          czasTreningu: latestForm.czasTreningu || 60,
          doswiadczenieBiegowe: latestForm.doswiadczenieBiegowe || 'poczatkujacy',
          miejsceTreningu: latestForm.miejsceTreningu || 'na_zewnatrz',
          preferencjeTempa: latestForm.preferencjeTempa || 'umiarkowane',
          motywacjaDoTreningow: latestForm.motywacjaDoTreningow || latestForm.coMotywuje || 'zdrowie',
          wsparcie: latestForm.wsparcie || latestForm.formatWsparcia || 'samodzielnie',
          // Additional fields from form
          chronotyp: latestForm.chronotyp,
          preferowanaGodzinaTreningu: latestForm.preferowanyCzasTreningu,
          dostepnySprzet: latestForm.dostepnySprzet || user.availableEquipment,
          obecneKontuzje: latestForm.alergie || user.hasCurrentInjuries || false,
          ograniczeniaZdrowotne: user.hasHealthRestrictions || false,
          alergie: user.hasAllergies || false,
          imieNazwisko: latestForm.imieNazwisko || user.name,
          createdAt: latestForm.createdAt,
          status: latestForm.status
        };
        
        console.log(`[getProfile] Final runningFormData:`, runningFormData);
      } else {
        console.log(`[getProfile] No running form found for userId: ${supabaseUserId}`);
      }
    } catch (formError) {
      console.error('[getProfile] Error while fetching running form:', formError);
      console.error('[getProfile] Error stack:', formError.stack);
      // Nie blokuj odpowiedzi jeśli formularz nie został znaleziony
    }

    console.log(`[getProfile] *** SENDING RESPONSE TO CLIENT ***`);
    console.log(`[getProfile] Response runningForm.glownyCel:`, runningFormData?.glownyCel);
    console.log(`[getProfile] Response runningForm.poziomZaawansowania:`, runningFormData?.poziomZaawansowania);
    console.log(`[getProfile] Response runningForm.dystansDocelowy:`, runningFormData?.dystansDocelowy);
    
    res.status(200).json({
      success: true,
      requiresProfileSetup: !user.hasFilledRunningForm,
      message: 'Profil użytkownika załadowany pomyślnie.',
      data: {
        user: user, // Zwróć użytkownika z MongoDB
        runningForm: runningFormData // Dodaj dane formularza jeśli dostępne
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualizacja profilu użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateProfile = async (req, res, next) => {
  try {
    console.log(`[updateProfile] *** PATCH REQUEST RECEIVED ***`);
    console.log(`[updateProfile] req.user exists:`, !!req.user);
    console.log(`[updateProfile] req.user.sub:`, req.user?.sub);
    console.log(`[updateProfile] req.user keys:`, req.user ? Object.keys(req.user) : 'none');
    console.log(`[updateProfile] Starting profile update for user: ${req.user?.sub}`);
    console.log(`[updateProfile] Request body:`, JSON.stringify(req.body, null, 2));

    if (!req.user || !req.user.sub) {
      console.error('[updateProfile] Authentication error: no user details found');
      return next(new AppError('Błąd uwierzytelniania: nie znaleziono szczegółów użytkownika. Upewnij się, że token jest prawidłowy.', 401));
    }

    const supabaseUserEmail = req.user.email;
    const supabaseUserName = (req.user.user_metadata && (req.user.user_metadata.full_name || req.user.user_metadata.name)) || 'Nowy Użytkownik';
    
    console.log(`[updateProfile] User details - Email: ${supabaseUserEmail}, Name: ${supabaseUserName}`);

    const filteredBody = {};
    const fieldsForSetOnInsert = {
        supabaseId: req.user.sub,
        email: supabaseUserEmail,
        name: supabaseUserName
    };

    const allowedFields = [
      'name',
      'email',
      'gender',
      'dateOfBirth',
      'age',
      'weight',
      'height',
      'phoneNumber',
      'waistCircumference',
      'restingHeartRate',
      'maxHeartRate',
      'experienceLevel',
      'currentActivityLevel',
      'chronotype',
      'preferredTrainingTime',
      'availableEquipment',
      'hasCurrentInjuries',
      'hasHealthRestrictions',
      'hasAllergies',
      'mainFitnessGoal',
      'fitnessGoals',
      'hasFilledRunningForm',
      // Running form fields
      'plec',
      'wzrost',
      'masaCiala',
      'obwodTalii',
      'glownyCel',
      'poziomZaawansowania',
      'aktualnaNawykowyAktywnosc',
      'chronotyp',
      'preferowanaGodzinaTreningu',
      'dostepnySprzet',
      'obecneKontuzje',
      'ograniczeniaZdrowotne',
      'alergie',
      // Additional form fields for complete form submission
      'imieNazwisko',
      'wiek',
      'dystansDocelowy',
      'aktualnyKilometrTygodniowy',
      'dniTreningowe',
      'czasTreningu',
      'rekord5km',
      'rekord10km',
      'rekordPolmaraton',
      'rekordMaraton',
      'dataZawodow',
      'raceDate',
      'opisCelu',
      'kontuzje',
      'doswiadczenieBiegowe',
      'miejsceTreningu',
      'preferencjeTempa',
      'motywacjaDoTreningow',
      'wsparcie',
      // Weekly schedule fields
      'czestotliwoscDostaw',
      'dzienDostawy',
      'godzinaDostawy',
      'strefaCzasowa',
      'createWeeklySchedule'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        filteredBody[field] = req.body[field];
        console.log(`[updateProfile] Processing field: ${field} = ${JSON.stringify(req.body[field])}`);
        if (field === 'email' || field === 'name') {
            delete fieldsForSetOnInsert[field];
        }
      }
    });

    console.log(`[updateProfile] Filtered body:`, JSON.stringify(filteredBody, null, 2));
    console.log(`[updateProfile] Fields for setOnInsert:`, JSON.stringify(fieldsForSetOnInsert, null, 2));

    // Przygotowanie operacji aktualizacji/wstawienia
    const updateOperation = {
      $set: filteredBody,
      $setOnInsert: fieldsForSetOnInsert
    };
    
    console.log(`[updateProfile] Update operation:`, JSON.stringify(updateOperation, null, 2));
    
    if (Object.keys(filteredBody).length === 0 && Object.keys(fieldsForSetOnInsert).length > 0) {
        // Nie ma potrzeby $set, jeśli nie ma co aktualizować, a tylko wstawiamy
        // Ale Mongoose wymaga, aby $set lub $setOnInsert coś robiły, jeśli nie ma $set, pusty obiekt $set jest ok
    }

    // Aktualizacja użytkownika lub jego utworzenie, jeśli nie istnieje
    console.log(`[updateProfile] Executing findOneAndUpdate for user: ${req.user.sub}`);
    const updatedUser = await User.findOneAndUpdate(
      { supabaseId: req.user.sub },
      updateOperation,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    if (!updatedUser) {
      console.error('[updateProfile] Failed to update or create user profile');
      return next(new AppError('Nie można było zaktualizować ani utworzyć profilu użytkownika.', 500));
    }

    console.log(`[updateProfile] Profile updated successfully for user: ${req.user.sub}`);
    console.log(`[updateProfile] Updated user data:`, JSON.stringify(updatedUser.toObject(), null, 2));

    // Check if running form data was included and update running form collection
    const runningFormFields = [
      'imieNazwisko', 'plec', 'wzrost', 'masaCiala', 'obwodTalii', 'glownyCel', 'poziomZaawansowania', 
      'aktualnaNawykowyAktywnosc', 'chronotyp', 'preferowanaGodzinaTreningu', 'dostepnySprzet', 
      'obecneKontuzje', 'ograniczeniaZdrowotne', 'alergie', 'dateOfBirth',
      'wiek', 'dystansDocelowy', 'aktualnyKilometrTygodniowy', 'dniTreningowe', 'czasTreningu',
      'rekord5km', 'rekord10km', 'rekordPolmaraton', 'rekordMaraton', 'dataZawodow', 'raceDate',
      'opisCelu', 'kontuzje', 'doswiadczenieBiegowe', 'miejsceTreningu', 'preferencjeTempa',
      'motywacjaDoTreningow', 'wsparcie'
    ];
    const hasRunningFormData = runningFormFields.some(field => req.body[field] !== undefined);
    
    console.log(`[updateProfile] hasRunningFormData check:`, hasRunningFormData);
    console.log(`[updateProfile] Request body fields:`, Object.keys(req.body));
    console.log(`[updateProfile] Fields found in body:`, runningFormFields.filter(field => req.body[field] !== undefined));
    console.log(`[updateProfile] Sample field values from body:`, {
      glownyCel: req.body.glownyCel,
      poziomZaawansowania: req.body.poziomZaawansowania,
      dniTreningowe: req.body.dniTreningowe
    });
    console.log('🔍 DEBUG [updateProfile] FULL dniTreningowe:', JSON.stringify(req.body.dniTreningowe));
    console.log('🔍 DEBUG [updateProfile] dniTreningowe type:', typeof req.body.dniTreningowe);
    console.log('🔍 DEBUG [updateProfile] dniTreningowe isArray:', Array.isArray(req.body.dniTreningowe));
    
    if (hasRunningFormData) {
      console.log(`[updateProfile] Running form data detected, updating TrainingFormSubmission`);
      try {
        const TrainingFormSubmission = require('../models/running-form.model');
        
        // Build running form update data
        const runningFormUpdate = {};
        runningFormFields.forEach(field => {
          if (req.body[field] !== undefined) {
            runningFormUpdate[field] = req.body[field];
            console.log(`[updateProfile] Adding to running form: ${field} = ${req.body[field]}`);
          }
        });
        
        // Ensure imieNazwisko is set if not provided
        if (!runningFormUpdate.imieNazwisko && updatedUser.name) {
          runningFormUpdate.imieNazwisko = updatedUser.name;
          console.log(`[updateProfile] Setting imieNazwisko from user name: ${updatedUser.name}`);
        }
        
        // Filter out empty strings to avoid MongoDB enum validation errors
        const filteredRunningFormUpdate = {};
        Object.keys(runningFormUpdate).forEach(key => {
          const value = runningFormUpdate[key];
          // Only include non-empty values
          if (value !== '' && value !== null && value !== undefined) {
            // For arrays, keep them even if empty (they might be valid)
            // For strings, only include non-empty ones
            if (Array.isArray(value) || value !== '') {
              filteredRunningFormUpdate[key] = value;
            }
          }
        });
        
        // Update or create running form submission
        console.log(`[updateProfile] Updating/creating running form for userId: ${req.user.sub}`);
        console.log(`[updateProfile] Filtered running form update data:`, JSON.stringify(filteredRunningFormUpdate, null, 2));
        
        // Find existing form or create new one - ONLY ONE per user
        let runningForm = await TrainingFormSubmission.findOne({ userId: req.user.sub })
          .sort({ updatedAt: -1, createdAt: -1 });
        
        if (runningForm) {
          console.log(`[updateProfile] Found existing form to update: ${runningForm._id}`);
          console.log(`[updateProfile] Existing form glownyCel before update:`, runningForm.glownyCel);
          
          // Update existing form
          Object.assign(runningForm, filteredRunningFormUpdate);
          runningForm.updatedAt = new Date();
          await runningForm.save();
        } else {
          console.log(`[updateProfile] No existing form found, creating new one`);
          
          // Create new form only if none exists
          runningForm = new TrainingFormSubmission({
            ...filteredRunningFormUpdate,
            userId: req.user.sub,
            status: 'nowy'
          });
          await runningForm.save();
        }
        
        const updatedForm = runningForm;
        
        console.log(`[updateProfile] Running form updated successfully:`, updatedForm._id);
        console.log(`[updateProfile] Form userId:`, updatedForm.userId);
        console.log(`[updateProfile] Updated form glownyCel after update:`, updatedForm.glownyCel);
        
        // Check if this is a complete form submission that should create a weekly schedule
        // Only create schedule when explicitly requested, not on every edit
        const shouldCreateSchedule = req.body.createWeeklySchedule === true;
        
        console.log(`[updateProfile] createWeeklySchedule flag:`, req.body.createWeeklySchedule);
        console.log(`[updateProfile] shouldCreateSchedule:`, shouldCreateSchedule);
        
        // Update hasFilledRunningForm flag if this is a complete form submission
        if (shouldCreateSchedule && !updatedUser.hasFilledRunningForm) {
          updatedUser.hasFilledRunningForm = true;
          await updatedUser.save();
        }
        
        if (shouldCreateSchedule) {
          console.log(`[updateProfile] Creating weekly schedule for user: ${req.user.sub}`);
          
          try {
            // Initialize weekly plan delivery service
            const weeklyPlanDeliveryService = new WeeklyPlanDeliveryService();
            
            // Prepare schedule data
            const scheduleData = {
              userProfile: mapFormToUserProfile(req.body, updatedUser),
              deliveryFrequency: req.body.czestotliwoscDostaw || 'weekly',
              deliveryDay: req.body.dzienDostawy || 'sunday',
              deliveryTime: req.body.godzinaDostawy || '18:00',
              timezone: req.body.strefaCzasowa || 'Europe/Warsaw',
              longTermGoal: mapFormToLongTermGoal(req.body)
            };
            
            // Check if user already has an active schedule
            let schedule;
            try {
              schedule = await weeklyPlanDeliveryService.getUserSchedule(req.user.sub);
              logInfo(`User ${req.user.sub} already has an active schedule - updating`);
              schedule = await weeklyPlanDeliveryService.updateSchedule(req.user.sub, scheduleData);
            } catch (error) {
              if (error.message.includes('Nie znaleziono aktywnego harmonogramu')) {
                // No schedule - create new one
                logInfo(`Creating new schedule for user: ${req.user.sub}`);
                schedule = await weeklyPlanDeliveryService.createSchedule(req.user.sub, scheduleData);
              } else {
                // Other error - rethrow
                throw error;
              }
            }
            
            // Generate first weekly plan immediately
            logInfo(`Generating first weekly plan for user: ${req.user.sub}`);
            const firstWeeklyPlan = await weeklyPlanDeliveryService.generateWeeklyPlan(schedule);
            
            // Update form submission with schedule info
            updatedForm.status = 'wygenerowany';
            updatedForm.planId = firstWeeklyPlan._id;
            updatedForm.scheduleId = schedule._id;
            await updatedForm.save();
            
            logInfo(`Successfully started weekly delivery system for user: ${req.user.sub}`);
            
            // Include schedule info in response
            return res.status(200).json({
              success: true,
              data: {
                user: updatedUser,
                schedule: {
                  scheduleId: schedule._id,
                  firstPlanId: firstWeeklyPlan._id,
                  deliveryFrequency: schedule.deliveryFrequency,
                  deliveryDay: schedule.deliveryDay,
                  deliveryTime: schedule.deliveryTime,
                  nextDeliveryDate: schedule.nextDeliveryDate
                },
                firstPlan: {
                  weekNumber: firstWeeklyPlan.weekNumber,
                  planType: firstWeeklyPlan.planType,
                  metadata: firstWeeklyPlan.metadata
                }
              }
            });
          } catch (scheduleError) {
            logError('Error creating weekly schedule during profile update', scheduleError);
            // Don't fail the whole request, just log the error
          }
        }
      } catch (formError) {
        console.error('[updateProfile] Error updating running form:', formError);
        // Don't fail the whole request, just log the error
      }
    }

    // Standard response without schedule
    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error(`[updateProfile] Error updating profile for user ${req.user?.sub}:`, error);
    console.error(`[updateProfile] Error stack:`, error.stack);
    
    // Obsługa potencjalnego błędu duplikacji klucza (np. jeśli email jest unikalny w MongoDB)
    if (error.code === 11000) {
      console.error('[updateProfile] Duplicate key error:', error.keyPattern);
      if (error.keyPattern && error.keyPattern.email) {
        return next(new AppError('Ten adres email jest już używany przez inne konto w bazie danych.', 409));
      }
      if (error.keyPattern && error.keyPattern.supabaseId) {
        // To nie powinno się zdarzyć, skoro `supabaseId` jest w kryterium wyszukiwania upsert
        return next(new AppError('Konflikt ID Supabase. To jest nieoczekiwany błąd.', 409));
      }
    }
    next(error);
  }
};

/**
 * Kontroler aktualizujący cele treningowe użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateTrainingGoals = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Pobranie obecnych celów treningowych
    const user = await User.findOne({ supabaseId: req.user.sub });
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika', 404));
    }

    // Aktualizacja celów treningowych
    const updatedTrainingGoals = {
      ...user.trainingGoals || {},
      ...req.body
    };

    // Aktualizacja profilu użytkownika
    const updatedUser = await User.findOneAndUpdate(
      { supabaseId: req.user.sub },
      { trainingGoals: updatedTrainingGoals },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        trainingGoals: updatedUser.trainingGoals
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler aktualizujący historię treningową użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateTrainingHistory = async (req, res, next) => {
  try {
    // Sprawdzenie wyników walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array()
      });
    }

    // Pobranie obecnej historii treningowej
    const user = await User.findOne({ supabaseId: req.user.sub });
    if (!user) {
      return next(new AppError('Nie znaleziono użytkownika', 404));
    }

    // Aktualizacja historii treningowej
    const updatedTrainingHistory = {
      ...user.trainingHistory || {},
      ...req.body
    };

    // Aktualizacja profilu użytkownika
    const updatedUser = await User.findOneAndUpdate(
      { supabaseId: req.user.sub },
      { trainingHistory: updatedTrainingHistory },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        trainingHistory: updatedUser.trainingHistory
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler obliczający strefy tętna użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getHeartRateZones = async (req, res, next) => {
  try {
    const user = req.user;

    // Sprawdzenie, czy użytkownik ma potrzebne dane
    if (!user.age || !user.restingHeartRate) {
      return next(new AppError('Brak wymaganych danych (wiek, tętno spoczynkowe) do obliczenia stref tętna', 400));
    }

    // Obliczenie stref tętna
    const heartRateZones = heartRateCalculator.calculateHeartRateZones(user.age, user.restingHeartRate);

    res.status(200).json({
      status: 'success',
      data: {
        heartRateZones
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Kontroler obliczający tempa treningowe użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getTrainingPaces = async (req, res, next) => {
  try {
    const user = req.user;

    // Sprawdzenie, czy użytkownik ma historię treningową
    if (!user.trainingHistory || !user.trainingHistory.personalBests) {
      return next(new AppError('Brak wymaganych danych o rekordach życiowych do obliczenia temp treningowych', 400));
    }

    // Obliczenie temp treningowych
    const paces = paceCalculator.generateRacePaces(user.trainingHistory.personalBests);

    res.status(200).json({
      status: 'success',
      data: {
        paces
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sprawdza, czy użytkownik po raz pierwszy wypełnia formularz biegowy.
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.checkFirstFormSubmission = async (req, res, next) => {
  try {
    // Zakładamy, że req.user jest dostępne po uwierzytelnieniu
    // i zawiera pole hasFilledRunningForm
    const isFirstSubmission = !req.user.hasFilledRunningForm;

    res.status(200).json({
      success: true,
      data: {
        isFirstSubmission: isFirstSubmission
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pobiera informacje o limitach subskrypcji użytkownika.
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.getSubscriptionLimits = async (req, res, next) => {
  try {
    if (!req.user || !req.user.sub) {
      return next(new AppError('Użytkownik nie uwierzytelniony.', 401));
    }
    const userId = req.user.sub;

    const subscriptionService = new SubscriptionService(); // Create an instance
    const limitsData = await subscriptionService.getUserSubscriptionDetails(userId);

    res.status(200).json({
      status: 'success',
      data: limitsData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualizacja danych formularza biegowego użytkownika
 * @param {Object} req - Obiekt żądania Express
 * @param {Object} res - Obiekt odpowiedzi Express
 * @param {Function} next - Funkcja next Express
 */
exports.updateRunningForm = async (req, res, next) => {
  try {
    console.log(`[updateRunningForm] Starting running form update for user: ${req.user?.sub}`);
    console.log(`[updateRunningForm] Request body:`, JSON.stringify(req.body, null, 2));

    if (!req.user || !req.user.sub) {
      console.error('[updateRunningForm] Authentication error: no user details found');
      return next(new AppError('Błąd uwierzytelniania: nie znaleziono szczegółów użytkownika.', 401));
    }

    const supabaseUserId = req.user.sub;
    const updateData = req.body;

    // Znajdź i zaktualizuj najnowszy formularz biegowy użytkownika
    console.log(`[updateRunningForm] Searching for latest form for user: ${supabaseUserId}`);
    const TrainingFormSubmission = require('../models/running-form.model');
    const latestForm = await TrainingFormSubmission.findOne({ userId: supabaseUserId })
      .sort({ createdAt: -1 });

    if (!latestForm) {
      console.error(`[updateRunningForm] No running form found for user: ${supabaseUserId}`);
      return next(new AppError('Nie znaleziono formularza biegowego dla tego użytkownika.', 404));
    }

    console.log(`[updateRunningForm] Found form with ID: ${latestForm._id}, created at: ${latestForm.createdAt}`);

    // Zaktualizuj tylko te pola, które zostały przesłane (bez imienia - to jest w profilu użytkownika)
    const allowedFields = [
      'dateOfBirth', 'plec', 'wzrost', 'masaCiala', 'obwodTalii',
      'glownyCel', 'poziomZaawansowania', 'dystansDocelowy', 'aktualnyKilometrTygodniowy',
      'dniTreningowe', 'czasTreningu', 'doswiadczenieBiegowe', 'miejsceTreningu',
      'preferencjeTempa', 'motywacjaDoTreningow', 'wsparcie'
    ];

    console.log(`[updateRunningForm] Updating form fields...`);
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        console.log(`[updateRunningForm] Updating field: ${field} from ${latestForm[field]} to ${updateData[field]}`);
        latestForm[field] = updateData[field];
      }
    });

    // Zapisz zaktualizowany formularz
    console.log(`[updateRunningForm] Saving updated form...`);
    await latestForm.save();
    console.log(`[updateRunningForm] Form saved successfully`);

    // Zaktualizuj również profil użytkownika jeśli są podstawowe dane (bez imienia - to jest zarządzane osobno)
    console.log(`[updateRunningForm] Updating user profile with basic data...`);
    try {
      const user = await User.findOne({ supabaseId: supabaseUserId });
      if (user) {
        console.log(`[updateRunningForm] Found user profile, updating fields...`);
        
        if (updateData.dateOfBirth) {
          console.log(`[updateRunningForm] Updating user dateOfBirth: ${updateData.dateOfBirth}`);
          user.dateOfBirth = updateData.dateOfBirth;
        }
        if (updateData.plec) {
          const newGender = updateData.plec === 'Mężczyzna' ? 'male' : 
                           updateData.plec === 'Kobieta' ? 'female' : 'other';
          console.log(`[updateRunningForm] Updating user gender from ${user.gender} to ${newGender}`);
          user.gender = newGender;
        }
        if (updateData.wzrost) {
          console.log(`[updateRunningForm] Updating user height from ${user.height} to ${updateData.wzrost}`);
          user.height = updateData.wzrost;
        }
        if (updateData.masaCiala) {
          console.log(`[updateRunningForm] Updating user weight from ${user.weight} to ${updateData.masaCiala}`);
          user.weight = updateData.masaCiala;
        }
        if (updateData.obwodTalii) {
          console.log(`[updateRunningForm] Updating user waistCircumference from ${user.waistCircumference} to ${updateData.obwodTalii}`);
          user.waistCircumference = updateData.obwodTalii;
        }
        
        await user.save();
        console.log(`[updateRunningForm] User profile updated successfully`);
      } else {
        console.warn(`[updateRunningForm] No user profile found for user: ${supabaseUserId}`);
      }
    } catch (userUpdateError) {
      console.error('[updateRunningForm] Error updating user profile:', userUpdateError);
      console.error('[updateRunningForm] User update error stack:', userUpdateError.stack);
      // Nie blokuj odpowiedzi jeśli aktualizacja profilu się nie udała
    }

    console.log(`[updateRunningForm] Running form update completed successfully for user: ${supabaseUserId}`);
    
    res.status(200).json({
      success: true,
      message: 'Dane biegowe zostały zaktualizowane pomyślnie.',
      data: {
        runningForm: {
          id: latestForm._id,
          dateOfBirth: latestForm.dateOfBirth,
          wiek: latestForm.wiek, // virtual field - wiek obliczany automatycznie
          plec: latestForm.plec,
          wzrost: latestForm.wzrost,
          masaCiala: latestForm.masaCiala,
          obwodTalii: latestForm.obwodTalii,
          glownyCel: latestForm.glownyCel,
          poziomZaawansowania: latestForm.poziomZaawansowania,
          dystansDocelowy: latestForm.dystansDocelowy,
          aktualnyKilometrTygodniowy: latestForm.aktualnyKilometrTygodniowy,
          dniTreningowe: latestForm.dniTreningowe,
          czasTreningu: latestForm.czasTreningu,
          doswiadczenieBiegowe: latestForm.doswiadczenieBiegowe,
          miejsceTreningu: latestForm.miejsceTreningu,
          preferencjeTempa: latestForm.preferencjeTempa,
          motywacjaDoTreningow: latestForm.motywacjaDoTreningow,
          wsparcie: latestForm.wsparcie,
          updatedAt: latestForm.updatedAt
        }
      }
    });
  } catch (error) {
    console.error(`[updateRunningForm] Error in updateRunningForm for user ${req.user?.sub}:`, error);
    console.error(`[updateRunningForm] Error stack:`, error.stack);
    next(error);
  }
}; 