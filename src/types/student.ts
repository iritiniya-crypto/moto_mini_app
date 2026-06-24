import type {Skill, StudentSkill} from './skill'
import type {ApiTrainingHistory, TrainingHistory, TrainingVideo} from './training'
import type {ApiTrainingPackage, TrainingPackage} from './package'
import type {User} from './user'

export type StudentLevel = 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export interface ApiStudent {
  id: string
  userId: string
  name: string
  telegramUsername: string
  level: StudentLevel
  focus?: string
  nextTrainingPlan?: string
  notes?: string
  createdAt: string
  updatedAt: string
  user: User
  packages: ApiTrainingPackage[]
  skills: StudentSkill[]
  historyCount?: number
  completedTrainingsCount?: number
  totalTrainings?: number
}

export interface ApiStudentProfile extends ApiStudent {
  trainingHistory: ApiTrainingHistory[]
  videos: TrainingVideo[]
}

export interface StudentInstructor {
  id: string
  firstName: string
  lastName: string
  telegramUsername?: string
  userId: string
  createdAt?: string
  updatedAt?: string
}

export type Student = {
  id: string
  apiId?: string
  createdAt?: string
  updatedAt?: string
  name: string
  status: string
  level: string
  completedTrainingsCount: number
  nextLesson: string
  avatar: string
  focus: string
  skills?: Skill[]
  trainingHistory?: TrainingHistory[]
  telegramUsername?: string
  trainingPackage?: TrainingPackage
  instructor?: StudentInstructor
}

export interface CreateStudentRequest {
  name: string
  telegramUsername?: string
  level: StudentLevel
  focus?: string
  nextTrainingPlan?: string
}

export interface UpdateStudentRequest {
  name?: string
  telegramUsername?: string
  level?: StudentLevel
  focus?: string
  nextTrainingPlan?: string
}
