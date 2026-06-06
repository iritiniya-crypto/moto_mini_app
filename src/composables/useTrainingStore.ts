import {computed, ref} from 'vue'
import {
  normalizeTrainingPackage,
  packageToPayload,
  upsertStudentPackage as upsertStudentPackageApi
} from '../api/packages'
import {normalizeSkillDefinitions, skillsToPayload, updateStudentSkillsApi} from '../api/skills'
import {createManualTrainingHistory, manualTrainingToPayload} from '../api/trainingHistory'
import {createTrainingReportApi} from '../api/trainingReports'
import {createTrainingVideo} from '../api/videos'
import type {Student} from '../types/student'
import type {TrainingHistory, TrainingReport} from '../types/training'
import type {TrainingPackage} from '../types/package'
import {useUserStore} from "@/stores/userStore.ts";

const trainingReports = ref<TrainingReport[]>([])

export function useTrainingStore() {
  async function saveReportLocally(report: Omit<TrainingReport, 'id' | 'createdAt'>, apiId?: string, historyApiId?: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(report.studentId)
    const student = userStore.profile
    if (!student) {
      return null
    }

    const id = Date.now()
    const newReport: TrainingReport = {
      ...report,
      trainedSkills: [...report.trainedSkills],
      skillUpdates: { ...report.skillUpdates },
      id,
      apiId,
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
      apiId: historyApiId,
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

    if (report.levelUpdate) {
      student.level = report.levelUpdate
    }

    return newReport
  }

  async function createTrainingReport(
    report: Omit<TrainingReport, 'id' | 'createdAt'>,
    options: { slotApiId?: string; studentApiId?: string } = {},
  ) {
    try {
      if (!options.slotApiId || !options.studentApiId) {
        throw new Error('Report has no backend ids')
      }

      const response = await createTrainingReportApi({
        slotId: options.slotApiId,
        studentId: options.studentApiId,
        trainedSkills: report.trainedSkills,
        improved: report.improved,
        nextFocus: report.nextFocus,
        levelUpdate: report.levelUpdate,
      })

      return saveReportLocally(
        report,
        response.report.id,
        response.trainingHistory.id,
      )
    } catch {
      return null
    }
  }

  async function updateStudent(studentId: string, patch: Partial<Student>) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
    if (student) {
      Object.assign(student, patch)
      return student
    }

    return null
  }

  async function updateStudentSkills(studentId: string, skills: Student['skills'], studentApiId?: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
    if (!student || !skills || !studentApiId) {
      return
    }

    try {
      const payload = skillsToPayload(skills)
      const response = await updateStudentSkillsApi(studentApiId, payload)
      student.skills = normalizeSkillDefinitions(response)
    } catch {
      // Keep the last backend-confirmed state.
    }
  }

  async function addTrainingVideo(
    studentId: string,
    training: Pick<TrainingHistory, 'slotId' | 'date' | 'duration' | 'location' | 'theme' | 'topics'>,
    video: { title: string; url: string; comment: string },
    historyApiId?: string,
  ) {
    void training
    const userStore = useUserStore()
    if (!historyApiId) {
      return
    }

    try {
      await createTrainingVideo(historyApiId, {
        title: video.title,
        telegramUrl: video.url,
        comment: video.comment,
      })
      await userStore.loadProfile(studentId)
    } catch {
      // Keep the last backend-confirmed state.
    }
  }

  async function addManualTraining(
    studentId: string,
    training: Pick<TrainingHistory, 'date' | 'duration' | 'location' | 'topics' | 'improved' | 'nextFocus'> & {
      videoUrl?: string
    },
    studentApiId?: string,
  ) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
    if (!student || !studentApiId) {
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

    try {
      const response = await createManualTrainingHistory(studentApiId, manualTrainingToPayload(history))
      history.apiId = typeof response.id === 'string' ? response.id : undefined

      if (training.videoUrl && history.apiId) {
        try {
          await createTrainingVideo(history.apiId, {
            title: 'Видео тренировки',
            telegramUrl: training.videoUrl,
            comment: training.improved,
          })
          history.hasVideo = true
          history.videoTitle = 'Видео тренировки'
          history.videoUrl = training.videoUrl
          history.videoComment = training.improved
        } catch {
          history.hasVideo = false
          history.videoTitle = undefined
          history.videoUrl = undefined
          history.videoComment = undefined
        }
      }

      student.trainingHistory.unshift(history)
      student.completedTrainingsCount++
      return history
    } catch {
      return null
    }
  }

  async function upsertStudentPackage(studentId: string, trainingPackage: TrainingPackage, studentApiId?: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile

    if (!student || !studentApiId) {
      return null
    }

    try {
      const response = await upsertStudentPackageApi(studentApiId, packageToPayload(trainingPackage))
      const savedPackage = normalizeTrainingPackage(response) ?? trainingPackage
      student.trainingPackage = savedPackage
      return savedPackage
    } catch {
      return null
    }
  }

  async function getStudentTrainingHistory(studentId: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
    return student?.trainingHistory || []
  }

  async function getStudentSkills(studentId: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
    return student?.skills || []
  }

  async function getStudentTrainingVideos(studentId: string) {
    return (await getStudentTrainingHistory(studentId)).filter((history) => history.videoUrl)
  }

  return {
    addManualTraining,
    addTrainingVideo,
    createTrainingReport,
    getStudentTrainingHistory,
    getStudentTrainingVideos,
    getStudentSkills,
    trainingReports: computed(() => trainingReports.value),
    upsertStudentPackage,
    updateStudentSkills,
    updateStudent,
  }
}
