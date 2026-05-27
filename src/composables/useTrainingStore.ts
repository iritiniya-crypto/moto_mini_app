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
    const student = getStudent(report.studentId)
    if (!student) {
      return null
    }

    const id = Date.now()
    const newReport: TrainingReport = {
      ...report,
      trainedSkills: [...report.trainedSkills],
      skillUpdates: { ...report.skillUpdates },
      id,
      createdAt: Date.now(),
    }

    trainingReports.value.push(newReport)

    if (!student.trainingHistory) {
      student.trainingHistory = []
    }

    const existingHistoryIndex = student.trainingHistory.findIndex((item) => item.slotId === report.slotId)

    if (existingHistoryIndex < 0) {
      student.completedTrainingsCount++
    }

    const history: TrainingHistory = {
      id: existingHistoryIndex >= 0 ? student.trainingHistory[existingHistoryIndex].id : Date.now(),
      slotId: report.slotId,
      date: report.date,
      duration: report.duration,
      location: report.location,
      theme: report.trainedSkills.join(', '),
      topics: [...report.trainedSkills],
      comment: '',
      improved: report.improved,
      hasVideo: false,
      mistakes: [],
      nextFocus: report.nextFocus,
      skillUpdates: {},
    }

    if (existingHistoryIndex >= 0) {
      const existingHistory = student.trainingHistory[existingHistoryIndex]
      student.trainingHistory[existingHistoryIndex] = {
        ...existingHistory,
        ...history,
        hasVideo: existingHistory.hasVideo,
        videoTitle: existingHistory.videoTitle,
        videoUrl: existingHistory.videoUrl,
        videoComment: existingHistory.videoComment,
      }
    } else {
      student.trainingHistory.unshift(history)
    }

    if (student.skills && existingHistoryIndex < 0) {
      Object.entries(report.skillUpdates).forEach(([skillName, improvement]) => {
        const skill = student.skills!.find((s) => s.name === skillName)
        if (skill) {
          const delta = getSkillDelta(improvement)
          skill.value = Math.min(100, Math.max(0, skill.value + delta))
        }
      })
    }

    if (report.levelUpdate) {
      student.level = report.levelUpdate
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

  function addManualTraining(
    studentId: number,
    training: Pick<TrainingHistory, 'date' | 'duration' | 'location' | 'topics' | 'improved' | 'nextFocus'> & {
      videoUrl?: string
    },
  ) {
    const student = getStudent(studentId)
    if (!student) {
      return null
    }

    if (!student.trainingHistory) {
      student.trainingHistory = []
    }

    const id = Date.now()
    const topics = training.topics.filter(Boolean)
    const history: TrainingHistory = {
      id,
      slotId: -id,
      date: training.date,
      duration: training.duration,
      location: training.location,
      theme: topics.join(', ') || 'Ручная тренировка',
      topics,
      comment: '',
      improved: training.improved,
      hasVideo: Boolean(training.videoUrl),
      mistakes: [],
      nextFocus: training.nextFocus,
      videoTitle: training.videoUrl ? 'Видео тренировки' : undefined,
      videoUrl: training.videoUrl || undefined,
      videoComment: training.videoUrl ? training.improved : undefined,
    }

    student.trainingHistory.unshift(history)
    student.completedTrainingsCount++

    return history
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
    addManualTraining,
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
