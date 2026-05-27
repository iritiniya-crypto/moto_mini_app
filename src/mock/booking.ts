import type { BookingSlot } from './types'

export const standardLocations = [
  {
    name: 'Площадка Запад',
    locationUrl: 'https://maps.google.com/?q=Ploshchadka+Zapad',
  },
  {
    name: 'Серпантин',
    locationUrl: 'https://maps.google.com/?q=Serpantin+Nha+Trang',
  },
  {
    name: 'Город',
    locationUrl: 'https://maps.google.com/?q=Nha+Trang+city+center',
  },
]

export const bookingSlots: BookingSlot[] = [
  {
    id: 1,
    date: '28 мая',
    time: '18:30',
    duration: '90 мин',
    studentId: 1,
    preference: 'Площадка Запад',
    studentComment: 'Хочу повторить развороты и торможение.',
    finalLocation: 'Площадка Запад',
    finalLocationUrl: 'https://maps.google.com/?q=Ploshchadka+Zapad',
    instructorComment: 'Встречаемся у въезда на площадку, возьмите закрытую обувь.',
    status: 'confirmed',
  },
  {
    id: 2,
    date: '29 мая',
    time: '11:00',
    duration: '60 мин',
    status: 'available',
  },
  {
    id: 3,
    date: '30 мая',
    time: '16:00',
    duration: '90 мин',
    studentId: 3,
    preference: 'Серпантин',
    studentComment: 'Первый раз хочу попробовать серпантин.',
    status: 'requested',
  },
  {
    id: 5,
    date: '30 мая',
    time: '19:00',
    duration: '90 мин',
    status: 'available',
  },
  { id: 4, date: '1 июня', time: '19:00', duration: '60 мин', status: 'unavailable' },
]
