export type TrainingPackagePaymentStatus = 'unpaid' | 'paid' | 'partial'
export type TrainingPackageStatus = 'active' | 'completed' | 'cancelled'
export type TrainingPackageName = 'Скутер' | 'Мотоцикл' | 'Джимхана'

export type PaymentStatus = 'оплачено' | 'не оплачено' | 'частично оплачено'

export interface ApiTrainingPackage {
  id: string
  studentId: string
  totalTrainings: number
  completedTrainings: number
  paymentStatus: TrainingPackagePaymentStatus
  startedAt: string
  endedAt: string
  isActive: boolean
  name?: TrainingPackageName
  createdAt: string
  updatedAt: string
}

export type TrainingPackage = {
  name?: TrainingPackageName
  total: number
  completed: number
  paymentStatus: PaymentStatus
  startedAt?: string
  endedAt?: string
  isActive?: boolean
}

export interface UpsertTrainingPackageRequest {
  name?: TrainingPackageName
  totalTrainings: number
  completedTrainings: number
  paymentStatus: TrainingPackagePaymentStatus
  startedAt?: string
  endedAt?: string
  isActive: boolean
}
