export type TrainingPackagePaymentStatus = 'unpaid' | 'paid' | 'partial'
export type TrainingPackageStatus = 'active' | 'completed' | 'cancelled'

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
  createdAt: string
  updatedAt: string
}

export type TrainingPackage = {
  total: number
  completed: number
  paymentStatus: PaymentStatus
  startedAt?: string
  endedAt?: string
  isActive?: boolean
}

export interface UpsertTrainingPackageRequest {
  totalTrainings: number
  completedTrainings: number
  paymentStatus: TrainingPackagePaymentStatus
  startedAt?: string
  endedAt?: string
  isActive: boolean
}
