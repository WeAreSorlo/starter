// A post's date, such as 11 November 2026
export function PostDate({ date }: { date?: string }) {
  if (!date) return null
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { dateStyle: 'long', timeZone: 'UTC' })
  return <time dateTime={date}>{day}</time>
}
