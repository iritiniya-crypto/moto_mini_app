import type {Student} from '@/types/student'
import type {TrainingPackageName} from '@/types/package'

const STORAGE_KEY = 'moto-training-package-names'

export const trainingPackageNameOptions: TrainingPackageName[] = ['Скутер', 'Мотоцикл', 'Джимхана']

function readPackageNames() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, TrainingPackageName>
  } catch {
    return {}
  }
}

export function getStoredPackageName(studentId?: string) {
  if (!studentId) {
    return undefined
  }

  return readPackageNames()[studentId]
}

export function setStoredPackageName(studentId: string, name: TrainingPackageName) {
  if (typeof window === 'undefined') {
    return
  }

  const names = readPackageNames()
  names[studentId] = name
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
}

export function packageNameForStudent(student?: Student | null): TrainingPackageName {
  return (
    student?.trainingPackage?.name ||
    getStoredPackageName(student?.apiId) ||
    getStoredPackageName(student?.id) ||
    'Скутер'
  )
}

