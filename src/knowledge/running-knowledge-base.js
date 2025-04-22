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
  }
};

module.exports = runningKnowledgeBase; 