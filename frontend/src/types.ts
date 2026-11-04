export interface UserShort {
  id: number
  username: string
}

export interface User {
  id: number
  username: string
  email: string
  city: string | null
  about: string | null
  created_at: string
}

export interface UserPublic {
  id: number
  username: string
  city: string | null
  about: string | null
  created_at: string
  walks_count: number
  followers_count: number
  is_subscribed: boolean
}

export interface Walk {
  id: number
  title: string
  description: string
  category: string
  city: string
  address: string
  latitude: number
  longitude: number
  start_time: string
  max_participants: number
  organizer: UserShort
  participants_count: number
  is_joined: boolean
  created_at: string
}

export interface WalkInput {
  title: string
  description: string
  category: string
  city: string
  address: string
  latitude: number
  longitude: number
  start_time: string
  max_participants: number
}

export interface WalkComment {
  id: number
  text: string
  walk_id: number
  author: UserShort
  created_at: string
}

export interface Filters {
  q: string
  city: string
  category: string
  date_from: string
}
