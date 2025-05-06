const mongoose = require('mongoose');
const { Schema } = mongoose;

const trainingFormSubmissionSchema = new Schema({
  // --- SEKCJA 0: Dane podstawowe ---
  imieNazwisko: { type: String, required: true, trim: true, minlength: 3 },
  wiek: { type: Number, required: true, min: 12, max: 100 },
  plec: { type: String, required: true, enum: ['Kobieta', 'Mężczyzna', 'Inna'] },
  wzrost: { type: Number, required: true, min: 100, max: 250 },
  masaCiala: { type: Number, required: true, min: 30, max: 300 },
  obwodTalii: { type: Number, min: 30, max: 200 }, // Zod had optional().or(z.literal('')) - handled as optional Number
  email: { type: String, trim: true, lowercase: true }, // Populated server-side? Marked optional in Zod
  telefon: { type: String, trim: true }, // Optional in Zod
  // bmi: Calculated virtually below

  // --- SEKCJA 1: Wybór głównego celu / motywacji ---
  glownyCel: {
    type: String,
    required: true,
    enum: [
      'redukcja_masy_ciala',
      'przebiegniecie_dystansu',
      'zaczac_biegac',
      'aktywny_tryb_zycia',
      'zmiana_nawykow',
      'powrot_po_kontuzji',
      'poprawa_kondycji',
      'inny_cel',
    ],
  },
  innyCelOpis: { type: String, trim: true }, // Required via Zod refine if glownyCel == 'inny_cel'

  // --- SEKCJA 2A: Plan dla osób z nadwagą / otyłością --- (Fields optional unless glownyCel matches)
  zaleceniaLekarskie: { type: Boolean },
  opisZalecenLekarskich: { type: String, trim: true }, // Required via Zod refine if zaleceniaLekarskie=true
  chorobyPrzewlekle: [{ type: String }], // Zod: z.array(z.string()).optional()
  boleStawow: { type: Number, min: 0, max: 10 }, // Zod: optional()
  preferowaneAktywnosci: [{ type: String }], // Zod: z.array(z.string()).optional()
  // dniTreningowe: { type: [String], required: true, minlength: 1 }, // Common field, see below
  // czasTreningu: { type: Number, min: 0, max: 180 }, // Common field, see below
  gotowoscMotywacyjna: { type: Number, min: 1, max: 10 }, // Zod: optional()
  wsparcieDietetyczne: { type: Boolean },

  // --- SEKCJA 2B: Plan biegowy --- (Fields optional unless glownyCel matches)
  poziomZaawansowania: { type: String, enum: ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany'] },
  dystansDocelowy: { type: String, enum: ['5km', '10km', 'polmaraton', 'maraton', 'inny'] },
  aktualnyKilometrTygodniowy: { type: Number, min: 0 }, // Zod: optional()
  // dniTreningowe: { type: [String], required: true, minlength: 1 }, // Common field, see below
  testCoopera: { type: String, enum: ['wykonany', 'niewykonany'] },
  wynikTestuCoopera: { type: Number }, // Zod: optional()
  rekord5km: { type: String, enum: ['ponizej_20min', '20_25min', '25_30min', '30_35min', '35_40min', 'powyzej_40min', ''] }, // Zod: optional()
  rekord10km: { type: String, enum: ['ponizej_40min', '40_50min', '50_60min', '60_70min', '70_80min', 'powyzej_80min', ''] }, // Zod: optional()
  rekordPolmaraton: { type: String, enum: ['ponizej_1h30min', '1h30_1h45min', '1h45_2h00min', '2h00_2h15min', '2h15_2h30min', 'powyzej_2h30min', ''] }, // Zod: optional()
  rekordMaraton: { type: String, enum: ['ponizej_3h00min', '3h00_3h30min', '3h30_4h00min', '4h00_4h30min', '4h30_5h00min', 'powyzej_5h00min', ''] }, // Zod: optional()
  vo2max: { type: String }, // Zod: optional()
  maxHr: { type: Number }, // Zod: optional()
  restingHr: { type: Number }, // Zod: optional()
  kontuzje: { type: Boolean },
  poprawaTechnikiBiegu: { type: Boolean },
  cwiczeniaUzupelniajace: { type: Boolean },

  // --- SEKCJA 2C: Plan ogólno-sprawnościowy --- (Fields optional unless glownyCel matches)
  obecnaAktywnosc: { type: String, enum: ['siedzacy', 'lekko_aktywny', 'umiarkowanie_aktywny', 'aktywny'] },
  srodowiskoTreningu: { type: String, enum: ['dom', 'silownia', 'zewnatrz'] },
  // dostepnySprzet: [{ type: String }], // Common field, see below
  // dniTreningowe: { type: [String], required: true, minlength: 1 }, // Common field, see below
  // czasTreningu: { type: Number, min: 0, max: 180 }, // Common field, see below
  celeDodatkowe: [{ type: String }], // Zod: optional()
  historiaProgramow: { type: Boolean },
  opisHistoriiProgramow: { type: String, trim: true }, // Required via Zod refine if historiaProgramow=true
  // ograniczeniaZdrowotne: { type: Boolean }, // Common field, required via Zod refine if true

  // --- SEKCJA 2D: Cel "Inny" --- (Fields optional unless glownyCel matches)
  opisCelu: { type: String, trim: true },
  dotychczasoweBariery: [{ type: String }], // Zod: optional()
  glownaMotywacja: [{ type: String }], // Zod: optional()
  // preferowaneAktywnosci: [{ type: String }], // Common field, see Sekcja 2A
  // dniTreningowe: { type: [String], required: true, minlength: 1 }, // Common field, see below
  // czasTreningu: { type: Number, min: 0, max: 180 }, // Common field, see below
  // ograniczeniaZdrowotne: { type: Boolean }, // Common field, see below

  // --- SEKCJA 3: Zdrowie i ograniczenia --- (Fields optional unless kontuzje=true or ograniczeniaZdrowotne=true or glownyCel matches)
  // chorobyPrzewlekle: [{ type: String }], // Already defined in 2A, but used conditionally here too
  hasPrzewlekleChorby: { type: Boolean, default: false }, // Note: Zod name was chorobyPrzewlekle, potentially ambiguous
  opisChorobPrzewleklych: { type: String, trim: true }, // Required via Zod refine if hasPrzewlekleChorby=true
  alergie: { type: Boolean, default: false },
  opisAlergii: { type: String, trim: true }, // Required via Zod refine if alergie=true
  lekiStale: { type: Boolean, default: false },
  opisLekowStalych: { type: String, trim: true }, // Required via Zod refine if lekiStale=true
  // kontuzje: { type: Boolean }, // Already defined in 2B
  opisKontuzji: { type: String, trim: true }, // Required via Zod refine if kontuzje=true
  lokalizacjaBolu: { type: String, trim: true },
  charakterBolu: { type: String, trim: true },
  skalaBolu: { type: Number, min: 0, max: 10 }, // Zod: optional()
  dataUrazu: { type: Date }, // Zod: optional()
  statusRehabilitacji: { type: String, enum: ['zakonczona', 'w_trakcie', 'niepodjeta', 'brak_potrzeby'] }, // Zod: optional()
  przebytePrzypadki: [{ type: String }], // Zod: optional()
  zaleceniaLekarza: { type: String, trim: true }, // Zod: optional()
  lekiWplywajaceNaWysilek: { type: String, trim: true }, // Zod: optional()
  ograniczeniaZdrowotne: { type: Boolean }, // Common field, required via Zod refine if true

  // --- SEKCJA 4: Technika ruchu / biegu --- (Fields optional unless poprawaTechnikiBiegu=true)
  kadencja: { type: String, enum: ['tak', 'nie'] },
  wartoscKadencji: { type: Number, min: 150, max: 220 }, // Zod: optional()
  sposobLadowania: { type: String, enum: ['srodstopie', 'piety', 'palce', 'nie_wiem'] },
  postawaTulowia: { type: String, enum: ['prosta', 'pochylona_przod', 'pochylona_tyl', 'nie_wiem'] },
  opisPostawyTulowia: { type: String, trim: true }, // Required via Zod refine if postawaTulowia is not 'prosta' or 'nie_wiem'
  pracaRak: { type: String, enum: ['prawidlowa', 'nadmierna', 'skrepowana', 'nie_wiem'] },
  opisPracyRamion: { type: String, trim: true }, // Required via Zod refine if pracaRak is not 'prawidlowa' or 'nie_wiem'
  stabilnoscBioder: { type: String, enum: ['dobra', 'slaba', 'nie_wiem'] },
  opisStabilnosci: { type: String, trim: true }, // Required via Zod refine if stabilnoscBioder is 'slaba'
  aspektyDoPoprawy: [{ type: String }], // Zod: optional()
  opisAspektowDoPoprawy: { type: String, trim: true }, // Required via Zod refine if aspektyDoPoprawy includes 'inne'

  // --- SEKCJA 5: Odżywianie i nawodnienie --- (Fields optional unless wsparcieDietetyczne=true or problemyZoladkowe='tak')
  ograniczeniaZywieniowe: [{ type: String }], // Zmieniono z String enum na Array
  opisOgraniczen: { type: String, trim: true }, // Required via Zod refine if ograniczeniaZywieniowe != 'brak'
  celeDietetyczne: [{ type: String }], // Zod: optional()
  problemyZoladkowe: { type: String, enum: ['tak', 'nie'] },
  opisProblemowZoladkowych: { type: String, trim: true }, // Required via Zod refine if problemyZoladkowe='tak'
  posilekPrzedTreningiem: [{ type: String }], // Zmieniono z String na Array
  czasPrzedTreningiem: { type: String, trim: true }, // Zod: optional() -- THIS IS THE FIELD CAUSING LINT ERROR!
  posilekPodczasTreningu: [{ type: String }], // Zmieniono z String na Array
  posilekPoTreningu: [{ type: String }], // Zmieniono z String na Array
  nawadnianie: { type: Number, min: 0, max: 10 }, // Zod: optional() Litry dziennie
  inneNapoje: [{ type: String }], // Zod: optional()

  // --- SEKCJA 6: Styl życia i dostępność --- (Fields generally required)
  godzinyAktywnosciOd: { type: String }, // Zod: optional() - Needs validation for time format
  godzinyAktywnosciDo: { type: String }, // Zod: optional() - Needs validation for time format
  godzinySnuOd: { type: String, required: true }, // Needs validation for time format
  godzinySnuDo: { type: String, required: true }, // Needs validation for time format
  drzemki: { type: Boolean },
  chronotyp: { type: String, required: true, enum: ['ranny_ptaszek', 'nocny_marek', 'posredni'] },
  dostepnySprzet: [{ type: String }], // Common field
  preferowanyCzasTreningu: { type: String, required: true, enum: ['rano', 'poludnie', 'wieczor', 'dowolnie'] },
  dniTreningowe: { type: [String], required: true, minlength: 1 }, // Common field
  czasTreningu: { type: Number, min: 0, max: 180 }, // Common field

  // --- SEKCJA 7: Psychologia i motywacja --- (Fields generally required)
  glownaBariera: { type: String, required: true, enum: ['brak_czasu', 'brak_motywacji', 'zmeczenie', 'brak_wsparcia', 'kontuzje', 'inne'] },
  opisBariery: { type: String, trim: true }, // Required via Zod refine if glownaBariera == 'inne'
  coMotywuje: [{ type: String }], // Zod: optional()
  opisMotywacji: { type: String, trim: true }, // Zod: optional()
  gotowoscDoWyzwan: { type: Number, min: 1, max: 10 }, // Zod: optional()
  formatWsparcia: [{ type: String }], // Zod: optional()
  przypomnienia: [{ type: String }], // Zod: optional()

  // --- SEKCJA 8: Zgody i zakończenie --- (Fields required)
  zgodaPrawdziwosc: { type: Boolean, required: true, default: true },
  zgodaPrzetwarzanieDanych: { type: Boolean, required: true, default: true },
  zgodaPowiadomienia: { type: Boolean, default: false }, // Domyślnie false, użytkownik może włączyć

  // --- Backend Fields ---
  userId: { type: String, required: true, index: true }, // Link to the user who submitted (Supabase uses UUIDs as strings)
  status: { type: String, enum: ['nowy', 'w_trakcie_generowania', 'wygenerowany', 'blad'], default: 'nowy', index: true },
  planId: { type: Schema.Types.ObjectId, ref: 'TrainingPlan' }, // Link to the generated plan

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// --- Virtuals ---
// Calculate BMI dynamically
trainingFormSubmissionSchema.virtual('bmi').get(function() {
  if (this.wzrost && this.masaCiala) {
    const heightInMeters = this.wzrost / 100;
    return parseFloat((this.masaCiala / (heightInMeters * heightInMeters)).toFixed(2));
  }
  return null;
});

// Ensure virtuals are included when converting to JSON
trainingFormSubmissionSchema.set('toJSON', { virtuals: true });
trainingFormSubmissionSchema.set('toObject', { virtuals: true });

// --- Indexes ---
trainingFormSubmissionSchema.index({ email: 1 }); // If email is reliably populated
trainingFormSubmissionSchema.index({ createdAt: -1 });

// --- Model Export ---
module.exports = mongoose.model('TrainingFormSubmission', trainingFormSubmissionSchema);