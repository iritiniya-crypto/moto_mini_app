import type { Student } from './types'
import {skills} from "./skills.ts";
import { TEST_USER_ID } from '../api/client.ts';

export const students: Student[] = [
  {
    id: TEST_USER_ID,
    name: 'Алина Морозова',
    status: 'базовый контроль мотоцикла',
    level: 'Уверенный старт',
    completedTrainingsCount: 8,
    nextLesson: '28 мая, 18:30',
    avatar: 'АМ',
    focus: 'держать взгляд выше и мягче работать сцеплением',
    skills: [...skills],
    telegramUsername: '@alinamoro',
    trainingPackage: {
      total: 4,
      completed: 2,
      paymentStatus: 'оплачено',
    },
    trainingHistory: [],
  },
  {
    id: 2,
    name: 'Илья Ковалев',
    status: 'вход в поворот',
    level: 'Средний',
    completedTrainingsCount: 13,
    nextLesson: '29 мая, 11:00',
    avatar: 'ИК',
    focus: 'дозировать передний тормоз без зажима рук',
    skills: [...skills],
    telegramUsername: '@ilyakovalev',
    trainingPackage: {
      total: 3,
      completed: 1,
      paymentStatus: 'частично оплачено',
    },
    trainingHistory: [],
  },
  {
    id: 3,
    name: 'Мария Данилова',
    status: 'баланс и сцепление',
    level: 'Новичок',
    completedTrainingsCount: 4,
    nextLesson: '30 мая, 16:00',
    avatar: 'МД',
    focus: 'стабильная посадка и точка схватывания',
    skills: [...skills],
    telegramUsername: '@maria.dani',
    trainingPackage: {
      total: 4,
      completed: 0,
      paymentStatus: 'не оплачено',
    },
    trainingHistory: [],
  },
]
