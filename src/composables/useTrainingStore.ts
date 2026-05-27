import { computed, ref } from 'vue'
import { students } from '../mock/students'
import type { Student, TrainingReport, TrainingHistory } from '../mock/types'

const trainingReports = ref<TrainingReport[]>([])
const studentsData = ref<Student[]>(students.map((s) => ({ ...s })))

export function useTrainingStore() {
  const allStudents = computed(() => studentsData.value)

  function getStudent(studentId: number) {
    return studentsData.value.find((s) => s.id === studentId)
  }

  function getSkillDelta(improvement: string): number {
    const improvements: Record<string, number> = {
      'Без изменений': 0,
      'Немного лучше': 5,
      'Заметно лучше': 10,
      'Нужно повторить': 0,
    }
    return improvements[improvement] || 0
  }

  function createTrainingReport(report: Omit<TrainingReport, 'id' | 'createdAt'>) {
    const id = Date.now()
    const newReport: TrainingReport = {
      ...report,
      id,
      createdAt: Date.now(),
    }

    trainingReports.value.push(newReport)

    // Update student data based on report
    const student = getStudent(report.studentId)
    if (student) {
      // Increase completed trainings count
      student.completedTrainingsCount++

      // Add to training history
      const history: TrainingHistory = {
        id: Date.now(),
        date: report.date,
        duration: report.duration,
        theme: report.trainedSkills.join(', '),
        topics: report.trainedSkills,
        comment: report.instructorComment,
        improved: report.improved,
        hasVideo: false,
        mistakes: [],
        instructorComment: report.instructorComment,
        nextFocus: report.nextFocus,
        skillUpdates: {},
      }

      if (!student.trainingHistory) {
        student.trainingHistory = []
      }
      student.trainingHistory.unshift(history)

      // Update skills progress
      if (student.skills) {
        Object.entries(report.skillUpdates).forEach(([skillName, improvement]) => {
          const skill = student.skills!.find((s) => s.name === skillName)
          if (skill) {
            const delta = getSkillDelta(improvement)
            skill.value = Math.min(100, Math.max(0, skill.value + delta))
            skill.note = report.improved
          }
        })
      }

      // Update student notes
      student.notes = report.nextFocus

      // Update student focus
      student.focus = report.nextFocus

      // Update level if changed
      if (report.levelUpdate) {
        student.level = report.levelUpdate
      }
    }

    return newReport
  }

  function updateStudent(studentId: number, patch: Partial<Student>) {
    const student = getStudent(studentId)
    if (student) {
      Object.assign(student, patch)
    }
  }

  function getStudentTrainingHistory(studentId: number) {
    const student = getStudent(studentId)
    return student?.trainingHistory || []
  }

  function getStudentSkills(studentId: number) {
    const student = getStudent(studentId)
    return student?.skills || []
  }

  return {
    allStudents,
    createTrainingReport,
    getStudent,
    getStudentTrainingHistory,
    getStudentSkills,
    trainingReports: computed(() => trainingReports.value),
    updateStudent,
  }
}
