export const HABIT_CATEGORIES = [
  { value: 'smoking', label: 'Smoking and nicotine' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'substances', label: 'Other substances' },
  { value: 'behavioral', label: 'Behavioral habits (gaming, phone, gambling)' },
  { value: 'other', label: 'Other habit' },
]
export const RESOURCE_CATEGORIES = [
  'Smoking and nicotine cessation', 'Alcohol recovery', 'Substance-use education and recovery', 'Craving management',
  'Trigger management', 'Mindfulness and meditation', 'Stress management', 'Healthy habits', 'Relapse prevention',
  'Motivation and recovery stories', 'Sleep and lifestyle', 'Support for friends and family', 'Professional help and treatment education',
]
// Maps a habit category to resource categories for recommendations
export const CATEGORY_RESOURCE_MAP = {
  smoking: ['Smoking and nicotine cessation', 'Craving management'],
  alcohol: ['Alcohol recovery', 'Craving management'],
  substances: ['Substance-use education and recovery', 'Relapse prevention'],
  behavioral: ['Healthy habits', 'Trigger management'],
  other: ['Healthy habits', 'Mindfulness and meditation'],
}
export const TRIGGERS = ['Stress', 'Boredom', 'Social situation', 'Loneliness', 'Anger', 'Fatigue', 'Celebration', 'Seeing others use', 'Habit or routine', 'Money worries', 'Work or study pressure', 'Other']
export const ACTIVITIES = ['Exercise', 'Walk outdoors', 'Meditation', 'Called a friend', 'Attended a meeting', 'Healthy meal', 'Hobby', 'Good sleep routine', 'Journaling', 'Helped someone']
export const COMMUNITY_CATEGORIES = ['general', 'smoking', 'alcohol', 'substances', 'behavioral', 'family and caregivers', 'wins', 'questions']
export const MOODS = [{ v: 1, e: '😞', l: 'Very low' }, { v: 2, e: '😕', l: 'Low' }, { v: 3, e: '😐', l: 'Okay' }, { v: 4, e: '🙂', l: 'Good' }, { v: 5, e: '😄', l: 'Great' }]

export const MILESTONES = {
  first_checkin: { title: 'First check-in', desc: 'Completed your first daily check-in.' },
  first_goal: { title: 'First goal', desc: 'Created your first goal.' },
  seven_checkins: { title: 'Seven check-ins', desc: 'Recorded 7 check-ins in total.' },
  seven_day_streak: { title: 'Seven-day check-in streak', desc: 'Checked in 7 days in a row.' },
  goal_completed: { title: 'Goal completed', desc: 'Reached the target of a goal.' },
  five_journal: { title: 'Reflective writer', desc: 'Wrote 5 journal entries.' },
  thirty_checkins: { title: 'Thirty check-ins', desc: 'Recorded 30 check-ins in total.' },
}
