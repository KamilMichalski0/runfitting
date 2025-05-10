/**
 * Knowledge Base for AI-Powered Running Training Plans
 * This file contains structured information about different types of running training
 * and their specific characteristics, requirements, and training approaches.
 */

const runningKnowledgeBase = {
  // Basic running distances and their characteristics
  distances: {
    '5k': {
      description: '5 kilometer race',
      focus: ['speed endurance', 'VO2max', 'lactate threshold'],
      keyTrainingTypes: ['interval training', 'tempo runs', 'easy runs'],
      typicalPlanLength: {
        beginner: '6-12 weeks',
        intermediate: '6-10 weeks',
        advanced: '6-16 weeks'
      },
      tapering: {
        duration: '7-10 days',
        volumeReduction: '20-50%'
      },
      trainingEmphasis: {
        beginner: ['building base mileage', 'developing running form', 'gradual progression'],
        intermediate: ['speed development', 'lactate threshold improvement', 'race-specific workouts'],
        advanced: ['VO2max optimization', 'race pace simulation', 'advanced interval training']
      }
    },
    '10k': {
      description: '10 kilometer race',
      focus: ['speed endurance', 'lactate threshold', 'aerobic capacity'],
      keyTrainingTypes: ['interval training', 'tempo runs', 'long runs', 'easy runs'],
      typicalPlanLength: {
        beginner: '8-12 weeks',
        intermediate: '8-12 weeks',
        advanced: '8-16 weeks'
      },
      tapering: {
        duration: '7-10 days',
        volumeReduction: '20-50%'
      },
      trainingEmphasis: {
        beginner: ['building endurance', 'developing pace awareness', 'gradual mileage increase'],
        intermediate: ['tempo runs', 'long intervals', 'progressive long runs'],
        advanced: ['race-specific workouts', 'advanced interval training', 'strength endurance']
      }
    },
    'halfMarathon': {
      description: '21.0975 kilometer race',
      focus: ['endurance', 'lactate threshold', 'aerobic capacity'],
      keyTrainingTypes: ['long runs', 'tempo runs', 'interval training', 'easy runs'],
      typicalPlanLength: {
        beginner: '12-16 weeks',
        intermediate: '10-16 weeks',
        advanced: '8-16 weeks'
      },
      tapering: {
        duration: '10-14 days',
        volumeReduction: '30-60%'
      },
      trainingEmphasis: {
        beginner: ['building long run endurance', 'developing pacing strategy', 'nutrition practice'],
        intermediate: ['tempo runs', 'progressive long runs', 'race simulation workouts'],
        advanced: ['advanced tempo runs', 'long intervals', 'strength endurance']
      }
    },
    'marathon': {
      description: '42.195 kilometer race',
      focus: ['endurance', 'fatigue resistance', 'aerobic capacity'],
      keyTrainingTypes: ['long runs', 'marathon pace runs', 'tempo runs', 'easy runs'],
      typicalPlanLength: {
        beginner: '16-30 weeks',
        intermediate: '16-20 weeks',
        advanced: '16-18 weeks'
      },
      tapering: {
        duration: '2-3 weeks',
        volumeReduction: '30-70%'
      },
      trainingEmphasis: {
        beginner: ['building long run endurance', 'developing pacing strategy', 'nutrition practice'],
        intermediate: ['marathon pace runs', 'progressive long runs', 'race simulation workouts'],
        advanced: ['advanced tempo runs', 'long intervals', 'strength endurance']
      }
    },
    'ultraMarathon': {
      description: 'Races longer than marathon distance',
      focus: ['ultra-endurance', 'fatigue resistance', 'terrain adaptation'],
      keyTrainingTypes: ['long runs', 'back-to-back long runs', 'trail running', 'hiking'],
      typicalPlanLength: {
        '50k': {
          beginner: '16-24 weeks',
          intermediate: '12-20 weeks',
          advanced: '8-16 weeks'
        },
        '50miles': {
          beginner: '20-24 weeks',
          intermediate: '16-20 weeks',
          advanced: '12-18 weeks'
        },
        '100k': {
          beginner: '24+ weeks',
          intermediate: '16-20+ weeks',
          advanced: '12-16+ weeks'
        },
        '100miles': {
          beginner: '24+ weeks',
          intermediate: '20+ weeks',
          advanced: '16+ weeks'
        }
      },
      tapering: {
        duration: '2-4 weeks',
        volumeReduction: '40-70%'
      },
      trainingEmphasis: {
        beginner: ['building time on feet', 'developing nutrition strategy', 'terrain adaptation'],
        intermediate: ['back-to-back long runs', 'night running practice', 'elevation training'],
        advanced: ['advanced terrain training', 'race simulation workouts', 'strength endurance']
      }
    }
  },

  // Training types and their characteristics
  trainingTypes: {
    'easyRun': {
      description: 'Conversational pace running',
      purpose: ['build aerobic base', 'recovery', 'fat metabolism'],
      intensity: '60-70% of max heart rate',
      duration: '30-90 minutes',
      physiologicalBenefits: [
        'improves cardiovascular efficiency',
        'enhances fat metabolism',
        'builds capillary density',
        'promotes recovery'
      ]
    },
    'tempoRun': {
      description: 'Comfortably hard continuous effort',
      purpose: ['improve lactate threshold', 'running economy', 'mental toughness'],
      intensity: '80-90% of max heart rate',
      duration: '20-60 minutes',
      physiologicalBenefits: [
        'raises lactate threshold',
        'improves running economy',
        'enhances mental toughness',
        'develops race-specific fitness'
      ]
    },
    'intervalTraining': {
      description: 'Alternating high-intensity running with recovery periods',
      purpose: ['improve VO2max', 'speed', 'power'],
      intensity: '90-100% of max heart rate',
      duration: '30-60 minutes total',
      physiologicalBenefits: [
        'increases VO2max',
        'improves running economy',
        'enhances anaerobic capacity',
        'develops speed and power'
      ]
    },
    'longRun': {
      description: 'Extended duration run at easy pace',
      purpose: ['build endurance', 'fatigue resistance', 'mental toughness'],
      intensity: '60-75% of max heart rate',
      duration: '60+ minutes',
      physiologicalBenefits: [
        'increases mitochondrial density',
        'enhances fat metabolism',
        'improves glycogen storage',
        'develops mental toughness'
      ]
    },
    'hillRepeats': {
      description: 'Repeated uphill running with recovery',
      purpose: ['build strength', 'power', 'running form'],
      intensity: '85-95% of max heart rate',
      duration: '30-45 minutes total',
      physiologicalBenefits: [
        'builds muscular strength',
        'improves running form',
        'enhances power output',
        'develops mental toughness'
      ]
    },
    'recoveryRun': {
      description: 'Very easy pace running',
      purpose: ['active recovery', 'reduce muscle soreness'],
      intensity: '50-60% of max heart rate',
      duration: '20-40 minutes',
      physiologicalBenefits: [
        'promotes blood flow',
        'reduces muscle stiffness',
        'enhances recovery',
        'maintains running form'
      ]
    }
  },

  // Training principles
  principles: {
    'SAID': {
      description: 'Specific Adaptations to Imposed Demands',
      explanation: 'The body adapts specifically to the type of stress placed upon it',
      application: [
        'train at race-specific intensities',
        'practice race-specific conditions',
        'develop race-specific skills'
      ]
    },
    'progressiveOverload': {
      description: 'Gradual increase in training stress',
      guidelines: [
        '10% weekly mileage increase',
        'gradual intensity progression',
        'progressive duration increase'
      ],
      monitoring: [
        'track weekly mileage',
        'monitor intensity levels',
        'assess recovery status'
      ]
    },
    'variation': {
      description: 'Different types of training stimuli',
      importance: [
        'prevent plateaus',
        'promote adaptation',
        'reduce injury risk'
      ],
      implementation: [
        'vary training types',
        'alternate intensity levels',
        'change training surfaces'
      ]
    },
    'recovery': {
      description: 'Rest and regeneration',
      importance: [
        'muscle repair',
        'energy restoration',
        'prevent overtraining'
      ],
      strategies: [
        'adequate sleep',
        'proper nutrition',
        'active recovery',
        'rest days'
      ]
    }
  },

  // Training phases
  phases: {
    'base': {
      focus: ['aerobic foundation', 'general fitness'],
      duration: '4-8 weeks',
      keyComponents: ['easy runs', 'long runs', 'strength training'],
      progression: [
        'gradual mileage increase',
        'focus on form',
        'build aerobic capacity'
      ]
    },
    'build': {
      focus: ['specific race preparation', 'increased intensity'],
      duration: '4-8 weeks',
      keyComponents: ['tempo runs', 'interval training', 'long runs'],
      progression: [
        'increase intensity',
        'develop race-specific fitness',
        'practice race conditions'
      ]
    },
    'peak': {
      focus: ['race-specific preparation', 'optimization'],
      duration: '2-4 weeks',
      keyComponents: ['race pace workouts', 'tapering'],
      progression: [
        'fine-tune race pace',
        'optimize recovery',
        'prepare mentally'
      ]
    },
    'taper': {
      focus: ['recovery', 'energy restoration'],
      duration: '1-3 weeks',
      keyComponents: ['reduced volume', 'maintained intensity'],
      progression: [
        'reduce volume gradually',
        'maintain intensity',
        'focus on recovery'
      ]
    }
  },

  // Physiological parameters
  physiological: {
    'heartRateZones': {
      zone1: {
        description: 'Very light',
        percentage: '50-60%',
        purpose: 'recovery, warm-up'
      },
      zone2: {
        description: 'Light',
        percentage: '60-70%',
        purpose: 'aerobic base building'
      },
      zone3: {
        description: 'Moderate',
        percentage: '70-80%',
        purpose: 'aerobic capacity'
      },
      zone4: {
        description: 'Hard',
        percentage: '80-90%',
        purpose: 'lactate threshold'
      },
      zone5: {
        description: 'Maximum',
        percentage: '90-100%',
        purpose: 'VO2max'
      }
    },
    'VO2max': {
      description: 'Maximum oxygen uptake',
      importance: [
        'indicator of aerobic fitness',
        'predictor of performance',
        'training adaptation marker'
      ],
      improvement: [
        'high-intensity interval training',
        'tempo runs',
        'progressive overload'
      ]
    },
    'lactateThreshold': {
      description: 'Exercise intensity at which lactate begins to accumulate',
      importance: [
        'predictor of endurance performance',
        'indicator of training adaptation',
        'guide for training intensity'
      ],
      improvement: [
        'tempo runs',
        'interval training',
        'progressive overload'
      ]
    }
  },

  // Injury prevention
  injuryPrevention: {
    'commonInjuries': {
      'runnersKnee': {
        description: 'Pain around the kneecap',
        prevention: [
          'strengthen quadriceps',
          'improve running form',
          'gradual mileage increase'
        ]
      },
      'shinSplints': {
        description: 'Pain along the shin bone',
        prevention: [
          'strengthen lower legs',
          'gradual mileage increase',
          'proper footwear'
        ]
      },
      'itbSyndrome': {
        description: 'Pain on the outside of the knee',
        prevention: [
          'strengthen hips',
          'improve running form',
          'proper stretching'
        ]
      }
    },
    'preventionStrategies': {
      'strengthTraining': {
        focus: [
          'core strength',
          'hip strength',
          'leg strength'
        ],
        frequency: '2-3 times per week'
      },
      'mobility': {
        focus: [
          'hip mobility',
          'ankle mobility',
          'thoracic spine mobility'
        ],
        frequency: 'daily'
      },
      'recovery': {
        focus: [
          'adequate sleep',
          'proper nutrition',
          'active recovery'
        ],
        importance: 'critical for injury prevention'
      }
    }
  },

  // Nutrition guidelines
  nutrition: {
    'preRun': {
      timing: '2-3 hours before long runs, 30-60 minutes before short runs',
      focus: ['carbohydrates', 'moderate protein', 'low fat/fiber'],
      examples: ['bananas', 'oatmeal', 'toast', 'sports drinks'],
      guidelines: [
        'focus on easily digestible foods',
        'avoid high-fiber foods',
        'include some protein',
        'stay hydrated'
      ]
    },
    'duringRun': {
      timing: 'Every 30-45 minutes for runs >60 minutes',
      focus: ['carbohydrates', 'electrolytes', 'fluids'],
      examples: ['sports drinks', 'energy gels', 'chews'],
      guidelines: [
        '30-60g carbohydrates per hour',
        '500-1000mg sodium per hour',
        '400-800ml fluids per hour'
      ]
    },
    'postRun': {
      timing: 'Within 30-60 minutes',
      focus: ['carbohydrates', 'protein', 'fluids'],
      examples: ['chocolate milk', 'smoothies', 'yogurt with granola'],
      guidelines: [
        '1.2g carbohydrates per kg body weight',
        '0.3g protein per kg body weight',
        'replenish fluids and electrolytes'
      ]
    }
  },

  // Hydration guidelines
  hydration: {
    'preRun': {
      timing: '2-3 hours before',
      amount: '500-750ml',
      focus: ['water', 'electrolytes'],
      guidelines: [
        'drink to thirst',
        'include electrolytes if sweating heavily',
        'avoid overhydration'
      ]
    },
    'duringRun': {
      timing: 'Every 15-20 minutes',
      amount: '150-250ml',
      focus: ['water', 'electrolytes', 'carbohydrates'],
      guidelines: [
        'drink to thirst',
        'include electrolytes for runs >60 minutes',
        'add carbohydrates for runs >90 minutes'
      ]
    },
    'postRun': {
      timing: 'Immediately after',
      amount: '450-675ml per 0.5kg lost',
      focus: ['water', 'electrolytes', 'carbohydrates'],
      guidelines: [
        'weigh before and after to determine fluid loss',
        'include electrolytes',
        'include carbohydrates for glycogen replenishment'
      ]
    }
  },

  // Complementary exercises for runners
  complementaryExercises: {
    lowerBodyStrength: {
      description: 'Exercises targeting lower body muscles essential for running',
      exercises: {
        squats: {
          description: 'Basic squat movement',
          technique: 'Stand with feet shoulder-width apart, lower hips back and down as if sitting in a chair',
          variations: ['sumo squats', 'bulgarian split squats', 'single-leg squats'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
          progression: ['bodyweight', 'dumbbells', 'barbell', 'increased depth'],
          intensity: 'moderate to high',
          benefits: ['builds functional strength', 'improves joint range of motion', 'corrects muscle imbalances']
        },
        lunges: {
          description: 'Forward stepping movement',
          technique: 'Step forward, lower body until both knees are at 90 degrees, return to start',
          variations: ['reverse lunges', 'walking lunges', 'bulgarian lunges'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
          progression: ['bodyweight', 'dumbbells', 'barbell', 'increased range'],
          intensity: 'moderate',
          benefits: ['improves balance', 'enhances coordination', 'builds unilateral strength']
        },
        deadlifts: {
          description: 'Hip hinge movement',
          technique: 'Stand with feet hip-width apart, hinge at hips while keeping back straight',
          variations: ['romanian deadlifts', 'single-leg deadlifts'],
          targetMuscles: ['glutes', 'hamstrings', 'lower back', 'core'],
          progression: ['bodyweight', 'dumbbells', 'barbell', 'increased weight'],
          intensity: 'high',
          benefits: ['strengthens posterior chain', 'improves running power', 'prevents injuries']
        },
        calfRaises: {
          description: 'Ankle plantar flexion movement',
          technique: 'Stand on edge of step, raise heels up and lower down',
          variations: ['single-leg calf raises', 'weighted calf raises'],
          targetMuscles: ['gastrocnemius', 'soleus'],
          progression: ['bodyweight', 'dumbbells', 'increased reps'],
          intensity: 'moderate',
          benefits: ['improves push-off power', 'prevents lower leg injuries']
        }
      }
    },
    coreStrength: {
      description: 'Exercises targeting core muscles for stability and power transfer',
      exercises: {
        plank: {
          description: 'Static core hold',
          technique: 'Hold push-up position on forearms, maintain straight body line',
          variations: ['side plank', 'plank with leg lift', 'plank with arm reach'],
          targetMuscles: ['rectus abdominis', 'obliques', 'transverse abdominis'],
          progression: ['time duration', 'added movements', 'unstable surface'],
          intensity: 'moderate',
          benefits: ['improves core stability', 'enhances posture', 'prevents back pain']
        },
        birdDog: {
          description: 'Dynamic core stabilization',
          technique: 'On hands and knees, extend opposite arm and leg while maintaining balance',
          variations: ['with resistance band', 'with weight'],
          targetMuscles: ['core', 'lower back', 'glutes'],
          progression: ['time duration', 'added resistance', 'increased range'],
          intensity: 'low to moderate',
          benefits: ['improves balance', 'enhances coordination', 'strengthens core']
        }
      }
    },
    plyometric: {
      description: 'Explosive movements to develop power and speed',
      exercises: {
        squatJumps: {
          description: 'Explosive vertical jump from squat position',
          technique: 'Squat down then explosively jump upward, land softly',
          variations: ['box jumps', 'depth jumps'],
          targetMuscles: ['quadriceps', 'glutes', 'calves'],
          progression: ['height of jump', 'number of reps', 'added weight'],
          intensity: 'high',
          benefits: ['develops explosive power', 'improves running economy']
        },
        bounding: {
          description: 'Exaggerated running strides',
          technique: 'Perform exaggerated running steps with focus on height and distance',
          variations: ['single-leg bounds', 'lateral bounds'],
          targetMuscles: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
          progression: ['distance', 'height', 'speed'],
          intensity: 'high',
          benefits: ['improves stride length', 'develops power', 'enhances running form']
        }
      }
    },
    mobility: {
      description: 'Exercises to improve joint range of motion and flexibility',
      exercises: {
        legSwings: {
          description: 'Dynamic hip mobility',
          technique: 'Swing leg forward and backward, then side to side',
          variations: ['with resistance band', 'increased range'],
          targetMuscles: ['hip flexors', 'hamstrings', 'adductors'],
          progression: ['range of motion', 'speed', 'added resistance'],
          intensity: 'low',
          benefits: ['improves hip mobility', 'reduces injury risk', 'enhances stride']
        },
        hipOpeners: {
          description: 'Hip joint mobility exercises',
          technique: 'Various movements to increase hip range of motion',
          variations: ['figure four stretch', 'pigeon pose', 'lizard pose'],
          targetMuscles: ['hip rotators', 'glutes', 'adductors'],
          progression: ['hold duration', 'depth of stretch'],
          intensity: 'low',
          benefits: ['improves hip flexibility', 'reduces tightness', 'enhances running form']
        }
      }
    },
    balance: {
      description: 'Exercises to improve stability and proprioception',
      exercises: {
        singleLegBalance: {
          description: 'Static balance on one leg',
          technique: 'Stand on one leg, maintain balance',
          variations: ['eyes closed', 'on unstable surface', 'with movement'],
          targetMuscles: ['ankle stabilizers', 'core', 'hip stabilizers'],
          progression: ['duration', 'surface difficulty', 'added movement'],
          intensity: 'low to moderate',
          benefits: ['improves balance', 'enhances proprioception', 'prevents ankle injuries']
        },
        dynamicBalance: {
          description: 'Balance exercises with movement',
          technique: 'Perform movements while maintaining balance on one leg',
          variations: ['single leg squats', 'single leg deadlifts'],
          targetMuscles: ['ankle stabilizers', 'core', 'hip stabilizers'],
          progression: ['movement complexity', 'added resistance'],
          intensity: 'moderate',
          benefits: ['improves dynamic stability', 'enhances running form']
        }
      }
    },
    correctiveExercises: {
      description: 'Exercises designed to address specific running-related injuries and imbalances',
      categories: {
        strengthAndActivation: {
          description: 'Exercises focusing on muscle strengthening and activation',
          exercises: {
            gluteActivation: {
              description: 'Exercises to improve gluteal muscle activation and strength',
              technique: 'Focus on proper form and mind-muscle connection',
              variations: ['glute bridges', 'clamshells', 'fire hydrants', 'donkey kicks'],
              targetMuscles: ['gluteus maximus', 'gluteus medius', 'gluteus minimus'],
              progression: ['bodyweight', 'resistance bands', 'added weight'],
              intensity: 'moderate',
              benefits: ['improves hip stability', 'reduces knee pain', 'enhances running form']
            },
            coreStability: {
              description: 'Exercises to improve core stability and control',
              technique: 'Maintain neutral spine position throughout movement',
              variations: ['dead bugs', 'bird dogs', 'pallof presses', 'anti-rotation exercises'],
              targetMuscles: ['transverse abdominis', 'multifidus', 'obliques'],
              progression: ['static holds', 'dynamic movements', 'added resistance'],
              intensity: 'moderate',
              benefits: ['improves posture', 'reduces back pain', 'enhances running efficiency']
            },
            hipStability: {
              description: 'Exercises to improve hip stability and control',
              technique: 'Focus on controlled movement and proper alignment',
              variations: ['single leg balance', 'hip airplanes', 'monster walks', 'lateral band walks'],
              targetMuscles: ['hip abductors', 'hip external rotators', 'hip stabilizers'],
              progression: ['bodyweight', 'resistance bands', 'unstable surface'],
              intensity: 'moderate',
              benefits: ['reduces IT band issues', 'improves running form', 'prevents knee pain']
            }
          }
        },
        stabilization: {
          description: 'Exercises focusing on joint stability and control',
          exercises: {
            ankleStability: {
              description: 'Exercises to improve ankle stability and control',
              technique: 'Maintain proper alignment and controlled movement',
              variations: ['single leg balance', 'ankle circles', 'alphabet writing', 'heel-toe walks'],
              targetMuscles: ['ankle stabilizers', 'intrinsic foot muscles'],
              progression: ['stable surface', 'unstable surface', 'eyes closed'],
              intensity: 'low to moderate',
              benefits: ['reduces ankle sprains', 'improves balance', 'enhances running form']
            },
            kneeStability: {
              description: 'Exercises to improve knee stability and control',
              technique: 'Focus on proper alignment and controlled movement',
              variations: ['step-ups', 'step-downs', 'wall slides', 'terminal knee extensions'],
              targetMuscles: ['quadriceps', 'hamstrings', 'VMO'],
              progression: ['bodyweight', 'added resistance', 'unstable surface'],
              intensity: 'moderate',
              benefits: ['reduces knee pain', 'improves running form', 'prevents injuries']
            }
          }
        },
        mobility: {
          description: 'Exercises focusing on joint mobility and flexibility',
          exercises: {
            hipMobility: {
              description: 'Exercises to improve hip mobility and range of motion',
              technique: 'Focus on controlled movement and proper breathing',
              variations: ['hip circles', 'leg swings', 'hip openers', 'pigeon pose'],
              targetMuscles: ['hip flexors', 'hip rotators', 'adductors'],
              progression: ['dynamic', 'static holds', 'added resistance'],
              intensity: 'low to moderate',
              benefits: ['improves running stride', 'reduces hip pain', 'enhances flexibility']
            },
            ankleMobility: {
              description: 'Exercises to improve ankle mobility and range of motion',
              technique: 'Maintain proper alignment and controlled movement',
              variations: ['ankle dorsiflexion', 'ankle plantarflexion', 'calf stretches', 'ankle circles'],
              targetMuscles: ['calf muscles', 'ankle stabilizers'],
              progression: ['bodyweight', 'added resistance', 'dynamic movements'],
              intensity: 'low',
              benefits: ['improves running form', 'reduces calf tightness', 'prevents injuries']
            }
          }
        },
        stretching: {
          description: 'Exercises focusing on muscle flexibility and length',
          exercises: {
            dynamicStretching: {
              description: 'Dynamic stretching exercises for warm-up',
              technique: 'Perform controlled movements through full range of motion',
              variations: ['leg swings', 'arm circles', 'hip circles', 'ankle mobility'],
              targetMuscles: ['major muscle groups'],
              progression: ['small range', 'full range', 'added resistance'],
              intensity: 'low',
              benefits: ['improves mobility', 'reduces injury risk', 'enhances performance']
            },
            staticStretching: {
              description: 'Static stretching exercises for cool-down',
              technique: 'Hold stretches for 20-30 seconds with proper breathing',
              variations: ['calf stretches', 'hamstring stretches', 'quad stretches', 'hip flexor stretches'],
              targetMuscles: ['major muscle groups'],
              progression: ['short holds', 'longer holds', 'deeper stretches'],
              intensity: 'low',
              benefits: ['improves flexibility', 'reduces muscle tightness', 'enhances recovery']
            }
          }
        },
        selfRelaxation: {
          description: 'Techniques for muscle relaxation and recovery',
          exercises: {
            foamRolling: {
              description: 'Self-myofascial release using foam roller',
              technique: 'Roll slowly over tight areas, pausing on tender spots',
              variations: ['calf rolling', 'IT band rolling', 'quad rolling', 'glute rolling'],
              targetMuscles: ['major muscle groups'],
              progression: ['soft roller', 'firm roller', 'textured roller'],
              intensity: 'low to moderate',
              benefits: ['reduces muscle tightness', 'improves recovery', 'enhances mobility']
            },
            massage: {
              description: 'Self-massage techniques for muscle recovery',
              technique: 'Apply pressure to tight areas using hands or tools',
              variations: ['calf massage', 'foot massage', 'glute massage', 'hamstring massage'],
              targetMuscles: ['major muscle groups'],
              progression: ['light pressure', 'moderate pressure', 'deep pressure'],
              intensity: 'low to moderate',
              benefits: ['reduces muscle tension', 'improves recovery', 'enhances flexibility']
            }
          }
        }
      },
      recommendations: {
        beginner: {
          frequency: '2-3 times per week',
          focus: ['basic strength', 'mobility', 'stretching'],
          progression: 'Start with basic exercises and gradually increase complexity'
        },
        intermediate: {
          frequency: '3-4 times per week',
          focus: ['strength', 'stability', 'mobility', 'stretching'],
          progression: 'Add resistance and complexity to exercises'
        },
        advanced: {
          frequency: '4-5 times per week',
          focus: ['advanced strength', 'stability', 'mobility', 'stretching', 'self-relaxation'],
          progression: 'Combine exercises and add advanced variations'
        }
      },
      injurySpecific: {
        runnersKnee: {
          focus: ['quadriceps strength', 'hip stability', 'IT band mobility'],
          exercises: ['step-downs', 'clamshells', 'IT band rolling', 'quad stretches']
        },
        shinSplints: {
          focus: ['calf strength', 'ankle stability', 'foot mobility'],
          exercises: ['calf raises', 'ankle mobility', 'foot strengthening', 'calf stretches']
        },
        plantarFasciitis: {
          focus: ['foot strength', 'calf flexibility', 'arch support'],
          exercises: ['foot rolling', 'calf stretches', 'towel curls', 'arch strengthening']
        },
        itbSyndrome: {
          focus: ['hip stability', 'glute strength', 'IT band mobility'],
          exercises: ['clamshells', 'hip airplanes', 'IT band rolling', 'glute bridges']
        }
      }
    }
  },

  // Exercise frequency recommendations
  exerciseFrequency: {
    beginner: {
      lowerBodyStrength: '1-2 times/week',
      coreStrength: '2 times/week',
      plyometric: 'none',
      mobility: 'daily',
      balance: '2-3 times/week'
    },
    intermediate: {
      lowerBodyStrength: '2 times/week',
      coreStrength: '2-3 times/week',
      plyometric: '1 time/week',
      mobility: 'daily',
      balance: '3 times/week'
    },
    advanced: {
      lowerBodyStrength: '2-3 times/week',
      coreStrength: '3 times/week',
      plyometric: '1-2 times/week',
      mobility: 'daily',
      balance: '3-4 times/week'
    }
  },

  // Exercise progression guidelines
  exerciseProgression: {
    principles: [
      'Master technique before increasing intensity',
      'Progress gradually in small increments',
      'Maintain proper form throughout progression',
      'Allow adequate recovery between sessions',
      'Listen to body signals and adjust accordingly'
    ],
    progressionFactors: {
      intensity: ['bodyweight', 'added resistance', 'increased range of motion'],
      volume: ['repetitions', 'sets', 'duration'],
      complexity: ['basic movement', 'variations', 'combined movements'],
      stability: ['stable surface', 'unstable surface', 'dynamic movements']
    }
  }
};

module.exports = runningKnowledgeBase; 