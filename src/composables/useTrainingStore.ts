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
        slotId: report.slotId,
        date: report.date,
        duration: report.duration,
        location: report.location,
        theme: report.trainedSkills.join(', '),
        topics: report.trainedSkills,
        comment: '',
        improved: report.improved,
        hasVideo: false,
        mistakes: [],
        nextFocus: report.nextFocus,
        skillUpdates: {},
      }

      if (!student.trainingHistory) {
        student.trainingHistory = []
      }
      const existingHistoryIndex = student.trainingHistory.findIndex((item) => item.slotId === report.slotId)
      if (existingHistoryIndex >= 0) {
        student.trainingHistory[existingHistoryIndex] = {
          ...student.trainingHistory[existingHistoryIndex],
          ...history,
          hasVideo: student.trainingHistory[existingHistoryIndex].hasVideo,
          videoTitle: student.trainingHistory[existingHistoryIndex].videoTitle,
          videoUrl: student.trainingHistory[existingHistoryIndex].videoUrl,
          videoComment: student.trainingHistory[existingHistoryIndex].videoComment,
        }
      } else {
        student.trainingHistory.unshift(history)
      }

      // Update skills progress
      if (student.skills) {
        Object.entries(report.skillUpdates).forEach(([skillName, improvement]) => {
          const skill = student.skills!.find((s) => s.name === skillName)
          if (skill) {
            const delta = getSkillDelta(improvement)
            skill.value = Math.min(100, Math.max(0, skill.value + delta))
          }
        })
      }

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

  function updateStudentSkills(studentId: number, skills: Student['skills']) {
    const student = getStudent(studentId)
    if (student && skills) {
      student.skills = skills.map((skill) => ({
        ...skill,
        value: Math.min(100, Math.max(0, Number(skill.value) || 0)),
      }))
    }
  }

  function addTrainingVideo(
    studentId: number,
    training: Pick<TrainingHistory, 'slotId' | 'date' | 'duration' | 'location' | 'theme' | 'topics'>,
    video: { title: string; url: string; comment: string },
  ) {
    const student = getStudent(studentId)
    if (!student) {
      return
    }

    if (!student.trainingHistory) {
      student.trainingHistory = []
    }

    const existingHistory = student.trainingHistory.find((item) => item.slotId === training.slotId)
    const videoPatch = {
      hasVideo: true,
      videoTitle: video.title,
      videoUrl: video.url,
      videoComment: video.comment,
    }

    if (existingHistory) {
      Object.assign(existingHistory, videoPatch)
      return
    }

    student.trainingHistory.unshift({
      id: Date.now(),
      slotId: training.slotId,
      date: training.date,
      duration: training.duration,
      location: training.location,
      theme: training.theme || 'Видео тренировки',
      topics: training.topics,
      comment: video.comment,
      improved: '',
      mistakes: [],
      ...videoPatch,
    })
  }

  function getStudentTrainingHistory(studentId: number) {
    const student = getStudent(studentId)
    return student?.trainingHistory || []
  }

  function getStudentSkills(studentId: number) {
    const student = getStudent(studentId)
    return student?.skills || []
  }

  function getStudentTrainingVideos(studentId: number) {
    return getStudentTrainingHistory(studentId).filter((history) => history.videoUrl)
  }

  return {
    addTrainingVideo,
    allStudents,
    createTrainingReport,
    getStudent,
    getStudentTrainingHistory,
    getStudentTrainingVideos,
    getStudentSkills,
    trainingReports: computed(() => trainingReports.value),
    updateStudentSkills,
    updateStudent,
  }
}
