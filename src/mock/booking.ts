import type {BookingSlot} from './types'

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
    id: 101,
    date: '22 июня',
    time: '18:30',
    duration: '90 мин',
    studentId: 'asfasfa gfaosyifg liu',
    preference: 'Площадка Запад',
    finalLocation: 'Площадка Запад',
    finalLocationUrl: 'https://maps.google.com/?q=Ploshchadka+Zapad',
    instructorComment: 'Встречаемся у въезда на площадку, возьмите закрытую обувь.',
    status: 'confirmed',
  },
]
