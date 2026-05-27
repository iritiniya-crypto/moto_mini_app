import type { Skill, AvailableSkill } from './types'

export const skills: Skill[] = [
  { id: 1, name: 'Медленная езда', value: 76, note: 'ровнее газ, меньше рывков' },
  { id: 2, name: 'Торможение', value: 64, note: 'добавить прогрессию переднего' },
  { id: 3, name: 'Взгляд в поворот', value: 72, note: 'лучше выходит на дуге' },
  { id: 4, name: 'Развороты', value: 58, note: 'тренировать корпус и баланс' },
  { id: 5, name: 'Работа сцеплением', value: 81, note: 'хороший контроль на малой скорости' },
]

export const availableSkills: AvailableSkill[] = [
  { id: 1, name: 'Овал' },
  { id: 2, name: 'Восьмерка' },
  { id: 3, name: 'Змейка' },
  { id: 4, name: 'Торможение' },
  { id: 5, name: 'Работа со сцеплением' },
  { id: 6, name: 'Медленная езда' },
  { id: 7, name: 'Развороты' },
  { id: 8, name: 'Взгляд в поворот' },
  { id: 9, name: 'Движение в городе' },
]
