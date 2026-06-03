import {computed, ref} from 'vue'
import {packageToPayload, upsertStudentPackage as upsertStudentPackageApi} from '../api/packages'
import {skillsToPayload, updateStudentSkillsApi} from '../api/skills'
import {createManualTrainingHistory, manualTrainingToPayload} from '../api/trainingHistory'
import {createTrainingReportApi} from '../api/trainingReports'
import {createTrainingVideo} from '../api/videos'
import type {Student, TrainingHistory, TrainingPackage, TrainingReport} from '../mock/types'
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
        typeof response.report.id === 'string' ? response.report.id : undefined,
        typeof response.trainingHistory.id === 'string' ? response.trainingHistory.id : undefined,
      )
    } catch {
      return saveReportLocally(report)
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

    const nextStudent: Student = {
      id: studentId,
      name: patch.name || 'Ученик',
      status: patch.status || 'активный',
      level: patch.level || 'Новичок',
      completedTrainingsCount: patch.completedTrainingsCount || 0,
      nextLesson: patch.nextLesson || 'Время еще не выбрано',
      avatar: patch.avatar || '',
      focus: patch.focus || '',
      ...patch,
    }

    return nextStudent
  }

  async function updateStudentSkills(studentId: string, skills: Student['skills'], studentApiId?: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
    if (student && skills) {
      try {
        const payload = skillsToPayload(skills)
        if (studentApiId && payload.length > 0) {
          await updateStudentSkillsApi(studentApiId, payload)
        }
      } catch {
        // Keep current local behavior as fallback.
      }

      student.skills = skills.map((skill) => ({
        ...skill,
        value: Math.min(100, Math.max(0, Number(skill.oldValue) || 0)),
      }))
    }
  }

  async function addTrainingVideo(
    studentId: string,
    training: Pick<TrainingHistory, 'slotId' | 'date' | 'duration' | 'location' | 'theme' | 'topics'>,
    video: { title: string; url: string; comment: string },
    historyApiId?: string,
  ) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile
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

    try {
      if (historyApiId) {
        await createTrainingVideo(historyApiId, {
          title: video.title,
          telegramUrl: video.url,
          comment: video.comment,
        })
      }
    } catch {
      // Video remains visible locally if backend is unavailable.
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

    try {
      if (studentApiId) {
        const response = await createManualTrainingHistory(studentApiId, manualTrainingToPayload(history))
        history.apiId = typeof response.id === 'string' ? response.id : undefined

        if (training.videoUrl && history.apiId) {
          await createTrainingVideo(history.apiId, {
            title: 'Видео тренировки',
            telegramUrl: training.videoUrl,
            comment: training.improved,
          })
        }
      }
    } catch {
      // Manual history is kept locally when backend is unavailable.
    }

    student.trainingHistory.unshift(history)
    student.completedTrainingsCount++

    return history
  }

  async function upsertStudentPackage(studentId: string, trainingPackage: TrainingPackage, studentApiId?: string) {
    const userStore = useUserStore()
    await userStore.loadProfile(studentId)
    const student = userStore.profile

    if (!student) {
      return null
    }

    try {
      if (studentApiId) {
        await upsertStudentPackageApi(studentApiId, packageToPayload(trainingPackage))
      }
    } catch {
      // Package is intentionally manual, so local fallback is acceptable.
    }

    student.trainingPackage = trainingPackage
    return trainingPackage
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
